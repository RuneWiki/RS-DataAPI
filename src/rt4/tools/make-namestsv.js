import fs from 'fs';

import Js5 from '#rt4/util/Js5.js';
import { KNOWN_HASHES, KNOWN_NAMES } from '#rt4/enum/hashes.js';

let cache = new Js5();
await cache.load();

let output = '';
for (let a = 0; a < cache.archives.length; a++) {
    let index = cache.archives[a].index;

    for (let g = 0; g < index.capacity; g++) {
        let ghash = index.groupNameHashes[g];
        if (typeof ghash !== 'undefined' && ghash !== -1) {
            output += `${index.id}\t${g}\t-1\t${ghash}\t${KNOWN_HASHES[ghash] ?? ''}\n`;
        }

        if (index.fileNameHashes[g]) {
            for (let f = 0; f < index.fileIds.length; f++) {
                let fhash = index.fileNameHashes[g][f];
                if (typeof fhash !== 'undefined' && fhash !== -1 && fhash !== 0) {
                    output += `${index.id}\t${g}\t${f}\t${fhash}\t${KNOWN_HASHES[fhash] ?? ''}\n`;
                }
            }
        }
    }
}

fs.writeFileSync('names.tsv', output);
