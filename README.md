# YES Script
`YES` - **Y**our **E**xtensible **S**cript .

YES is a meta [scriptlet standard][SPEC] whose elements and meaning are determined
by **YOU** the programmer. They can be extended further with attributes which
allow **YOUR** end-users to make their additions to **YOUR** elements.

## Getting Started
The js API provides a parser which reads an entire file's contents by string.
You do not need to split the contents. The parser will do that for you.

`YesParser.fromBuffer` will return `{elements: [], errors: []}`

See [element.mjs](./src/element.mjs) for the full Yes Element API.

Each `error` take the form `{line: Integer, type: String}` to report to users.

```js
import { parser } from './../lib.mjs'
import { readFileSync } from 'fs'
const buffer = readFileSync('./example/example.mesh', 'utf-8')
const results = parser.fromBuffer(buffer)
```

See the [example](./example/example.mjs) to learn how to access
element types and their data from an example
[mesh file format](./example/example.mesh) which uses the YES scriplet spec.

## License
This project is licensed under the [Common Development and Distribution License (CDDL)][LEGAL].

[SPEC]: https://github.com/TheMaverickProgrammer/js_yes_parser/blob/master/spec/README.md
[LEGAL]: https://github.com/TheMaverickProgrammer/js_yes_parser/blob/master/legal/LICENSE.md