import { containsWhitespace  } from "./utils.mjs"

export class KeyVal {
    constructor(key=null, val=null) {
        this.key = key
        this.val = val
        this._keyContainsWs = containsWhitespace(key)
        this._valContainsWs = containsWhitespace(val)
    }

    isNameless() {
        return this.key == null
    }

    equals(other) {
        if(typeof this != typeof other) {
            return false
        }

        return this.key == other.key 
            && this.val == other.val
    }

    toString() {
        const v = 
            this._valContainsWs 
            ? `"${this.val}"` 
            : this.val
        
        if(this.isNameless()) {
            return v
        }

        const k =
            this._keyContainsWs
            ? `"${this.key}"`
            : this.key
    
        return `${k}=${v}`
    }
}   