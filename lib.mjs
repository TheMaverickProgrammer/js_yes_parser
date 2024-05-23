import {read} from './src/element.mjs'
import {ElementTypes} from './src/enums.mjs'

export const parser = {
    _lineCount: 0,
    _pendingAttrs: [],
    _elements: [],
    _errors: [],

    fromBuffer: async function(strBuffer) {
        strBuffer.split(/\r?\n/).handleLine(_handleLine);
    },

    _handleLine: function(line) {
        this._lineCount++;
        const p = read(this._lineCount, line);

        if(p.error != null) {
            this._errors.push({line: _lineCount, error: p.error});
            return;
        }

        switch(p.element.type) {
            case ElementTypes.ATTRIBUTE:
                this._pendingAttrs.push(p.element);
                return;
            case ElementTypes.STANDARD:
                p.element.setAttributes(this._pendingAttrs);
                this._pendingAttrs = [];
                break;
            case _:
                /* fall-through */
        }

        this._elements.push(p.element);
    }
}