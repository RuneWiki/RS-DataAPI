import fs from 'fs';

export default class Packet {
    constructor(src) {
        if (src instanceof Packet) {
            src = src.data;
        }

        this.data = new Int8Array(src);
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
        return this.data[this.pos++] & 0xFF;
    }

    g1b() {
        return this.data[this.pos++];
    }

    g2() {
        return (((this.data[this.pos++] & 0xFF) << 8) | (this.data[this.pos++] & 0xFF)) >>> 0;
    }

    g2s() {
        let value = (((this.data[this.pos++] & 0xFF) << 8) | (this.data[this.pos++] & 0xFF)) >>> 0;
        if (value > 32767) {
            value -= 65536;
        }
        return value;
    }

    g3() {
        return (((this.data[this.pos++] & 0xFF) << 16) | ((this.data[this.pos++] & 0xFF) << 8) | (this.data[this.pos++] & 0xFF)) >>> 0;
    }

    g4() {
        return (((this.data[this.pos++] & 0xFF) << 24) | ((this.data[this.pos++] & 0xFF) << 16) | ((this.data[this.pos++] & 0xFF) << 8) | (this.data[this.pos++] & 0xFF)) >>> 0;
    }

    g4s() {
        return ((this.data[this.pos++] & 0xFF) << 24) | ((this.data[this.pos++] & 0xFF) << 16) | ((this.data[this.pos++] & 0xFF) << 8) | (this.data[this.pos++] & 0xFF);
    }

    gjstr() {
        let str = '';
        while (this.data[this.pos !== 0]) {
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
