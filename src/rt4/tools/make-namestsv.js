import fs from 'fs';

import Js5 from '#rt4/util/Js5.js';
import { KNOWN_HASHES, KNOWN_NAMES } from '#rt4/enum/hashes.js';

let cache = new Js5();
await cache.load();

let totalGroups = 0;
let missingGroups = 0;
let totalFiles = 0;
let missingFiles = 0;

let output = '';
for (let a = 0; a < cache.archives.length; a++) {
    let index = cache.archives[a].index;

    for (let g = 0; g < index.capacity; g++) {
        let ghash = index.groupNameHashes[g];
        if (typeof ghash !== 'undefined' && ghash !== -1) {
            output += `${index.id}\t${g}\t-1\t${ghash}\t${KNOWN_HASHES[ghash] ?? ''}\n`;
            totalGroups++;
            if (!KNOWN_HASHES[ghash]) {
                missingGroups++;
            }
        }

        if (index.fileNameHashes[g]) {
            for (let f = 0; f < index.fileIds.length; f++) {
                let fhash = index.fileNameHashes[g][f];

                if (typeof fhash !== 'undefined' && fhash !== -1 && fhash !== 0) {
                    output += `${index.id}\t${g}\t${f}\t${fhash}\t${KNOWN_HASHES[fhash] ?? ''}\n`;
                    totalFiles++;
                    if (!KNOWN_HASHES[fhash]) {
                        missingFiles++;
                    }
                }
            }
        }
    }
}

console.log(`Groups: Missing ${missingGroups} / ${totalGroups} (${(missingGroups / totalGroups * 100).toFixed(2)}%)`);
console.log(`Files: Missing ${missingFiles} / ${totalFiles} (${(missingFiles / totalFiles * 100).toFixed(2)}%)`);

fs.writeFileSync('names.tsv', output);
