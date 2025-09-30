export class Literal {
    constructor(start=null, end=null) {
        if(start == null || end == null) {
            throw 'Literal start and end tokens must be non-null.'
        }
        this.start = start
        this.end = end
    }
}

export const LiteralQuotes = new Literal('\"', '\"')
