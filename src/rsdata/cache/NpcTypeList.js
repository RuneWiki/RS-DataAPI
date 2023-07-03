import fs from 'fs';
import Jagfile from '#jagex3/io/Jagfile.js';
import Packet from '#jagex3/io/Packet.js';
import { getGroup } from '#rsdata/util/OpenRS2.js';

class NpcType {
    id = -1;

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
            let count = data.g1();

            this.models = [];
            for (let i = 0; i < count; i++) {
                this.models[i] = data.g2();
            }

            if (readCb) {
                readCb(this.id, code, this.models);
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
        } else if (code === 12) {
            this.size = data.g1();

            if (readCb) {
                readCb(this.id, code, this.size);
            }
        } else if (code === 13) {
            this.readyanim = data.g2();

            if (readCb) {
                readCb(this.id, code, this.readyanim);
            }
        } else if (code === 14) {
            this.walkanim = data.g2();

            if (readCb) {
                readCb(this.id, code, this.walkanim);
            }
        } else if (code === 15) {
            this.turnleftanim = data.g2();

            if (readCb) {
                readCb(this.id, code, this.turnleftanim);
            }
        } else if (code === 16) {
            this.turnrightanim = data.g2();

            if (readCb) {
                readCb(this.id, code, this.turnrightanim);
            }
        } else if (code === 17) {
            this.walkanim = data.g2();
            this.walkanim_b = data.g2();
            this.walkanim_l = data.g2();
            this.walkanim_r = data.g2();

            if (readCb) {
                readCb(this.id, code, this.walkanim, this.walkanim_b, this.walkanim_l, this.walkanim_r);
            }
        } else if (code === 18) {
            this.category = data.g2();

            if (readCb) {
                readCb(this.id, code, this.category);
            }
        } else if (code >= 30 && code < 35) {
            if (!this.ops) {
                this.ops = new Array(5);
            }

            this.ops[code - 30] = data.gjstr();

            if (readCb) {
                readCb(this.id, code, this.ops[code - 30]);
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
            let count = data.g1();

            this.recol_p = [];
            for (let i = 0; i < count; i++) {
                this.recol_p[i] = data.g1s();
            }

            if (readCb) {
                readCb(this.id, code, this.recol_p);
            }
        } else if (code === 60) {
            let count = data.g1();

            this.heads = [];
            for (let i = 0; i < count; i++) {
                this.heads[i] = data.g2();
            }

            if (readCb) {
                readCb(this.id, code, this.heads);
            }
        } else if (code === 93) {
            this.visonmap = false;

            if (readCb) {
                readCb(this.id, code, this.visonmap);
            }
        } else if (code === 95) {
            this.vislevel = data.g2();

            if (readCb) {
                readCb(this.id, code, this.vislevel);
            }
        } else if (code === 97) {
            this.resizeh = data.g2();

            if (readCb) {
                readCb(this.id, code, this.resizeh);
            }
        } else if (code === 98) {
            this.resizev = data.g2();

            if (readCb) {
                readCb(this.id, code, this.resizev);
            }
        } else if (code === 99) {
            this.drawpriority = true;

            if (readCb) {
                readCb(this.id, code, this.drawpriority);
            }
        } else if (code === 100) {
            this.ambient = data.g1s();

            if (readCb) {
                readCb(this.id, code, this.ambient);
            }
        } else if (code === 101) {
            this.contrast = data.g1s();

            if (readCb) {
                readCb(this.id, code, this.contrast);
            }
        } else if (code === 102) {
            if (game === 'oldschool') {
                let start = data.g1();
                let count = 0;

                for (let i = start; i != 0; i >>= 1) {
                    count++;
                }

                this.icons = [];
                for (let i = 0; i < count; i++) {
                    if (((start & 1) << i) !== 0) {
                        let sprite = data.gsmart4();
                        let tile = data.gsmart();

                        this.icons.push([sprite, tile]);
                    }
                }

                if (readCb) {
                    readCb(this.id, code, this.icons);
                }
            } else {
                this.icon = data.g2();

                if (readCb) {
                    readCb(this.id, code, this.icon);
                }
            }
        } else if (code === 103) {
            this.turnspeed = data.g2();

            if (readCb) {
                readCb(this.id, code, this.turnspeed);
            }
        } else if (code === 106 || code === 118) {
            this.multivarbit = data.g2();
            if (this.multivarbit === 65535) {
                this.multivarbit = -1;
            }

            this.multivar = data.g2();
            if (this.multivar === 65535) {
                this.multivar = -1;
            }

            this.multinpc = -1;
            if (code === 118) {
                this.multinpc = data.g2();
                if (this.multinpc === 65535) {
                    this.multinpc = -1;
                }
            }

            let count = data.g1();

            this.multinpcs = [];
            for (let i = 0; i <= count; i++) {
                this.multinpcs[i] = data.g2();
                if (this.multinpcs[i] === 65535) {
                    this.multinpcs[i] = -1;
                }
            }

            if (readCb) {
                readCb(this.id, code, this.multivarbit, this.multivar, this.multinpc, this.multinpcs);
            }
        } else if (code === 107) {
            this.active = false;

            if (readCb) {
                readCb(this.id, code, this.active);
            }
        } else if (code === 109) {
            this.slowmove = false;

            if (readCb) {
                readCb(this.id, code, this.slowmove);
            }
        } else if (code === 111) {
            if (game === 'oldschool') {
                this.follower = true;

                if (readCb) {
                    readCb(this.id, code, this.follower);
                }
            } else {
                this.shadowed = false;

                if (readCb) {
                    readCb(this.id, code, this.shadowed);
                }
            }
        } else if (code === 113) {
            this.shadow1 = data.g2();
            this.shadow2 = data.g2();

            if (readCb) {
                readCb(this.id, code, this.shadow1, this.shadow2);
            }
        } else if (code === 114) {
            if (game === 'oldschool') {
                this.runanim = data.g2();

                if (readCb) {
                    readCb(this.id, code, this.runanim);
                }
            } else {
                this.shadowmod1 = data.g1s();
                this.shadowmod2 = data.g1s();

                if (readCb) {
                    readCb(this.id, code, this.shadowmod1, this.shadowmod2);
                }
            }
        } else if (code === 115) {
            if (game === 'oldschool') {
                this.runanim = data.g2();
                this.runanim_b = data.g2();
                this.runanim_l = data.g2();
                this.runanim_r = data.g2();

                if (readCb) {
                    readCb(this.id, code, this.runanim, this.runanim_b, this.runanim_l, this.runanim_r);
                }
            } else {
                this.code115 = [data.g1(), data.g1()];
            }
        } else if (code === 116) {
            this.crawlanim = data.g2();

            if (readCb) {
                readCb(this.id, code, this.crawlanim);
            }
        } else if (code === 117) {
            this.crawlanim = data.g2();
            this.crawlanim_b = data.g2();
            this.crawlanim_l = data.g2();
            this.crawlanim_r = data.g2();

            if (readCb) {
                readCb(this.id, code, this.crawlanim, this.crawlanim_b, this.crawlanim_l, this.crawlanim_r);
            }
        } else if (code === 119) {
            this.loginscreenproperties = data.g1s();

            if (readCb) {
                readCb(this.id, code, this.loginscreenproperties);
            }
        } else if (code === 121) {
            let count = data.g1();

            this.modeloff = [];
            for (let i = 0; i < count; i++) {
                let index = data.g1();

                this.modeloff[index] = [data.g1s(), data.g1s(), data.g1s()];
            }

            if (readCb) {
                readCb(this.id, code, this.modeloff);
            }
        } else if (code === 122) {
            this.hitbar = data.g2();

            if (readCb) {
                readCb(this.id, code, this.hitbar);
            }
        } else if (code === 123) {
            this.iconheight = data.g2();

            if (readCb) {
                readCb(this.id, code, this.iconheight);
            }
        } else if (code === 125) {
            this.spawndirection = data.g1s();

            if (readCb) {
                readCb(this.id, code, this.spawndirection);
            }
        } else if (code === 126) {
            this.minimapmarkerobjectentry = data.g2();

            if (readCb) {
                readCb(this.id, code, this.minimapmarkerobjectentry);
            }
        } else if (code === 127) {
            this.base = data.g2();

            if (readCb) {
                readCb(this.id, code, this.base);
            }
        } else if (code === 128) {
            this.code128 = data.g1();

            if (readCb) {
                readCb(this.id, code, this.code128);
            }
        } else if (code === 134) {
            this.idlesound = data.g2();
            this.crawlsound = data.g2();
            this.walksound = data.g2();
            this.runsound = data.g2();
            this.soundradius = data.g1();

            if (readCb) {
                readCb(this.id, code, this.idlesound, this.crawlsound, this.walksound, this.runsound, this.soundradius);
            }
        } else if (code === 135) {
            this.cursor1op = data.g1();
            this.cursor1 = data.g2();

            if (readCb) {
                readCb(this.id, code, this.cursor1op, this.cursor1);
            }
        } else if (code === 136) {
            this.cursor1op = data.g1();
            this.cursor1 = data.g2();

            if (readCb) {
                readCb(this.id, code, this.cursor1op, this.cursor1);
            }
        } else if (code === 137) {
            this.attackcursor = data.g2();

            if (readCb) {
                readCb(this.id, code, this.attackcursor);
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
            console.log(`Unrecognized npc config code: ${code}`);
            data.pos = data.length;
        }
    }
}

export default class NpcTypeList {
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

