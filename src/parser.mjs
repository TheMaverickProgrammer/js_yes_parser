import { Element } from './element.mjs'
import { Delimiters, ErrorTypes, ElementTypes, Glyphs } from './enums.mjs'
import { KeyVal } from './keyval.mjs'
import { isWhitespace, unquote } from './utils.mjs'

export class ElementParser {
    constructor() {
        this.delimiter = Delimiters.UNSET
        this.element = null
        this.error = null
    }

    // Entry

    parseTokens(input, start, literals = []) {
        let len = input.length

        // Find first non white-space character
        while(start < len) {
            if(isWhitespace(input[start])) {
                start++
                continue
            }

            // Current character is non white-space
            break
        }

        // Edge case: no KeyVal args.
        if(start >= len) {
            return
        }

        this.#evaluateKeyVals(this.#collect(input, start, literals))
    }

    //
    // Private methods
    //

    #collect(input, start, literals = []) {
        const udLiterals = new Map()
        for(let literal of literals) {
            udLiterals.set(literal, -1)
        }

        const len = input.length
        let current = start
        let tokens = []

        /// Step 1: Learn appropriate delimiter by iterating over tokens
        /// in search for the first comma. [literals] cause the [current]
        /// index to jump to the matching [Literal.end] character and resumes
        /// iterating normally.
        ///
        /// If EOL is reached, comma is chosen to be the delimiter so that
        /// tokens with one [KeyVal] argument can have spaces around it,
        /// since it is the case when it is obvious there are no other
        /// arguments to parse.

        let space = -1, equal = -1
        let equalCount = 0, spacesBfEq = 0, spacesAfEq = 0
        let tokensBfEq = 0, tokensAfEq = 0
        let tokenWalk = false
        let activeLiteral = null

        while(current < len) {
            const c = input[current]
            const isComma = c == Glyphs.COMMA
            const isSpace = isWhitespace(c)
            const isEqual = c == Glyphs.EQUAL

            let isLiteral = false
            if(activeLiteral != null) {
                // Test if this is the matching end glyph
                if(activeLiteral.end == c) {
                    isLiteral = true
                }
            } else {
                if(!isSpace && !isEqual) {
                    if(!tokenWalk) {
                        (equal == -1)
                        ? tokensBfEq++
                        : tokensAfEq++
                    }
                    (equal == -1)
                    ? spacesBfEq = 0
                    : spacesAfEq = 0
                    tokenWalk = true
                } else if(isSpace) {
                    if(tokenWalk) {
                        (equal == -1)
                        ? spacesBfEq++
                        : spacesAfEq++
                    }
                    if(space == -1) {
                        space = current
                    }
                    tokenWalk = false
                } else if(isEqual) {
                    tokenWalk = false
                    if(equal == -1) {
                        equal = current
                    }
                    equalCount++
                }

                let continueLoop = false

                for(let literal of udLiterals.keys()) {
                    if(literal.start == c) {
                        isLiteral = true
                        activeLiteral = literal
                        udLiterals.set(activeLiteral, current)
                        current++
                        continueLoop = true
                        break
                    }
                }

                if(continueLoop) continue
            }

            // Ensure literals are terminated before evaluating delimiters
            if(isLiteral) {
                if(udLiterals.get(activeLiteral) == -1) {
                    udLiterals.set(activeLiteral, current)
                } else {
                    udLiterals.set(activeLiteral, -1)
                    activeLiteral = null
                }

                current++
                continue
            }

            // Look ahead for terminating literal
            if((udLiterals.get(activeLiteral) ?? -1) != -1) {
                const literalEndPos = 
                    input.indexOf(activeLiteral.end, current)

                if(literalEndPos != -1) {
                    current = literalEndPos
                    continue
                } else {
                    // There is a missing terminating literal
                    break
                }
            }

            if(isComma) {
                this.delimiter = Delimiters.COMMA
                break
            }

            current++
        }

        // Edge case: one key-value pair can have spaces around them
        // while being parsed correctly
        const oneTokenExists = equalCount == 1
        && tokensBfEq == 1
        && tokensAfEq <= 1
        && Math.abs(spacesBfEq - spacesAfEq) <= 1

