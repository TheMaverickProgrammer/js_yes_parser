import { Delimiters, ErrorTypes, ElementTypes, Glyphs } from './enums.mjs'
import { KeyVal } from './keyval.mjs'

export class Element {
    constructor() {
        this.attributes = []
        this.text = ''
        this.args = []
        this.type = ElementTypes.STANDARD
    }

    toString() {
        return `${Glyphs.for(this.type)}${this.text} ${this.#printArgs()}`
    }

    setAttributes(attrs) {
        this.attributes = []
        for(const a of attrs) {
            // Perform a sanity check
            if(a.type != ElementTypes.ATTRIBUTE) {
                throw 'Element is not an attribute!'
            }
            this.attributes.push(a)
        }
    }

    upsert(keyval) {
        const idx = this.#findKey(keyval.key)

        // Insert if no match was found
        if(idx == -1) {
            this.args.push(keyval)
            return
        }

        // Update by replacing
        this.args[idx] = keyval
    }

    hasKey(key) {
        return this.#findKey(key) > -1
    }

    hasKeys(keyList) {
        for(const key of keyList) {
            if(this.#findKey(key) == -1) return false
        }

        return true
    }

    getKeyValue(key, or=null) {
        const idx = this.#findKey(key)

        // Found
        if(idx != -1) {
            return this.args[idx].val
        }

        // Return default value
        return or
    }

    getKeyValueAsInt(key, or=null) { 
        // Get and parse the arg by key
        let val = this.getKeyValue(key, or)
        val = parseInt(val)

        // If the result is not null or NaN
        if(!Number.isNaN(val)) {
            return val
        }

        return or
    }

    getKeyValueAsBool(key, or=null) {
        // Get and parse the arg by key
        let val = this.getKeyValue(key, or)
        if(val != null) {
            // Anything else is considered falsey
            return val.toLowerCase() == 'true'
        }

        return or
    }

    getKeyValueAsNumber(key, or=null) {
        // Get and parse the arg by key
        let val = this.getKeyValue(key, or)
        val = parseNumber(val)

        // If the result is not null or NaN
        if(!Number.isNaN(val)) {
            return val
        }

        return or
    }

    //
    // Private methods
    //

    #findKey(key) {
        if(key == null) return -1
        return this.args.findIndex(
            e => e.key != null && e.key.toLowerCase() == key.toLowerCase()
        )
    }

    #printArgs() {
        let res = ''
        const len = this.args.length
        for(let i = 0; i < len; i++) {
            res += this.args[i].toString()
            if(i < len - 1) {
                res += ', '
            }
        }

        return res
    }
}

export class ElementParser {
    constructor() {
        this.delimiter = Delimiters.UNSET
        this.element = null
        this.error = null
        this.lineNumber = -1
    }

    // Entry

    parseTokens(input, start) {
        let end = start

        // Evaluate all tokens on the line
        while(end < input.length) {
            end = this.#parseTokenStep(input, end+1)

            // Abort early if there is a problem
            if(this.error != null) break
        }
    }

    //
    // Private methods
    //

    #parseTokenStep(input, start) {
        const len = input.length

        // Find first non-space character
        while(start < len) {
            if(Glyphs.SPACE == input[start]) {
                start++
                continue
            }

            // else, current char is non-space
            break
        }

        if(start >= len) {
            return len
        }

