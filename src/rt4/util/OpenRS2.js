import axios from 'axios';
import fs from 'fs';
import fsp from 'fs/promises';
import zlib from 'zlib';
import { dirname } from 'path';

import Packet from '#jagex3/io/Packet.js';
import BZip2 from '#jagex3/io/BZip2.js';

export async function downloadFile(url, path) {
    try {
        let request = await axios.get(url, { responseType: 'arraybuffer' });
        // await fsp.writeFile(path, request.data);
        fs.mkdirSync(dirname(path), { recursive: true });
        fs.writeFileSync(path, request.data);
        return new Uint8Array(request.data);
    } catch (err) {
        console.error(`Failed to download ${url}`);
        return null;
    }
}

// ----

export const OPENRS2_DOMAIN = 'https://archive.openrs2.org';
export const OPENRS2_API = `${OPENRS2_DOMAIN}/caches/$scope/$id`;

export async function getGroup(id, archive, group) {
    if (fs.existsSync(`data/${id}/${archive}/${group}.dat`)) {
        return fs.readFileSync(`data/${id}/${archive}/${group}.dat`);
    }

    let url = OPENRS2_API.replace('$scope', 'runescape').replace('$id', id);
    let api = `${url}/archives/${archive}/groups/${group}.dat`;

    return await downloadFile(api, `data/${id}/${archive}/${group}.dat`);
}

export async function readGroup(id, archive, group) {
    let data = Packet.wrap(await getGroup(id, archive, group));

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

// ----

if (process.env.DEV_MODE != 1 || !fs.existsSync('data/caches.json')) {
    // redownload caches.json each time in non-dev mode
    await downloadFile(`${OPENRS2_DOMAIN}/caches.json`, 'data/caches.json');
}

let caches = JSON.parse(fs.readFileSync('data/caches.json', 'ascii'));

export function findCache(rev = -1, openrs2 = -1, match = 0) {
    return caches.filter(c => c.id == openrs2 || (c.builds.length && c.builds.findIndex(b => b.major == rev) !== -1))[match];
}
