import Js5MasterIndex from '#rsdata/util/Js5.js';
import { findCache } from '#rsdata/util/OpenRS2.js';

export default function (f, opts, next) {
    f.get(`/:archive/:group`, async (req, reply) => {
        const { archive, group } = req.params;
        const { rev = -1, openrs2 = -1, match = 0 } = req.query;

        let cache = findCache(rev, openrs2, match);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match}`;
        }

        let js5 = new Js5MasterIndex(cache.id);
        js5.init();
        await js5.archives[archive].load();

        return js5.archives[archive].fileIds[group].length.toString();
    });

    f.get(`/:archive`, async (req, reply) => {
        const { archive } = req.params;
        const { rev = -1, openrs2 = -1, match = 0 } = req.query;

        let cache = findCache(rev, openrs2, match);
        if (!cache) {
            reply.code(404);
            return `Could not find cache for ${rev} ${openrs2} ${match}`;
        }

        let js5 = new Js5MasterIndex(cache.id);
        js5.init();
        await js5.archives[archive].load();

        return js5.archives[archive].capacity.toString();
    });

    next();
}