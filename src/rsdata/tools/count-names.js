import fs from 'fs';
import Js5 from '#rsdata/util/Js5.js';

let cache = new Js5();
await cache.load();

console.log('OpenRS2', fs.readFileSync('data/cache/openrs2id.txt', 'utf8'));
let archivesWithNames = cache.archives.filter(a => a.index.groupNameHashes.length).map(a => ({
    archive: a.index.id,
    groupHashCount: a.index.groupNameHashes.filter(g => g != -1).length
}));
console.log(archivesWithNames);

// fs.writeFileSync('data/hashes.json', JSON.stringify(interfaces.groupNames.filter(a => a).sort((a, b) => a.localeCompare(b)), null, 2));
// console.log(interfaces.groupNames.filter(n => n).length, interfaces.groupNames.filter(n => !n).length);
