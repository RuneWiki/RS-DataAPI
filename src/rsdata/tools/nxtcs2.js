import {} from 'dotenv/config.js';
import fs from 'fs';

import { getNamesByHash, initHashes } from '#rsdata/enum/hashes.js';

import { findCache } from '#rsdata/util/OpenRS2.js';
import Js5MasterIndex from '#rsdata/util/Js5.js';
import ClientScript from '#jagex3/type/ClientScript.js';

initHashes();

// const js5 = new Js5MasterIndex(findCache(-1, 1473)); // 667
// const js5 = new Js5MasterIndex(findCache(-1, 1202)); // rs3 nxt beta
const js5 = new Js5MasterIndex(findCache(-1, 547)); // rs3 java
const cs2 = await js5.getArchive(12);

ClientScript.loadOpcodeMap('config/cs2/nxt.opcodes.csv');

const script = new ClientScript(await cs2.getGroup(1), true, true, true);
console.log(script);
