#!/usr/bin/env node
'use strict';
var path = require('path');
var fs = require('fs');
var Transform = require('readable-stream').Transform;
var zlip = require('zlib');

var args = require('minimist')(process.argv.slice(2), {
  boolean: ['help', 'in', 'out', 'compress', 'uncompress'],
  string: ['file']
});

var BASE_PATH = path.resolve(process.env.BASE_PATH || __dirname);
var OUTFILE = path.join(BASE_PATH, 'out.txt');

if (args.help) {
  printHelp();
} else if (args.in || args._.includes('-')) {
  processFile(process.stdin);
} else if (args.file) {
  let stream = fs.createReadStream(path.join(BASE_PATH, args.file));
  processFile(stream);
} else {
  error('Incorrect usage.', true);
}
// *******************

function processFile(inStream) {
  var outStream = inStream;
  if (args.uncompress) {
    let gunzipStream = zlip.createGunzip();
    outStream = outStream.pipe(gunzipStream);
  }
  var upperStream = new Transform({
    transform(chunk, enc, cb) {
      this.push(chunk.toString().toUpperCase());
      cb();
    }
  });

  outStream = outStream.pipe(upperStream);

  if (args.compress) {
    let gzipStream = zlip.createGzip();
    outStream = outStream.pipe(gzipStream);
    OUTFILE = `${OUTFILE}.gz`;
  }

  var targetStream = process.stdout;
  if (args.out) {
    targetStream = process.stdout;
  } else {
    targetStream = fs.createWriteStream(OUTFILE);
  }
  outStream.pipe(targetStream);
}

function error(msg, includeHelp = false) {
  console.error(msg);
  if (includeHelp) {
    console.log('');
    printHelp();
  }
}

function printHelp() {
  console.log('ex2 usage');
  console.log('  ex2.js --help');
  console.log('--help             print this help');
  console.log('--file={FILENAME}  process the file');
  console.log('--in,              process stdin');
  console.log('--out,             print to stdout');
  console.log('--compress,        gzip the output');
  console.log('--uncompress,      un-gzip the input');
  console.log('');
}
