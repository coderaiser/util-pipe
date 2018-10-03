Pipe-io [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL] [![Coverage Status][CoverageIMGURL]][CoverageURL]
=========
Pipe [streams](https://github.com/substack/stream-handbook) and handle events.
Uses [stream.pipeline](https://nodejs.org/dist/latest-v10.x/docs/api/stream.html#stream_stream_pipeline_streams_callback) where can.

## Install

```
npm i pipe-io --save
```

## API

### pipe
Create pipe between streams and adds callback wich would 
be called once whenever everything is done, or error occures.

```js
const pipe = require('pipe-io');
const fs = require('fs');
const NAME = 'README.md';
const NAME2 = 'README2.md';
const readStream = fs.createReadStream(NAME);
const writeStream = fs.createWriteStream(NAME2);

pipe([readStream, writeStream], (error) => {
    console.log(error || 'done');
});
```

## Related

- [Pullout](https://github.com/coderaiser/pullout "Pullout") - pull out data from stream

## License
MIT

[NPMIMGURL]:                https://img.shields.io/npm/v/pipe-io.svg?style=flat
[BuildStatusIMGURL]:        https://img.shields.io/travis/coderaiser/pipe-io/master.svg?style=flat
[DependencyStatusIMGURL]:   https://img.shields.io/david/coderaiser/pipe-io.svg?style=flat
[LicenseIMGURL]:            https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[CoverageIMGURL]:           https://coveralls.io/repos/coderaiser/pipe-io/badge.svg?branch=master&service=github
[NPMURL]:                   https://npmjs.org/package/pipe-io "npm"
[BuildStatusURL]:           https://travis-ci.org/coderaiser/pipe-io  "Build Status"
[DependencyStatusURL]:      https://david-dm.org/coderaiser/pipe-io "Dependency Status"
[LicenseURL]:               https://tldrlegal.com/license/mit-license "MIT License"
[CoverageURL]:              https://coveralls.io/github/coderaiser/pipe-io?branch=master

