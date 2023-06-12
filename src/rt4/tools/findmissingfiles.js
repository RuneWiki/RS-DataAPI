import fs from 'fs';
import Js5 from '#rt4/util/Js5.js';

let cache = new Js5();
await cache.load();

let missing = [];
cache.archives.filter(a => a.index.groupNameHashes.length).forEach(a => {
    // if (a.index.id !== 3) {
    //     return;
    // }

    fs.writeFileSync(`data/fhashes-${a.index.id}.json`, JSON.stringify({
        hashes: a.index.fileNameHashes.filter(f => f.filter(h => h > 0).length),
        names: a.index.fileNames.filter(f => f.filter(h => h).length)
    }, null, 2));

    for (let i = 0; i < a.index.fileNameHashes.length; i++) {
        if (!a.index.fileNameHashes[i]) {
            continue;
        }

        for (let j = 0; j < a.index.fileNameHashes[i].length; j++) {
            if (a.index.fileNameHashes[i][j] !== -1 && a.index.fileNameHashes[i][j] !== 0 && !a.index.fileNames[i][j]) {
                missing.push(a.index.fileNameHashes[i][j]);
            }
        }
    }
});

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + str.charCodeAt(i) - hash) | 0;
    }
    return hash;
}

let CHARSET = 'abcdefghijklmnopqrstuvwxyz0123456789_ -,';

function bruteForce(dest, len = 3, prefix = '', suffix = '', minLen = 1) {
    for (let i = 0; i < CHARSET.length; i++) {
        let name = prefix + CHARSET[i] + suffix;
        let hash = hashCode(name);

        if (missing.includes(hash)) {
            console.log(name, hash);
            if (!dest[hash]) {
                dest[hash] = [];
            }
            dest[hash].push(name);
        }

        if (len > minLen) {
            bruteForce(dest, len - 1, name, '');
        }
    }
}

let hashes = {};
bruteForce(hashes, 6);

if (Object.keys(hashes).length) {
    fs.writeFileSync(`data/ffound-${new Date().getTime()}.json`, JSON.stringify(hashes, null, 2));
}
