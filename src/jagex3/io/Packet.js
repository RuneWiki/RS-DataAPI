import fs from 'fs';

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

    // ----

    g1() {
        return this.data[this.pos++];
    }

    g1s() {
        let value = this.data[this.pos++];
        if (value > 0x7F) {
            value -= 0x100;
        }
        return value;
    }

    gbool() {
        return this.g1() === 1;
    }

    g2() {
        return (this.data[this.pos++] << 8) | this.data[this.pos++];
    }

    g2s() {
        let value = (this.data[this.pos++] << 8) | this.data[this.pos++];
        if (value > 0x7FFF) {
            value -= 0x10000;
        }
        return value;
    }

    g3() {
        return (this.data[this.pos++] << 16) | (this.data[this.pos++] << 8) | this.data[this.pos++];
    }

    g4() {
        return (this.data[this.pos++] << 24) | (this.data[this.pos++] << 16) | (this.data[this.pos++] << 8) | this.data[this.pos++];
    }

    g4s() {
        let value = (this.data[this.pos++] << 24) | (this.data[this.pos++] << 16) | (this.data[this.pos++] << 8) | this.data[this.pos++];
        if (value > 0x7FFFFFFF) {
            value -= 0x100000000;
        }
        return value;
    }

    gsmart4() {
        let value = this.data[this.pos];
        if ((value & 0x80) == 0) {
            return this.g2();
        } else {
            return this.g4();
        }
    }

    gjstr() {
        let str = '';
        while (this.data[this.pos] !== 0) {
            str += String.fromCharCode(this.data[this.pos++]);
        }
        this.pos++;
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
}