            let dat = jag.read('npc.dat');
            let count = dat.g2();

            dat.terminator = '\n';
            for (let i = 0; i < count; i++) {
                await this.getOld(i, dat, readCb, readCbOnly);
            }

            this.count = count;
        } else if (this.js5.openrs2.indexes >= 18 && game != 'oldschool') {
            await this.js5.indexes[18].load();

            let lastGroup = this.js5.indexes[18].capacity - 1;
            let remainder = this.js5.indexes[18].groupCapacities[lastGroup];
            let total = (lastGroup << 8) + remainder;

            for (let id = 0; id < total; id++) {
                let group = id >>> 8;

                if (!(await this.js5.indexes[18].getGroup(group))) {
                    i += 0xFF;
                    continue;
                }

                await this.get(id, readCb, readCbOnly);
            }

            this.count = total;
        } else {
            await this.js5.indexes[2].load();

            let groupData = await this.js5.indexes[2].getGroup(9);
            if (!groupData) {
                return;
            }

            for (let i = 0; i < this.js5.indexes[2].fileIds[9].length; i++) {
                let id = this.js5.indexes[2].fileIds[9][i];

                await this.get(id, readCb, readCbOnly);
            }

            this.count = this.js5.indexes[2].fileIds[9].length;
        }

        if (readCbOnly) {
            this.configs = [];
        }
    }

    async get(id, readCb = null, readCbOnly = false) {
        if (this.configs[id]) {
            return this.configs[id];
        }

        let npc = new NpcType();
        npc.id = id;

        if (this.js5.openrs2.indexes >= 18 && this.js5.openrs2.game != 'oldschool') {
            await this.js5.indexes[18].load();

            let group = id >> 8;
            let file = id & 0xFF;

            let data = await this.js5.getFile(18, group, file);
            if (!data) {
                return null;
            }

            npc.decode(this.js5.openrs2, data, readCb);
        } else {
            await this.js5.indexes[2].load();

            let data = await this.js5.getFile(2, 9, id);
            if (!data) {
                return null;
            }

            npc.decode(this.js5.openrs2, data, readCb);
        }

        if (!readCbOnly) {
            this.configs[id] = npc;
            return npc;
        } else {
            return null;
        }
    }

    async getOld(id, data, readCb = null, readCbOnly = false) {
        if (this.configs[id]) {
            return this.configs[id];
        }

        let npc = new NpcType();
        npc.id = id;

        npc.decode(this.js5.openrs2, data, readCb);

        if (!readCbOnly) {
            this.configs[id] = npc;
            return npc;
        } else {
            return null;
        }
    }
}
