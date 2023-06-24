import Packet from '#jagex3/io/Packet.js';
import { KNOWN_HASHES, KNOWN_NAMES, hashCode } from '#rt4/enum/hashes.js';
import { findCache, readGroup } from '#rt4/util/OpenRS2.js';

class Js5Index {
    openrs2 = -1;
    id = -1;
    version = 0;
    size = 0;
    capacity = 0;

    groupIds = [];
    groupVersions = [];
    groupChecksums = [];
    groupCapacities = [];
    groupSizes = [];
    groupNameHashes = [];
    groupNames = [];
    groupChecksums = [];
    groupVersions = [];
    fileIds = [];
    fileNameHashes = [];
    fileNames = [];

    constructor(id, openrs2) {
        this.id = id;
        this.openrs2 = openrs2;
    }

    async load() {
        let data = await readGroup(this.openrs2, 255, this.id);
        if (!data) {
            return;
        }

        // ORIGINAL, VERSIONED, SMART
        let protocol = data.g1();
        if (protocol >= 6) {
            this.version = data.g4();
        } else {
            this.version = 0;
        }

        let flags = data.g1();

        this.size = 0;
        if (protocol >= 7) {
            this.size = data.gsmart4();
        } else {
            this.size = data.g2();
        }

        let prevGroupId = 0;
        let maxGroupId = -1;
        for (let i = 0; i < this.size; i++) {
            if (protocol >= 7) {
                this.groupIds[i] = prevGroupId += data.gsmart4();
            } else {
                this.groupIds[i] = prevGroupId += data.g2();
            }

            if (this.groupIds[i] > maxGroupId) {
                maxGroupId = this.groupIds[i];
            }
        }
        this.capacity = maxGroupId + 1;

        if (flags != 0) {
            for (let i = 0; i < this.capacity; i++) {
                this.groupNameHashes[i] = -1;
            }

            for (let i = 0; i < this.size; i++) {
                let id = this.groupIds[i];
                this.groupNameHashes[id] = data.g4s();
                this.groupNames[id] = KNOWN_HASHES[this.groupNameHashes[id]] || null;
            }
        }

        for (let i = 0; i < this.size; i++) {
            this.groupChecksums[this.groupIds[i]] = data.g4s();
        }

        for (let i = 0; i < this.size; i++) {
            this.groupVersions[this.groupIds[i]] = data.g4();
        }

        for (let i = 0; i < this.size; i++) {
            this.groupSizes[this.groupIds[i]] = data.g2();
        }

        for (let i = 0; i < this.size; i++) {
            let prevFileId = 0;
            let maxFileId = -1;
            let groupId = this.groupIds[i];
            let groupSize = this.groupSizes[groupId];

            this.fileIds[groupId] = [];
            for (let j = 0; j < groupSize; j++) {
                if (protocol >= 7) {
                    this.fileIds[groupId][j] = prevFileId += data.gsmart4();
                } else {
                    this.fileIds[groupId][j] = prevFileId += data.g2();
                }

                if (this.fileIds[groupId][j] > maxFileId) {
                    maxFileId = this.fileIds[groupId][j];
                }
            }

            this.groupCapacities[groupId] = maxFileId + 1;
        }

        if (flags != 0) {
            for (let i = 0; i < this.size; i++) {
                let groupId = this.groupIds[i];
                let groupSize = this.groupSizes[groupId];

                this.fileNameHashes[groupId] = [];
                this.fileNames[groupId] = [];
                for (let j = 0; j < this.groupCapacities[groupId]; j++) {
                    this.fileNameHashes[groupId][j] = -1;
                }

                for (let j = 0; j < groupSize; j++) {
                    let fileId = -1;
                    if (this.fileIds[groupId] === null) {
                        fileId = j;
                    } else {
                        fileId = this.fileIds[groupId][j];
                    }

                    this.fileNameHashes[groupId][fileId] = data.g4s();
                    this.fileNames[groupId][fileId] = KNOWN_HASHES[this.fileNameHashes[groupId][fileId]] || null;
                }
            }
        }
    }

    async getGroup(group) {
        return readGroup(this.openrs2, this.id, group);
    }

    async getGroupByName(name) {
        let hash = hashCode(name);
        let group = this.groupNameHashes.indexOf(hash);

        return readGroup(this.openrs2, this.id, group);
    }

    async getFile(group, file) {
        let fileIds = this.fileIds[group];
        let groupSize = this.groupSizes[group];

        if (groupSize > 1) {
            if (!this.unpacked) {
                this.unpacked = [];
            }

            if (!this.unpacked[group]) {
                this.unpacked[group] = [];
            }

            if (this.unpacked[group][file]) {
                return Packet.wrap(this.unpacked[group][file]);
            }

            let data = await readGroup(this.openrs2, this.id, group);
            if (!data) {
                return null;
            }

            data.pos = data.length - 1;
            let stripes = data.g1();
            data.pos -= (groupSize * stripes * 4) + 1;

            let off = 0;
            for (let i = 0; i < stripes; i++) {
                let len = 0;

                for (let j = 0; j < groupSize; j++) {
                    len += data.g4s();

                    let fileId = fileIds[j];
                    this.unpacked[group][fileId] = data.gdata(len, off, false);

                    off += len;
                }
            }

            return Packet.wrap(this.unpacked[group][file]);
        } else {
            return readGroup(this.openrs2, this.id, group);
        }
    }
}

export default class Js5MasterIndex {
    openrs2 = -1;
    archives = [];

    constructor(openrs2) {
        this.openrs2 = openrs2;
    }

    async load() {
        let cache = findCache(-1, this.openrs2);

        for (let archive = 0; archive < cache.indexes; archive++) {
            try {
                let index = new Js5Index(archive, this.openrs2);
                await index.load();

                this.archives[archive] = index;
            } catch (err) {
                console.error('Failed to load archive', archive);
                console.error(err);
            }
        }
    }

    async getArchive(id) {
        if (this.archives[id].index == null) {
            let index = new Js5Index(id);
            await index.load();
            this.archives[id].index = index;
        }

        return this.archives[id].index;
    }
}
