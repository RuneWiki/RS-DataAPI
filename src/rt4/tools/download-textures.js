import {} from 'dotenv/config.js';
import Jimp from 'jimp';
import fs from 'fs';

import Js5MasterIndex from '#rt4/util/Js5.js';
import { findCache } from '#rt4/util/OpenRS2.js';

async function decodeImage(data) {
    data.pos = data.length - 2;
    let info = data.g2();
    let version = info >> 15;
    let tiles = info & 0x7FFF;

    if (version === 0) {
        data.pos = data.length - 7 - (tiles * 8);
        if (data.pos < 0 || data.pos > data.length) {
            throw new Error('Invalid image data');
        }

        let xOffsets = [];
        let yOffsets = [];
        let innerWidths = [];
        let innerHeights = [];

        let width = data.g2();
        let height = data.g2();
        let paletteCount = data.g1() + 1;

        for (let i = 0; i < tiles; i++) {
            xOffsets[i] = data.g2();
        }

        for (let i = 0; i < tiles; i++) {
            yOffsets[i] = data.g2();
        }

        for (let i = 0; i < tiles; i++) {
            innerWidths[i] = data.g2();
        }

        for (let i = 0; i < tiles; i++) {
            innerHeights[i] = data.g2();
        }

        data.pos = data.length - 7 - (tiles * 8) - ((paletteCount - 1) * 3);
        if (data.pos < 0 || data.pos > data.length) {
            throw new Error('Invalid image data');
        }

        let palette = [0];
        for (let i = 1; i < paletteCount; i++) {
            palette[i] = data.g3();

            if (palette[i] == 0) {
                // preserve black colors so they aren't made transparent
                palette[i] = 1;
            }
        }

        let tileX = Math.ceil(Math.sqrt(tiles));
        let tileY = Math.ceil(tiles / tileX);
        let img = new Jimp(tileX * width, tileY * height);
        img.background(0x00000000);

        data.pos = 0;
        for (let i = 0; i < tiles; i++) {
            let innerWidth = innerWidths[i];
            let innerHeight = innerHeights[i];
            let len = innerWidth * innerHeight;

            let startX = (i % tileX) * width;
            let startY = Math.floor(i / tileX) * height;

            let flags = data.g1();
            if ((flags & 0x1) === 0) {
                for (let j = 0; j < len; j++) {
                    let pixel = palette[data.g1()];
                    let x = startX + xOffsets[i] + (j % innerWidth);
                    let y = startY + yOffsets[i] + Math.floor(j / innerWidth);
                    let pos = (x + (y * tileX * width)) * 4;

                    img.bitmap.data[pos + 3] = pixel === 0 ? 0 : 255;
                    if (pixel === 1) {
                        // restore black colors
                        pixel = 0;
                    }

                    img.bitmap.data[pos] = (pixel >> 16) & 0xFF;
                    img.bitmap.data[pos + 1] = (pixel >> 8) & 0xFF;
                    img.bitmap.data[pos + 2] = pixel & 0xFF;
                }

                if ((flags & 0x2) !== 0) {
                    for (let j = 0; j < len; j++) {
                        let x = startX + xOffsets[i] + (j % innerWidth);
                        let y = startY + yOffsets[i] + Math.floor(j / innerWidth);
                        let pos = (x + (y * tileX * width)) * 4;

                        img.bitmap.data[pos + 3] = data.g1();
                    }
                }
            } else {
                for (let x = 0; x < innerWidth; x++) {
                    for (let y = 0; y < innerHeight; y++) {
                        let pixel = palette[data.g1()];
                        let pos = (startX + xOffsets[i] + x + ((startY + yOffsets[i] + y) * tileX * width)) * 4;

                        img.bitmap.data[pos + 3] = pixel === 0 ? 0 : 255;
                        if (pixel === 1) {
                            // restore black colors
                            pixel = 0;
                        }

                        img.bitmap.data[pos] = (pixel >> 16) & 0xFF;
                        img.bitmap.data[pos + 1] = (pixel >> 8) & 0xFF;
                        img.bitmap.data[pos + 2] = pixel & 0xFF;
                    }
                }

                if ((flags & 0x2) !== 0) {
                    for (let x = 0; x < innerWidth; x++) {
                        for (let y = 0; y < innerHeight; y++) {
                            let pos = (startX + xOffsets[i] + x + ((startY + yOffsets[i] + y) * tileX * width)) * 4;

                            img.bitmap.data[pos + 3] = data.g1();
                        }
                    }
                }
            }
        }

        return img;
    } else {
        // rs3 format (observable in 881+)
        data.pos = 0;
        let unk1 = data.g1();

        if (unk1 === 0) {
            let hasAlpha = data.gbool();
            let width = data.g2();
            let height = data.g2();

            let tileX = Math.ceil(Math.sqrt(tiles));
            let tileY = Math.ceil(tiles / tileX);
            let img = new Jimp(tileX * width, tileY * height);
            img.background(0x00000000);

            for (let i = 0; i < tiles; i++) {
                let len = width * height;
                let startX = (i % tileX) * width;
                let startY = Math.floor(i / tileX) * height;

                for (let j = 0; j < len; j++) {
                    let x = startX + (j % width);
                    let y = startY + Math.floor(j / width);
                    let pos = (x + (y * tileX * width)) * 4;

                    let pixel = data.g3();
                    img.bitmap.data[pos] = (pixel >> 16) & 0xFF;
                    img.bitmap.data[pos + 1] = (pixel >> 8) & 0xFF;
                    img.bitmap.data[pos + 2] = pixel & 0xFF;
                    img.bitmap.data[pos + 3] = 255;
                }

                if (hasAlpha) {
                    for (let j = 0; j < len; j++) {
                        let x = startX + (j % width);
                        let y = startY + Math.floor(j / width);
                        let pos = (x + (y * tileX * width)) * 4;

                        img.bitmap.data[pos + 3] = data.g1();
                    }
                }
            }

            return img;
        } else {
            if (unk1 === 1) {
                throw new Error('Unsupported operation');
            } else {
                throw new Error('Runtime exception');
            }
        }
    }
}

