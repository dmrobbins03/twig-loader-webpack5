import { validate } from "schema-utils";

const schema = {
    type: "object",
    properties: {
        twigOptions: {
            type: "object",
        },
    },
    additionalProperties: false,
};

export default function getOptions(loader) {
    const options = loader.options;
    delete options.context;
    if (!options) {
        return {};
    }
    validate(schema, options, "twig-loader");
    return options;
}
