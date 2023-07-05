import fs from 'fs';
import Jagfile from '#jagex3/io/Jagfile.js';
import Packet from '#jagex3/io/Packet.js';
import { getGroup } from '#rsdata/util/OpenRS2.js';

class ObjType {
    id = -1;

    // model = -1;
    // name = null;
    // desc = null;
    // zoom2d = 2000;
    // xan2d = 0;
    // yan2d = 0;
    // xof2d = 0;
    // yof2d = 0;
    // code9 = null;
    // code10 = -1;
    // stackable = false;
    // cost = 0;
    // wearpos = -1;
    // wearpos2 = -1;
    // members = false;
    // stacksize = 1;
    // manwear = -1;
    // manwearOffsetX = 0;
    // manwearOffsetY = 0;
    // manwearOffsetZ = 0;
    // manwear2 = -1;
    // womanwear = -1;
    // womanwearOffsetX = 0;
    // womanwearOffsetY = 0;
    // womanwearOffsetZ = 0;
    // womanwear2 = -1;
    // wearpos3 = -1;
    // ops = new Array(5);
    // iops = new Array(5);
    // recol_s = [];
    // recol_d = [];
    // retex_s = [];
    // retex_d = [];
    // shiftop = 0;
    // recol_p = [];
    // tooltip = 0;
    // stockmarket = false;
    // weight = 0;
    // manwear3 = -1;
    // womanwear3 = -1;
    // manhead = -1;
    // manhead2 = -1;
    // womanhead = -1;
    // womanhead2 = -1;
    // category = -1;
    // zan2d = 0;
    // certlink = -1;
    // certtemplate = -1;
    // countobj = [];
    // resizex = 128;
    // resizey = 128;
    // resizez = 128;
    // ambient = 0;
    // contrast = 0;
    // team = 0;
    // lentlink = -1;
    // lenttemplate = -1;
    // cursor1 = -1;
    // cursor1op = -1;
    // cursor2 = -1;
    // cursor2op = -1;
    // cursor3 = -1;
    // cursor3op = -1;
    // cursor4 = -1;
    // cursor4op = -1;
    // quest = [];
    // picksize = 0;
    // boughtlink = -1;
    // boughttemplate = -1;
    // placeholderlink = -1;
    // placeholdertemplate = -1;
    // params = [];

    decode(openrs2, data, readCb = null) {
        while (data.available > 0) {
            let code = data.g1();
            if (code === 0) {
                break;
            }

            this.decodeInner(openrs2, code, data, readCb);
        }
    }

