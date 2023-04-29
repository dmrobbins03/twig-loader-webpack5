import Twig from "twig";
import async from "async";
import fs from "fs";

import compilerFactory from "./compiler.js";
import getOptions from "./getOptions.js";
import generateTemplateId from "./utils.js";

Twig.cache(false);

// shared resolve map to store includes that are resolved by webpack
// so they can be used in the compiled templates
var resolveMap = {};

export default async function loader(source) {
    var loaderApi = this;
    var loaderAsyncCallback = this.async();
    var context = loaderApi.rootContext || loaderApi.options.context;
    this.cacheable && this.cacheable();

    // the path is saved to resolve other includes from
    try {
        const resourcePath = loaderApi.resource;

        // check if path is valid
        fs.accessSync(loaderApi.resource, fs.constants.F_OK);

        // this will be the template id for this resource,
        // this id is also be generated in the copiler when this resource is included
        var id = generateTemplateId(resourcePath, context);

        var options = getOptions(loaderApi);
        var tpl;

        Twig.extend(function (Twig) {
            var compiler = Twig.compiler;
            compiler.module["webpack"] = compilerFactory(options);
        });

        // compile function that can be called recursively to do multiple
        // compilation passes when doing async webpack resolving
        (function compile(templateData) {
            // store all the paths that need to be resolved
            var resolveQueue = [];
            var resolve = function (value) {
                if (resolveQueue.indexOf(value) === -1 && !resolveMap[value]) {
                    resolveQueue.push(value);
                }
            };

            Twig.extend(function (Twig) {
                var compiler = Twig.compiler;
                // pass values to the compiler, and return the compiler function
                compiler.module["webpack"] = compilerFactory({
                    loaderApi: loaderApi,
                    resolve: resolve,
                    resolveMap: resolveMap,
                    path: resourcePath,
                });
            });

            tpl = Twig.twig({
                id: id,
                path: resourcePath,
                data: templateData,
                allowInlineIncludes: true,
            });

            tpl = tpl.compile({
                module: "webpack",
                twig: "twig",
            });

            // called when we are done resolving all template paths
            var doneResolving = function doneResolving() {
                // re-feed the parsed tokens into the next pass so Twig can skip the token parse step
                compile(Twig.twig({ ref: id }).tokens);
            };

            // resolve all template async
            var resolveTemplates = function resolveTemplates() {
                async.each(
                    resolveQueue,
                    function (req, cb) {
                        loaderApi.resolve(context, req, function (err, res) {
                            if (err) {
                                // could not be resolved by webpack, mark as false so it can be
                                // ignored by the compiler
                                resolveMap[req] = false;
                            } else {
                                resolveMap[req] = res;
                                // also store the resolved value to be used
                                resolveMap[res] = res;
                            }
                            cb();
                        });
                    },
                    doneResolving
                );
            };

            // if we have resolve items in our queue that have been added by this compilation pass, we need
            // to resolve them and do another compilation pass
            if (resolveQueue.length) {
                resolveTemplates();
            } else {
                // nothing to resolve anymore, return the template source
                loaderAsyncCallback(null, tpl);
            }
        })(source);
    } catch (error) {
        console.warn("Error", error);
    }
}
