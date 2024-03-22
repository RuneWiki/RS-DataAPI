import tarStream from 'tar-stream';

import ObjTypeList from '#rsdata/cache/ObjTypeList.js';
import Js5MasterIndex from '#rsdata/util/Js5.js';
import { findCache, findCacheNew } from '#rsdata/util/OpenRS2.js';
import NpcTypeList from '#rsdata/cache/NpcTypeList.js';
import ParamType from '#rsdata/cache/ParamType.js';
import { Component } from '#jagex3/type/Component.js';

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

        if (openrs2 !== -1) {
            game = null;
        }

        if (rev !== -1 && rev < 234) {
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

        if (openrs2 !== -1) {
            game = null;
        }

        if (rev !== -1 && rev < 234) {
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

        if (openrs2 !== -1) {
            game = null;
        }

        if (rev !== -1 && rev < 234) {
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

        if (openrs2 !== -1) {
            game = null;
        }

        if (rev !== -1 && rev < 234) {
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

        if (openrs2 !== -1) {
            game = null;
        }

        if (rev !== -1 && rev < 234) {
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

        if (openrs2 !== -1) {
            game = null;
        }

        if (rev !== -1 && rev < 234) {
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

            let inputtype = null;
            let outputtype = null;

            out += `[enum_${id}]\n`;
            if (rev > 800) {
                return;
            }

            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 1) {
                    let type = data.g1();

                    inputtype = ParamType.getType(type);
                    out += `inputtype=${inputtype}\n`;
                } else if (code === 2) {
                    let type = data.g1();

                    outputtype = ParamType.getType(type);
                    out += `outputtype=${outputtype}\n`;
                } else if (code === 3) {
                    out += `default=${data.gjstr()}\n`;
                } else if (code === 4) {
                    out += `default=${ParamType.prefixTypeValue(outputtype, data.g4s())}\n`;
                } else if (code === 5) {
                    let count = data.g2();

                    for (let j = 0; j < count; j++) {
                        out += `val=${ParamType.prefixTypeValue(inputtype, data.g4s())},${data.gjstr()}\n`;
                    }
                } else if (code === 6) {
                    let count = data.g2();

                    for (let j = 0; j < count; j++) {
                        out += `val=${ParamType.prefixTypeValue(inputtype, data.g4s())},${ParamType.prefixTypeValue(outputtype, data.g4s())}\n`;
                    }
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

    f.get('/struct', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (openrs2 !== -1) {
            game = null;
        }

        if (rev !== -1 && rev < 234) {
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

            out += `[struct_${id}]\n`;
            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 249) {
                    let count = data.g1();

                    for (let i = 0; i < count; i++) {
                        let isString = data.gbool();
                        let key = data.g3();
                        let value = isString ? data.gjstr() : data.g4s();

                        out += `param=param_${key},${value}\n`;
                    }
                } else {
                    // console.log(`Unknown enum config code ${code}`);
                    break;
                }
            }
        };

        if (game === 'oldschool') {
            await executeConfigFiles(js5, 34, dump);
        } else if (rev >= 745) {
            await executeConfigGroups(js5, 22, dump);
        } else {
            await executeConfigFiles(js5, 26, dump);
        }

        return out;
    });

    f.get('/npc', async (req, reply) => {
        const { openrs2 = null, format = 'txt', download = 'raw' } = req.query;
        let { rev = null, match = 0, game = null } = req.query;

        let caches = findCacheNew(openrs2, rev, game);
        if (!caches.length) {
            reply.code(404);
            return `No suitable caches found for query: ${JSON.stringify(req.query)}\nIf you specified a revision, it may have conflicts between different games - e.g. try specifying &game=oldschool or &game=runescape.\nOr perhaps your query is too specific.\nA successful request can look like ?rev=214 or ?rev=194&game=oldschool.`;
        }

        if (match >= caches.length) {
            match = caches.length - 1;
        }

        let cache = caches[match];
        if (cache.builds.length) {
            rev = cache.builds[0].major;
        }
        game = cache.game;

        // ----

        let out = '';
        let lastId = -1;
        let dump = (id, code, ...data) => {
            if (lastId != id) {
                if (id > 0) {
                    out += '\n';
                }

                out += `[npc_${id}]\n`;
            }

            lastId = id;

            if (code === 1) {
                for (let i = 0; i < data[0].length; i++) {
                    out += `model${i + 1}=model_${data[0][i]}\n`;
                }
            } else if (code === 2) {
                out += `name=${data[0]}\n`;
            } else if (code === 3) {
                out += `desc=${data[0]}\n`;
            } else if (code === 12) {
                if (data[0] != 1) {
                    out += `size=${data[0]}\n`;
                }
            } else if (code === 13) {
                out += `readyanim=seq_${data[0]}\n`;
            } else if (code === 14) {
                out += `walkanim=seq_${data[0]}\n`;
            } else if (code === 15) {
                out += `turnleftanim=${data[0]}\n`;
            } else if (code === 16) {
                if (game === 'oldschool') {
                    out += `turnrightanim=${data[0]}\n`;
                } else {
                    out += 'disposealpha=yes\n';
                }
            } else if (code === 17) {
                out += `walkanims=seq_${data[0]},seq_${data[1]},seq_${data[2]},seq_${data[3]}\n`;
            } else if (code === 18) {
                out += `category=category_${data[0]}\n`;
            } else if (code >= 30 && code < 35) {
                out += `op${code - 30 + 1}=${data[0]}\n`;
            } else if (code === 40) {
                for (let i = 0; i < data[0].length; i++) {
                    out += `recol${i + 1}s=${data[0][i]}\n`;
                    out += `recol${i + 1}d=${data[1][i]}\n`;
                }
            } else if (code === 41) {
                for (let i = 0; i < data[0].length; i++) {
                    out += `retex${i + 1}s=${data[0][i]}\n`;
                    out += `retex${i + 1}d=${data[1][i]}\n`;
                }
            } else if (code === 42) {
                for (let i = 0; i < data[0].length; i++) {
                    out += `recol${i + 1}p=${data[0][i]}\n`;
                }
            } else if (code === 60) {
                for (let i = 0; i < data[0].length; i++) {
                    out += `head${i + 1}=model_${data[0][i]}\n`;
                }
            } else if (code === 90) {
                out += `code90=${data[0]}\n`;
            } else if (code === 91) {
                out += `code91=${data[0]}\n`;
            } else if (code === 92) {
                out += `code92=${data[0]}\n`;
            } else if (code === 93) {
                out += 'visonmap=no\n';
            } else if (code === 95) {
                if (data[0] == 0) {
                    out += 'vislevel=hide\n';
                } else {
                    out += `vislevel=${data[0]}\n`;
                }
            } else if (code === 97) {
                out += `resizeh=${data[0]}\n`;
            } else if (code === 98) {
                out += `resizev=${data[0]}\n`;
            } else if (code === 99) {
                out += 'drawpriority=yes\n';
            } else if (code === 100) {
                out += `ambient=${data[0]}\n`;
            } else if (code === 101) {
                out += `contrast=${data[0]}\n`;
            } else if (code === 102) {
                if (game === 'oldschool') {
                    for (let i = 0; i < data[0].length; i++) {
                        out += `icon${i + 1}=${data[0][i][0]},${data[0][i][1]}\n`;
                    }
                } else {
                    out += `icon=${data[0]}\n`;
                }
            } else if (code === 103) {
                out += `turnspeed=${data[0]}\n`;
            } else if (code === 106 || code === 118) {
                if (data[0] != -1) {
                    out += `multivar=varbit_${data[0]}\n`;
                } else if (data[1] != -1) {
                    out += `multivar=var_${data[1]}\n`;
                }

                if (data[2] != -1) {
                    out += `multinpc=npc_${data[2]}\n`;
                }

                for (let i = 0; i < data[3].length; i++) {
                    if (data[3][i] == -1) {
                        continue;
                    }

                    out += `multinpc${i + 1}=npc_${data[3][i]}\n`;
                }
            } else if (code === 107) {
                out += 'active=no\n';
            } else if (code === 109) {
                out += 'slowmove=no';
            } else if (code === 111) {
                if (game === 'oldschool') {
                    out += 'follower=yes\n';
                } else {
                    out += 'shadowed=no\n';
                }
            } else if (code === 113) {
                out += `shadow=${data[0]},${data[1]}\n`;
            } else if (code === 114) {
                if (game === 'oldschool') {
                    out += `runanim=${data[0]}\n`;
                } else {
                    out += `shadowmod=${data[0]},${data[1]}\n`;
                }
            } else if (code === 115) {
                if (game === 'oldschool') {
                    out += `runanims=seq_${data[0]},seq_${data[1]},seq_${data[2]},seq_${data[3]}\n`;
                } else {
                    out += `shadowmod2=${data[0]},${data[1]}\n`;
                }
            } else if (code === 116) {
                out += `crawlanim=seq_${data[0]}\n`;
            } else if (code === 117) {
                out += `crawlanims=seq_${data[0]},seq_${data[1]},seq_${data[2]},seq_${data[3]}\n`;
            } else if (code === 119) {
                out += `loginscreenproperties=${data[0]}\n`;
            } else if (code === 121) {
                for (let i = 0; i < data[0].length; i++) {
                    if (!data[0][i]) {
                        continue;
                    }

                    out += `modeloff${i + 1}=${data[0][i][0]},${data[0][i][1]},${data[0][i][2]}\n`;
                }
            } else if (code === 122) {
                out += `hitbar=${data[0]}\n`;
            } else if (code === 123) {
                out += `iconheight=${data[0]}\n`;
            } else if (code === 125) {
                out += `spawndirection=${data[0]}\n`;
            } else if (code === 126) {
                out += `minimapmarkerobjectentry=${data[0]}\n`;
            } else if (code === 127) {
                out += `base=bas_${data[0]}\n`;
            } else if (code === 128) {
                out += `code128=${data[0]}\n`;
            } else if (code === 134) {
                out += `sounds=synth_${data[0]},synth_${data[1]},synth_${data[2]},synth_${data[3]},${data[4]}\n`;
            } else if (code === 135) {
                out += `cursor1=${data[1]},${data[0]}\n`;
            } else if (code === 136) {
                out += `cursor2=${data[1]},${data[0]}\n`;
            } else if (code === 137) {
                out += `attackcursor=${data[0]}`;
            } else if (code === 249) {
                for (let i = 0; i < data[0].length; i++) {
                    out += `param=param_${data[0][i].key},${data[0][i].value}\n`;
                }
            } else {
                out += `code${code}=${data.join(',')}\n`;
            }
        };

        // ----

        let js5 = new Js5MasterIndex(cache);
        let npcTypes = new NpcTypeList(js5);

        if (format === 'json') {
            await npcTypes.load();
            return npcTypes.configs;
        } else if (format === 'runelite') {
            await npcTypes.load();

            let npcs = [];
            for (let i = 0; i < npcTypes.count; i++) {
                let npc = await npcTypes.get(i);

                let rl = {
                    id: i,
                    name: npc.name ?? null,
                    size: npc.size ?? 1,
                    models: npc.models ?? [],
                    chatheadModels: npc.heads ?? [],
                    standingAnimation: npc.readyanim ?? -1,
                    rotateLeftAnimation: npc.turnleftanim ?? -1,
                    rotateRightAnimation: npc.turnrightanim ?? -1,
                    walkingAnimation: npc.walkanim ?? -1,
                    rotate180Animation: npc.walkanim_b ?? -1,
                    rotate90RightAnimation: npc.walkanim_r ?? -1,
                    rotate90LeftAnimation: npc.walkanim_l ?? -1,
                    recolorToFind: npc.recol_s ? npc.recol_s.map(x => x > 0x7FFF ? x -= 0x10000 : x) : [],
                    recolorToReplace: npc.recol_d ? npc.recol_d.map(x => x > 0x7FFF ? x -= 0x10000 : x) : [],
                    actions: npc.ops ?? new Array(5),
                    isMinimapVisible: npc.visonmap ?? false,
                    combatLevel: npc.vislevel ?? 0,
                    widthScale: npc.resizeh ?? 128,
                    heightScale: npc.resizev ?? 128,
                    hasRenderPriority: npc.drawpriority ?? false,
                    ambient: npc.ambient ?? 0,
                    contrast: npc.contrast ?? 0,
                    headIcon: npc.icon ?? -1,
                    rotationSpeed: npc.turnspeed ?? 32,
                    varbitId: npc.multivarbit ?? -1,
                    varpId: npc.multivar ?? -1,
                    isInteractable: npc.active ?? true,
                    rotationFlag: npc.slowmove ?? true,
                    isPet: npc.follower ?? false,
                    //
                    examine: npc.desc ?? null,
                    // retextureToFind: npc.retex_s ?? [],
                    // retextureToReplace: npc.retex_d ?? [],
                };

                npcs[i] = rl;
            }

            if (download == 'archive') {
                reply.type('application/x-tar');

                let tar = tarStream.pack();
                for (let i = 0; i < npcs.length; i++) {
                    tar.entry({ name: `${i}.json` }, JSON.stringify(npcs[i], null, 2));
                }
                tar.finalize();
                return tar;
            } else {
                reply.type('application/json');
                return JSON.stringify(npcs, null, 2);
            }
        } else {
            await npcTypes.load(dump, true);
            return out;
        }
    });

    f.get('/obj/category', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en', named = false, ids = false } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (openrs2 !== -1) {
            game = null;
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

        let categories = {};
        let objs = [];

        let dump = async (id, data) => {
            let obj = {};

            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 1) {
                    let model = -1;

                    if (game == 'runescape' && rev >= 700) {
                        model = data.gSmart2or4();
                    } else {
                        model = data.g2();
                    }
                } else if (code === 2) {
                    obj.name = data.gjstr();
                } else if (code === 3) {
                    data.gjstr();
                } else if (code === 4) {
                    data.g2();
                } else if (code === 5) {
                    data.g2();
                } else if (code === 6) {
                    data.g2();
                } else if (code === 7) {
                    data.g2s();
                } else if (code === 8) {
                    data.g2s();
                } else if (code === 9) {
                    if (game == 'oldschool' && rev > 180) {
                        data.gjstr();
                    }
                } else if (code === 10) {
                    data.g2();
                } else if (code === 11) {
                } else if (code === 12) {
                    data.g4s();
                } else if (code === 13) {
                    data.g1();
                } else if (code === 14) {
                    data.g1();
                } else if (code === 16) {
                } else if (code === 18) {
                    data.g2();
                } else if (code === 23) {
                    if (game == 'runescape' && rev >= 700) {
                        data.gSmart2or4();
                    } else {
                        data.g2();
                    }

                    if (game == 'runescape' && rev > 500) {
                    } else {
                        data.g1();
                    }
                } else if (code === 24) {
                    if (game == 'runescape' && rev >= 700) {
                        data.gSmart2or4();
                    } else {
                        data.g2();
                    }
                } else if (code === 25) {
                    if (game == 'runescape' && rev >= 700) {
                        data.gSmart2or4();
                    } else {
                        data.g2();
                    }

                    if (game == 'runescape' && rev > 500) {
                    } else {
                        data.g1();
                    }
                } else if (code === 26) {
                    if (game == 'runescape' && rev >= 700) {
                        data.gSmart2or4();
                    } else {
                        data.g2();
                    }
                } else if (code === 27) {
                    data.g1();
                } else if (code >= 30 && code < 35) {
                    data.gjstr();
                } else if (code >= 35 && code < 40) {
                    data.gjstr();
                } else if (code === 40) {
                    let count = data.g1();

                    for (let i = 0; i < count; i++) {
                        data.g2();
                        data.g2();
                    }
                } else if (code === 41) {
                    let count = data.g1();

                    for (let i = 0; i < count; i++) {
                        data.g2();
                        data.g2();
                    }
                } else if (code === 42) {
                    if (game == 'oldschool') {
                        data.g1();
                    } else {
                        // sprite-related
                        let count = data.g1();

                        config.recol_p = [];
                        for (let i = 0; i < count; i++) {
                            data.g1s();
                        }
                    }
                } else if (code === 43) {
                    data.g4();
                } else if (code === 65) {
                } else if (code === 75) {
                    data.g2s();
                } else if (code === 78) {
                    if (game == 'runescape' && rev >= 700) {
                        data.gSmart2or4();
                    } else {
                        data.g2();
                    }
                } else if (code === 79) {
                    if (game == 'runescape' && rev >= 700) {
                        data.gSmart2or4();
                    } else {
                        data.g2();
                    }
                } else if (code === 90) {
                    if (game == 'runescape' && rev >= 700) {
                        data.gSmart2or4();
                    } else {
                        data.g2();
                    }
                } else if (code === 91) {
                    if (game == 'runescape' && rev >= 700) {
                        data.gSmart2or4();
                    } else {
                        data.g2();
                    }
                } else if (code === 92) {
                    if (game == 'runescape' && rev >= 700) {
                        data.gSmart2or4();
                    } else {
                        data.g2();
                    }
                } else if (code === 93) {
                    if (game == 'runescape' && rev >= 700) {
                        data.gSmart2or4();
                    } else {
                        data.g2();
                    }
                } else if (code === 94) {
                    obj.category = data.g2();
                } else if (code === 95) {
                    data.g2();
                } else if (code === 96) {
                    data.g1();
                } else if (code === 97) {
                    data.g2();
                } else if (code === 98) {
                    data.g2();
                } else if (code >= 100 && code < 110) {
                    data.g2();
                    data.g2();
                } else if (code === 110) {
                    data.g2();
                } else if (code === 111) {
                    data.g2();
                } else if (code === 112) {
                    data.g2();
                } else if (code === 113) {
                    data.g1s();
                } else if (code === 114) {
                    data.g1s();
                } else if (code === 115) {
                    data.g1();
                } else if (code === 121) {
                    data.g2();
                } else if (code === 122) {
                    data.g2();
                } else if (code === 125) {
                    data.g1s();
                    data.g1s();
                    data.g1s();
                } else if (code === 126) {
                    data.g1s();
                    data.g1s();
                    data.g1s();
                } else if (code === 127) {
                    data.g1();
                    data.g2();
                } else if (code === 128) {
                    data.g1();
                    data.g2();
                } else if (code === 129) {
                    data.g1();
                    data.g2();
                } else if (code === 130) {
                    data.g1();
                    data.g2();
                } else if (code === 132) {
                    let count = data.g1();

                    for (let i = 0; i < count; i++) {
                        data.g2();
                    }
                } else if (code === 134) {
                    data.g1();
                } else if (code === 139) {
                    data.g2();
                } else if (code === 140) {
                    data.g2();
                } else if (code === 148) {
                    data.g2();
                } else if (code === 149) {
                    data.g2();
                } else if (code === 249) {
                    let count = data.g1();

                    for (let i = 0; i < count; i++) {
                        let isString = data.gbool();
                        let key = data.g3();
                        let value = isString ? data.gjstr() : data.g4s();
                    }
                } else {
                    console.log(`Unrecognized obj config code ${code}`, data.gdata(data.pos + 2, 0, false));
                    break;
                }
            }

            objs[id] = obj;
        };

        if (cache.indexes >= 20 && game != 'oldschool') {
            await executeConfigGroups(js5, 19, dump);
        } else {
            await executeConfigFiles(js5, 10, dump);
        }

        for (let i = 0; i < objs.length; i++) {
            let obj = objs[i];
            if (typeof obj.category === 'undefined') {
                continue;
            }

            if (!categories[obj.category]) {
                categories[obj.category] = [];
            }

            if (named == 'true') {
                if (ids == 'true') {
                    categories[obj.category].push({
                        id: i,
                        name: obj.name ?? `obj_${i}`
                    });
                } else {
                    categories[obj.category].push(obj.name ?? `obj_${i}`);
                }
            } else {
                categories[obj.category].push(i);
            }
        }

        return categories;
    });

    f.get('/obj', async (req, reply) => {
        const { openrs2 = null, format = 'txt', download = 'raw' } = req.query;
        let { rev = null, match = 0, game = null } = req.query;

        let caches = findCacheNew(openrs2, rev, game);
        if (!caches.length) {
            reply.code(404);
            return `No suitable caches found for query: ${JSON.stringify(req.query)}\nIf you specified a revision, it may have conflicts between different games - e.g. try specifying &game=oldschool or &game=runescape.\nOr perhaps your query is too specific.\nA successful request can look like ?rev=214 or ?rev=194&game=oldschool.`;
        }

        if (match >= caches.length) {
            match = caches.length - 1;
        }

        let cache = caches[match];
        if (cache.builds.length) {
            rev = cache.builds[0].major;
        }
        game = cache.game;

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
        let lastId = -1;
        let dump = (id, code, ...data) => {
            if (lastId != id) {
                if (id > 0) {
                    out += '\n';
                }

                out += `[obj_${id}]\n`;
            }

            lastId = id;

            if (code === 1) {
                out += `model=model_${data[0]}\n`;
            } else if (code === 2) {
                out += `name=${data[0]}\n`;
            } else if (code === 3) {
                out += `desc=${data[0]}\n`;
            } else if (code === 4) {
                out += `2dzoom=${data[0]}\n`;
            } else if (code === 5) {
                out += `2dxan=${data[0]}\n`;
            } else if (code === 6) {
                out += `2dyan=${data[0]}\n`;
            } else if (code === 7) {
                out += `2dxof=${data[0]}\n`;
            } else if (code === 8) {
                out += `2dyof=${data[0]}\n`;
            } else if (code === 9) {
                out += `code9=${data[0]}\n`;
            } else if (code === 10) {
                out += `code10=seq_${data[0]}\n`;
            } else if (code === 11) {
                out += 'stackable=yes\n';
            } else if (code === 12) {
                out += `cost=${data[0]}\n`;
            } else if (code === 13) {
                out += `wearpos=${getWearPos(data[0])}\n`;
            } else if (code === 14) {
                out += `wearpos2=${getWearPos(data[0])}\n`;
            } else if (code === 16) {
                out += 'members=yes\n';
            } else if (code === 18) {
                out += `stacksize=${data[0]}\n`;
            } else if (code === 23) {
                if (data.length > 1) {
                    out += `manwear=model_${data[0]},${data[1]}\n`;
                } else {
                    out += `manwear=model_${data[0]}\n`;
                }
            } else if (code === 24) {
                out += `manwear2=model_${data[0]}\n`;
            } else if (code === 25) {
                if (data.length > 1) {
                    out += `womanwear=model_${data[0]},${data[1]}\n`;
                } else {
                    out += `womanwear=model_${data[0]}\n`;
                }
            } else if (code === 26) {
                out += `womanwear2=model_${data[0]}\n`;
            } else if (code === 27) {
                out += `wearpos3=${getWearPos(data[0])}\n`;
            } else if (code >= 30 && code < 35) {
                out += `op${code - 30 + 1}=${data[0]}\n`;
            } else if (code >= 35 && code < 40) {
                out += `iop${code - 35 + 1}=${data[0]}\n`;
            } else if (code === 40) {
                for (let i = 0; i < data[0].length; i++) {
                    out += `recol${i + 1}s=${data[0][i]}\n`;
                    out += `recol${i + 1}d=${data[1][i]}\n`;
                }
            } else if (code === 41) {
                for (let i = 0; i < data[0].length; i++) {
                    out += `retex${i + 1}s=${data[0][i]}\n`;
                    out += `retex${i + 1}d=${data[1][i]}\n`;
                }
            } else if (code === 42) {
                if (game === 'oldschool') {
                    out += `shiftop=${data[0]}\n`;
                } else {
                    for (let i = 0; i < data[0].length; i++) {
                        out += `recol${i + 1}p=${data[0][i]}\n`;
                    }
                }
            } else if (code === 43) {
                out += `tooltip=0x${data[0].toString(16).toUpperCase().padStart(6, '0')}\n`;
            } else if (code === 65) {
                out += 'stockmarket=yes\n';
            } else if (code === 75) {
                let grams = data[0];

                let weight = grams;
                let unit = 'g';

                if (weight != 0) {
                    if (weight % 1000 === 0) {
                        weight = weight / 1000;
                        unit = 'kg';
                    } else {
                        const g_per_oz = 28_3495;
                        let oz = Math.floor((Math.abs(weight) * 10000 + g_per_oz - 1) / g_per_oz);

                        if (Math.floor((oz * g_per_oz) / 10000) == Math.abs(weight)) {
                            if (oz % 16 === 0) {
                                weight = oz / 16;
                                unit = 'lb';
                            } else {
                                weight = oz;
                                unit = 'oz';
                            }

                            if (grams < 0) {
                                weight = -weight;
                            }
                        }
                    }
                }

                out += `weight=${weight}${unit}\n`;
            } else if (code === 78) {
                out += `manwear3=model_${data[0]}\n`;
            } else if (code === 79) {
                out += `manwear3=model_${data[0]}\n`;
            } else if (code === 90) {
                out += `manhead=model_${data[0]}\n`;
            } else if (code === 91) {
                out += `womanhead=model_${data[0]}\n`;
            } else if (code === 92) {
                out += `manhead2=model_${data[0]}\n`;
            } else if (code === 93) {
                out += `womanhead2=model_${data[0]}\n`;
            } else if (code === 94) {
                out += `category=category_${data[0]}\n`;
            } else if (code === 95) {
                out += `2dzan=${data[0]}\n`;
            } else if (code === 96) {
                switch (data[0]) {
                    // case 1:
                    //     out += `dummyitem=inv_only\n`;
                    //     break;
                    // case 2:
                    //     out += `dummyitem=graphic_only\n`;
                    //     break;
                    default:
                        out += `dummyitem=${data[0]}\n`;
                        break;
                }
            } else if (code === 97) {
                out += `certlink=obj_${data[0]}\n`;
            } else if (code === 98) {
                out += `certtemplate=obj_${data[0]}\n`;
            } else if (code >= 100 && code < 110) {
                out += `count${code - 100 + 1}=obj_${data[0]},${data[1]}\n`;
            } else if (code === 110) {
                out += `resizex=${data[0]}\n`;
            } else if (code === 111) {
                out += `resizey=${data[0]}\n`;
            } else if (code === 112) {
                out += `resizez=${data[0]}\n`;
            } else if (code === 113) {
                out += `ambient=${data[0]}\n`;
            } else if (code === 114) {
                out += `contrast=${data[0]}\n`;
            } else if (code === 115) {
                out += `team=${data[0]}\n`;
            } else if (code === 121) {
                out += `lentlink=obj_${data[0]}\n`;
            } else if (code === 122) {
                out += `lenttemplate=obj_${data[0]}\n`;
            } else if (code === 125) {
                out += `manwearoff=${data[0]},${data[1]},${data[2]}\n`;
            } else if (code === 126) {
                out += `manwearoff=${data[0]},${data[1]},${data[2]}\n`;
            } else if (code === 127) {
                out += `cursor1=${data[1]},${data[0]}\n`;
            } else if (code === 128) {
                out += `cursor2=${data[1]},${data[0]}\n`;
            } else if (code === 129) {
                out += `cursor3=${data[1]},${data[0]}\n`;
            } else if (code === 130) {
                out += `cursor4=${data[1]},${data[0]}\n`;
            } else if (code === 132) {
                for (let i = 0; i < data[0].length; i++) {
                    out += `quest${i + 1}=${data[0][i]}\n`;
                }
            } else if (code === 134) {
                out += `picksize=${data[0]}\n`;
            } else if (code === 139) {
                out += `boughtlink=obj_${data[0]}\n`;
            } else if (code === 140) {
                out += `boughttemplate=obj_${data[0]}\n`;
            } else if (code === 148) {
                out += `placeholderlink=obj_${data[0]}\n`;
            } else if (code === 149) {
                out += `placeholdertemplate=obj_${data[0]}\n`;
            } else if (code === 249) {
                for (let i = 0; i < data[0].length; i++) {
                    out += `param${i + 1}=${data[0][i].key},${data[0][i].value}\n`;
                }
            }
        };

        // ----

        let js5 = new Js5MasterIndex(cache);
        let objTypes = new ObjTypeList(js5);

        if (format === 'json') {
            await objTypes.load();
            return objTypes.configs;
        } else if (format === 'runelite') {
            await objTypes.load();

            let objs = [];
            for (let i = 0; i < objTypes.count; i++) {
                let obj = await objTypes.get(i);

                if (!obj.ops) {
                    obj.ops = new Array(5);
                }

                if (obj.ops && !obj.ops[2]) {
                    obj.ops[2] = 'Take';
                }

                if (!obj.iops) {
                    obj.iops = new Array(5);
                }

                if (obj.iops && !obj.iops[4]) {
                    obj.iops[4] = 'Drop';
                }

                let rl = {
                    id: i,
                    name: obj.name ?? 'null',
                    resizeX: typeof obj.resizex !== 'undefined' ? obj.resizex : 128,
                    resizeY: typeof obj.resizey !== 'undefined' ? obj.resizey : 128,
                    resizeZ: typeof obj.resizez !== 'undefined' ? obj.resizez : 128,
                    xan2d: obj.xan2d ?? 0,
                    yan2d: obj.yan2d ?? 0,
                    zan2d: obj.zan2d ?? 0,
                    cost: obj.cost ?? 0,
                    isTradable: obj.stockmarket ?? false,
                    stackable: obj.stackable ?? false,
                    inventoryModel: obj.model ?? -1,
                    members: obj.members ?? false,
                    zoom2d: obj.zoom2d ?? 2000,
                    xOffset2d: obj.xan2d ?? 0,
                    yOffset2d: obj.yan2d ?? 0,
                    ambient: typeof obj.ambient !== 'undefined' ? obj.ambient : 0,
                    contrast: typeof obj.contrast !== 'undefined' ? obj.contrast : 0,
                    options: obj.ops,
                    interfaceOptions: obj.iops,
                    maleModel0: typeof obj.manwear !== 'undefined' ? obj.manwear : -1,
                    maleModel1: typeof obj.manwear2 !== 'undefined' ? obj.manwear2 : -1,
                    maleModel2: typeof obj.manwear3 !== 'undefined' ? obj.manwear3 : -1,
                    maleOffset: obj.manwearOffsetY ?? 0,
                    maleHeadModel: typeof obj.manhead !== 'undefined' ? obj.manhead : -1,
                    maleHeadModel2: typeof obj.manhead2 !== 'undefined' ? obj.manhead2 : -1,
                    femaleModel0: typeof obj.womanwear !== 'undefined' ? obj.womanwear : -1,
                    femaleModel1: typeof obj.womanwear2 !== 'undefined' ? obj.womanwear2 : -1,
                    femaleModel2: typeof obj.womanwear3 !== 'undefined' ? obj.womanwear3 : -1,
                    femaleOffset: obj.womanwearOffsetY ?? 0,
                    femaleHeadModel: typeof obj.womanhead !== 'undefined' ? obj.womanhead : -1,
                    femaleHeadModel2: typeof obj.womanhead2 !== 'undefined' ? obj.womanhead2 : -1,
                    notedID: typeof obj.certlink !== 'undefined' ? obj.certlink : -1,
                    notedTemplate: typeof obj.certtemplate !== 'undefined' ? obj.certtemplate : -1,
                    team: typeof obj.team !== 'undefined' ? obj.team : 0,
                    shiftClickDropIndex: typeof obj.shiftop !== 'undefined' ? obj.shiftop : -2,
                    boughtId: typeof obj.boughtlink !== 'undefined' ? obj.boughtlink : -1,
                    boughtTemplate: typeof obj.boughttemplate !== 'undefined' ? obj.boughttemplate : -1,
                    placeholderId: typeof obj.placeholderlink !== 'undefined' ? obj.placeholderlink : -1,
                    placeholderTemplate: typeof obj.placeholdertemplate !== 'undefined' ? obj.placeholdertemplate : -1,
                    //
                    examine: obj.desc ?? null,
                    recolorToFind: obj.recol_s ? obj.recol_s.map(x => x > 0x7FFF ? x -= 0x10000 : x) : [],
                    recolorToReplace: obj.recol_d ? obj.recol_d.map(x => x > 0x7FFF ? x -= 0x10000 : x) : [],
                    // retextureToFind: obj.retex_s ?? [],
                    // retextureToReplace: obj.retex_d ?? [],
                };

                objs[i] = rl;
            }

            if (download == 'archive') {
                reply.type('application/x-tar');

                // create a tarball containing every json object in separate files like 0.json, 1.json, etc
                let tar = tarStream.pack();
                for (let i = 0; i < objs.length; i++) {
                    tar.entry({ name: `${i}.json` }, JSON.stringify(objs[i], null, 2));
                }
                tar.finalize();
                return tar;
            } else {
                reply.type('application/json');
                return JSON.stringify(objs, null, 2);
            }
        } else {
            await objTypes.load(dump, true);
            return out;
        }
    });

    f.get('/param', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (openrs2 !== -1) {
            game = null;
        }

        if (rev !== -1 && rev < 234) {
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
                    let type = ParamType.getType(data.g1());
                    out += `type=${type}\n`;
                } else if (code === 2) {
                    out += `default=${data.g4s()}\n`;
                } else if (code === 4) {
                    out += `autodisable=no\n`;
                } else if (code === 5) {
                    out += `default=${data.gjstr()}\n`;
                } else if (code === 101) {
                    let type = data.gSmart1or2();
                    out += `type=${type}\n`;
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

        if (openrs2 !== -1) {
            game = null;
        }

        if (rev !== -1 && rev < 234) {
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

    f.get('/component/:id', async (req, reply) => {
        const { id } = req.params;
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (openrs2 !== -1) {
            game = null;
        }

        if (rev !== -1 && rev < 234) {
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

        if (typeof id === 'undefined') {
            reply.code(400);
            return 'Interface ID required';
        }

        const comArchive = await js5.getArchive(3);
        const spriteArchive = await js5.getArchive(8);
        let group = -1;
        if (!/^\d+$/.test(id)) {
            group = await comArchive.getGroupId(id);
        } else {
            group = parseInt(id);
        }
        if (group < 0 || group >= comArchive.groups) {
            reply.code(400);
            return 'Invalid interface ID';
        }

        return Component.decodeGroup(group, comArchive, spriteArchive);
    });

    next();
}
