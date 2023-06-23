import fs from 'fs';

import Js5MasterIndex from '#rt4/util/Js5.js';

let cache = new Js5MasterIndex();
await cache.load();

let inv = [];
for (let i = 0; i < cache.archives[2].fileIds[5].length; i++) {
    let data = await cache.archives[2].getFile(5, i);
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
            config.scope = data.g1();
        } else if (code === 4) {
            let count = data.g1();

            config.stock = [];
            for (let j = 0; j < count; j++) {
                config.stock[j] = {
                    id: data.g2(),
                    count: data.g2()
                };
            }
        } else if (code === 7) {
            config.code7 = true;
        } else if (code === 40) {
            config.code40 = true;
        } else {
            // console.log(`Unrecognized config code ${code}`, data);
        }
    }

    inv[i] = config;
}

let output = '';
for (let i = 0; i < inv.length; i++) {
    let config = inv[i];
    if (i > 0) {
        output += '\n';
    }

    output += `[inv_${i}]\n`;
    output += `scope=${config.scope}\n`;

    if (config.code7) {
        output += 'code7=yes\n';
    }

    if (config.code40) {
        output += 'code40=yes\n';
    }

    if (config.stock) {
        for (let j = 0; j < config.stock.length; j++) {
            output += `stock${j + 1}=obj_${config.stock[j].id},${config.stock[j].count}\n`;
        }
    }
}
fs.writeFileSync('dump/all.inv', output);
