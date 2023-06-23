import Js5MasterIndex from '#rt4/util/Js5.js';
import { findCache } from '#rt4/util/OpenRS2.js';

export default function (f, opts, next) {
    f.get('/inv', async (req, reply) => {
        const { rev = -1, openrs2 = -1, match = 0 } = req.query;

        let cache = findCache(rev, openrs2, match);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match}`;
        }

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
