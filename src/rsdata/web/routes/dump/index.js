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
    f.get('/inv', async (req, reply) => {
        const { rev = -1, openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { game = 'runescape' } = req.query;

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
                    console.log(`Unknown inv config code ${code}`);
                    break;
                }
            }
        });

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
                    out += `wearpos=${data.g1()}\n`;
                } else if (code === 14) {
                    out += `wearpos2=${data.g1()}\n`;
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
                    out += `wearpos3=${data.g1()}\n`;
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

                    // try to guess the unit used
                    // we have one rule to follow: no decimals allowed
                    let weight = grams;
                    let unit = 'g';

                    if (grams % 1000 === 0) {
                        weight = grams / 1000;
                        unit = 'kg';
                    }

                    if (unit === 'g') {
                        let pounds = grams * 0.00220462;
                        let rounded = Math.round(pounds);
                        let toGrams = rounded * 453.592;

                        if (Math.floor(toGrams) === grams) {
                            weight = Math.round(pounds);
                            unit = 'lb';
                        }
                    }

                    if (unit === 'g') {
                        let ounces = grams * 0.035274;
                        let rounded = Math.round(ounces);
                        let toGrams = rounded * 28.3495;

                        if (Math.floor(toGrams) === grams) {
                            weight = Math.round(ounces);
                            unit = 'oz';
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

    next();
}
