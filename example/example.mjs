import { YesParser, ErrorTypes } from './../lib.mjs'
import { readFileSync } from 'fs'

// This example shows how to print the contents from the parser
const printAll = function(results) {
    const {elements, errors} = results

    for(const el of elements) {
        for(const a of el.attributes) {
            console.log(a.toString())
        }
        console.log(el.toString())
    }

    // Print errors with line numbers, if any
    for(const err of errors) {
        // Do not report empty lines (new lines)
        if(err.type == ErrorTypes.EOL_NO_DATE) continue

        console.log(`Error: ${err}`)
    }
}

// Print unhandled exceptions thrown during parsing
const unhandledException = function(error) {
    console.error(`Unhandled Exception thrown: ${error}`)
}

// This example shows how to parse from a string buffer
// read from a file.
try {
    const buffer = readFileSync('./example/example.mesh', 'utf-8')
    const results = YesParser.fromBuffer(buffer)
    printAll(results)
} catch (err) {
    unhandledException(err)
}