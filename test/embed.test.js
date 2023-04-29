import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import should from "should";

import runLoader from "./fakeModuleSystem.js";
import twigLoader from "../index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, "fixtures");

describe("embed", function () {
    it("should generate proper require embed tag", function (done) {
        var template = path.join(fixtures, "embed", "template.html.twig");
        runLoader(
            twigLoader,
            path.join(fixtures, "extend"),
            template,
            fs.readFileSync(template, "utf-8"),
            function (err, result) {
                if (err) throw err;

                should(result).have.type("string");

                // verify the generated module imports the `embed`d templates
                should(result).match(/require\(\"embed\.html\.twig\"\);/);

                done();
            }
        );
    });

    it("should generate proper require include tag in block tag", function (done) {
        var template = path.join(fixtures, "embed", "template.html.twig");
        runLoader(
            twigLoader,
            path.join(fixtures, "extend"),
            template,
            fs.readFileSync(template, "utf-8"),
            function (err, result) {
                if (err) throw err;

                should(result).have.type("string");

                // verify the generated module imports the `include`d templates
                should(result).match(/require\(\"include\.html\.twig\"\);/);

                done();
            }
        );
    });
});
