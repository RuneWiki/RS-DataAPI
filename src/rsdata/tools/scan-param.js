import fs from 'fs';
import Js5 from '#rsdata/util/Js5.js';
import { findCache } from '#rsdata/util/OpenRS2.js';
import Js5MasterIndex from '#rsdata/util/Js5.js';

let caches = JSON.parse(fs.readFileSync('data/caches.json', 'ascii'))

let targetParam = 13;
let decode = true;

for (let i = 0; i < caches.length; i++) {
    if (caches.indexes < 10) {
        continue;
    }

    let js5 = new Js5MasterIndex(caches[i]);
    let config = await js5.getArchive(2);
    if (config.fileIds.length < 10) {
        continue;
    }

    let data = await config.getFile(11, targetParam);
    if (!data) {
        continue;
    }

    if (data.length > 2) { // 2 so we ignore autodisable=no
        console.log('openrs2', caches[i].game, caches[i].id, '-', 'timestamp', caches[i].timestamp, '-', 'rev', caches[i].builds.length ? caches[i].builds[0].major : -1, 'length', data.length);

        if (decode) {
            let out = '';
            
            out += `[param_${targetParam}]\n`;
            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 1) {
                    let type = data.g1();
                    let char = new TextDecoder('windows-1252').decode(Uint8Array.from([type]));

                    switch (char) {
                        case 'i':
                            type = 'int';
                            break;
                        case 'g':
                            type = 'enum';
                            break;
                        case 'd':
                            type = 'graphic';
                            break;
                        case 'O':
                            type = 'namedobj';
                            break;
                        case 'm':
                            type = 'model';
                            break;
                        case 'S':
                            type = 'stat';
                            break;
                        case 's':
                            type = 'string';
                            break;
                        case 'o':
                            type = 'obj';
                            break;
                        case 'l':
                            type = 'loc';
                            break;
                        case 'I':
                            type = 'component';
                            break;
                        case 'J':
                            type = 'struct';
                            break;
                        case '1':
                            type = 'boolean';
                            break;
                        case 'c':
                            type = 'coord';
                            break;
                        case 'y':
                            type = 'category';
                            break;
                        case 't':
                            type = 'spotanim';
                            break;
                        case 'n':
                            type = 'npc';
                            break;
                        case 'v':
                            type = 'inv';
                            break;
                        case 'P':
                            type = 'synth';
                            break;
                        case 'A':
                            type = 'seq';
                            break;
                        case 'Ð':
                            type = 'dbrow';
                            break;
                        case 'µ':
                            type = 'mapelement';
                            break;
                        // case 'K':
                        //     break;
                        // case '@':
                        //     break;
                        // case 'x':
                        //     break;
                        // case '«':
                        //     break;
                        // case '€':
                        //     break;
                        default:
                            // console.log(`Unknown param type ${type}: ${char}`);
                            break;
                    }

                    out += `type=${type}\n`;
                } else if (code === 2) {
                    out += `default=${data.g4s()}\n`;
                } else if (code === 4) {
                    out += `autodisable=no\n`;
                } else if (code === 5) {
                    out += `default=${data.gjstr()}\n`;
                } else if (code === 101) {
                    let type = data.gsmart();
                    out += `type=${type}\n`;
                } else {
                    console.log(`Unknown param config code ${code}`);
                    break;
                }
            }

            console.log(out);
            process.exit(0);
        }
    }
}
