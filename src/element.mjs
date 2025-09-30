import { ElementTypes, Glyphs } from './enums.mjs'

export class Element {
    constructor() {
        this.attributes = []
        this.text = ''
        this.args = []
        this.type = ElementTypes.STANDARD
    }

    isStandard() { return this.type == ElementTypes.STANDARD }
    isAttribute() { return this.type == ElementTypes.ATTRIBUTE }
    isGlobal() { return this.type == ElementTypes.GLOBAL }
    isComment() { return this.type == ElementTypes.COMMENT }

    toString() {
        const sp = 
            this.args.length > 0
            ? ' '
            : ''

        return `${Glyphs.for(this.type)}${this.text}${sp}${this.#printArgs()}`
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
