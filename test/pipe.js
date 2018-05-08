'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const zlib = require('zlib');
const {promisify} = require('util');

const tar = require('tar-fs');
const gunzip = require('gunzip-maybe');
const pullout = require('pullout');
const tryToCatch = require('try-to-catch');

const pipe = require('..');
const test = require('tape');

const random = Math.random();

test('check parameters', (t) => {
    t.throws(pipe, /streams could not be empty!/, 'check streams');
    t.throws(pipe.bind(null, []), /callback could not be empty!/, 'check callback');
    t.end();
});

test('file1 | gunzip maybe: error', async (t) => {
    const _pipe = promisify(pipe);
    const file = fs.createReadStream('/hello');
    
    const [e] = await tryToCatch(_pipe, [file, gunzip()])
    
    t.equal(e.code, 'ENOENT', 'should return error');
    t.end();
});

test('file1 | file2: no error', (t) => {
    const tmp = os.tmpdir();
    const name = path.basename(__filename);
    const nameTmp = path.join(tmp, name + random);
     
    tryPipe(__filename, nameTmp, () => {
        const file1 = fs.readFileSync(__filename, 'utf8');
        const file2 = fs.readFileSync(nameTmp, 'utf8');
        
        fs.unlinkSync(nameTmp);
        
        t.equal(file1, file2, 'files equal');
        t.end();
    });
});

test('file1 | file2: write open EACESS', (t) => {
    const name = path.basename(__filename);
    const nameTmp = '/' + name + random;
    
    tryPipe(__filename, nameTmp, (error) => {
        t.ok(error, error && error.message);
        t.end();
    });
});

test('file1 | file2: write open EACESS: big file', (t) => {
    const name = path.basename(__filename);
    const nameTmp = '/' + name + random;
    
    tryPipe('/bin/bash', nameTmp, (error) => {
        t.ok(error, error && error.message);
        t.end();
    });
});

test('file1 | file2: read open ENOENT', (t) => {
    const tmp = os.tmpdir();
    const name = path.basename(__filename);
    const nameTmp = path.join(tmp, name + random);
    
    tryPipe(__filename + random, nameTmp, (error) => {
        t.ok(error, error && error.message);
        
        t.end();
    });
});

test('file1 | file2: error read EISDIR', (t) => {
    const tmp = os.tmpdir();
    const name = path.basename(__filename);
    const nameTmp = path.join(tmp, name + random);
    
    tryPipe('/', nameTmp, (error) => {
        fs.unlinkSync(nameTmp);
        t.equal(error.code, 'EISDIR', 'EISDIR: read error');
        t.end();
    });
});

test('file | dir: error write EISDIR', (t) => {
    tryPipe(__filename, '/', (error) => {
        t.equal(error.code, 'EISDIR', 'EISDIR: write error');
        t.end();
    });
});

test('dir1 | dir2: error read/write EISDIR', (t) => {
    tryPipe(__dirname, '/', (error) => {
        t.equal(error.code, 'EISDIR', 'read/write EISDIR');
        t.end();
    });
});

test('file1 | gzip | file2: no errors', (t) => {
    const tmp = os.tmpdir();
    const name = path.basename(__filename);
    const nameTmp = path.join(tmp, name + random);
    
    const read = fs.createReadStream(__filename);
    const write = fs.createWriteStream(nameTmp);
    const zip = zlib.createGzip();
    
    pipe([read, zip, write], () => {
        const file1 = fs.readFileSync(__filename, 'utf8');
        const file2 = fs.readFileSync(nameTmp);
        const zip = zlib.gzipSync(file1);
        
        fs.unlinkSync(nameTmp);
        
        t.deepEqual(zip, file2, 'file gziped');
        t.end();
    });
});

test('file1 | gzip', (t) => {
    const read = fs.createReadStream(__filename);
    const zip = zlib.createGzip();
    
    pipe([read, zip], (error) => {
        t.notOk(error, 'no errors');
        t.end();
    });
});

test('file1 | gzip: error ENOENT', (t) => {
    const read = fs.createReadStream(__filename + random);
    const zip = zlib.createGzip();
    
    pipe([read, zip], (error) => {
        t.ok(error, error.message);
        t.end();
    });
});

test('file1 | gzip: error EISDIR', (t) => {
    const read = fs.createReadStream('/');
    const zip = zlib.createGzip();
    
    pipe([read, zip], (error) => {
        t.ok(error, error.message);
        t.end();
    });
});

test('file1 | gunzip: error header check', (t) => {
    const read = fs.createReadStream(__filename);
    const gunzip = zlib.createGunzip();
    
    pipe([read, gunzip], (error) => {
        t.ok(error, error.message);
        t.end();
    });
});

