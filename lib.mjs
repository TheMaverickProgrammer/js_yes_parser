import {read} from './src/element.mjs'
import {ElementTypes} from './src/enums.mjs'

export const YesParser = {
    _lineCount: 0,
    _pendingAttrs: [],
    _elements: [],
    _errors: [],

    fromBuffer(strBuffer) {
        strBuffer.split(/\r?\n/).forEach((line) => this._handleLine(line))
        return {elements: this._elements, errors: this._errors}
    },

    _handleLine(line) {
        this._lineCount++
        const p = read(line)

        if(p.error != null) {
            this._errors.push({line: this._lineCount, error: p.error})
            return
        }

        switch(p.element.type) {
            case ElementTypes.ATTRIBUTE:
                this._pendingAttrs.push(p.element)
                return
            case ElementTypes.STANDARD:
                p.element.setAttributes(this._pendingAttrs)
                this._pendingAttrs = []
                break
            default:
                /* fall-through */
        }

        this._elements.push(p.element)
    }
}

export * from './src/enums.mjs'
export * from './src/element.mjs'
export * from './src/keyval.mjs'