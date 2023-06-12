import fs from 'fs';
import zlib from 'zlib';

import axios from 'axios';
import tar from 'tar';

import Packet from '#jagex3/io/Packet.js';
import BZip2 from '#jagex3/io/BZip2.js';

const OPENRS2_SCOPE = 'runescape';
// const OPENRS2_ID = '1372'; // use whatever
const OPENRS2_ID = '254'; // links to rev 530, dated 2009-02-01
// const OPENRS2_ID = '259'; // links to rev 578, dated 2009-12-22
// const OPENRS2_ID = '671'; // links to rev 578, dated 2010-01-18
// const OPENRS2_ID = '516'; // links to rev 578, dated 2010-01-22
const OPENRS2_API = `https://archive.openrs2.org/caches/${OPENRS2_SCOPE}/${OPENRS2_ID}`;

if (!fs.existsSync('data')) {
    fs.mkdirSync('data', { recursive: true });
}

if (!fs.existsSync('data/xteas.json')) {
    console.log('Downloading XTEAs...');
    await axios.get(`${OPENRS2_API}/keys.json`).then((response) => {
        fs.writeFileSync('data/xteas.json', JSON.stringify(response.data));
    });
}

if (!fs.existsSync('data/cache') || !fs.existsSync('data/cache/openrs2id.txt') || fs.readFileSync('data/cache/openrs2id.txt', 'ascii') != OPENRS2_ID) {
    console.log('New OpenRS2 ID, clearing cache...');
    fs.rmSync('data/cache', { recursive: true, force: true });
}

if (!fs.existsSync(`data/cache`) || !fs.existsSync(`data/cache/openrs2id.txt`)) {
    fs.mkdirSync(`data/cache`, { recursive: true });
    fs.writeFileSync('data/cache/openrs2id.txt', OPENRS2_ID);
}

const XTEAS = JSON.parse(fs.readFileSync('data/xteas.json'));

export function getXtea(x, z) {
    return XTEAS.find((xtea) => xtea.mapsquare == (x << 8 | z));
}

export async function getGroup(archive, group) {
    if (!fs.existsSync(`data/cache/${archive}`)) {
        fs.mkdirSync(`data/cache/${archive}`, { recursive: true });
    }

    try {
        let file;
        if (!fs.existsSync(`data/cache/${archive}/${group}.dat`)) {
            file = await axios.get(`${OPENRS2_API}/archives/${archive}/groups/${group}.dat`, { responseType: 'arraybuffer' });
            file = new Uint8Array(file.data);
            fs.writeFileSync(`data/cache/${archive}/${group}.dat`, file);
        } else {
            file = fs.readFileSync(`data/cache/${archive}/${group}.dat`);
        }

        return file;
    } catch (err) {
        console.error('Failed to download group', archive, group);
        return null;
    }
}

export async function readGroup(archive, group) {
    let data = Packet.wrap(await getGroup(archive, group));

    let compression = data.g1();
    let length = data.g4();

    if (compression === 0) {
        return data.gPacket(length);
    } else {
        let uncompressedLength = data.g4();

        if (compression === 1) {
            return Packet.wrap(BZip2.decompress(data.gdata(length)));
        } else if (compression === 2) {
            return Packet.wrap(zlib.gunzipSync(data.gdata(length)));
        }
    }
}

// disk.zip: dat/idx format
// tar.gz: flat format
export async function extractFlatFiles() {
    let file = null;

    if (!fs.existsSync(`data/${OPENRS2_ID}-flat-file.tar.gz`)) {
        file = await axios.get(`${OPENRS2_API}/flat-file.tar.gz`, { responseType: 'arraybuffer' });
        file = new Uint8Array(file.data);
        fs.writeFileSync(`data/${OPENRS2_ID}-flat-file.tar.gz`, file);
    } else {
        file = fs.readFileSync(`data/${OPENRS2_ID}-flat-file.tar.gz`);
    }

    // TODO: stream piping
    console.log('Extracting flat files...');
    await tar.x({
        file: `data/${OPENRS2_ID}-flat-file.tar.gz`,
        C: 'data/cache/',
        strip: 1,
        keep: true
    });
    console.log('Extracted!');
}
