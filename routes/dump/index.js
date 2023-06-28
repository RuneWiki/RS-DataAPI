import Js5MasterIndex from '#rt4/util/Js5.js';
import { findCache } from '#rt4/util/OpenRS2.js';

export default function (f, opts, next) {
    f.get('/inv', async (req, reply) => {
        const { rev = -1, openrs2 = -1, match = 0 } = req.query;

        let cache = findCache(rev, openrs2, match);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match}`;
        }

        let js5 = new Js5MasterIndex(cache.id);
        js5.init();

        await js5.archives[2].load();

        let inv = [];
        for (let i = 0; i < js5.archives[2].fileIds[5].length; i++) {
            let id = js5.archives[2].fileIds[5][i];
            let data = await js5.archives[2].getFile(5, id);
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
                    config.size = data.g2();
                } else if (code === 4) {
                    let count = data.g1();

                    config.stock = [];
                    for (let j = 0; j < count; j++) {
                        config.stock[j] = {
                            id: data.g2(),
                            count: data.g2()
                        };
                    }
                } else {
                    console.log(`Unrecognized config code ${code}`, data);
                }
            }

            inv[i] = config;
        }

        let output = '';
        for (let i = 0; i < inv.length; i++) {
            let config = inv[i];
            if (!config) {
                continue;
            }

            if (i > 0) {
                output += '\n';
            }

            output += `[inv_${i}]\n`;

            if (config.size) {
                output += `size=${config.size}\n`;
            }

            if (config.stock) {
                for (let j = 0; j < config.stock.length; j++) {
                    output += `stock${j + 1}=obj_${config.stock[j].id},${config.stock[j].count}\n`;
                }
            }
        }

        return output;
    });

    f.get('/obj', async (req, reply) => {
        const { rev = -1, openrs2 = -1, match = 0 } = req.query;

        let cache = findCache(rev, openrs2, match);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match}`;
        }

        let js5 = new Js5MasterIndex(cache.id);
        js5.init();

        await js5.archives[19].load();

        let maxGroup = js5.archives[19].capacity - 1;
        let total = (maxGroup << 8) + js5.archives[19].groupCapacities[maxGroup]; // total + remainder

        // ----
        let obj = [];
        for (let id = 0; id < total; id++) {
            let group = id >>> 8;
            let file = id & 0xFF;

            let data = await js5.archives[19].getFile(group, file);
            if (!data) {
                continue;
            }

            let config = {};

            while (data.available > 0) {
                let code = data.g1();
                if (code === 0) {
                    break;
                }

                if (code === 1) {
                    if (rev >= 700) {
                        config.model = data.gsmart4_2();
                    } else {
                        config.model = data.g2();
                    }
                } else if (code === 2) {
                    config.name = data.gjstr();
                } else if (code === 3) {
                    config.desc = data.gjstr();
                } else if (code === 4) {
                    config.zoom2d = data.g2();
                } else if (code === 5) {
                    config.xan2d = data.g2();
                } else if (code === 6) {
                    config.yan2d = data.g2();
                } else if (code === 7) {
                    config.xof2d = data.g2s();
                } else if (code === 8) {
                    config.yof2d = data.g2s();
                } else if (code === 11) {
                    config.stackable = true;
                } else if (code === 12) {
                    config.cost = data.g4s();
                } else if (code === 13) {
                    config.wearpos = data.g1();
                } else if (code === 14) {
                    config.wearpos2 = data.g1();
                } else if (code === 16) {
                    config.members = true;
                } else if (code === 18) {
                    config.stacksize = data.g2();
                } else if (code === 23) {
                    if (rev >= 700) {
                        config.manwear = data.gsmart4_2();
                    } else {
                        config.manwear = data.g2();
                    }
                } else if (code === 24) {
                    if (rev >= 700) {
                        config.manwear2 = data.gsmart4_2();
                    } else {
                        config.manwear2 = data.g2();
                    }
                } else if (code === 25) {
                    if (rev >= 700) {
                        config.womanwear = data.gsmart4_2();
                    } else {
                        config.womanwear = data.g2();
                    }
                } else if (code === 26) {
                    if (rev >= 700) {
                        config.womanwear2 = data.gsmart4_2();
                    } else {
                        config.womanwear2 = data.g2();
                    }
                } else if (code === 27) {
                    config.wearpos3 = data.g1();
                } else if (code >= 30 && code < 35) {
                    if (!config.op) {
                        config.op = [];
                    }

                    config.op[code - 30] = data.gjstr();
                } else if (code >= 35 && code < 40) {
                    if (!config.iop) {
                        config.iop = [];
                    }

                    config.iop[code - 35] = data.gjstr();
                } else if (code === 40) {
                    let count = data.g1();

                    config.recols = [];
                    config.recold = [];
                    for (let i = 0; i < count; i++) {
                        config.recols[i] = data.g2();
                        config.recold[i] = data.g2();
                    }
                } else if (code === 41) {
                    let count = data.g1();

                    config.retexs = [];
                    config.retexd = [];
                    for (let i = 0; i < count; i++) {
                        config.retexs[i] = data.g2();
                        config.retexd[i] = data.g2();
                    }
                } else if (code === 42) {
                    // sprite recolor
                    let count = data.g1();

                    config.recolp = [];
                    for (let i = 0; i < count; i++) {
                        config.recolp[i] = data.g1s();
                    }
                } else if (code === 43) {
                    config.tooltip = data.g4();
                } else if (code === 65) {
                    config.stockmarket = true;
                } else if (code === 78) {
                    if (rev >= 700) {
                        config.manwear3 = data.gsmart4_2();
                    } else {
                        config.manwear3 = data.g2();
                    }
                } else if (code === 79) {
                    if (rev >= 700) {
                        config.womanwear3 = data.gsmart4_2();
                    } else {
                        config.womanwear3 = data.g2();
                    }
                } else if (code === 90) {
                    if (rev >= 700) {
                        config.manhead = data.gsmart4_2();
                    } else {
                        config.manhead = data.g2();
                    }
                } else if (code === 91) {
                    if (rev >= 700) {
                        config.womanhead = data.gsmart4_2();
                    } else {
                        config.womanhead = data.g2();
                    }
                } else if (code === 92) {
                    if (rev >= 700) {
                        config.manhead2 = data.gsmart4_2();
                    } else {
                        config.manhead2 = data.g2();
                    }
                } else if (code === 93) {
                    if (rev >= 700) {
                        config.womanhead2 = data.gsmart4_2();
                    } else {
                        config.womanhead2 = data.g2();
                    }
                } else if (code === 95) {
                    config.zan2d = data.g2();
                } else if (code === 96) {
                    config.code96 = data.g1();
                } else if (code === 97) {
                    config.certlink = data.g2();
                } else if (code === 98) {
                    config.certtemplate = data.g2();
                } else if (code >= 100 && code < 110) {
                    if (!config.countobj || !config.countco) {
                        config.countobj = [];
                        config.countco = [];
                    }

                    config.countobj[code - 100] = data.g2();
                    config.countco[code - 100] = data.g2();
                } else if (code === 110) {
                    config.resizex = data.g2();
                } else if (code === 111) {
                    config.resizey = data.g2();
                } else if (code === 112) {
                    config.resizez = data.g2();
                } else if (code === 113) {
                    config.ambient = data.g1s();
                } else if (code === 114) {
                    config.contrast = data.g1s();
                } else if (code === 115) {
                    config.team = data.g1();
                } else if (code === 121) {
                    config.lentlink = data.g2();
                } else if (code === 122) {
                    config.lenttemplate = data.g2();
                } else if (code === 125) {
                    config.manwearxoff = data.g1s();
                    config.manwearyoff = data.g1s();
                    config.manwearzoff = data.g1s();
                } else if (code === 126) {
                    config.womanwearxoff = data.g1s();
                    config.womanwearyoff = data.g1s();
                    config.womanwearzoff = data.g1s();
                } else if (code === 127) {
                    config.cursor1op = data.g1();
                    config.cursor1 = data.g2();
                } else if (code === 128) {
                    config.cursor2op = data.g1();
                    config.cursor2 = data.g2();
                } else if (code === 129) {
                    // guessing
                    config.cursor3op = data.g1();
                    config.cursor3 = data.g2();
                } else if (code === 130) {
                    // guessing
                    config.cursor4op = data.g1();
                    config.cursor4 = data.g2();
                } else if (code === 132) {
                    let count = data.g1();

                    config.quests = [];
                    for (let i = 0; i < count; i++) {
                        config.quests[i] = data.g2();
                    }
                } else if (code === 134) {
                    // guessing
                    config.picksize = data.g1();
                } else if (code === 139) {
                    config.bindlink = data.g2();
                } else if (code === 140) {
                    config.bindtemplate = data.g2();
                } else if (code === 249) {
                    let count = data.g1();

                    config.param = [];
                    for (let i = 0; i < count; i++) {
                        let isString = data.gbool();
                        let key = data.g3();
                        let value = isString ? data.gjstr() : data.g4s();

                        config.param[key] = value;
                    }
                } else {
                    // console.log(`Unrecognized config code ${code}`, data);
                }
            }

            obj[id] = config;
        }

        // ----
        let output = '';
        for (let i = 0; i < obj.length; i++) {
            let config = obj[i];
            if (typeof obj[i] === 'undefined') {
                continue;
            }

            if (i > 0) {
                output += '\n';
            }

            output += `[obj_${i}]\n`;

            // ----

            if (config.name) {
                output += `name=${config.name}\n`;
            }

            if (config.desc) {
                output += `desc=${config.desc}\n`;
            }

            if (config.cost) {
                output += `cost=${config.cost}\n`;
            }

            if (config.stackable) {
                output += `stackable=yes\n`;
            }

            if (config.members) {
                output += `members=yes\n`;
            }

            if (config.stockmarket) {
                output += `stockmarket=yes\n`;
            }

            if (config.stacksize) {
                output += `stacksize=${config.stacksize}\n`;
            }

            if (config.op) {
                for (let j = 0; j < config.op.length; j++) {
                    if (config.op[j]) {
                        output += `op${j + 1}=${config.op[j]}\n`;
                    }
                }
            }

            if (config.iop) {
                for (let j = 0; j < config.iop.length; j++) {
                    if (config.iop[j]) {
                        output += `iop${j + 1}=${config.iop[j]}\n`;
                    }
                }
            }

            if (config.countobj) {
                for (let j = 0; j < config.countobj.length; j++) {
                    if (config.countco[j]) {
                        output += `count${j + 1}=obj_${config.countobj[j]},${config.countco[j]}\n`;
                    }
                }
            }

            if (config.code96) {
                output += `code96=${config.code96}\n`;
            }

            if (config.certlink) {
                output += `certlink=obj_${config.certlink}\n`;
            }

            if (config.certtemplate) {
                output += `certtemplate=obj_${config.certtemplate}\n`;
            }

            if (config.lentlink) {
                output += `lentlink=obj_${config.lentlink}\n`;
            }

            if (config.lenttemplate) {
                output += `lenttemplate=obj_${config.lenttemplate}\n`;
            }

            if (config.bindlink) {
                output += `bindlink=obj_${config.bindlink}\n`;
            }

            if (config.bindtemplate) {
                output += `bindtemplate=obj_${config.bindtemplate}\n`;
            }

            if (config.team) {
                output += `team=${config.team}\n`;
            }

            if (typeof config.cursor1 !== 'undefined') {
                output += `cursor1=${config.cursor1},${config.cursor1op}\n`;
            }

            if (typeof config.cursor2 !== 'undefined') {
                output += `cursor2=${config.cursor2},${config.cursor2op}\n`;
            }

            if (typeof config.cursor3 !== 'undefined') {
                output += `cursor3=${config.cursor3},${config.cursor3op}\n`;
            }

            if (typeof config.cursor4 !== 'undefined') {
                output += `cursor4=${config.cursor4},${config.cursor4op}\n`;
            }

            if (config.tooltip) {
                output += `tooltip=0x${config.tooltip.toString(16)}\n`;
            }

            if (config.quests) {
                for (let j = 0; j < config.quests.length; j++) {
                    output += `quest${j + 1}=${config.quests[j]}\n`;
                }
            }

            if (config.wearpos) {
                output += `wearpos=${config.wearpos}\n`;
            }

            if (config.wearpos2) {
                output += `wearpos2=${config.wearpos2}\n`;
            }

            if (config.wearpos3) {
                output += `wearpos3=${config.wearpos3}\n`;
            }

            if (config.picksize) {
                output += `picksize=${config.picksize}\n`;
            }

            // ----

            if (config.model) {
                output += `model=model_${config.model}\n`;
            }

            if (config.zoom2d) {
                output += `2dzoom=${config.zoom2d}\n`;
            }

            if (config.xan2d) {
                output += `2dxan=${config.xan2d}\n`;
            }

            if (config.yan2d) {
                output += `2dyan=${config.yan2d}\n`;
            }

            if (config.zan2d) {
                output += `2dzan=${config.zan2d}\n`;
            }

            if (config.xof2d) {
                output += `2dxof=${config.xof2d}\n`;
            }

            if (config.yof2d) {
                output += `2dyof=${config.yof2d}\n`;
            }

            if (config.resizex) {
                output += `resizex=${config.resizex}\n`;
            }

            if (config.resizey) {
                output += `resizey=${config.resizey}\n`;
            }

            if (config.resizez) {
                output += `resizez=${config.resizez}\n`;
            }

            if (config.ambient) {
                output += `ambient=${config.ambient}\n`;
            }

            if (config.contrast) {
                output += `contrast=${config.contrast}\n`;
            }

            // ----

            if (config.manwear) {
                output += `manwear=model_${config.manwear}\n`;
            }

            if (config.manwear2) {
                output += `manwear2=model_${config.manwear2}\n`;
            }

            if (config.manwear3) {
                output += `manwear3=model_${config.manwear3}\n`;
            }

            if (config.manwearxoff) {
                output += `manwearxoff=${config.manwearxoff}\n`;
            }

            if (config.manwearyoff) {
                output += `manwearyoff=${config.manwearyoff}\n`;
            }

            if (config.manwearzoff) {
                output += `manwearzoff=${config.manwearzoff}\n`;
            }

            if (config.womanwear) {
                output += `womanwear=model_${config.womanwear}\n`;
            }

            if (config.womanwear2) {
                output += `womanwear2=model_${config.womanwear2}\n`;
            }

            if (config.womanwear3) {
                output += `womanwear3=model_${config.womanwear3}\n`;
            }

            if (config.womanwearxoff) {
                output += `womanwearxoff=${config.womanwearxoff}\n`;
            }

            if (config.womanwearyoff) {
                output += `womanwearyoff=${config.womanwearyoff}\n`;
            }

            if (config.womanwearzoff) {
                output += `womanwearzoff=${config.womanwearzoff}\n`;
            }

            if (config.manhead) {
                output += `manhead=model_${config.manhead}\n`;
            }

            if (config.manhead2) {
                output += `manhead2=model_${config.manhead2}\n`;
            }

            if (config.womanhead) {
                output += `womanhead=model_${config.womanhead}\n`;
            }

            if (config.womanhead2) {
                output += `womanhead2=model_${config.womanhead2}\n`;
            }

            if (config.recols) {
                for (let j = 0; j < config.recols.length; j++) {
                    output += `recol${j + 1}s=${config.recols[j]}\n`;
                    output += `recol${j + 1}d=${config.recold[j]}\n`;
                }
            }

            if (config.retexs) {
                for (let j = 0; j < config.retexs.length; j++) {
                    output += `retex${j + 1}s=${config.retexs[j]}\n`;
                    output += `retex${j + 1}d=${config.retexd[j]}\n`;
                }
            }

            if (config.recolp) {
                for (let j = 0; j < config.recolp.length; j++) {
                    output += `recolp${j + 1}=${config.recolp[j]}\n`;
                }
            }

            // ----

            if (config.param) {
                for (let j = 0; j < config.param.length; j++) {
                    if (config.param[j]) {
                        output += `param=${j + 1}=${config.param[j]}\n`;
                    }
                }
            }
        }

        return output;
    });

    next();
}
