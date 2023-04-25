import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import runLoader from "./fakeModuleSystem.js";
import twigLoader from "../index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, "fixtures");

describe("loader", function () {
    it("should add require statement to the twig library", function (done) {
        var template = path.join(fixtures, "loader", "template.html.twig");
        runLoader(
            twigLoader,
            path.join(fixtures, "loader"),
            template,
            fs.readFileSync(template, "utf-8"),
            function (err, result) {
                if (err) throw err;

                result.should.have.type("string");

                result.should.match(/require\(\"twig\"\)\.twig/);

                done();
            }
        );
    });
});
