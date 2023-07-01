import Js5MasterIndex from '#rsdata/util/Js5.js';

import { findCache, OPENRS2_API } from '#rsdata/util/OpenRS2.js';

export default function (f, opts, next) {
    f.get('/download', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (rev !== -1 && rev < 234) {
            game = 'oldschool';
        }

        let cache = findCache(rev, openrs2, match, lang, game);
        if (!cache) {
            reply.code(400);
            return `Could not find cache for ${rev} ${openrs2} ${match} ${lang} ${game}`;
        }

        if (!cache.disk_store_valid) {
            reply.code(400);
            return 'Cache is not disk-store capable';
        }

        return reply.redirect(302, `${OPENRS2_API.replace('$scope', cache.scope).replace('$id', cache.id)}/disk.zip`);
    });

    f.get('/read/:archive/:group', async (req, reply) => {
        const { archive, group } = req.params;
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (rev !== -1 && rev < 234) {
            game = 'oldschool';
        }

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

        let data = await js5.indexes[archive].getGroup(group, true);
        if (!data) {
            // maybe this is a name?
            data = await js5.indexes[archive].getGroupByName(group);

            if (!data) {
                reply.code(404);
                return `Could not find group ${group} in archive ${archive}`;
            }
        }

        if (archive == 52) {
            reply.type('image/vnd.ms-dds');
            return data.data.slice(5);
        } else if (archive == 53) {
            reply.type('image/png');
            return data.data.slice(5);
        } else if (archive == 54) {
            reply.type('image/png');
            return data.data.slice(6);
        } else if (archive == 55) {
            reply.type('image/ktx');
            return data.data.slice(5);
        } else if (archive == 59) {
            reply.type('application/x-font-opentype');
            return data.data;
        } else {
            reply.type('application/octet-stream');
            return data.data;
        }
    });

    f.get('/find', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (rev !== -1 && rev < 234) {
            game = 'oldschool';
        }

        let cache = findCache(rev, openrs2, match, lang, game);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match} ${lang} ${game}`;
        }

        return cache;
    });

    f.get('/parse', async (req, reply) => {
        const { openrs2 = -1, match = 0, lang = 'en' } = req.query;
        let { rev = -1, game = 'runescape' } = req.query;

        if (rev === -1 && openrs2 === -1) {
            reply.code(400);
            return 'Either rev or openrs2 must be specified';
        }

        if (rev !== -1 && rev < 234) {
            game = 'oldschool';
        }

        let cache = findCache(rev, openrs2, match, lang, game);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match} ${lang} ${game}`;
        }

        let js5 = new Js5MasterIndex(cache);

        for (let i = 0; i < js5.indexes.length; i++) {
            await js5.indexes[i].load();
        }

        return js5;
    });

    next();
}
