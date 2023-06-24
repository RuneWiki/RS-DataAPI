import Js5MasterIndex from '#rt4/util/Js5.js';
import { KNOWN_HASHES } from '#rt4/enum/hashes.js';

import { findCache, OPENRS2_API } from '#rt4/util/OpenRS2.js';

export default function (f, opts, next) {
    f.get('/:archive', async (req, reply) => {
        const { archive } = req.params;
        const { rev = -1, openrs2 = -1, match = 0 } = req.query;

        let cache = findCache(rev, openrs2, match);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match}`;
        }

        let js5 = new Js5MasterIndex(cache.id);
        js5.init();

        let output = '';
        let a = archive;
        let index = js5.archives[a];
        await index.load();

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

        return output;
    });

    f.get('/', async (req, reply) => {
        const { rev = -1, openrs2 = -1, match = 0 } = req.query;

        let cache = findCache(rev, openrs2, match);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match}`;
        }

        let js5 = new Js5MasterIndex(cache.id);
        js5.init();

        let output = '';
        for (let a = 0; a < js5.archives.length; a++) {
            let index = js5.archives[a];

            await index.load();
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

        return output;
    });

    next();
}
