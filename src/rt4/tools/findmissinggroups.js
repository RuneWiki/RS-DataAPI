import fs from 'fs';
import Js5 from '#rt4/util/Js5.js';

let cache = new Js5();
await cache.load();

let missing = [];
cache.archives.filter(a => a.index.groupNameHashes.length).forEach(a => {
    // if (a.index.id !== 3) {
    //     return;
    // }

    fs.writeFileSync(`data/ghashes-${a.index.id}.json`, JSON.stringify({
        hashes: a.index.groupNameHashes.filter(g => g !== -1),
        names: a.index.groupNames.filter(f => f)
    }, null, 2));

    for (let i = 0; i < a.index.groupNames.length; i++) {
        if (a.index.groupNameHashes[i] !== -1 && !a.index.groupNames[i]) {
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
bruteForce(hashes, 5);

if (Object.keys(hashes).length) {
    fs.writeFileSync(`data/gfound-${new Date().getTime()}.json`, JSON.stringify(hashes, null, 2));
}