        // EOL with no comma delimiter found
        if(this.delimiter == Delimiters.UNSET) {
            if(oneTokenExists && space != -1) {
                // Step #2: no delimiter was found
                // and only **one** key provided, 
                // which means the key-value pair is
                // likely to be surrounded by
                // whitespace and should be permitted.
                this.delimiter = Delimiters.COMMA
            } else {
                this.delimiter = Delimiters.SPACE
            }
        }

        // Step 2: Use learned delimiter to collect the tokens
        current = start
        equal = -1
        activeLiteral = null
        let lastTokenIdx = start

        while(current < len) {
            const c = input[current]
            const isEqual = c == Glyphs.EQUAL
            const isDelim = 
                (this.delimiter == Delimiters.COMMA)
                ? c == Delimiters.COMMA
                : isWhitespace(c)

            let isLiteral = false
            if(activeLiteral != null) {
                if(activeLiteral.end == c) {
                    isLiteral = true
                }
            } else {
                if(isEqual) {
                    equal = current
                    current++
                    continue
                }

                // No active literal span indicates this was a value delimiter
                if(isDelim) {
                    tokens.push({
                        data: input.substring(lastTokenIdx, current), 
                        pivot: equal - lastTokenIdx
                    })
                    current++
                    lastTokenIdx = current
                
                    // Scan ahead for next token
                    while(current < len && isWhitespace(input[current])) {
                        current++
                    }
                    continue
                }

                // Detect literals if any to begin string-span
                for(let literal of udLiterals.keys()) {
                    if(literal.start == c) {
                        isLiteral = true
                        activeLiteral = literal
                        break
                    }
                }
            }

            // Ensure literals are terminated.
            if(isLiteral) {
                if(udLiterals.get(activeLiteral) == -1) {
                    udLiterals.set(activeLiteral, current)
                } else {
                    udLiterals.set(activeLiteral, -1)
                    activeLiteral = null
                }

                current++
                continue
            }

            // Look ahead for terminating literal.
            if((udLiterals.get(activeLiteral) ?? -1) != -1) {
                const literalEndPos = 
                    input.indexOf(activeLiteral.end, current)

                if(literalEndPos != -1) {
                    current = literalEndPos
                    continue
                } else {
                    // Missing terminating literal. Abort.
                    break
                }
            }

            current++
        }

        // Capture pending token if one exists.
        if(lastTokenIdx < len) {
            tokens.push({
                data: input.substring(lastTokenIdx),
                pivot: equal - lastTokenIdx
            })
        }

        return tokens
    }

    #evaluateKeyVals(tokens) {
        // Sanity check.
        if(this.element == null) {
            throw 'Element was not initialized.'
        }

        for(let token of tokens) {
            const data = token.data
            const pivot = token.pivot

            // Edge case: token is the equals character
            // Treat this as no key and no value.
            if(data == Glyphs.EQUAL) continue

            // Trim white spaces around the equal symbol
            if(pivot >= 0) {
                this.element.upsert(new KeyVal(
                    unquote(data.substring(0, pivot).trim()),
                    unquote(data.substring(pivot+1).trim())
                ))
                continue
            }

            // Nameless key value only
            this.element.upsert(new KeyVal(null, unquote(data.trim())))
        }
    }
}

export const read = function(line, literals = []) {
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
        if(isWhitespace(line[pos])) {
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

    // Step 3: find the end of the element name (first white space or EOL)
    pos = Math.min(pos, len)
    const tpos = line.indexOf(Glyphs.TAB, pos)
    const spos = line.indexOf(Glyphs.SPACE, pos)

    let end
    if(tpos == -1 && spos == -1) {
        end = len
    } else if(tpos != -1 && spos != -1) {
        end = Math.min(tpos, spos)
    } else {
        end = Math.max(tpos, spos)
    }

    const text = unquote(line.substring(pos, end))
    if(text.length == 0) {
        let error = ErrorTypes.EOL_MISSING_ELEMENT

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
    parser.parseTokens(line, end, literals)

    return parser
}
