import fs from 'fs';
import Js5 from '#rt4/util/Js5.js';

let cache = new Js5();
await cache.load();

let missing = [];
cache.archives.filter(a => a.index.groupNameHashes.length).forEach(a => {
    if (a.index.id !== 8) {
        return;
    }

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
        let name = prefix + CHARSET[i];
        let full = name + suffix;
        let hash = hashCode(full);

        if (missing.includes(hash)) {
            console.log(full, hash);
            if (!dest[hash]) {
                dest[hash] = [];
            }
            dest[hash].push(full);
        }

        if (len > minLen) {
            bruteForce(dest, len - 1, name, suffix);
        }
    }
}

let hashes = {};
bruteForce(hashes, 10, '', ',0', 5);

if (Object.keys(hashes).length) {
    fs.writeFileSync(`data/sfound-${new Date().getTime()}.json`, JSON.stringify(hashes, null, 2));
}
