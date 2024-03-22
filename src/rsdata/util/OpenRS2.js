import axios from 'axios';
import fs from 'fs';
import fsp from 'fs/promises';
import zlib from 'zlib';
import { dirname } from 'path';
import tar from 'tar';

import Packet from '#jagex3/io/Packet.js';
import BZip2 from '#jagex3/io/BZip2.js';

export async function downloadFile(url, path) {
    try {
        let request = await axios.get(url, { responseType: 'arraybuffer' });
        fs.mkdirSync(dirname(path), { recursive: true });
        fs.writeFileSync(path, request.data);
        return new Uint8Array(request.data);
    } catch (err) {
        console.error(`Failed to download ${url}`);
        return null;
    }
}

export async function downloadFileStream(url, path) {
    return new Promise(async (res, rej) => {
        try {
            fs.mkdirSync(dirname(path), { recursive: true });
            let file = fs.createWriteStream(path);
            let response = await axios.get(url, { responseType: 'stream' });
            let stream = response.data;
            stream.pipe(file);
            stream.on('end', () => res());
        } catch (err) {
            rej(err);
        }
    });
}

// ----

export const OPENRS2_DOMAIN = 'https://archive.openrs2.org';
export const OPENRS2_API = `${OPENRS2_DOMAIN}/caches/$scope/$id`;

export async function getXteas(id) {
    if (fs.existsSync(`data/${id}/keys.json`)) {
        return JSON.parse(fs.readFileSync(`data/${id}/keys.json`));
    }

    let url = OPENRS2_API.replace('$scope', 'runescape').replace('$id', id);
    let api = `${url}/keys.json`;

    await downloadFile(api, `data/${id}/keys.json`, false);
    return JSON.parse(fs.readFileSync(`data/${id}/keys.json`));
}

export async function getGroup(id, archive, group) {
    if (archive < 0 || group < 0) {
        return null;
    }

    if (fs.existsSync(`data/${id}/${archive}/${group}.dat`)) {
        return fs.readFileSync(`data/${id}/${archive}/${group}.dat`);
    }

    let url = OPENRS2_API.replace('$scope', 'runescape').replace('$id', id);
    let api = `${url}/archives/${archive}/groups/${group}.dat`;

    return await downloadFile(api, `data/${id}/${archive}/${group}.dat`);
}

export async function readGroup(id, archive, group, keys) {
    if (archive < 0 || group < 0) {
        return null;
    }

    let data = Packet.wrap(await getGroup(id, archive, group));
    if (keys) {
        data.tinydec(keys);
    }

    let compression = data.g1();
    let length = data.g4s();

    if (compression === 0) {
        return data.gPacket(length);
    } else {
        let uncompressedLength = data.g4s();

        if (compression === 1) {
            return Packet.wrap(BZip2.decompress(data.gdata(length)));
        } else if (compression === 2) {
            if (keys) {
                return Packet.wrap(zlib.inflateRawSync(data.gdata(length, data.pos + 10, -8 - (data.pos + 10) + data.length)));
            }

            return Packet.wrap(zlib.gunzipSync(data.gdata(length)));
        } else if (compression === 3) {
            // TODO: LZMA
        }
    }
}

// disk.zip: dat/idx format
// tar.gz: flat format
export async function extractFlatFiles(openrs2) {
    if (!fs.existsSync(`data/${openrs2}-flat-file.tar.gz`)) {
        let url = OPENRS2_API.replace('$scope', 'runescape').replace('$id', openrs2);
        console.log(url);
        await downloadFileStream(`${url}/flat-file.tar.gz`, `data/${openrs2}-flat-file.tar.gz`);
    }

    return new Promise(async (res, rej) => {
        fs.mkdirSync(`data/${openrs2}`, { recursive: true });
        let stream = fs.createReadStream(`data/${openrs2}-flat-file.tar.gz`);
        stream.pipe(tar.x({
            C: `data/${openrs2}/`,
            strip: 1,
            keep: true
        }));
        stream.on('end', () => res());
    });
}

// ----

if (process.env.DEV_MODE != 1 || !fs.existsSync('data/caches.json')) {
    // redownload caches.json each time in non-dev mode
    await downloadFile(`${OPENRS2_DOMAIN}/caches.json`, 'data/caches.json');
}

let caches = JSON.parse(fs.readFileSync('data/caches.json', 'ascii'));
caches.sort((a, b) => a.id - b.id);
caches.push({
    id: -1,
    game: 'runescape',
    builds: [
        {
            major: 194
        }
    ]
});
caches.push({
    id: -1,
    game: 'runescape',
    builds: [
        {
            major: 204
        }
    ]
});
caches.push({
    id: -1,
    game: 'runescape',
    builds: [
        {
            major: 222
        }
    ]
});
caches.push({
    id: -1,
    game: 'runescape',
    builds: [
        {
            major: 225
        }
    ]
});

export function findCache(rev = -1, openrs2 = -1, match = 0, lang = 'en', game) {
    if (game) {
        return caches.filter(c => (c.id == openrs2 || (c.builds.length && c.builds.findIndex(b => b.major == rev) !== -1)) && c.language == lang && c.game == game)[match];
    } else {
        return caches.filter(c => (c.id == openrs2 || (c.builds.length && c.builds.findIndex(b => b.major == rev) !== -1)) && c.language == lang)[match];
    }
}

export function findCacheNew(openrs2 = null, rev = null, game = null) {
    if (rev === null && openrs2 === null) {
        return [];
    }

    if (openrs2 !== null) {
        let results = caches.filter(c => c.id == openrs2);
        return results;
    }

    if (game) {
        return caches.filter(c => c.builds.some(b => b.major == rev) && c.game == game);
    } else {
        let results = caches.filter(c => c.builds.some(b => b.major == rev));

        let games = [];
        results.forEach(r => {
            if (!games.includes(r.game)) {
                games.push(r.game);
            }
        });
        if (games.length > 1) {
            // not specific enough!
            return [];
        }

        return results;
    }
}
