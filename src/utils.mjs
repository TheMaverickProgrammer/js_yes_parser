export function containsWhitespace(str) {
    if(str == null || typeof str != 'string') return false
    return str.includes(' ') || str.includes('\t')
}

export function isWhitespace(c) {
    return c == ' ' || c == '\t'
}

export function unquote(str) {
    // No-op.
    if(str == null || typeof str != 'string' || str.length <= 1) {
        return str
    }

    // This string is quoted.
    if(str[0] == '\"' && str[str.length-1] == '\"') {
        return str.substring(1, str.length-1)
    }

    // Pre-emptively trim white-space and return.
    return str.trim()
}