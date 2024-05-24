export class KeyVal {
    constructor(key=null, val=null) {
        this.key = key
        this.val = val
    }

    toString() {
        if(this.key == null) {
            return `${this.val}`
        }
    
        return `${this.key}=${this.val}`
    }
}   