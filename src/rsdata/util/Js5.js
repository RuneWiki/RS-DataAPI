import Packet from '#jagex3/io/Packet.js';
import { hashCode } from '#rsdata/enum/hashes.js';
import { getXteas, readGroup } from '#rsdata/util/OpenRS2.js';

class Js5Index {
    openrs2 = -1;
    id = -1;
    build = -1;

    version = 0;
    size = -1;
    capacity = 0;

    groupIds = [];
    groupVersions = [];
    groupChecksums = [];
    groupCapacities = [];
    groupSizes = [];
    groupNameHashes = [];
    groupChecksums = [];
    groupUncompressedChecksums = [];
    groupDigests = [];
    groupVersions = [];
    fileIds = [];
    fileNameHashes = [];

    constructor(id, openrs2, build) {
        this.id = id;
        this.openrs2 = openrs2;
        this.build = build;
    }

    async load() {
        if (this.size !== -1) {
            // already loaded
            return;
        }

        let data = await readGroup(this.openrs2, 255, this.id);
        if (!data) {
            return;
        }

        // ORIGINAL, VERSIONED, SMART
        const format = data.g1();
        if (format < 5 || format > 8) {
            throw new Error('Unsupported format: ' + format);
        }

        if (format >= 6) {
            this.version = data.g4s();
        } else {
            this.version = 0;
        }

        const flags = data.g1();
        const hasNames = flags & 0x1;
        const hasDigests = flags & 0x2;
        const hasLengths = flags & 0x4;
        const hasUncompressedChecksums = flags & 0x8;

        this.size = 0;
        if (format >= 7) {
            this.size = data.gSmart2or4();
        } else {
            this.size = data.g2();
        }

        let prevGroupId = 0;
        let maxGroupId = -1;
        for (let i = 0; i < this.size; i++) {
            if (format >= 7) {
                this.groupIds[i] = prevGroupId += data.gSmart2or4();
            } else {
                this.groupIds[i] = prevGroupId += data.g2();
            }

            if (this.groupIds[i] > maxGroupId) {
                maxGroupId = this.groupIds[i];
            }
        }
        this.capacity = maxGroupId + 1;

        if (hasNames) {
            for (let i = 0; i < this.capacity; i++) {
                this.groupNameHashes[i] = -1;
            }

            for (let i = 0; i < this.size; i++) {
                this.groupNameHashes[this.groupIds[i]] = data.g4s();
            }
        }

        for (let i = 0; i < this.size; i++) {
            this.groupChecksums[this.groupIds[i]] = data.g4s();
        }

        if (hasUncompressedChecksums) {
            for (let i = 0; i < this.size; i++) {
                this.groupUncompressedChecksums[this.groupIds[i]] = data.g4s();
            }
        }

        if (hasDigests) {
            for (let i = 0; i < this.size; i++) {
                data.pos += 64;
                // this.groupDigests[this.groupIds[i]] = data.gdata(64);
            }
        }

        if (hasLengths) {
            for (let i = 0; i < this.size; i++) {
                data.g4s();
                data.g4s();
            }
        }

        for (let i = 0; i < this.size; i++) {
            this.groupVersions[this.groupIds[i]] = data.g4s();
        }

        for (let i = 0; i < this.size; i++) {
            if (format >= 7) {
                this.groupSizes[this.groupIds[i]] = data.gSmart2or4();
            } else {
                this.groupSizes[this.groupIds[i]] = data.g2();
            }
        }

        for (let i = 0; i < this.size; i++) {
            let prevFileId = 0;
            let maxFileId = -1;

            let groupId = this.groupIds[i];
            let groupSize = this.groupSizes[groupId];

            this.fileIds[groupId] = [];
            for (let j = 0; j < groupSize; j++) {
                if (format >= 7) {
                    this.fileIds[groupId][j] = prevFileId += data.gSmart2or4();
                } else {
                    this.fileIds[groupId][j] = prevFileId += data.g2();
                }

                if (this.fileIds[groupId][j] > maxFileId) {
                    maxFileId = this.fileIds[groupId][j];
                }
            }

            this.groupCapacities[groupId] = maxFileId + 1;
        }

        if (hasNames) {
            for (let i = 0; i < this.size; i++) {
                let groupId = this.groupIds[i];
                let groupSize = this.groupSizes[groupId];

                this.fileNameHashes[groupId] = [];
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
                }
            }
        }
    }

    async getCapacity() {
        if (this.size === -1) {
            await this.load();
        }

        return this.capacity;
    }

    async getSize() {
        if (this.size === -1) {
            await this.load();
        }

        return this.size;
    }

    async getGroup(group, skipLoading = false) {
        if (this.size === -1 && !skipLoading) {
            await this.load();
        }

        if (this.id === 5) {
            let xteas = await getXteas(this.openrs2);

            let match = xteas.find(x => x.group == group);
            if (match) {
                return readGroup(this.openrs2, this.id, group, match.key);
            }
        }

        return readGroup(this.openrs2, this.id, group);
    }

    async getGroupCapacity(group, skipLoading = false) {
        if (this.size === -1 && !skipLoading) {
            await this.load();
        }

        return this.groupCapacities[group];
    }

    async getGroupByName(name) {
        if (this.size === -1) {
            await this.load();
        }

        let hash = hashCode(name);
        let group = this.groupNameHashes.indexOf(hash);

        if (this.id === 5) {
            let xteas = await getXteas(this.openrs2);

            let match = xteas.find(x => x.group == group);
            if (match) {
                return readGroup(this.openrs2, this.id, group, match.key);
            }
        }

        return readGroup(this.openrs2, this.id, group);
    }

    async getGroupId(name) {
        if (this.size === -1) {
            await this.load();
        }

        let hash = hashCode(name);
        let group = this.groupNameHashes.indexOf(hash);

        return group;
    }

    async getFile(group, file) {
        if (this.size === -1) {
            await this.load();
        }

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

            let uncompressed = await readGroup(this.openrs2, this.id, group);
            if (!uncompressed) {
                return null;
            }

            uncompressed = uncompressed.data;

            let start = uncompressed.length;
            let position = start - 1;
            let stripes = uncompressed[position] & 0xFF;
            let bufferPosition = position - (groupSize * stripes * 4);
            let buffer = new Packet(uncompressed);

            buffer.pos = bufferPosition;
            let lens = new Int32Array(groupSize);
            for (let i = 0; i < stripes; i++) {
                let off = 0;

                for (let j = 0; j < groupSize; j++) {
                    off += buffer.g4s();
                    lens[j] += off;
                }
            }

            let extracted = new Array(groupSize);
            for (let i = 0; i < groupSize; i++) {
                extracted[i] = new Uint8Array(lens[i]);
                lens[i] = 0;
            }

            buffer.pos = bufferPosition;
            let off = 0;
            for (let i = 0; i < stripes; i++) {
                let fileLen = 0;

                for (let j = 0; j < groupSize; j++) {
                    fileLen += buffer.g4s();

                    extracted[j].set(uncompressed.subarray(off, off + fileLen), 0);

                    off += fileLen;
                    lens[j] += fileLen;
                }
            }

            for (let i = 0; i < groupSize; i++) {
                let file = 0;
                if (fileIds == null) {
                    file = i;
                } else {
                    file = fileIds[i];
                }

                this.unpacked[group][file] = extracted[i];
            }

            return Packet.wrap(this.unpacked[group][file]);
        } else {
            return readGroup(this.openrs2, this.id, group);
        }
    }
}

export default class Js5MasterIndex {
    openrs2 = null;
    indexes = [];

    constructor(openrs2) {
        this.openrs2 = openrs2;

        // TODO: skipping invalid archives
        for (let archive = 0; archive < this.openrs2.indexes; archive++) {
            this.indexes[archive] = new Js5Index(archive, this.openrs2.id, this.openrs2.builds.length ? this.openrs2.builds[0].major : -1);
        }
    }

    async getArchive(archive) {
        if (archive >= this.openrs2.indexes || archive < 0) {
            return null;
        }

        if (this.indexes[archive].size === -1) {
            await this.indexes[archive].load();
        }

        return this.indexes[archive];
    }

    async getGroup(archive, group) {
        if (archive >= this.openrs2.indexes || archive < 0) {
            return null;
        }

        return this.indexes[archive].getGroup(group);
    }

    async getGroupByName(archive, name) {
        if (archive >= this.openrs2.indexes || archive < 0) {
            return null;
        }

        return this.indexes[archive].getGroupByName(name);
    }

    async getFile(archive, group, file) {
        if (archive >= this.openrs2.indexes || archive < 0) {
            return null;
        }

        return this.indexes[archive].getFile(group, file);
    }
}
