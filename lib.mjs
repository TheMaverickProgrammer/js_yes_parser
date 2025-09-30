import {read} from './src/parser.mjs'
import {ElementTypes, Glyphs} from './src/enums.mjs'
import {Literal, LiteralQuotes} from './src/literal.mjs'

class Collector {
    constructor() {
        this.lineCount = 0
        this.pendingAttrs = []
        this.elements = []
        this.errors = []
        this.buildingLine = null
    }

    handleLine(line, literals = []) {
        ++this.lineCount

        if(line.indexOf(Glyphs.BACKSLASH) == line.length-1) {
            line = line.substring(0, line.length-1)

            if(this.buildingLine == null) {
                this.buildingLine = line
            } else {
                this.buildingLine += line
            }

            return
        } else if(this.buildingLine != null) {
            line = this.buildingLine + line
            this.buildingLine = null
        }

        const p = read(line, literals)

        if(p.error != null) {
            this.errors.push({line: this.lineCount, type: p.error})
            return
        }

        switch(p.element.type) {
            case ElementTypes.ATTRIBUTE:
                this.pendingAttrs.push(p.element)
                return
            case ElementTypes.STANDARD:
                p.element.setAttributes(this.pendingAttrs)
                this.pendingAttrs = []
                break
            default:
                /* fall-through */
        }

        p.element.lineNumber = this.lineCount
        this.elements.push(p.element)
    }
}

function hoist(a, b) {
    const isGlobalA = a.type == ElementTypes.GLOBAL
    const isGlobalB = b.type == ElementTypes.GLOBAL
    if(isGlobalA && isGlobalB) {
        return a.lineNumber - b.lineNumber
    } else if(isGlobalA) {
        return -a.lineNumber
    } else {
        /* isGlobalB */
        return b.lineNumber
    }
}

export class YesParser {
    //
    // Public methods
    //

    static fromBuffer(strBuffer, literals = []) {
        const collector = new Collector()

        // Provide default quote pair literals.
        literals = [LiteralQuotes, ...literals]

        strBuffer.split(/\r?\n/).forEach((line) => {
            collector.handleLine(line, literals)
        })
        return {elements: collector.elements.sort(hoist), errors: collector.errors}
    }
}

export {ElementTypes, ErrorTypes} from './src/enums.mjs'
export {Element} from './src/element.mjs'
export {KeyVal} from './src/keyval.mjs'
export {Literal, LiteralQuotes}