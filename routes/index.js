import Js5MasterIndex from '#rt4/util/Js5.js';
import { KNOWN_HASHES } from '#rt4/enum/hashes.js';

import { findCache, OPENRS2_API } from '#rt4/util/OpenRS2.js';

export default function (f, opts, next) {
    f.get('/download', async (req, reply) => {
        const { rev = -1, openrs2 = -1, match = 0 } = req.query;

        let cache = findCache(rev, openrs2, match);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match}`;
        }

        if (!cache.disk_store_valid) {
            reply.code(400);
            return 'Cache is not disk-store capable';
        }

        return reply.redirect(302, `${OPENRS2_API.replace('$scope', cache.scope).replace('$id', cache.id)}/disk.zip`);
    });

    f.get('/find', async (req, reply) => {
        const { rev = -1, openrs2 = -1, match = 0 } = req.query;

        let cache = findCache(rev, openrs2, match);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match}`;
        }

        return cache;
    });

    f.get('/parse', async (req, reply) => {
        const { rev = -1, openrs2 = -1, match = 0 } = req.query;

        let cache = findCache(rev, openrs2, match);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match}`;
        }

        let js5 = new Js5MasterIndex(cache.id);
        await js5.load();

        return js5;
    });

    f.get('/hashes', async (req, reply) => {
        const { rev = -1, openrs2 = -1, match = 0 } = req.query;

        let cache = findCache(rev, openrs2, match);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match}`;
        }

        let js5 = new Js5MasterIndex(cache.id);
        await js5.load();

        let output = '';
        for (let a = 0; a < js5.archives.length; a++) {
            let index = js5.archives[a];

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
