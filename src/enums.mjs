const makeIterableEnum = function(table) {
    table.values = Object.values(table);
    return Object.freeze(table);
};

export const Delimiters = makeIterableEnum({
    UNSET: "",
    COMMA: ",",
    SPACE: " ",
});

export const ElementTypes = makeIterableEnum({
    STANDARD: "standard",
    GLOBAL: "global",
    COMMENT: "comment",
    ATTRIBUTE: "attribute"
});

export const Glyphs = makeIterableEnum({
    NONE: "",
    EQUAL:"=",
    AT: "@",
    BANG: "!",
    HASH: "#",
    SPACE: " ",
    COMMA: ",",
    QUOTE: "\"",
});

export const ErrorTypes = makeIterableEnum({
    BADTOKEN_AT: "Element using attribute prefix out-of-place.",
    BADTOKEN_BANG: "Element using global prefix out-of-place.",
    EOL_NO_DATA: "Nothing to parse (EOL).",
    EOL_MISSING_ELEMENT: "Missing element identifier (EOL).",
    EOL_MISSING_ATTRIBUTE: "Missing attribute identifier (EOL).",
    EOL_MISSING_GLOBAL: "Missing global identifier (EOL).",
    UNTERMINATED_QUOTE: "Missing end quote in expression.",
    RUNTIME: "Unexpected runtime error." // Reserved for misc. parsing issues
});