    decodeInner(openrs2, code, data, readCb = null) {
        const game = openrs2.game;
        const rev = openrs2.builds.length ? openrs2.builds[0].major : -1;

        if (code === 1) {
            if (game == 'runescape' && rev >= 700) {
                this.model = data.gsmart4();
            } else {
                this.model = data.g2();
            }

            if (readCb) {
                readCb(this.id, code, this.model);
            }
        } else if (code === 2) {
            this.name = data.gjstr();

            if (readCb) {
                readCb(this.id, code, this.name);
            }
        } else if (code === 3) {
            this.desc = data.gjstr();

            if (readCb) {
                readCb(this.id, code, this.desc);
            }
        } else if (code === 4) {
            this.zoom2d = data.g2();

            if (readCb) {
                readCb(this.id, code, this.zoom2d);
            }
        } else if (code === 5) {
            this.xan2d = data.g2();

            if (readCb) {
                readCb(this.id, code, this.xan2d);
            }
        } else if (code === 6) {
            this.yan2d = data.g2();

            if (readCb) {
                readCb(this.id, code, this.yan2d);
            }
        } else if (code === 7) {
            this.xof2d = data.g2s();

            if (readCb) {
                readCb(this.id, code, this.xof2d);
            }
        } else if (code === 8) {
            this.yof2d = data.g2s();

            if (readCb) {
                readCb(this.id, code, this.yof2d);
            }
        } else if (code === 9) {
            if (game == 'oldschool' && rev > 180) {
                this.code9 = data.gjstr();
            } else {
                this.code9 = true;
            }

            if (readCb) {
                readCb(this.id, code, this.code9);
            }
        } else if (code === 10) {
            this.code10 = data.g2();

            if (readCb) {
                readCb(this.id, code, this.code10);
            }
        } else if (code === 11) {
            this.stackable = true;

            if (readCb) {
                readCb(this.id, code, this.stackable);
            }
        } else if (code === 12) {
            this.cost = data.g4s();

            if (readCb) {
                readCb(this.id, code, this.cost);
            }
        } else if (code === 13) {
            this.wearpos = data.g1();

            if (readCb) {
                readCb(this.id, code, this.wearpos);
            }
        } else if (code === 14) {
            this.wearpos2 = data.g1();

            if (readCb) {
                readCb(this.id, code, this.wearpos2);
            }
        } else if (code === 16) {
            this.members = true;

            if (readCb) {
                readCb(this.id, code, this.members);
            }
        } else if (code === 18) {
            this.stacksize = data.g2();

            if (readCb) {
                readCb(this.id, code, this.stacksize);
            }
        } else if (code === 23) {
            if (game == 'runescape' && rev >= 700) {
                this.manwear = data.gsmart4();
            } else {
                this.manwear = data.g2();
            }

            if (game == 'runescape' && rev > 500) {
                if (readCb) {
                    readCb(this.id, code, this.manwear);
                }
            } else {
                this.manwearOffsetY = data.g1();

                if (readCb) {
                    readCb(this.id, code, this.manwear, this.manwearOffsetY);
                }
            }
        } else if (code === 24) {
            if (game == 'runescape' && rev >= 700) {
                this.manwear2 = data.gsmart4();
            } else {
                this.manwear2 = data.g2();
            }

            if (readCb) {
                readCb(this.id, code, this.manwear2);
            }
        } else if (code === 25) {
            if (game == 'runescape' && rev >= 700) {
                this.womanwear = data.gsmart4();
            } else {
                this.womanwear = data.g2();
            }

            if (game == 'runescape' && rev > 500) {
                if (readCb) {
                    readCb(this.id, code, this.womanwear);
                }
            } else {
                this.womanwearOffsetY = data.g1();

                if (readCb) {
                    readCb(this.id, code, this.womanwear, this.womanwearOffsetY);
                }
            }
        } else if (code === 26) {
            if (game == 'runescape' && rev >= 700) {
                this.womanwear2 = data.gsmart4();
            } else {
                this.womanwear2 = data.g2();
            }


            if (readCb) {
                readCb(this.id, code, this.womanwear2);
            }
        } else if (code === 27) {
            this.wearpos3 = data.g1();

            if (readCb) {
                readCb(this.id, code, this.wearpos3);
            }
        } else if (code >= 30 && code < 35) {
            if (!this.ops) {
                this.ops = new Array(5);
            }

            this.ops[code - 30] = data.gjstr();

            if (readCb) {
                readCb(this.id, code, this.ops[code - 30]);
            }
        } else if (code >= 35 && code < 40) {
            if (!this.iops) {
                this.iops = new Array(5);
            }

            this.iops[code - 35] = data.gjstr();

            if (readCb) {
                readCb(this.id, code, this.iops[code - 35]);
            }
        } else if (code === 40) {
            let count = data.g1();

            this.recol_s = [];
            this.recol_d = [];
            for (let i = 0; i < count; i++) {
                this.recol_s[i] = data.g2();
                this.recol_d[i] = data.g2();
            }

            if (readCb) {
                readCb(this.id, code, this.recol_s, this.recol_d);
            }
        } else if (code === 41) {
            let count = data.g1();

            this.retex_s = [];
            this.retex_d = [];
            for (let i = 0; i < count; i++) {
                this.retex_s[i] = data.g2();
                this.retex_d[i] = data.g2();
            }

            if (readCb) {
                readCb(this.id, code, this.retex_s, this.retex_d);
            }
        } else if (code === 42) {
            if (game == 'oldschool') {
                this.shiftop = data.g1();

                if (readCb) {
                    readCb(this.id, code, this.shiftop);
                }
            } else {
                // sprite-related
                let count = data.g1();

                this.recol_p = [];
                for (let i = 0; i < count; i++) {
                    this.recol_p[i] = data.g1s();
                }

                if (readCb) {
                    readCb(this.id, code, this.recol_p);
                }
            }
        } else if (code === 43) {
            this.tooltip = data.g4();

            if (readCb) {
                readCb(this.id, code, this.tooltip);
            }
        } else if (code === 65) {
            this.stockmarket = true;

            if (readCb) {
                readCb(this.id, code, this.stockmarket);
            }
        } else if (code === 75) {
            this.weight = data.g2s();

            if (readCb) {
                readCb(this.id, code, this.weight);
            }
        } else if (code === 78) {
            if (game == 'runescape' && rev >= 700) {
                this.manwear3 = data.gsmart4();
            } else {
                this.manwear3 = data.g2();
            }

            if (readCb) {
                readCb(this.id, code, this.manwear3);
            }
        } else if (code === 79) {
            if (game == 'runescape' && rev >= 700) {
                this.womanwear3 = data.gsmart4();
            } else {
                this.womanwear3 = data.g2();
            }

            if (readCb) {
                readCb(this.id, code, this.womanwear3);
            }
        } else if (code === 90) {
            if (game == 'runescape' && rev >= 700) {
                this.manhead = data.gsmart4();
            } else {
                this.manhead = data.g2();
            }

            if (readCb) {
                readCb(this.id, code, this.manhead);
            }
        } else if (code === 91) {
            if (game == 'runescape' && rev >= 700) {
                this.womanhead = data.gsmart4();
            } else {
                this.womanhead = data.g2();
            }

            if (readCb) {
                readCb(this.id, code, this.womanhead);
            }
        } else if (code === 92) {
            if (game == 'runescape' && rev >= 700) {
                this.manhead2 = data.gsmart4();
            } else {
                this.manhead2 = data.g2();
            }

            if (readCb) {
                readCb(this.id, code, this.manhead2);
            }
        } else if (code === 93) {
            if (game == 'runescape' && rev >= 700) {
                this.womanhead2 = data.gsmart4();
            } else {
                this.womanhead2 = data.g2();
            }

            if (readCb) {
                readCb(this.id, code, this.womanhead2);
            }
        } else if (code === 94) {
            this.category = data.g2();

            if (readCb) {
                readCb(this.id, code, this.category);
            }
        } else if (code === 95) {
            this.zan2d = data.g2();

            if (readCb) {
                readCb(this.id, code, this.zan2d);
            }
        } else if (code === 96) {
            this.dummyitem = data.g1();

            if (readCb) {
                readCb(this.id, code, this.dummyitem);
            }
        } else if (code === 97) {
            this.certlink = data.g2();

            if (readCb) {
                readCb(this.id, code, this.certlink);
            }
        } else if (code === 98) {
            this.certtemplate = data.g2();

            if (readCb) {
                readCb(this.id, code, this.certtemplate);
            }
        } else if (code >= 100 && code < 110) {
            if (!this.countobj) {
                this.countobj = new Array(10);
            }

            let obj = data.g2();
            let count = data.g2();

            this.countobj[code - 100] = { obj, count };

            if (readCb) {
                readCb(this.id, code, obj, count);
            }
        } else if (code === 110) {
            this.resizex = data.g2();

            if (readCb) {
                readCb(this.id, code, this.resizex);
            }
        } else if (code === 111) {
            this.resizey = data.g2();

            if (readCb) {
                readCb(this.id, code, this.resizey);
            }
        } else if (code === 112) {
            this.resizez = data.g2();

            if (readCb) {
                readCb(this.id, code, this.resizez);
            }
        } else if (code === 113) {
            this.ambient = data.g1s();

            if (readCb) {
                readCb(this.id, code, this.ambient);
            }
        } else if (code === 114) {
            this.contrast = data.g1s();

            if (readCb) {
                readCb(this.id, code, this.contrast);
            }
        } else if (code === 115) {
            this.team = data.g1();

            if (readCb) {
                readCb(this.id, code, this.team);
            }
        } else if (code === 121) {
            this.lentlink = data.g2();

            if (readCb) {
                readCb(this.id, code, this.lentlink);
            }
        } else if (code === 122) {
            this.lenttemplate = data.g2();

            if (readCb) {
                readCb(this.id, code, this.lenttemplate);
            }
        } else if (code === 125) {
            this.manwearOffsetX = data.g1s();
            this.manwearOffsetY = data.g1s();
            this.manwearOffsetZ = data.g1s();

            if (readCb) {
                readCb(this.id, code, this.manwearOffsetX, this.manwearOffsetY, this.manwearOffsetZ);
            }
        } else if (code === 126) {
            this.womanwearOffsetX = data.g1s();
            this.womanwearOffsetY = data.g1s();
            this.womanwearOffsetZ = data.g1s();

            if (readCb) {
                readCb(this.id, code, this.womanwearOffsetX, this.womanwearOffsetY, this.womanwearOffsetZ);
            }
        } else if (code === 127) {
            this.cursor1op = data.g1();
            this.cursor1 = data.g2();

            if (readCb) {
                readCb(this.id, code, this.cursor1op, this.cursor1);
            }
        } else if (code === 128) {
            this.cursor2op = data.g1();
            this.cursor2 = data.g2();

            if (readCb) {
                readCb(this.id, code, this.cursor2op, this.cursor2);
            }
        } else if (code === 129) {
            this.cursor3op = data.g1();
            this.cursor3 = data.g2();

            if (readCb) {
                readCb(this.id, code, this.cursor3op, this.cursor3);
            }
        } else if (code === 130) {
            this.cursor4op = data.g1();
            this.cursor4 = data.g2();

            if (readCb) {
                readCb(this.id, code, this.cursor4op, this.cursor4);
            }
        } else if (code === 132) {
            let count = data.g1();

            this.quest = [];
            for (let i = 0; i < count; i++) {
                this.quest[i] = data.g2();
            }

            if (readCb) {
                readCb(this.id, code, this.quest);
            }
        } else if (code === 134) {
            this.picksize = data.g1();

            if (readCb) {
                readCb(this.id, code, this.picksize);
            }
        } else if (code === 139) {
            this.boughtlink = data.g2();

            if (readCb) {
                readCb(this.id, code, this.boughtlink);
            }
        } else if (code === 140) {
            this.boughttemplate = data.g2();

            if (readCb) {
                readCb(this.id, code, this.boughttemplate);
            }
        } else if (code === 148) {
            this.placeholderlink = data.g2();

            if (readCb) {
                readCb(this.id, code, this.placeholderlink);
            }
        } else if (code === 149) {
            this.placeholdertemplate = data.g2();

            if (readCb) {
                readCb(this.id, code, this.placeholdertemplate);
            }
        } else if (code === 249) {
            let count = data.g1();

            this.params = [];
            for (let i = 0; i < count; i++) {
                let isString = data.gbool();
                let key = data.g3();
                let value = isString ? data.gjstr() : data.g4s();

                this.params.push({ key, value });
            }

            if (readCb) {
                readCb(this.id, code, this.params);
            }
        } else {
            console.log(`Unrecognized obj config code: ${code}`);
            data.pos = data.length;
        }
    }
}

