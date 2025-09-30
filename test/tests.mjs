import { describe, it } from "node:test"
import { YesParser, Literal } from "../lib.mjs"
import assert from "node:assert"

function extract(keyval) {
    let obj = {}
    if(keyval.key != null && typeof keyval.key !== 'undefined') 
        obj.key = keyval.key
    if(keyval.val != null && typeof keyval.val !== 'undefined') 
        obj.val = keyval.val
    return obj
}

describe('YES document parser', () => {
    it('should correctly convert to string representation', () => {
        const doc = [
            'a key = val',
            'b val val2',
            'c val',
            'd key=val',
            'e key = val,',
            'f key= val aaa bbb',
            'g key = val aaa bbb',
            'h key = val ,',
            'i key = val,key2=val2',
            'j key = val , key2 = val2',
            'k key= val ,val2 aaa',
            'l key =val ,    key2   =val2,',
            'm val',
            'n key=',
            'o key =',
            'p key = ',
            'q',
            'r key =val ,    key2   =val2, key3 = val3',
            's val val2 val3',
            't key=val key2=val2 key3=val3',
            'u "aaa bbb"',
            '"v" abcd',
            'w x y z="123"',
            'x a=b -c',
            'y\tz\ty2\t\tz2\t\t',
            'z a\t=\t1,b\t=\t2'
        ]

        const expected = [
            'a key=val',
            'b val, val2',
            'c val',
            'd key=val',
            'e key=val',
            'f key=, val, aaa, bbb',
            'g key, val, aaa, bbb',
            'h key=val',
            'i key=val, key2=val2',
            'j key=val, key2=val2',
            'k key=val, "val2 aaa"',
            'l key=val, key2=val2',
            'm val',
            'n key=',
            'o key=',
            'p key=',
            'q',
            'r key=val, key2=val2, key3=val3',
            's val, val2, val3',
            't key=val, key2=val2, key3=val3',
            'u "aaa bbb"',
            'v abcd',
            'w x, y, z=123',
            'x a=b, -c',
            'y z, y2, z2',
            'z a=1, b=2'
        ]

        const parser = YesParser.fromBuffer(doc.join('\r\n'))

        assert.strictEqual(expected.length, parser.elements.length)

        const result = parser.elements.map((e) => e.toString())

        assert.deepEqual(result, expected)
    })

    it('should parse KeyVal quoted keys and values without quotes', () => {
        const doc = [
            'a "aaa bbb"',
            'b "crab battle" "efficient car goose" "key3"="value3" "key4"=value4 "value5"',
            'c "1234"',
            'd "\t\tez\t\t"'
        ]

        const expected = [
            [{val: 'aaa bbb'}],
            [
                {val: 'crab battle'},
                {val: 'efficient car goose'},
                {key: 'key3', val: 'value3'},
                {key: 'key4', val: 'value4'},
                {val: 'value5'},
            ],
            [{val: '1234'}],
            [{val: '\t\tez\t\t'}]
        ]

        const parser = YesParser.fromBuffer(doc.join('\r\n'))

        assert.strictEqual(expected.length, parser.elements.length)

        const result = parser.elements.map((el) => el.args.map((kv) => extract(kv)))

        assert.deepEqual(result, expected)
    })

    it('should parse KeyVals exactly per the specification', () => {
        const doc = [
            'a key = val',
            'b    val      val2    val3    ',
            'c val',
            'd key=val',
            'e key = val,',
            'f key= val aaa bbb',
            'g key = val aaa bbb',
            'h key = val ,',
            'i key = val,key2=val2',
            'j key = val , key2 = val2',
            'k key= val ,val2 aaa',
            'l key =val ,    key2   =val2,',
            'm val',
            'n key=',
            'o key =',
            'p key = ',
            'q',
            'r key =val ,    key2   =val2, key3 = val3',
            's val val2 val3',
            't key=val key2=val2 key3=val3',
            'u "aaa bbb"',
            'v "crab battle" "efficient car goose" "key3"="value3" "key4"=value4 value5 "value6"',
            'w x y z="123"',
            'x a=b -c',
            'let1 x: int = 4',
            'let2 x: int=32'
        ]

        const expected = [
            [{key: 'key', val: 'val'}],
            [{val: 'val'}, {val: 'val2'}, {val: 'val3'}],
            [{val: 'val'}],
            [{key: 'key', val: 'val'}],
            [{key: 'key', val: 'val'}],
            [
                {key: 'key', val: ''},
                {val: 'val'},
                {val: 'aaa'},
                {val: 'bbb'}
            ],
            [
                {val: 'key'},
                {val: 'val'},
                {val: 'aaa'},
                {val: 'bbb'}
            ],
            [{key: 'key', val: 'val'}],
            [{key: 'key', val: 'val'}, {key: 'key2', val: 'val2'}],
            [{key: 'key', val: 'val'}, {key: 'key2', val: 'val2'}],
            [{key: 'key', val: 'val'}, {val: 'val2 aaa'}],
            [{key: 'key', val: 'val'}, {key: 'key2', val: 'val2'}],
            [{val: 'val'}],
            [{key: 'key', val: ''}],
            [{key: 'key', val: ''}],
            [{key: 'key', val: ''}],
            [],
            [
                {key: 'key', val: 'val'},
                {key: 'key2', val: 'val2'},
                {key: 'key3', val: 'val3'},
            ],
            [
                {val: 'val'},
                {val: 'val2'},
                {val: 'val3'},
            ],
            [
                {key: 'key', val: 'val'},
                {key: 'key2', val: 'val2'},
                {key: 'key3', val: 'val3'},
            ],
            [{val: 'aaa bbb'}],
            [
                {val: 'crab battle'},
                {val: 'efficient car goose'},
                {key: 'key3', val: 'value3'},
                {key: 'key4', val: 'value4'},
                {val: 'value5'},
                {val: 'value6'},
            ],
            [
                {val: 'x'},
                {val: 'y'},
                {key: 'z', val: '123'},
            ],
            [{key: 'a', val: 'b'}, {val: '-c'}],
            [
                {val: 'x:'},
                {val: 'int'},
                {val: '4'},
            ],
            [
                {val: 'x:'},
                {key: 'int', val: '32'},
            ],
        ]

        const parser = YesParser.fromBuffer(doc.join('\r\n'))

        assert.strictEqual(expected.length, parser.elements.length)

        const result = parser.elements.map((el) => el.args.map((kv) => extract(kv)))

        assert.deepEqual(result, expected)
    })

    it('should hoist Global elements to the top in the parsed results list', () => {
        const doc = [
            '1 key=val',
            '!a key=val',
            '2 val val',
            '!b',
            '3 key=val key2=val',
            '4 key=val',
            '!c val val key=val',
            '!d val, val',
            '5 key=val',
            '6 key=val',
            '!e key=val',
        ]

        const expected = [
            '!a key=val',
            '!b',
            '!c val, val, key=val',
            '!d val, val',
            '!e key=val',
            '1 key=val',
            '2 val, val',
            '3 key=val, key2=val',
            '4 key=val',
            '5 key=val',
            '6 key=val',
        ]

        const parser = YesParser.fromBuffer(doc.join('\r\n'))

        assert.strictEqual(expected.length, parser.elements.length)

        const result = parser.elements.map((e) => e.toString())

        assert.deepEqual(result, expected)
    })

    it('should never allow these regressions (sanity check)', () => {
        const doc = [
            'a key = val',
            'b val val2',
            'c val',
            'd key=val',
            'e key = val,',
            'f key = val aaa bbb',
            'g key = val ,',
            'i key = val , val2    ,',
            'j val val2 val3',
            'w x y z="123"',
        ]

        const expected = [
            [{key: 'key', val: ''}],
            [{val: 'val val2'}],
            [{val: 'val '}],
            [{key: 'key', val: ' val'}],
            [{val: 'val'}],
            [
                {val: 'key='},
                {val: 'val'},
                {val: 'aaa'},
                {val: 'bbb'}
            ],
            [{key: 'key', val: 'val '}],
            [{key: 'k', val: 'v'}, {val: 'val2    '}],
            [{val: 'val val2 val3'}],
            [{key: 'x y z', val: '123'},],
        ]

        const parser = YesParser.fromBuffer(doc.join('\r\n'))

        assert.strictEqual(expected.length, parser.elements.length)

        const result = parser.elements.map((el) => el.args.map((kv) => extract(kv)))

        assert.notDeepEqual(result, expected)
    })

    it('should parse tabs as white-space', () => {
        const doc = [
            'a b\tc',
            'e\tf\tg',
            'm n="\t\to\t\t"\tp',
            'scenes act/level1.dev\\',
            '       act/level2.dev\\',
            '       act/level3.dev',
        ]

        const expected = [
            [{val:'b'},{val:'c'}],
            [{val:'f'},{val:'g'}],
            [
                {key: 'n', val: '\t\to\t\t'},
                {val: 'p'}
            ],
            [
                {val: 'act/level1.dev'},
                {val: 'act/level2.dev'},
                {val: 'act/level3.dev'},
            ]
        ]

        const parser = YesParser.fromBuffer(doc.join('\r\n'))

        assert.strictEqual(expected.length, parser.elements.length)

        const result = parser.elements.map((el) => el.args.map((kv) => extract(kv)))

        assert.deepEqual(result, expected)
    })
    
    it('should allow macro-like string concepts', () => {
        const doc = [
            '!macro teardown_textbox(tb) = "call common.textbox_teardown tb="tb'
        ]

        const expected = [
            [{key: 'teardown_textbox(tb)', val: '"call common.textbox_teardown tb="tb'}]
        ]

        const parser = YesParser.fromBuffer(doc.join('\r\n'))

        assert.strictEqual(expected.length, parser.elements.length)

        const result = parser.elements.map((el) => el.args.map((kv) => extract(kv)))

        assert.deepEqual(result, expected)
    })

    it('should parse multi-line elements', () => {
        const doc = [
            'var msg: str="apple, bananas, coconut, diamond, eggplant\\',
            ', fig, grape, horse, igloo, joke, kangaroo\\',
            ', lemon, notebook, mango"',
            'var list2: [int]=[1\\',
            ', 2, 3, 4, 5, 6, 7]'
        ]

        const expected = [
            [
                {val: 'msg:'},
                {key: 'str',
                    val: 'apple, bananas, coconut, diamond, eggplant'
                    + ', fig, grape, horse, igloo, joke, kangaroo'
                    + ', lemon, notebook, mango'
                }
            ],
            [
                {val: 'list2:'},
                {key: '[int]', val: '[1, 2, 3, 4, 5, 6, 7]'}
            ],
        ]

        const literals = [
            new Literal('[', ']')
        ]

        const parser = YesParser.fromBuffer(doc.join('\r\n'), literals)

        assert.strictEqual(expected.length, 2)

        const result = parser.elements.map((el) => el.args.map((kv) => extract(kv)))

        assert.deepEqual(result, expected)
    })

    it('should parse with custom string literal spans', () => {
        const doc = [
            'fn hello_world: (&int num, str message) {}'
        ]

        const expected = [
            [
                {val: 'hello_world:'},
                {val: '(&int num, str message)'},
                {val: '{}'}
            ]
        ]

        const literals = [
            new Literal('(', ')'),
            new Literal('{', '}')
        ]

        const parser = YesParser.fromBuffer(doc.join('\r\n'), literals)

        assert.strictEqual(expected.length, 1)

        const result = parser.elements.map((el) => el.args.map((kv) => extract(kv)))

        assert.deepEqual(result, expected)
    })
})