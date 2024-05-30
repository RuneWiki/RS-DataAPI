import {} from 'dotenv/config.js';
import fs from 'fs';

import Js5MasterIndex from '#rsdata/util/Js5.js';
import { findCache } from '#rsdata/util/OpenRS2.js';
import { getNamesByHash, initHashes } from '#rsdata/enum/hashes.js';
import Packet from '#jagex3/io/Packet.js';

initHashes();

let js5 = new Js5MasterIndex(findCache(149));

fs.mkdirSync('dump/maps', { recursive: true });

// fs.writeFileSync('dump/maps/map_index', '');
await js5.indexes[5].load();
for (let i = 0; i < js5.indexes[5].size; i++) {
    let group = js5.indexes[5].groupIds[i];
    let hash = js5.indexes[5].groupNameHashes[group];
    let name = getNamesByHash(hash)[0];
    let data = await js5.indexes[5].getGroupByName(name);
    if (data.length === 0) {
        data = new Packet(new Uint8Array(1));
    }
    // fs.appendFileSync('dump/maps/map_index', group + '=' + name + '\n');
    // data.save(`dump/maps/${name}`, data.length);
    data.save(`dump/maps/${group}.dat`, data.length);
}
