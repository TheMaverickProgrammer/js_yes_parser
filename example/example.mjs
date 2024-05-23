import { parser, ErrorTypes } from './../lib.mjs';
const fs = require('fs');

parser
    .fromBuffer(fs.readFileSync('example.mesh', 'utf-8'))
    .then(printAll, unhandledException);

const printAll = function(results) {
    const {elements, errors} = results;

    for(const e of elements) {
        for(const a of e.attributes) {
            console.log(a);
        }
        console.log(e);
    }

    // Print errors with line numbers, if any
    for(const e of errors) {
        // Do not report empty lines (new lines)
        if(e.type == ErrorTypes.EOL_NO_DATE) continue;

        console.log(`Error: ${e}`);
    }
}
const unhandledException = function(error) {
    console.error(`Unhandled Exception thrown: ${error}`);
}