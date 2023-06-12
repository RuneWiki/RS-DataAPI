import fs from 'fs';
import Js5 from '#rt4/util/Js5.js';

let cache = new Js5();
await cache.load();

let missing = [];
cache.archives.filter(a => a.index.groupNameHashes.length).forEach(a => {
    // if (a.index.id !== 3) {
    //     return;
    // }

    fs.writeFileSync(`data/hashes-${a.index.id}.json`, JSON.stringify(a.index.groupNameHashes.filter(g => g !== -1), null, 2));
    for (let i = 0; i < a.index.groupNames.length; i++) {
        if (a.index.groupNameHashes[i] !== -1) {
            missing.push(a.index.groupNameHashes[i]);
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

function bruteForce(dest, len = 3, prefix = '', suffix = '') {
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

        if (len > 1) {
            bruteForce(dest, len - 1, name, '');
        }
    }
}

let hashes = {};
bruteForce(hashes, 8);

if (Object.keys(hashes).length) {
    fs.writeFileSync(`data/found-${new Date().getTime()}.json`, JSON.stringify(hashes, null, 2));
}
