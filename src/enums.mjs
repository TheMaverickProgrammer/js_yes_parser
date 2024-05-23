export const Delimiters = Object.freeze({
    UNSET: Symbol(""),
    COMMA: Symbol(","),
    SPACE: Symbol(" "),
});

export const ElementTypes = Object.freeze({
    STANDARD: Symbol("standard"),
    GLOBAL: Symbol("global"),
    COMMENT: Symbol("comment"),
    ATTRIBUTE: Symbol("attribute")
});

export const Glyphs = Object.freeze({
    NONE: Symbol(""),
    EQUAL: Symbol("="),
    AT: Symbol("@"),
    BANG: Symbol("!"),
    HASH: Symbol("#"),
    SPACE: Symbol(" "),
    COMMA: Symbol(","),
    QUOTE: Symbol("\""),
});

export const ErrorTypes = Object.freeze({
    BADTOKEN_AT: Symbol("Element using attribute prefix out-of-place."),
    BADTOKEN_BANG: Symbol("Element using global prefix out-of-place."),
    EOL_NO_DATA: Symbol("Nothing to parse (EOL)."),
    EOL_MISSING_ELEMENT: Symbol("Missing element identifier (EOL)."),
    EOL_MISSING_ATTRIBUTE: Symbol("Missing attribute identifier (EOL)."),
    EOL_MISSING_GLOBAL: Symbol("Missing global identifier (EOL)."),
    UNTERMINATED_QUOTE: Symbol("Missing end quote in expression."),
    RUNTIME: Symbol("Unexpected runtime error.") // Reserved for misc. parsing issues
});
