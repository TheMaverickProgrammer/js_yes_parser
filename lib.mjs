import {read} from './src/element.mjs'
import {ElementTypes} from './src/enums.mjs'

class Collector {
    constructor() {
        this.lineCount = 0
        this.pendingAttrs = []
        this.elements = []
        this.errors = []
    }

    handleLine(line) {
        this.lineCount++
        const p = read(line)

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

        this.elements.push(p.element)
    }
}

export class YesParser {
    //
    // Public methods
    //

    static fromBuffer(strBuffer) {
        const collector = new Collector()
        strBuffer.split(/\r?\n/).forEach((line) => {
            collector.handleLine(line)
        })
        return {elements: collector.elements, errors: collector.errors}
    }
}

export {ElementTypes, ErrorTypes} from './src/enums.mjs'
export {Element} from './src/element.mjs'
export {KeyVal} from './src/keyval.mjs'