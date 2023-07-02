import Packet from '#jagex3/io/Packet.js';
import BZip2 from '#jagex3/io/BZip2.js';

function genHash(name) {
    let hash = 0;
    name = name.toUpperCase();
    for (let i = 0; i < name.length; i++) {
        hash = ((hash * 61 + name.charCodeAt(i)) - 32) | 0;
    }
    return hash;
}

export default class Jagfile {
    data = null;
    fileCount = 0;
    fileHash = [];
    fileName = [];
    fileUnpackedSize = [];
    filePackedSize = [];
    filePos = [];
    unpacked = false;

    fileQueue = [];
    fileWrite = [];

    static load(path) {
        return new Jagfile(Packet.load(path));
    }

    constructor(src) {
        if (!src) {
            return;
        }

        let unpackedSize = src.g3();
        let packedSize = src.g3();

        if (unpackedSize === packedSize) {
            this.data = new Uint8Array(src.data);
            this.unpacked = false;
        } else {
            let temp = new Uint8Array(src.gdata(packedSize));
            this.data = BZip2.decompress(temp);
            src = new Packet(this.data);
            this.unpacked = true;
        }

        this.fileCount = src.g2();

        let pos = src.pos + this.fileCount * 10;
        for (let i = 0; i < this.fileCount; i++) {
            this.fileHash[i] = src.g4s();
            this.fileUnpackedSize[i] = src.g3();
            this.filePackedSize[i] = src.g3();

            this.filePos[i] = pos;
            pos += this.filePackedSize[i];
        }
    }

    read(name, decompress = true) {
        let hash = genHash(name);

        for (let i = 0; i < this.fileCount; i++) {
            if (this.fileHash[i] !== hash) {
                continue;
            }

            if (this.unpacked) {
                return new Packet(this.data.subarray(this.filePos[i], this.filePos[i] + this.filePackedSize[i]));
            } else {
                let temp = this.data.subarray(this.filePos[i], this.filePos[i] + this.filePackedSize[i]);

                if (decompress) {
                    return new Packet(BZip2.decompress(temp, false));
                } else {
                    return new Packet(temp);
                }
            }
        }

        return null;
    }
}
