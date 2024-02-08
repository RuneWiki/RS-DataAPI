import Bunzip from 'seek-bzip';

export default class BZip2 {
    static decompress(bytes, checkCRC = false) {
        const temp = new Uint8Array(bytes.length + 4);
        temp[0] = 0x42;
        temp[1] = 0x5A;
        temp[2] = 0x68;
        temp[3] = 0x31;
        temp.set(bytes, 4);
        return Bunzip.decode(temp);
    }
}