export default class ObjTypeList {
    js5 = null;
    configs = [];
    count = 0;

    constructor(js5) {
        this.js5 = js5;
    }

    async load(readCb = null, readCbOnly = false) {
        let game = this.js5.openrs2.game;

        if (game === 'runescape' && this.js5.openrs2.builds.length && this.js5.openrs2.builds[0].major < 400) {
            let config = await getGroup(this.js5.openrs2.id, 0, 2);
            if (!config) {
                config = fs.readFileSync(`caches/${this.js5.openrs2.builds[0].major}/config`);
            }

            let jag = new Jagfile(new Packet(config));

            let dat = jag.read('obj.dat');
            let count = dat.g2();

            dat.terminator = '\n';
            for (let i = 0; i < count; i++) {
                await this.getOld(i, dat, readCb, readCbOnly);
            }

            this.count = count;
        } else if (this.js5.openrs2.indexes >= 19 && game != 'oldschool') {
            await this.js5.indexes[19].load();

            let lastGroup = this.js5.indexes[19].capacity - 1;
            let remainder = this.js5.indexes[19].groupCapacities[lastGroup];
            let total = (lastGroup << 8) + remainder;

            for (let id = 0; id < total; id++) {
                let group = id >>> 8;

                if (!(await this.js5.indexes[19].getGroup(group))) {
                    // skip to next group (incomplete cache?)
                    i += 0xFF;
                    continue;
                }

                await this.get(id, readCb, readCbOnly);
            }

            this.count = total;
        } else {
            await this.js5.indexes[2].load();

            let groupData = await this.js5.indexes[2].getGroup(10);
            if (!groupData) {
                // uh oh
                return;
            }

            for (let i = 0; i < this.js5.indexes[2].fileIds[10].length; i++) {
                let id = this.js5.indexes[2].fileIds[10][i];

                await this.get(id, readCb, readCbOnly);
            }

            this.count = this.js5.indexes[2].fileIds[10].length;
        }

        if (readCbOnly) {
            this.configs = [];
        }
    }

    async get(id, readCb = null, readCbOnly = false) {
        if (this.configs[id]) {
            return this.configs[id];
        }

        let obj = new ObjType();
        obj.id = id;

        if (this.js5.openrs2.indexes >= 20 && this.js5.openrs2.game != 'oldschool') {
            await this.js5.indexes[19].load();

            let group = id >> 8;
            let file = id & 0xFF;

            let data = await this.js5.getFile(19, group, file);
            if (!data) {
                return null;
            }

            obj.decode(this.js5.openrs2, data, readCb);
        } else {
            await this.js5.indexes[2].load();

            let data = await this.js5.getFile(2, 10, id);
            if (!data) {
                return null;
            }

            obj.decode(this.js5.openrs2, data, readCb);
        }

        if (!readCbOnly) {
            this.configs[id] = obj;
            return obj;
        } else {
            return null;
        }
    }

    async getOld(id, data, readCb = null, readCbOnly = false) {
        if (this.configs[id]) {
            return this.configs[id];
        }

        let obj = new ObjType();
        obj.id = id;

        obj.decode(this.js5.openrs2, data, readCb);

        if (!readCbOnly) {
            this.configs[id] = obj;
            return obj;
        } else {
            return null;
        }
    }
}
