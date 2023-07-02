import ObjType from '#rsdata/cache/ObjType.js';

export default class ObjTypeList {
    js5 = null;
    configs = [];
    count = 0;

    constructor(js5) {
        this.js5 = js5;
    }

    async load(readCb = null) {
        if (this.js5.openrs2.indexes >= 20 && this.js5.openrs2.game != 'oldschool') {
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

                await this.get(id, readCb);
            }
        } else {
            await this.js5.indexes[2].load();

            let groupData = await this.js5.indexes[2].getGroup(10);
            if (!groupData) {
                // uh oh
                return;
            }

            for (let i = 0; i < this.js5.indexes[2].fileIds[10].length; i++) {
                let id = this.js5.indexes[2].fileIds[10][i];

                await this.get(id, readCb);
            }
        }

        this.count = this.configs.length;
    }

    async get(id, readCb = null) {
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
                return obj;
            }

            obj.decode(this.js5.openrs2, data, readCb);
        } else {
            await this.js5.indexes[2].load();

            let data = await this.js5.getFile(2, 10, id);
            if (!data) {
                return obj;
            }

            obj.decode(this.js5.openrs2, data, readCb);
        }

        this.configs[id] = obj;
        return obj;
    }
}