        const end = this.#evaluateDelimiter(input, start)
        this.#evaluateToken(input, start, end)
        return end
    }

    #evaluateDelimiter(input, start) {
        let quoted = false // Finds matching end-quotes
        const len = input.length
        let curr = start

        // Step 1: skip string literals wrapped in quotes
        while(curr < len) {
            let quotePos = input.indexOf(Glyphs.QUOTE, curr)
            if(quoted) {
                if(quotePos == -1) {
                    this.error = ErrorTypes.UNTERMINATED_QUOTE
                    return len
                }
                quoted = false
                start = quotePos
                curr = start + 1
                continue
            }

            const spacePos = input.indexOf(Glyphs.SPACE, curr)
            const commaPos = input.indexOf(Glyphs.COMMA, curr)

            if(quotePos > -1 && quotePos < spacePos && quotePos < commaPos) {
                quoted = true
                start = quotePos
                curr = start + 1
                continue
            } else if(spacePos == commaPos) {
                // edge case: end of line
                return len
            }

            // Use the first (nearest) valid delimiter
            if(spacePos == -1 && commaPos > -1) {
                curr = commaPos
            } else if(spacePos > -1 && commaPos == -1) {
                curr = spacePos
            } else if(spacePos > -1 && commaPos > -1) {
                curr = Math.min(spacePos, commaPos)
            }
            break
        }

        // Step 2: determine delimiter if not yet set
        // by scanning white spaces in search for the first comma
        // or falling back to spaces if not found.
        let space = -1, equal = -1, quote = -1
        while(this.delimiter == Delimiters.UNSET && curr < len) {
            const c = input[curr]
            const isComma = Glyphs.COMMA == c
            const isSpace = Glyphs.SPACE == c
            const isEqual = Glyphs.EQUAL == c
            const isQuote = Glyphs.QUOTE == c

            if(isComma) {
                this.#setDelimiterType(Delimiters.COMMA)
                break
            }

            if(isSpace && space == -1) {
                space = curr
            }

            if(isEqual && equal == -1 && quote == -1) {
                equal = curr
            }

            // Ensure quotes are toggled, if token was reached
            if(isQuote) {
                if(quote == -1) {
                    quote = curr
                } else {
                    quote = -1
                }
            }

            curr++
        }

        // Case: EOL with not delimiter found
        if(this.delimiter == Delimiters.UNSET) {
            // No space token found.
            // Nothing to parse. Abort.
            if(space == -1) {
                return len
            }

            this.#setDelimiterType(Delimiters.SPACE)
            // Go back to the first space token
            curr = space
        }

        // Step 3: use delimiter type to find the next end pos
        // which will result in the range [start,end] to be next token
        const idx = input.indexOf(this.delimiter, start)
        if(idx == -1) {
            // Possibly last keyval token. EOL.
            return len
        }

        return Math.min(len, idx)
    }

    #evaluateToken(input, start, end) {
        // Sanity check.
        if(this.element == null) {
            throw 'Element was not initialized.'
        }

        // Trim whie spaces around the equal symbol
        const token = input.substring(start, end).trim()

        // Named key values are seperated by equals tokens
        const equalPos = token.indexOf(Glyphs.EQUAL)
        if(equalPos != -1) {
            const key = token.substring(0, equalPos).trim()
            const val = token.substring(equalPos + 1, token.length).trim()
            this.element.upsert(new KeyVal(key, val))
            return
        }

        // Nameless key value only
        this.element.upsert(new KeyVal(null, token))
    }

    #setDelimiterType(type) {
        if(this.delimiter == Delimiters.UNSET) {
            this.delimiter = type
            return true
        }

        return this.delimiter == type
    }
}

export const read = function(line) {
    const parser = new ElementParser()

    // Step 1: Trim whitespace and start at the first valid character
    line = line.trim()
    const len = line.length

    if(len == 0) {
        parser.error = ErrorTypes.EOL_NO_DATA
        return parser
    }

    let pos = 0
    let type = ElementTypes.STANDARD

    while(pos < len) {
        // Find first non-space character
        if(line[pos] == Glyphs.SPACE) {
            pos++
            continue
        }

        const idx = Glyphs.values.indexOf(line[pos])

        // Standard element found
        if(idx == -1) {
            break
        }

        // Step 2: if the first valid character is reserved prefix,
        // then tag the element and continue searching for the name start pos
        const glyph = Glyphs.values[idx]

        switch(glyph) {
            case Glyphs.HASH:
                if(type == ElementTypes.STANDARD) {
                    // All characters beyond the hash is treated as a comment
                    parser.element = new Element()
                    parser.element.text = line.substring(pos+1)
                    parser.element.type = ElementTypes.COMMENT
                    return parser
                }
            case Glyphs.AT:
                if(type != ElementTypes.STANDARD) {
                    parser.error = ErrorTypes.BADTOKEN_AT
                    return parser
                }
                type = ElementTypes.ATTRIBUTE
                pos++
                continue
            case Glyphs.BANG:
                if(type != ElementTypes.STANDARD) {
                    parser.error = ErrorTypes.BADTOKEN_BANG
                    return parser
                }
                type = ElementTypes.GLOBAL
                pos++
                continue
            default:
                /* intentional fall-through */
        }

        // End the loop
        break
    }

    // Step 3: find the end of the element name (first space or EOL)
    pos = Math.min(pos, len)
    const idx = line.indexOf(Glyphs.SPACE, pos)

    let end
    if(idx < 0) {
        end = len
    } else {
        end = Math.min(len, idx)
    }

    const text = line.substring(pos, end)
    if(text.length == 0) {
        let error = ErrorTypes.EOL_MISSING_GLOBAL

        if(type == ElementTypes.ATTRIBUTE) {
            error = ErrorTypes.EOL_MISSING_ATTRIBUTE
        } else if(type == ElementTypes.GLOBAL) {
            error = ErrorTypes.EOL_MISSING_GLOBAL
        }

        parser.error = error
        return parser
    }

    parser.element = new Element()
    parser.element.type = type
    parser.element.text = text

    // Step 4: parse remaining tokens, if any, and return results
    parser.parseTokens(line, end)

    return parser
}
