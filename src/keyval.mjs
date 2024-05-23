export const KeyVal = {
    key: null,
    value: null
}   

KeyVal.prototype.toString = function(self) {
    if(self.key == null) {
        return `${value}`;
    }

    return `${key}=${val}`;
}