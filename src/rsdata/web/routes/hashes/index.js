import { Readable } from 'stream';

import Js5MasterIndex from '#rsdata/util/Js5.js';
import { getNamesByHash, hashCode } from '#rsdata/enum/hashes.js';

import { findCache, OPENRS2_API } from '#rsdata/util/OpenRS2.js';

export default function (f, opts, next) {
    f.get('/gen/:name', async (req, reply) => {
        const { name } = req.params;

        return hashCode(name);
    });

    f.get('/:archive', async (req, reply) => {
        const { archive } = req.params;
        const { openrs2 = -1, match = 0, lang = 'en', missing = false, groupsOnly = false } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (openrs2 !== -1) {
            game = null;
        }

        if (rev !== -1 && rev < 234) {
            game = 'oldschool';
        }

        // ----

        let cache = findCache(rev, openrs2, match, lang, game);
        if (!cache) {
            reply.code(400);
            return `Could not find cache for ${rev} ${openrs2} ${match} ${lang} ${game}`;
        }

        if (cache.builds.length) {
            rev = cache.builds[0].major;
        }
        game = cache.game;
        let js5 = new Js5MasterIndex(cache);

        // ----

        const stream = new Readable();
        stream._read = () => {};
        reply.send(stream);

        let a = archive;
        let index = js5.indexes[a];
        await index.load();

        for (let g = 0; g < index.capacity; g++) {
            let ghash = index.groupNameHashes[g];
            if (typeof ghash !== 'undefined' && ghash !== -1) {
                let hashes = getNamesByHash(ghash);

                if (missing && !hashes.length) {
                    stream.push(`${index.id}\t${g}\t-1\t${ghash}\n`);
                } else if (!missing) {
                    stream.push(`${index.id}\t${g}\t-1\t${ghash}\t${hashes.join('\t')}\n`);
                }
            }

            if (!groupsOnly) {
                if (index.fileNameHashes[g]) {
                    for (let f = 0; f < index.fileIds.length; f++) {
                        let fhash = index.fileNameHashes[g][f];

                        if (typeof fhash !== 'undefined' && fhash !== -1 && fhash !== 0) {
                            let hashes = getNamesByHash(fhash);

                            if (missing && !hashes.length) {
                                stream.push(`${index.id}\t${g}\t${f}\t${fhash}\n`);
                            } else if (!missing) {
                                stream.push(`${index.id}\t${g}\t${f}\t${fhash}\t${hashes.join('\t')}\n`);
                            }
                        }
                    }
                }
            }
        }

        stream.push(null);
    });

    f.get('/', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en', missing = false, groupsOnly = false } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (openrs2 !== -1) {
            game = null;
        }

        if (rev !== -1 && rev < 234) {
            game = 'oldschool';
        }

        // ----

        let cache = findCache(rev, openrs2, match, lang, game);
        if (!cache) {
            reply.code(400);
            return `Could not find cache for ${rev} ${openrs2} ${match} ${lang} ${game}`;
        }

        if (cache.builds.length) {
            rev = cache.builds[0].major;
        }
        game = cache.game;
        let js5 = new Js5MasterIndex(cache);

        // ----

        const stream = new Readable();
        stream._read = () => {};
        reply.send(stream);

        for (let a = 0; a < js5.indexes.length; a++) {
            let index = js5.indexes[a];

            await index.load();

            for (let g = 0; g < index.capacity; g++) {
                let ghash = index.groupNameHashes[g];
                if (typeof ghash !== 'undefined' && ghash !== -1) {
                    let hashes = getNamesByHash(ghash);

                    if (missing && !hashes.length) {
                        stream.push(`${index.id}\t${g}\t-1\t${ghash}\n`);
                    } else if (!missing) {
                        stream.push(`${index.id}\t${g}\t-1\t${ghash}\t${hashes.join('\t')}\n`);
                    }
                }

                if (!groupsOnly) {
                    if (index.fileNameHashes[g]) {
                        for (let f = 0; f < index.fileIds.length; f++) {
                            let fhash = index.fileNameHashes[g][f];

                            if (typeof fhash !== 'undefined' && fhash !== -1 && fhash !== 0) {
                                let hashes = getNamesByHash(fhash);

                                if (missing && !hashes.length) {
                                    stream.push(`${index.id}\t${g}\t${f}\t${fhash}\n`);
                                } else if (!missing) {
                                    stream.push(`${index.id}\t${g}\t${f}\t${fhash}\t${hashes.join('\t')}\n`);
                                }
                            }
                        }
                    }
                }
            }
        }

        stream.push(null);
    });

    next();
}
