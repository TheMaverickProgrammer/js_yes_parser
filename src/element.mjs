import { Delimeters, ErrorTypes, ElementTypes, Glyphs } from './enums.mjs'

export const Element = {
    attributes: [],
    text: '',
    args: [],
    type: ElementTypes.STANDARD,

    setAttributes: function(attrs) {
        this.attributes = [];
        for(const a of attrs) {
            // Perform a sanity check
            if(a.type != ElementTypes.ATTRIBUTE) {
                throw 'Element is not an attribute!';
            }
            this.attributes.push(a);
        }
    },
    
    add: function(keyval) {
        this.args.push(keyval);
    },

    upsert: function(keyval) {
        const idx = 
            this.args.indexOf(
                e => e.key != null 
                && e.key.toLowerCase() == keyval.key.toLowerCase()
            );

        // Insert if no match was found
        if(idx == -1) {
            this.args.push(keyval);
            return;
        }

        // Update by replacing
        this.args[idx] = keyval;
    },

    hasKey: function(key) {
        const idx = 
            this.args.indexOf(
                e => e.key.toLowerCase() == key.toLowerCase()
            );
        return idx > -1;
    },

    hasKeys: function(keyList) {
        for(const key of keyList) {
            const idx = 
                this.args.indexOf(
                    e => e.key.toLowerCase() == key.toLowerCase()
                );
            if(idx == -1) return false;
        }

        return true;
    },

    getKeyValue: function(key, or) {
        const idx = 
            this.args.indexOf(
                e => e.key.toLowerCase() == key.toLowerCase()
            );

        // Found
        if(idx != -1) {
            return this.args[idx].val;
        }

        // Miss
        return or;
    },

    getKeyValueAsInt(key, or) { 
        // Ensure `or` is null if unset
        if(typeof or === 'undefined') {
            or = null;
        }

        // Get and parse the arg by key
        let val = this.getKeyValue(key, or);
        val = parseInt(val);

        // If the result is null or NaN
        if(Number.isNaN(val)) {
            // Return default value
            return or;
        }

        return val;
    },

    getKeyValueAsBool(key, or) {
        // Ensure `or` is null if unset
        if(typeof or === 'undefined') {
            or = null;
        }

        // Get and parse the arg by key
        let val = this.getKeyValue(key, or);
        if(val != null) {
            // Anything else is considered falsey
            return val.toLowerCase() == "true";
        }

        // If the result is null return the default
        if(val == null) {
            return or;
        }

        return val;
    },

    getKeyValueAsNumber(key, or) {
        // Ensure `or` is null if unset
        if(typeof or === 'undefined') {
            or = null;
        }

        // Get and parse the arg by key
        let val = this.getKeyValue(key, or);
        val = parseNumber(val);

        // If the result is null or NaN
        if(Number.isNaN(val)) {
            // Return default value
            return or;
        }

        return val;
    },

    _printArgs() {
        let res = "";
        const len = this.args.length;
        for(let i = 0; i < len; i++) {
            res += this.args[i].toString();
            if(i < len - 1) {
                res += ', ';
            }
        }

        return res;
    }
}

Element.prototype.toString = function(self) {
    return `${self.type}${self.text} ${self._printArgs()}`;
}

