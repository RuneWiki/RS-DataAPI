import {} from 'dotenv/config.js';
import fs from 'fs';

import Js5MasterIndex from '#rsdata/util/Js5.js';
import { findCache } from '#rsdata/util/OpenRS2.js';

import { Component } from '#jagex3/type/Component.js';

let js5 = new Js5MasterIndex(findCache(550));

const comArchive = await js5.getArchive(3);
const spriteArchive = await js5.getArchive(8);

for (let i = 0; i < comArchive.capacity; i++) {
    let group = comArchive.groupIds[i];
    fs.writeFileSync('dump/com/' + group + '.json', JSON.stringify(await Component.decodeGroup(group, comArchive, spriteArchive), null, 2));
}
