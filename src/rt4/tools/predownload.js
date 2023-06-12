import { getGroup, extractFlatFiles, readGroup } from '#rt4/util/OpenRS2.js';

await extractFlatFiles();
await getGroup(255, 255); // sent by the server
