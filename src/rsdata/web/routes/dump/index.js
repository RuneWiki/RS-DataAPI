import Js5MasterIndex from '#rsdata/util/Js5.js';
import { findCache } from '#rsdata/util/OpenRS2.js';

async function executeConfigGroups(js5, archive, cb) {
    await js5.indexes[archive].load();

    let lastGroup = js5.indexes[archive].capacity - 1;
    let remainder = js5.indexes[archive].groupCapacities[lastGroup];
    let total = (lastGroup << 8) + remainder;

    for (let id = 0; id < total; id++) {
        let group = id >>> 8;
        let file = id & 0xFF;

        if (!(await js5.indexes[archive].getGroup(group))) {
            // skip to next group (incomplete cache?)
            i += 0xFF;
            continue;
        }

        let data = await js5.indexes[archive].getFile(group, file);
        if (!data) {
            continue;
        }

        await cb(id, data);
    }
}

async function executeConfigFiles(js5, group, cb) {
    await js5.indexes[2].load();

    for (let i = 0; i < js5.indexes[2].fileIds[group].length; i++) {
        let id = js5.indexes[2].fileIds[group][i];
        let data = await js5.indexes[2].getFile(group, id);
        if (!data) {
            continue;
        }

        await cb(id, data);
    }
}

export default function (f, opts, next) {
    f.get('/flu', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (!req.query.game && rev !== -1 && rev < 234) {
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

        let out = '';
        await executeConfigFiles(js5, 1, async (id, data) => {
            if (id > 0) {
                out += '\n';
            }

            out += `[flu_${id}]\n`;
            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 1) {
                    out += `colour=0x${data.g3().toString(16).padStart(6, '0')}\n`;
                } else if (code === 2) {
                    let texture = data.g2();
                    if (texture === 65535) {
                        texture = -1;
                    }

                    out += `texture=${texture}\n`;
                } else if (code === 3) {
                    out += `scale=${data.g2()}\n`;
                } else if (code === 4) {
                    out += `blockshadow=no\n`;
                } else {
                    // console.log(`Unknown flu config code ${code}`);
                    break;
                }
            }
        });

        return out;
    });

    f.get('/idk', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (!req.query.game && rev !== -1 && rev < 234) {
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

        let out = '';
        await executeConfigFiles(js5, 3, async (id, data) => {
            if (id > 0) {
                out += '\n';
            }

            out += `[idk_${id}]\n`;
            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 1) {
                } else {
                    // console.log(`Unknown idk config code ${code}`);
                    break;
                }
            }
        });

        return out;
    });

    f.get('/flo', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (!req.query.game && rev !== -1 && rev < 234) {
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

        let out = '';
        await executeConfigFiles(js5, 4, async (id, data) => {
            if (id > 0) {
                out += '\n';
            }

            out += `[flo_${id}]\n`;
            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 1) {
                    out += `colour=0x${data.g3().toString(16).toUpperCase().padStart(6, '0')}\n`;
                } else if (code === 2) {
                    out += `texture=${data.g1()}\n`;
                } else if (code === 3) {
                    if (game === 'runescape' && rev >= 500) {
                        let texture = data.g2();
                        if (texture === 65535) {
                            texture = -1;
                        }
                        out += `texture=${data.g2()}\n`;
                    } else if (game === 'runescape') {
                        // 194-254 combined flo/flu
                        out += `overlay=yes\n`;
                    }
                } else if (code === 5) {
                    out += `occlude=no\n`;
                } else if (code === 6) {
                    // 194-254
                    out += `editname=${data.gjstr()}\n`;
                } else if (code === 7) {
                    out += `mapcolour=0x${data.g3().toString(16).toUpperCase().padStart(6, '0')}\n`;
                } else if (code === 8) {
                    out += 'code8=yes\n';
                } else if (code === 9) {
                    out += `scale=${data.g2()}\n`;
                } else if (code === 10) {
                    out += `blockshadow=no\n`;
                } else if (code === 11) {
                    out += `brightness=${data.g1()}\n`;
                } else if (code === 12) {
                    out += `blend=yes\n`;
                } else if (code === 13) {
                    out += `watercolour=${data.g3().toString(16).toUpperCase().padStart(6, '0')}\n`;
                } else if (code === 14) {
                    out += `wateropacity=${data.g1()}\n`;
                } else if (code === 16) {
                    out += `waterintensity=${data.g1()}\n`;
                } else if (code === 20) {
                    out += `code20=${data.g2()}\n`;
                } else if (code === 21) {
                    out += `code21=${data.g1()}\n`;
                } else if (code === 22) {
                    out += `code22=${data.g2()}\n`;
                } else {
                    // console.log(`Unknown flo config code ${code}`);
                    break;
                }
            }
        });

        return out;
    });

    f.get('/inv', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (!req.query.game && rev !== -1 && rev < 234) {
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

        let out = '';
        await executeConfigFiles(js5, 5, async (id, data) => {
            if (id > 0) {
                out += '\n';
            }

            out += `[inv_${id}]\n`;
            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 2) {
                    out += `size=${data.g2()}\n`;
                } else if (code === 4) {
                    let count = data.g1();

                    for (let j = 0; j < count; j++) {
                        out += `stock${j + 1}=obj_${data.g2()},${data.g2()}\n`;
                    }
                } else {
                    // console.log(`Unknown inv config code ${code}`);
                    break;
                }
            }
        });

        return out;
    });

    f.get('/loc', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (!req.query.game && rev !== -1 && rev < 234) {
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

        let out = '';
        let dump = async (id, data) => {
            if (id > 0) {
                out += '\n';
            }

            out += `[loc_${id}]\n`;
            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 1) {
                } else {
                    // console.log(`Unknown loc config code ${code}`);
                    break;
                }
            }
        };

        if (cache.indexes >= 16 && game != 'oldschool') {
            await executeConfigGroups(js5, 16, dump);
        } else {
            await executeConfigFiles(js5, 6, dump);
        }

        return out;
    });

    f.get('/enum', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (!req.query.game && rev !== -1 && rev < 234) {
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

        let out = '';
        let dump = async (id, data) => {
            if (id > 0) {
                out += '\n';
            }

            out += `[enum_${id}]\n`;
            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 1) {
                } else {
                    // console.log(`Unknown enum config code ${code}`);
                    break;
                }
            }
        };

        if (cache.indexes >= 17 && game != 'oldschool') {
            await executeConfigGroups(js5, 17, dump);
        } else {
            await executeConfigFiles(js5, 8, dump);
        }

        return out;
    });

    f.get('/npc', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (!req.query.game && rev !== -1 && rev < 234) {
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

        let out = '';
        let dump = async (id, data) => {
            if (id > 0) {
                out += '\n';
            }

            out += `[npc_${id}]\n`;
            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 1) {
                    let count = data.g1();

                    for (let i = 0; i < count; i++) {
                        out += `model${i + 1}=model_${data.g2()}\n`;
                    }
                } else if (code === 2) {
                    out += `name=${data.gjstr()}\n`;
                } else if (code === 3) {
                    out += `desc=${data.gjstr()}\n`;
                } else if (code === 12) {
                    let size = data.g1();

                    if (size !== 1) {
                        out += `size=${size}\n`;
                    }
                } else if (code === 13) {
                    out += `readyanim=seq_${data.g2()}\n`;
                } else if (code === 14) {
                    out += `walkanim=seq_${data.g2()}\n`;
                } else if (code === 15) {
                    out += `turnleftanim=seq_${data.g2()}\n`;
                } else if (code === 16) {
                    out += `turnrightanim=seq_${data.g2()}\n`;
                } else if (code === 17) {
                    out += `walkanims=seq_${data.g2()},seq_${data.g2()},seq_${data.g2()},seq_${data.g2()}\n`;
                } else if (code === 18) {
                    out += `category=category_${data.g2()}\n`;
                } else if (code >= 30 && code < 35) {
                    out += `op${code - 30 + 1}=${data.gjstr()}\n`;
                } else if (code === 40) {
                    let count = data.g1();

                    for (let i = 0; i < count; i++) {
                        out += `recol${i + 1}s=${data.g2()}\n`;
                        out += `recol${i + 1}d=${data.g2()}\n`;
                    }
                } else if (code === 41) {
                    let count = data.g1();

                    for (let i = 0; i < count; i++) {
                        out += `retex${i + 1}s=${data.g2()}\n`;
                        out += `retex${i + 1}d=${data.g2()}\n`;
                    }
                } else if (code === 60) {
                    let count = data.g1();

                    for (let i = 0; i < count; i++) {
                        out += `head${i + 1}=model_${data.g2()}\n`;
                    }
                } else if (code === 93) {
                    out += 'visonmap=no\n';
                } else if (code === 95) {
                    let level = data.g2();
                    out += `vislevel=${level !== 0 ? level : 'hide'}\n`;
                } else if (code === 97) {
                    out += `resizeh=${data.g2()}\n`;
                } else if (code === 98) {
                    out += `resizev=${data.g2()}\n`;
                } else if (code === 99) {
                    out += `drawpriority=yes\n`;
                } else if (code === 100) {
                    out += `ambient=${data.g1s()}\n`;
                } else if (code === 101) {
                    out += `contrast=${data.g1s()}\n`;
                } else if (code === 102) {
                    let start = data.g1();
                    let count = 0;

                    for (let i = start; i != 0; i >>= 1) {
                        count++;
                    }

                    for (let i = 0; i < count; i++) {
                        if (((start & 1) << i) !== 0) {
                            let sprite = data.gsmart4();
                            let tile = data.gsmart();
                            out += `icon${i + 1}=${sprite},${tile}\n`;
                        }
                    }
                } else if (code === 103) {
                    out += `turnspeed=${data.g2()}\n`;
                } else if (code === 106 || code === 118) {
                    let multivarbit = data.g2();
                    if (multivarbit === 65535) {
                        multivarbit = -1;
                    }

                    let multivar = data.g2();
                    if (multivar === 65535) {
                        multivar = -1;
                    }

                    let multinpc = -1;
                    if (code === 118) {
                        multinpc = data.g2();

                        if (multinpc === 65535) {
                            multinpc = -1;
                        }
                    }

                    if (multivarbit !== -1) {
                        out += `multivar=varbit_${multivarbit}\n`;
                    } else {
                        out += `multivar=var_${multivar}\n`;
                    }

                    out += `multinpc=npc_${multinpc}\n`;

                    let count = data.g1();
                    for (let i = 0; i <= count; i++) {
                        out += `multinpc${i + 1}=npc_${data.g2()}\n`;
                    }
                } else if (code === 107) {
                    out += `active=no\n`;
                } else if (code === 109) {
                    out += `slowmove=no\n`;
                } else if (code === 111) {
                    if (game === 'oldschool') {
                        out += `follower=yes\n`;
                    } else {
                        out += `shadowed=no\n`;
                    }
                } else if (code === 113) {
                    out += `shadow=${data.g2()},${data.g2()}\n`;
                } else if (code === 114) {
                    out += `shadowmod=${data.g1s()},${data.g1s()}\n`;
                } else if (code === 114) {
                    if (game === 'oldschool') {
                        out += `runanim=seq_${data.g2()}\n`;
                    } else {
                        out += `code115=${data.g1()},${data.g1()}\n`;
                    }
                } else if (code === 115) {
                    if (game === 'oldschool') {
                        out += `runanims=seq_${data.g2()},seq_${data.g2()},seq_${data.g2()},seq_${data.g2()}\n`;
                    } else {
                        out += `code115=${data.g1()},${data.g1()}\n`;
                    }
                } else if (code === 116) {
                    out += `crawlanim=seq_${data.g2()}\n`;
                } else if (code === 117) {
                    out += `crawlanims=seq_${data.g2()},seq_${data.g2()},seq_${data.g2()},seq_${data.g2()}\n`;
                } else if (code === 119) {
                    out += `loginscreenproperties=${data.g1s()}\n`;
                } else if (code === 122) {
                    out += `hitbar=${data.g2()}\n`;
                } else if (code === 123) {
                    out += `iconheight=${data.g2()}\n`;
                } else if (code === 125) {
                    out += `spawndirection=${data.g1s()}\n`;
                } else if (code === 126) {
                    out += `minimapmarkerobjectentry=${data.g2()}\n`;
                } else if (code === 127) {
                    out += `base=base_${data.g2()}\n`;
                } else if (code === 128) {
                    out += `code128=${data.g1()}\n`;
                } else if (code === 134) {
                    let sound = data.g2();
                    if (sound !== 65535) {
                        out += `idlesound=synth_${sound}\n`;
                    }

                    sound = data.g2();
                    if (sound !== 65535) {
                        out += `crawlsound=synth_${sound}\n`;
                    }

                    sound = data.g2();
                    if (sound !== 65535) {
                        out += `walksound=synth_${sound}\n`;
                    }

                    sound = data.g2();
                    if (sound !== 65535) {
                        out += `runsound=synth_${sound}\n`;
                    }

                    out += `soundradius=${data.g1()}\n`;
                } else if (code === 135) {
                    let op = data.g1();
                    let cursor = data.g2();

                    out += `cursor1=${cursor},${op}\n`;
                } else if (code === 136) {
                    let op = data.g1();
                    let cursor = data.g2();

                    out += `cursor2=${cursor},${op}\n`;
                } else if (code === 137) {
                    out += `attackcursor=${data.g2()}\n`;
                } else if (code === 249) {
                    let count = data.g1();

                    for (let i = 0; i < count; i++) {
                        let isString = data.gbool();
                        let key = data.g3();
                        let value = isString ? data.gjstr() : data.g4s();

                        out += `param=param_${key},${value}\n`;
                    }
                } else {
                    // console.log(`Unknown npc config code ${code}`);
                    break;
                }
            }
        };

        if (cache.indexes >= 18 && game != 'oldschool') {
            await executeConfigGroups(js5, 18, dump);
        } else {
            await executeConfigFiles(js5, 9, dump);
        }

        return out;
    });

    f.get('/obj', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (rev !== -1 && rev < 234) {
            game = 'oldschool';
        }

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

        function getWearPos(id) {
            switch (id) {
                case 0:
                    return 'hat';
                case 1:
                    return 'back';
                case 2:
                    return 'front';
                case 3:
                    return 'righthand';
                case 4:
                    return 'torso';
                case 5:
                    return 'lefthand';
                case 6:
                    return 'arms';
                case 7:
                    return 'legs';
                case 8:
                    return 'head';
                case 9:
                    return 'hands';
                case 10:
                    return 'feet';
                case 11:
                    return 'jaw';
                case 12:
                    return 'ring';
                case 13:
                    return 'quiver';
                default:
                    return id.toString();
            }
        }

        let out = '';
        let dump = async (id, data) => {
            if (id > 0) {
                out += '\n';
            }

            out += `[obj_${id}]\n`;
            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 1) {
                    let model = -1;

                    if (game == 'runescape' && rev >= 700) {
                        model = data.gsmart4();
                    } else {
                        model = data.g2();
                    }

                    out += `model=model_${model}\n`;
                } else if (code === 2) {
                    out += `name=${data.gjstr()}\n`;
                } else if (code === 3) {
                    out += `desc=${data.gjstr()}\n`;
                } else if (code === 4) {
                    out += `2dzoom=${data.g2()}\n`;
                } else if (code === 5) {
                    out += `2dxan=${data.g2()}\n`;
                } else if (code === 6) {
                    out += `2dyan=${data.g2()}\n`;
                } else if (code === 7) {
                    out += `2dxof=${data.g2s()}\n`;
                } else if (code === 8) {
                    out += `2dyof=${data.g2s()}\n`;
                } else if (code === 9) {
                    if (game == 'oldschool' && rev > 180) {
                        // TODO
                        out += `code9=${data.gjstr()}\n`;
                    } else {
                        out += 'code9=yes\n';
                    }
                } else if (code === 10) {
                    out += `code10=seq_${data.g2()}\n`;
                } else if (code === 11) {
                    out += 'stackable=yes\n';
                } else if (code === 12) {
                    out += `cost=${data.g4s()}\n`;
                } else if (code === 13) {
                    out += `wearpos=${getWearPos(data.g1())}\n`;
                } else if (code === 14) {
                    out += `wearpos2=${getWearPos(data.g1())}\n`;
                } else if (code === 16) {
                    out += `members=yes\n`;
                } else if (code === 18) {
                    out += `stacksize=${data.g2()}\n`;
                } else if (code === 23) {
                    let model = -1;

                    if (game == 'runescape' && rev >= 700) {
                        model = data.gsmart4();
                    } else {
                        model = data.g2();
                    }

                    if (game == 'runescape' && rev > 500) {
                        out += `manwear=model_${model}\n`;
                    } else {
                        let offset = data.g1();
                        out += `manwear=model_${model},${offset}\n`;
                    }
                } else if (code === 24) {
                    let model = -1;

                    if (game == 'runescape' && rev >= 700) {
                        model = data.gsmart4();
                    } else {
                        model = data.g2();
                    }

                    out += `manwear2=model_${model}\n`;
                } else if (code === 25) {
                    let model = -1;

                    if (game == 'runescape' && rev >= 700) {
                        model = data.gsmart4();
                    } else {
                        model = data.g2();
                    }

                    if (game == 'runescape' && rev > 500) {
                        out += `womanwear=model_${model}\n`;
                    } else {
                        let offset = data.g1();
                        out += `womanwear=model_${model},${offset}\n`;
                    }
                } else if (code === 26) {
                    let model = -1;

                    if (game == 'runescape' && rev >= 700) {
                        model = data.gsmart4();
                    } else {
                        model = data.g2();
                    }

                    out += `womanwear2=model_${model}\n`;
                } else if (code === 27) {
                    out += `wearpos3=${getWearPos(data.g1())}\n`;
                } else if (code >= 30 && code < 35) {
                    out += `op${code - 30 + 1}=${data.gjstr()}\n`;
                } else if (code >= 35 && code < 40) {
                    out += `iop${code - 35 + 1}=${data.gjstr()}\n`;
                } else if (code === 40) {
                    let count = data.g1();

                    for (let i = 0; i < count; i++) {
                        out += `recol${i + 1}s=${data.g2()}\n`;
                        out += `recol${i + 1}d=${data.g2()}\n`;
                    }
                } else if (code === 41) {
                    let count = data.g1();

                    for (let i = 0; i < count; i++) {
                        out += `retex${i + 1}s=${data.g2()}\n`;
                        out += `retex${i + 1}d=${data.g2()}\n`;
                    }
                } else if (code === 42) {
                    if (game == 'oldschool') {
                        out += `shiftop=${data.g1()}\n`;
                    } else {
                        // sprite-related
                        let count = data.g1();

                        config.recol_p = [];
                        for (let i = 0; i < count; i++) {
                            out += `recolp${i + 1}=${data.g1s()}\n`;
                        }
                    }
                } else if (code === 43) {
                    out += `tooltip=0x${data.g4().toString(16).padStart(6, '0')}\n`;
                } else if (code === 65) {
                    out += 'stockmarket=yes\n';
                } else if (code === 75) {
                    let grams = data.g2s();

                    let weight = grams;
                    let unit = 'g';

                    if (weight != 0) {
                        if (weight % 1000 === 0) {
                            weight = weight / 1000;
                            unit = 'kg';
                        } else {
                            const g_per_oz = 28_3495;
                            let oz = Math.floor((weight * 10000 + g_per_oz - 1) / g_per_oz);

                            if (Math.floor((oz * g_per_oz) / 10000) == weight) {
                                if (oz % 16 === 0) {
                                    weight = oz / 16;
                                    unit = 'lb';
                                } else {
                                    weight = oz;
                                    unit = 'oz';
                                }
                            }
                        }
                    }

                    out += `weight=${weight}${unit}\n`;
                } else if (code === 78) {
                    let model = -1;

                    if (game == 'runescape' && rev >= 700) {
                        model = data.gsmart4();
                    } else {
                        model = data.g2();
                    }

                    out += `womanwear3=model_${model}\n`;
                } else if (code === 79) {
                    let model = -1;

                    if (game == 'runescape' && rev >= 700) {
                        model = data.gsmart4();
                    } else {
                        model = data.g2();
                    }

                    out += `womanwear3=model_${model}\n`;
                } else if (code === 90) {
                    let model = -1;

                    if (game == 'runescape' && rev >= 700) {
                        model = data.gsmart4();
                    } else {
                        model = data.g2();
                    }

                    out += `manhead=model_${model}\n`;
                } else if (code === 91) {
                    let model = -1;

                    if (game == 'runescape' && rev >= 700) {
                        model = data.gsmart4();
                    } else {
                        model = data.g2();
                    }

                    out += `womanhead=model_${model}\n`;
                } else if (code === 92) {
                    let model = -1;

                    if (game == 'runescape' && rev >= 700) {
                        model = data.gsmart4();
                    } else {
                        model = data.g2();
                    }

                    out += `manhead2=model_${model}\n`;
                } else if (code === 93) {
                    let model = -1;

                    if (game == 'runescape' && rev >= 700) {
                        model = data.gsmart4();
                    } else {
                        model = data.g2();
                    }

                    out += `womanhead2=model_${model}\n`;
                } else if (code === 94) {
                    out += `category=category_${data.g2()}\n`;
                } else if (code === 95) {
                    out += `2dzan=${data.g2()}\n`;
                } else if (code === 96) {
                    out += `code96=${data.g1()}\n`;
                } else if (code === 97) {
                    out += `certlink=obj_${data.g2()}\n`;
                } else if (code === 98) {
                    out += `certtemplate=obj_${data.g2()}\n`;
                } else if (code >= 100 && code < 110) {
                    out += `count${code - 100 + 1}=obj_${data.g2()},${data.g2()}\n`;
                } else if (code === 110) {
                    out += `resizex=${data.g2()}\n`;
                } else if (code === 111) {
                    out += `resizey=${data.g2()}\n`;
                } else if (code === 112) {
                    out += `resizez=${data.g2()}\n`;
                } else if (code === 113) {
                    out += `ambient=${data.g1s()}\n`;
                } else if (code === 114) {
                    out += `contrast=${data.g1s()}\n`;
                } else if (code === 115) {
                    out += `team=${data.g1()}\n`;
                } else if (code === 121) {
                    out += `lentlink=obj_${data.g2()}\n`;
                } else if (code === 122) {
                    out += `lenttemplate=obj_${data.g2()}\n`;
                } else if (code === 125) {
                    out += `manwearoff=${data.g1s()},${data.g1s()},${data.g1s()}\n`;
                } else if (code === 126) {
                    out += `womanwearoff=${data.g1s()},${data.g1s()},${data.g1s()}\n`;
                } else if (code === 127) {
                    let op = data.g1();
                    let cursor = data.g2();

                    out += `cursor1=${cursor},${op}\n`;
                } else if (code === 128) {
                    let op = data.g1();
                    let cursor = data.g2();

                    out += `cursor2=${cursor},${op}\n`;
                } else if (code === 129) {
                    // guessing
                    let op = data.g1();
                    let cursor = data.g2();

                    out += `cursor3=${cursor},${op}\n`;
                } else if (code === 130) {
                    // guessing
                    let op = data.g1();
                    let cursor = data.g2();

                    out += `cursor4=${cursor},${op}\n`;
                } else if (code === 132) {
                    let count = data.g1();

                    for (let i = 0; i < count; i++) {
                        out += `quest${i + 1}=${data.g2()}\n`;
                    }
                } else if (code === 134) {
                    // guessing
                    out += `picksize=${data.g1()}\n`;
                } else if (code === 139) {
                    out += `boughtlink=obj_${data.g2()}\n`;
                } else if (code === 140) {
                    out += `boughttemplate=obj_${data.g2()}\n`;
                } else if (code === 148) {
                    out += `placeholderlink=obj_${data.g2()}\n`;
                } else if (code === 149) {
                    out += `placeholdertemplate=obj_${data.g2()}\n`;
                } else if (code === 249) {
                    let count = data.g1();

                    for (let i = 0; i < count; i++) {
                        let isString = data.gbool();
                        let key = data.g3();
                        let value = isString ? data.gjstr() : data.g4s();

                        out += `param=param_${key},${value}\n`;
                    }
                } else {
                    console.log(`Unrecognized obj config code ${code}`, data.gdata(data.pos + 2, 0, false));
                    break;
                }
            }
        };

        if (cache.indexes >= 20 && game != 'oldschool') {
            await executeConfigGroups(js5, 19, dump);
        } else {
            await executeConfigFiles(js5, 10, dump);
        }

        return out;
    });

    f.get('/param', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (!req.query.game && rev !== -1 && rev < 234) {
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

        let out = '';
        await executeConfigFiles(js5, 11, async (id, data) => {
            if (id > 0) {
                out += '\n';
            }

            out += `[param_${id}]\n`;
            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 1) {
                    let type = 0;
                    let char = '';

                    if (rev > 800) {
                        // TODO
                    } else {
                        type = data.g1();
                        char = new TextDecoder('windows-1252').decode(Uint8Array.from([type]));
                    }

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
                } else {
                    // console.log(`Unknown param config code ${code}`);
                    break;
                }
            }
        });

        return out;
    });

    f.get('/material', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (!req.query.game && rev !== -1 && rev < 234) {
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

        if (rev < 510 || rev > 839) {
            reply.code(400);
            return `Revision ${rev} does not support materials`;
        }

        if (rev > 753) {
            reply.code(400);
            return `Revision ${rev} changes not supported yet`;
        }

        await js5.getArchive(26);
        let data = await js5.getFile(26, 0, 0);

        let arr1 = [];
        let arr2 = [];
        let arr3 = [];
        let arr4 = [];
        let arr5 = [];
        let arr6 = [];
        let arr7 = [];
        let arr8 = [];
        let arr9 = [];
        let arr10 = [];
        let arr11 = [];
        let arr12 = [];
        let arr13 = [];
        let arr14 = [];
        let arr15 = [];
        let arr16 = [];
        let arr17 = [];
        let arr18 = [];
        let arr19 = [];
        let arr20 = [];
        let arr21 = [];

        let count = data.g2();
        for (let i = 0; i < count; i++) {
            arr1[i] = data.gbool();
        }

        for (let i = 0; i < count; i++) {
            if (arr1[i]) {
                arr2[i] = data.gbool();
            }
        }

        for (let i = 0; i < count; i++) {
            if (arr1[i]) {
                arr3[i] = data.gbool();
            }
        }

        for (let i = 0; i < count; i++) {
            if (arr1[i]) {
                arr4[i] = data.gbool();
            }
        }

        if (rev < 600) {
            for (let i = 0; i < count; i++) {
                if (arr1[i]) {
                    arr5[i] = data.gbool();
                }
            }
        }

        for (let i = 0; i < count; i++) {
            if (arr1[i]) {
                arr6[i] = data.g1s();
            }
        }

        for (let i = 0; i < count; i++) {
            if (arr1[i]) {
                arr7[i] = data.g1s();
            }
        }

        for (let i = 0; i < count; i++) {
            if (arr1[i]) {
                arr8[i] = data.g1s();
            }
        }

        for (let i = 0; i < count; i++) {
            if (arr1[i]) {
                arr9[i] = data.g1s();
            }
        }

        for (let i = 0; i < count; i++) {
            if (arr1[i]) {
                arr10[i] = data.g2();
            }
        }

        if (data.available > 0) {
            for (let i = 0; i < count; i++) {
                if (arr1[i]) {
                    arr11[i] = data.g1s();
                }
            }

            for (let i = 0; i < count; i++) {
                if (arr1[i]) {
                    arr12[i] = data.g1s();
                }
            }

            for (let i = 0; i < count; i++) {
                if (arr1[i]) {
                    arr13[i] = data.gbool();
                }
            }

            for (let i = 0; i < count; i++) {
                if (arr1[i]) {
                    arr14[i] = data.gbool();
                }
            }

            for (let i = 0; i < count; i++) {
                if (arr1[i]) {
                    arr15[i] = data.g1s();
                }
            }
            for (let i = 0; i < count; i++) {
                if (arr1[i]) {
                    arr16[i] = data.gbool();
                }
            }

            for (let i = 0; i < count; i++) {
                if (arr1[i]) {
                    arr17[i] = data.gbool();
                }
            }

            for (let i = 0; i < count; i++) {
                if (arr1[i]) {
                    arr18[i] = data.gbool();
                }
            }
        }

        if (data.available > 0) {
            for (let i = 0; i < count; i++) {
                if (arr1[i]) {
                    arr19[i] = data.g1();
                }
            }

            for (let i = 0; i < count; i++) {
                if (arr1[i]) {
                    arr20[i] = data.g4();
                }
            }

            for (let i = 0; i < count; i++) {
                if (arr1[i]) {
                    arr21[i] = data.g1();
                }
            }
        }

        if (data.available != 0) {
            console.log(data.available);
            reply.code(400);
            return 'Bad decode';
        }

        let out = '';

        for (let i = 0; i < count; i++) {
            if (!arr1[i]) {
                continue;
            }

            if (i > 0) {
                out += '\n';
            }

            out += `[material_${i}]\n`;
            out += `arr2=${arr2[i]}\n`;
            out += `arr3=${arr3[i]}\n`;
            out += `arr4=${arr4[i]}\n`;
            if (rev < 700) {
                out += `arr5=${arr5[i]}\n`;
            }
            out += `arr6=${arr6[i]}\n`;
            out += `arr7=${arr7[i]}\n`;
            out += `arr8=${arr8[i]}\n`;
            out += `arr9=${arr9[i]}\n`;
            out += `arr10=${arr10[i]}\n`;

            if (arr11.length) {
                out += `arr11=${arr11[i]}\n`;
                out += `arr12=${arr12[i]}\n`;
                out += `arr13=${arr13[i]}\n`;
                out += `arr14=${arr14[i]}\n`;
                out += `arr15=${arr15[i]}\n`;
                out += `arr16=${arr16[i]}\n`;
                out += `arr17=${arr17[i]}\n`;
                out += `arr18=${arr18[i]}\n`;
            }

            if (arr19.length) {
                out += `arr19=${arr19[i]}\n`;
                out += `arr20=${arr20[i]}\n`;
                out += `arr21=${arr21[i]}\n`;
            }
        }

        return out;
    });

    next();
}