let js5 = new Js5MasterIndex(findCache(930, -1, 1).id);
js5.init();

await js5.archives[52].load();
for (let i = 0; i < js5.archives[52].size; i++) {
    let group = js5.archives[52].groupIds[i];

    if (!fs.existsSync(`dump/textures_dxt/${group}.dds`)) {
        let data = await js5.archives[52].getGroup(group);
        data.save(`dump/textures_dxt/${group}.dds`, data.length, 5);
    }
}

await js5.archives[53].load();
for (let i = 0; i < js5.archives[53].size; i++) {
    let group = js5.archives[53].groupIds[i];

    if (!fs.existsSync(`dump/textures_png/${group}.png`)) {
        let data = await js5.archives[53].getGroup(group);
        data.save(`dump/textures_png/${group}.png`, data.length, 5);
    }
}

await js5.archives[54].load();
for (let i = 0; i < js5.archives[54].size; i++) {
    let group = js5.archives[54].groupIds[i];

    if (!fs.existsSync(`dump/textures_png_mipped/${group}.png`)) {
        let data = await js5.archives[54].getGroup(group);
        data.save(`dump/textures_png_mipped/${group}.png`, data.length, 6);
    }
}

await js5.archives[55].load();
for (let i = 0; i < js5.archives[55].size; i++) {
    let group = js5.archives[55].groupIds[i];

    if (!fs.existsSync(`dump/textures_etc/${group}.ktx`)) {
        let data = await js5.archives[55].getGroup(group);
        data.save(`dump/textures_etc/${group}.ktx`, data.length, 5);
    }
}

await js5.archives[59].load();
for (let i = 0; i < js5.archives[59].size; i++) {
    let group = js5.archives[59].groupIds[i];

    if (!fs.existsSync(`dump/typefonts/${group}.otf`)) {
        let data = await js5.archives[59].getGroup(group);
        data.save(`dump/typefonts/${group}.otf`, data.length);
    }
}

// takes longer to convert
await js5.archives[8].load();
for (let i = 0; i < js5.archives[8].size; i++) {
    let group = js5.archives[8].groupIds[i];

    if (!fs.existsSync(`dump/sprites/${group}.png`)) {
        let data = await js5.archives[8].getGroup(group);
        let img = await decodeImage(data);
        await img.writeAsync(`dump/sprites/${group}.png`);
    }
}