test('file1 | gunzip | untar: error header check', (t) => {
    const read = fs.createReadStream(__filename);
    const gunzip = zlib.createGunzip();
    const tarStream = tar.extract(__dirname);
    
    pipe([read, gunzip, tarStream], (error) => {
        t.ok(error, error.message);
        t.end();
    });
});

test('file1 | gunzip | untar: error header check: gz', (t) => {
    const read = fs.createReadStream(__dirname + '/fixture/awk.1.gz');
    const gunzip = zlib.createGunzip();
    const tarStream = tar.extract(__dirname);
    
    pipe([read, gunzip, tarStream], (error) => {
        t.ok(error, error.message);
        t.end();
    });
});

test('tar | gzip | file', (t) => {
    const fixture = path.join(__dirname, 'fixture');
    const to = path.join(os.tmpdir(), `${Math.random()}.tar.gz`);
    const tarStream = tar.pack(fixture, {
        entries: [
            'pipe.txt'
        ]
    });
    
    const gzip = zlib.createGzip();
    const write = fs.createWriteStream(to);
    
    pipe([tarStream, gzip, write], () => {
        const toFile = fs.readFileSync(to);
        
        fs.unlinkSync(to);
        t.ok(toFile.length, 'should pack file');
        t.end();
    });
});

test('tar | gzip | file: error: EACESS', (t) => {
    const fixture = path.join(__dirname, 'fixture');
    const to = path.join(`/${Math.random()}.tar.gz`);
    const tarStream = tar.pack(fixture, {
        entries: [
            'pipe.txt'
        ]
    });
    
    const gzip = zlib.createGzip();
    const write = fs.createWriteStream(to);
    
    pipe([tarStream, gzip, write], (error) => {
        t.ok(error);
        t.end();
    });
});

test('file1, file2 | response: end false', (t) => {
    const server = http.createServer((req, res) => {
        const read1 = fs.createReadStream(__filename);
        const read2 = fs.createReadStream(__filename);
        
        pipe([read1, res], {end: false}, () => {
            pipe([read2, res], (error) => {
                t.notOk(error, 'file1, file2 -> response');
            });
        });
    });
    
    server.listen(() => {
        const {port} = server.address();
        const url = `http://127.0.0.1:${port}`;
        
        console.log(`server: 127.0.0.1:${port}`);
        
        http.get(url, (res) => {
            console.log(`request: ${url}`);
            
            pullout(res, 'string', (error, data) => {
                const file = fs.readFileSync(__filename, 'utf8');
                t.equal(data.length, file.length * 2, 'reponse == file1 + file2');
                t.end();
                server.close();
            });
        }).on('error', (error) => {
            t.ok(error, error.message);
            t.end();
        });
    });
    
    server.on('error', (error) => {
        t.ok(error, error.message);
        t.end();
    });
});

test('file1, file2 | options: empty object', (t) => {
    const server = http.createServer((req, res) => {
        const read1 = fs.createReadStream(__filename);
        const read2 = fs.createReadStream(__filename);
        
        pipe([read1, res], {}, () => {
            pipe([read2, res], () => {});
        });
    });
    
    server.listen(7331, '127.0.0.1', () => {
        console.log('server: 127.0.0.1:7331');
        
        http.get('http://127.0.0.1:7331', (res) => {
            console.log('request: http://127.0.0.1:7331');
            
            pullout(res, 'string', (error, data) => {
                const file = fs.readFileSync(__filename, 'utf8');
                t.equal(data.length, file.length, 'reponse == file');
                t.end();
                server.close();
            });
        }).on('error', (error) => {
            t.ok(error, error.message);
            t.end();
        });
    });
    
    server.on('error', (error) => {
        t.ok(error, error.message);
        t.end();
    });
});

function tryPipe(from, to, fn) {
    const read = fs.createReadStream(from);
    const write = fs.createWriteStream(to);
    
    pipe([read, write], (error) => {
        const name = checkListenersLeak([read, write]);
        
        if (name)
            console.error('possible memory leak: ', name);
        
        fn(error);
    });
}

function checkListenersLeak(streams) {
    let name;
    const events  = ['open', 'error', 'end', 'finish'];
    const regExp  = /^function (onError|onReadError|onWriteError|onReadEnd|onWriteFinish)/;
    
    streams.some((stream) => {
        events.some((event) => {
            stream.listeners(event).some((fn) => {
                const is = (fn + '').match(regExp);
                
                if (is)
                    name = is[1];
                
                return name;
            });
            
            return name;
        });
        
        return name;
    });
    
    return name;
}