const ElementParser = {
    delimeter: Delimeters.UNSET,
    element: null,
    error: null,
    lineNumber: -1,

    parseTokens: function(input, start) {
        let end = start;

        // Evaluate all tokens on the line
        while(end < input.length) {
            end = this.parseTokenStep(input, end+1);

            // Abort early if there is a problem
            if(this.error != null) break;
        }
    },

    parseTokenStep: function(input, start) {
        const len = input.length;

        // Find first non-space character
        while(start < len) {
            if(Glyphs.SPACE == input[start]) {
                start++;
                continue;
            }

            // else, current char is non-space
            break;
        }

        if(start >= len) {
            return;
        }

        const end = this.evaluateDelimeter(input, start);
        this.evaluateToken(input, start, end);
        return end;
    },

    evaluateDelimeter: function(input, start) {
        let quoted = false; // Finds matching end-quotes
        const len = input.length;
        let curr = start;

        // Step 1: skip string literals wrapped in quotes
        while(current < len) {
            let quotePos = input.indexOf(Glyphs.QUOTE, current);
            if(quoted) {
                if(quotPos == -1) {
                    this.error = ErrorTypes.UNTERMINATED_QUOTE;
                    return len;
                }
                quoted = false;
                start = quotePos;
                current = start + 1;
                continue;
            }

            // TODO: https://github.com/TheMaverickProgrammer/dart_yes_parser/blob/master/lib/src/element_parser.dart#L207
        }
    },

    evaluateToken: function(input, start, end) {
        // Sanity check.
        if(this.element == null) {
            throw 'Element was not initialized.';
        }

        // Trim whie spaces around the equal symbol
        const token = input.substring(start, end).trim();

        const kv = KeyVal.new();

        // Named key values are seperated by equals tokens
        const equalPos = token.indexOf(Glyphs.EQUAL);
        if(equalPos != -1) {
            kv.key = token.substring(0, equalPos).trim();
            kv.val = token.substring(equalPos + 1, token.length).trim();
            this.parser.element.upsert(kv);
            return;
        }

        // Nameless key value
        kv.val = token;
        this.parser.element.add(kv);
    },

    setDelimiterType(type) {
        if(this.delimeter == Delimeters.UNSET) {
            this.delimeter = type;
            return true;
        }

        return this.delimeter == type;
    }
}

export const read = function(lineNumber, line) {
    const parser = ElementParser.new();

    // Step 1: Trim whitespace and start at the first valid character
    line = line.trim()
    const len = line.length;

    if(len == 0) {
        parser.error = ErrorTypes.EOL_NO_DATA;
        return parser;
    }

    let pos = 0;
    parser.type = ElementTypes.STANDARD;

    while(pos < len) {
        // Find first non-space character
        if(line[pos] == Glyphs.SPACE) {
            pos++;
            continue;
        }

        const idx = Glyphs.indexOf(e => e == line[pos]);

        // Standard element found
        if(idx == -1) {
            break;
        }

        // Step 2: if the first valid character is reserved prefix,
        // then tag the element and continue searching for the name start pos
        const glyph = Glyphs[idx];

        switch(glyph) {
            case Glyphs.HASH:
                if(type == ElementTypes.STANDARD) {
                    // All characters beyond the hash is treated as a comment
                    parser.element = Element.new();
                    parser.element.text = line.substring(pos+1);
                    return parser;
                }
            case Glyphs.AT:
                if(type != ElementTypes.STANDARD) {
                    parser.error = ErrorTypes.BADTOKEN_AT;
                    return parser;
                }
                parser.type = ElementTypes.ATTRIBUTE;
                pos++;
                continue;
            case Glyphs.BANG:
                if(type != ElementTypes.STANDARD) {
                    parser.error = ErrorTypes.BADTOKEN_BANG;
                    return parser;
                }
                parser.type = ElementTypes.GLOBAL;
                pos++;
                continue;
            case _:
                /* intentional fall-through */
        }

        // End the loop
        break;
    }

    // Step 3: find the end of the element name (first space or EOL)
    pos = min(pos, len);
    const idx = line.indexOf(Glyphs.SPACE, pos);

    let end;
    if(idx < 0) {
        end = len;
    } else {
        end = min(len, idx);
    }

    parser.text = line.substring(pos, end);
    if(parser.text.length == 0) {
        let error = ErrorTypes.EOL_MISSING_GLOBAL;

        if(type == ElementTypes.ATTRIBUTE) {
            error = ErrorTypes.EOL_MISSING_ATTRIBUTE;
        } else if(type == ElementTypes.GLOBAL) {
            error = ErrorTypes.EOL_MISSING_GLOBAL;
        }

        parser.error = error;
        return parser;
    }

    parser.element = Element.new();
    parser.element.type = type;

    // Step 4: parse remaining tokens, if any, and return results
    parser.parseTokens(line, end);

    return parser;
}
