export const KeyVal = function() {
    const data = {
        key: null,
        val: null,
        toString: function() {
            if(this.key == null) {
                return `${this.val}`;
            }
        
            return `${this.key}=${this.val}`;
        }
    };

    return data;
}   