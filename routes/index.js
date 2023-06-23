import { downloadFile } from '#rt4/util/OpenRS2.js';
import Js5MasterIndex from '#rt4/util/Js5.js';
import { KNOWN_HASHES } from '#rt4/enum/hashes.js';

import fs from 'fs';

let caches = JSON.parse(fs.readFileSync('data/caches.json', 'ascii'));

export default function (f, opts, next) {
    f.get('/', async (req, reply) => {
        let cache = new Js5MasterIndex(254);
        await cache.load();
    });

    f.get('/find', async (req, reply) => {
        const { rev } = req.query;

        return caches.filter(c => c.builds.length && c.builds[0].major == req.query.rev);
    });

    f.get('/parse', async (req, reply) => {
        const { rev, match = 0 } = req.query;

        let cache = caches.filter(c => c.builds.length && c.builds[0].major == req.query.rev)[match];
        let js5 = new Js5MasterIndex(cache.id);
        await js5.load();

        return js5;
    });

    f.get('/hashes', async (req, reply) => {
        const { rev, match = 0 } = req.query;

        let cache = caches.filter(c => c.builds.length && c.builds[0].major == req.query.rev)[match];
        let js5 = new Js5MasterIndex(cache.id);
        await js5.load();

        let output = '';
        for (let a = 0; a < js5.archives.length; a++) {
            let index = js5.archives[a].index;

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

        reply.type('text/plain');
        return output;
    });

    f.get('/dump/inv', async (req, reply) => {
        const { rev, match = 0 } = req.query;

        let cache = caches.filter(c => c.builds.length && c.builds[0].major == rev)[match];
        let js5 = new Js5MasterIndex(cache.id);
        await js5.load();

        let inv = [];
        for (let i = 0; i < js5.archives[2].fileIds[5].length; i++) {
            let id = js5.archives[2].fileIds[5][i];
            let data = await js5.archives[2].getFile(5, id);
            if (!data) {
                continue;
            }

            let config = {};

            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 2) {
                    config.size = data.g2();
                } else if (code === 4) {
                    let count = data.g1();

                    config.stock = [];
                    for (let j = 0; j < count; j++) {
                        config.stock[j] = {
                            id: data.g2(),
                            count: data.g2()
                        };
                    }
                } else {
                    console.log(`Unrecognized config code ${code}`, data);
                }
            }

            inv[i] = config;
        }

        let output = '';
        for (let i = 0; i < inv.length; i++) {
            let config = inv[i];
            if (!config) {
                continue;
            }

            if (i > 0) {
                output += '\n';
            }

            output += `[inv_${i}]\n`;

            if (config.size) {
                output += `size=${config.size}\n`;
            }

            if (config.stock) {
                for (let j = 0; j < config.stock.length; j++) {
                    output += `stock${j + 1}=obj_${config.stock[j].id},${config.stock[j].count}\n`;
                }
            }
        }

        return output;
    });

    next();
}
