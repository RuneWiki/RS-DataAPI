import {} from 'dotenv/config';
import fs from 'fs';

import Js5 from '#rsdata/util/Js5.js';
import { findCache } from '#rsdata/util/OpenRS2.js';
import { initHashes, hashCode, exportHashes, getNamesByHash } from '#rsdata/enum/hashes.js';

const SKIP_KNOWN_HASHES = true; // re-start from the beginning

// ----

function* generate(chars) {
    let len = chars.length;
    let queue = Array(len).fill(0).map((_, n) => [n]);

    while (true) {
        let a = queue.shift();
        yield a.map(n => chars[n]).join('');

        for (let n = a[a.length - 1]; n < len; n++) {
            queue.push(a.concat(n));
        }
    }
}

const CHARSET = 'abcdefghijklmnopqrstuvwxyz0123456789_ -,';

let globalQuit = false;
async function bruteForce(missing, dest, prefix = '', suffix = '') {
    let sleepTimer = 0;

    for (let p of generate(CHARSET)) {
        if (globalQuit) {
            break;
        }

        let full = prefix + p + suffix;
        let hash = hashCode(full);

        if (missing.indexOf(hash) !== -1) {
            if (!dest[hash]) {
                dest[hash] = [];
            }

            console.log('found', full, hash);
            dest[hash].push(full);
        }

        sleepTimer++;
        if (sleepTimer > 5000) {
            console.log('sleeping', full);
            // return a little slice of time so we can ctrl+c
            await new Promise(resolve => setTimeout(resolve, 1));
            sleepTimer = 0;
        }
    }
}

// ----

if (!process.env.DEV_MODE) {
    initHashes();
}

let cache = new Js5(findCache(410).id);
cache.init();

let missing = [];
for (let i = 0; i < cache.archives.length; i++) {
    let index = cache.archives[i];
    if (index.id !== 8) {
        continue;
    }

    await index.load();

    for (let g = 0; g < index.capacity; g++) {
        let ghash = index.groupNameHashes[g];
        if (typeof ghash !== 'undefined' && ghash !== -1) {
            if (SKIP_KNOWN_HASHES && getNamesByHash(ghash).length) {
                continue;
            }

            if (missing.indexOf(ghash) === -1) {
                missing.push(ghash);
            }
        }

        if (index.fileNameHashes[g]) {
            for (let f = 0; f < index.fileIds.length; f++) {
                let fhash = index.fileNameHashes[g][f];

                if (typeof fhash !== 'undefined' && fhash !== -1 && fhash != 0) {
                    if (SKIP_KNOWN_HASHES && getNamesByHash(fhash).length) {
                        continue;
                    }

                    if (missing.indexOf(fhash) === -1) {
                        missing.push(fhash);
                    }
                }
            }
        }
    }
}

let hashes = {};

function save() {
    globalQuit = true;
    console.log('found', Object.keys(hashes).length, 'hashes');

    if (Object.keys(hashes).length) {
        fs.mkdirSync('dump', { recursive: true });
        fs.writeFileSync(`dump/found-${new Date().getTime()}.tsv`, exportHashes(hashes));
    }
}

process.on('SIGINT', function() {
    save();

    process.exit(0);
});

console.log(missing.length, 'hashes to find');

if (missing.length) {
    await bruteForce(missing, hashes);
    save();
}
