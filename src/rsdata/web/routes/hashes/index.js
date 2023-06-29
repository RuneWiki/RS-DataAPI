import Js5MasterIndex from '#rsdata/util/Js5.js';
import { getNamesByHash } from '#rsdata/enum/hashes.js';

import { findCache, OPENRS2_API } from '#rsdata/util/OpenRS2.js';

export default function (f, opts, next) {
    f.get('/:archive', async (req, reply) => {
        const { archive } = req.params;
        const { rev = -1, openrs2 = -1, match = 0, missing = false } = req.query;

        let cache = findCache(rev, openrs2, match);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match}`;
        }

        let js5 = new Js5MasterIndex(cache);

        let output = '';
        let a = archive;
        let index = js5.indexes[a];
        await index.load();

        for (let g = 0; g < index.capacity; g++) {
            let ghash = index.groupNameHashes[g];
            if (typeof ghash !== 'undefined' && ghash !== -1) {
                let hashes = getNamesByHash(ghash);

                if (missing && !hashes.length) {
                    output += `${index.id}\t${g}\t-1\t${ghash}\n`;
                } else if (!missing) {
                    output += `${index.id}\t${g}\t-1\t${ghash}\t${hashes.join('\t')}\n`;
                }
            }

            if (index.fileNameHashes[g]) {
                for (let f = 0; f < index.fileIds.length; f++) {
                    let fhash = index.fileNameHashes[g][f];

                    if (typeof fhash !== 'undefined' && fhash !== -1 && fhash !== 0) {
                        let hashes = getNamesByHash(fhash);

                        if (missing && !hashes.length) {
                            output += `${index.id}\t${g}\t${f}\t${fhash}\n`;
                        } else if (!missing) {
                            output += `${index.id}\t${g}\t${f}\t${fhash}\t${hashes.join('\t')}\n`;
                        }
                    }
                }
            }
        }

        return output;
    });

    f.get('/', async (req, reply) => {
        const { rev = -1, openrs2 = -1, match = 0, missing } = req.query;

        let cache = findCache(rev, openrs2, match);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match}`;
        }

        let js5 = new Js5MasterIndex(cache);

        let output = '';
        for (let a = 0; a < js5.indexes.length; a++) {
            let index = js5.indexes[a];

            await index.load();

            for (let g = 0; g < index.capacity; g++) {
                let ghash = index.groupNameHashes[g];
                if (typeof ghash !== 'undefined' && ghash !== -1) {
                    let hashes = getNamesByHash(ghash);

                    if (missing && !hashes.length) {
                        output += `${index.id}\t${g}\t-1\t${ghash}\n`;
                    } else if (!missing) {
                        output += `${index.id}\t${g}\t-1\t${ghash}\t${hashes.join('\t')}\n`;
                    }
                }

                if (index.fileNameHashes[g]) {
                    for (let f = 0; f < index.fileIds.length; f++) {
                        let fhash = index.fileNameHashes[g][f];

                        if (typeof fhash !== 'undefined' && fhash !== -1 && fhash !== 0) {
                            let hashes = getNamesByHash(fhash);

                            if (missing && !hashes.length) {
                                output += `${index.id}\t${g}\t${f}\t${fhash}\n`;
                            } else if (!missing) {
                                output += `${index.id}\t${g}\t${f}\t${fhash}\t${hashes.join('\t')}\n`;
                            }
                        }
                    }
                }
            }
        }

        return output;
    });

    next();
}
