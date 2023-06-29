import fs from 'fs';
import { dirname } from 'path';

export default class Packet {
    constructor(src) {
        if (src instanceof Packet) {
            src = src.data;
        }

        this.data = new Uint8Array(src);
        this.pos = 0;
    }

    get length() {
        return this.data.length;
    }

    get available() {
        return this.data.length - this.pos;
    }

    // ----

    static load(path) {
        return new Packet(fs.readFileSync(path));
    }

    static wrap(src) {
        return new Packet(src);
    }

    save(path, length = this.pos, start = 0) {
        let dir = dirname(path);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(path, this.data.subarray(start, start + length));
    }

    // ----

    g1() {
        return this.data[this.pos++];
    }

    gbool() {
        return this.g1() == 1;
    }

    g1s() {
        let value = this.g1();
        if (value > 0x7F) {
            value -= 0x100;
        }
        return value;
    }

    g2() {
        return (this.data[this.pos++] << 8) | this.data[this.pos++] >>> 0;
    }

    g2s() {
        let value = this.g2();
        if (value > 0x7FFF) {
            value -= 0x10000;
        }
        return value;
    }

    g3() {
        return ((this.data[this.pos++] << 16) | (this.data[this.pos++] << 8) | this.data[this.pos++]) >>> 0;
    }

    g4() {
        return ((this.data[this.pos++] << 24) | (this.data[this.pos++] << 16) | (this.data[this.pos++] << 8) | this.data[this.pos++]) >>> 0;
    }

    g4s() {
        let value = this.g4();
        if (value > 0x7FFFFFFF) {
            value -= 0x100000000;
        }
        return value;
    }

    g8() {
        let low = this.g4();
        let high = this.g4();
        return (BigInt(high) << 32n) | BigInt(low);
    }

    gjstr() {
        let len = 0;
        while (this.data[this.pos + len] != 0) {
            len++;
        }

        let str = new TextDecoder('windows-1252').decode(this.data.subarray(this.pos, this.pos + len));
        this.pos += len + 1;
        return str;
    }

    gdata(length = this.available, offset = this.pos, advance = true) {
        let temp = this.data.subarray(offset, offset + length);
        if (advance) {
            this.pos += length;
        }
        return temp;
    }

    gPacket(length = this.available, offset = this.pos, advance = true) {
        return Packet.wrap(this.gdata(length, offset, advance));
    }

    gsmart4_() {
        let value = this.data[this.pos] & 0xFF;
        if ((value & 0x80) == 0) {
            return this.g2();
        } else {
            return this.g4s();
        }
    }

    // TODO: Java vs JS differences, because this should be identical to ^
    gsmart4() {
        let value = this.data[this.pos] & 0xFF;
        if ((value & 0x80) == 0) {
            return this.g2();
        } else {
            return this.g4s() & 0x7FFFFFFF;
        }
    }
}
