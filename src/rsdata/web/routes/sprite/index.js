import Js5MasterIndex from '#rsdata/util/Js5.js';
import { findCache } from '#rsdata/util/OpenRS2.js';

import Jimp from 'jimp';

function isPrime(val) {
    if (val === 1) {
        // not "prime" but good enough for this function's purpose
        return true;
    }

    for (let i = 2; i < val; i++) {
        if (val % i === 0) {
            return false;
        }
    }

    return true;
}

async function decodeImage(data, transparent = true) {
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

        let palette = [];
        if (transparent) {
            palette[0] = 0x00000000;
        } else {
            palette[0] = 0xFF00FFFF;
        }

        for (let i = 1; i < paletteCount; i++) {
            palette[i] = data.g3();

            if (palette[i] == 0) {
                // preserve black colors so they aren't made transparent
                palette[i] = 1;
            }
        }

        let tileX = Math.ceil(Math.sqrt(tiles));
        let tileY = Math.ceil(tiles / tileX);
        if (isPrime(tiles)) {
            tileX = tiles;
            tileY = 1;
        } else if (tileX * tileY != tiles) {
            let heightTries = 0;

            // wrong aspect ratio, try subtracting from height and adding to width
            while (tileX * tileY != tiles && heightTries < 10) {
                tileY--;
                tileX++;
                heightTries++;
            }

            if (tileX * tileY != tiles) {
                tileX = Math.ceil(Math.sqrt(tiles));
                tileY = Math.ceil(tiles / tileX);

                // because we do width second, we're biased towards a wider spritesheet
                let widthTries = 0;

                // wrong aspect ratio, try subtracting from width and adding to height
                while (tileX * tileY != tiles && widthTries < 10) {
                    tileX--;
                    tileY++;
                    widthTries++;
                }

                if (tileX * tileY != tiles) {
                    // oh well, we tried
                    tileX = Math.ceil(Math.sqrt(tiles));
                    tileY = Math.ceil(tiles / tileX);
                    // tileX = tiles;
                    // tileY = 1;
                }
            }
        }

        let img;
        if (transparent) {
            img = new Jimp(tileX * width, tileY * height, palette[0]).colorType(4);
        } else {
            img = new Jimp(tileX * width, tileY * height, palette[0]).colorType(2);
        }

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
                    let color = data.g1();
                    if (color === 0) {
                        continue;
                    }

                    let pixel = palette[color];
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
                        let color = data.g1();
                        if (color === 0) {
                            continue;
                        }

                        let pixel = palette[color];
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
            let img;
            if (transparent) {
                img = new Jimp(tileX * width, tileY * height).colorType(2);
            } else {
                img = new Jimp(tileX * width, tileY * height, 0xFF00FFFF).colorType(2);
            }

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

export default function (f, opts, next) {
    f.get(`/:name`, async (req, reply) => {
        const { name } = req.params;
        const { openrs2 = -1, match = 0, lang = 'en', magenta } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (openrs2 !== -1) {
            game = null;
        }

        if (rev !== -1 && rev < 234) {
            game = 'oldschool';
        }

        let transparent = true;
        if (magenta) {
            transparent = false;
        }

        // ----

        let cache = findCache(rev, openrs2, match, lang, game);
        if (!cache) {
            reply.code(400);
            return `Could not find cache for ${rev} ${openrs2} ${match} ${lang} ${game}`;
        }

        if (cache.builds.length) {
            rev = cache.builds[0].major;
        }
        game = cache.game;
        let js5 = new Js5MasterIndex(cache);

        // ----

        if (await js5.indexes[8].getGroupByName(`${name},0`)) {
            // this is a spritesheet split across multiple groups
            let count = 0;
            for (let i = 0; i < 512; i++) {
                if (await js5.indexes[8].getGroupByName(`${name},${i}`)) {
                    count++;
                } else {
                    break;
                }
            }

            let sprites = [];
            for (let i = 0; i < count; i++) {
                let data = await js5.indexes[8].getGroupByName(`${name},${i}`);
                sprites.push(await decodeImage(data, transparent));
            }

            let width = Math.ceil(Math.sqrt(count));
            let height = Math.ceil(count / width);
            if (isPrime(count)) {
                width = count;
                height = 1;
            } else if (width * height != count) {
                let heightTries = 0;
    
                // wrong aspect ratio, try subtracting from height and adding to width
                while (width * height != count && heightTries < 10) {
                    height--;
                    width++;
                    heightTries++;
                }
    
                if (width * height != count) {
                    width = Math.ceil(Math.sqrt(count));
                    height = Math.ceil(count / width);
    
                    // because we do width second, we're biased towards a wider spritesheet
                    let widthTries = 0;
    
                    // wrong aspect ratio, try subtracting from width and adding to height
                    while (width * height != count && widthTries < 10) {
                        width--;
                        height++;
                        widthTries++;
                    }
    
                    if (width * height != count) {
                        // oh well, we tried
                        width = Math.ceil(Math.sqrt(count));
                        height = Math.ceil(count / width);
                        // width = count;
                        // height = 1;
                    }
                }
            }

            let sheet = new Jimp(width * sprites[0].getWidth(), height * sprites[0].getHeight());
            sheet.background(0x00000000);

            for (let i = 0; i < count; i++) {
                let x = i % width;
                let y = Math.floor(i / width);

                sheet.composite(sprites[i], x * sprites[0].getWidth(), y * sprites[0].getHeight());
            }

            reply.type('image/png');
            return sheet.getBufferAsync(Jimp.MIME_PNG);
        } else if (await js5.indexes[8].getGroupByName(name)) {
            let data = await js5.indexes[8].getGroupByName(name);

            // this is a self-contained spritesheet/single sprite
            let img = await decodeImage(data, transparent);
            reply.type('image/png');
            return img.getBufferAsync(Jimp.MIME_PNG);
        } else {
            if (Number(isNaN(name))) {
                reply.code(404);
                return `Could not find group ${name}`;
            }

            let data = await js5.indexes[8].getGroup(Number(name));
            if (!data) {
                reply.code(404);
                return `Could not find group ${name}`;
            }

            // this is a self-contained spritesheet/single sprite
            let img = await decodeImage(data, transparent);
            reply.type('image/png');
            return img.getBufferAsync(Jimp.MIME_PNG);
        }
    });

    next();
}
