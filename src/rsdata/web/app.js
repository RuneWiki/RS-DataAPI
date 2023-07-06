import { } from 'dotenv/config';
import path from 'path';

import fastify from 'fastify';
import ejs from 'ejs';
import mercurius from 'mercurius';

import { initHashes } from '#rsdata/enum/hashes.js';
import Js5MasterIndex from '#rsdata/util/Js5.js';
import { findCache } from '#rsdata/util/OpenRS2.js';
import ObjTypeList from '#rsdata/cache/ObjTypeList.js';

const app = fastify({
    logger: process.env.DEV_MODE == 1
});

if (process.env.RATE_LIMIT == 1 && process.env.DEV_MODE != 1) {
    await app.register(import('@fastify/rate-limit'), {
        max: 10,
        timeWindow: 1000 * 5
    });

    app.setNotFoundHandler({
        preHandler: app.rateLimit()
    }, function (req, reply) {
        reply.code(404).send('');
    });
} else {
    app.setNotFoundHandler(function (req, reply) {
        reply.code(404).send('');
    });
}

// ----

const schema = `
  scalar JSON

  type ConfigObjCount {
    obj: Int
    count: Int
  }

  type ConfigParam {
    key: Int
    value: JSON
  }

  type Obj {
    id: Int!
    model: Int
    name: String
    desc: String
    zoom2d: Int
    xan2d: Int
    yan2d: Int
    zan2d: Int
    xof2d: Int
    yof2d: Int
    stackable: Boolean
    cost: Int
    wearpos: Int
    wearpos2: Int
    wearpos3: Int
    members: Boolean
    stacksize: Int
    manwear: Int
    manwearOffsetX: Int
    manwearOffsetY: Int
    manwearOffsetZ: Int
    manwear2: Int
    manwear3: Int
    manhead: Int
    manhead2: Int
    womanwear: Int
    womanwearOffsetX: Int
    womanwearOffsetY: Int
    womanwearOffsetZ: Int
    womanwear2: Int
    womanwear3: Int
    womanhead: Int
    womanhead2: Int
    ops: [String]
    iops: [String]
    recol_s: [Int]
    recol_d: [Int]
    retex_s: [Int]
    retex_d: [Int]
    shiftop: Int
    recol_p: [Int]
    tooltip: Int
    stockmarket: Boolean
    weight: Int
    category: Int
    dummyitem: Int
    certlink: Int
    certtemplate: Int
    countobj: [ConfigObjCount]
    resizex: Int
    resizey: Int
    resizez: Int
    ambient: Int
    contrast: Int
    team: Int
    lentlink: Int
    lenttemplate: Int
    cursor1: Int
    cursor1op: Int
    cursor2: Int
    cursor2op: Int
    cursor3: Int
    cursor3op: Int
    cursor4: Int
    cursor4op: Int
    quest: [Int]
    picksize: Int
    boughtlink: Int
    boughttemplate: Int
    placeholderlink: Int
    placeholdertemplate: Int
    params: [ConfigParam]
  }

  type ObjCategory {
    category: Int
    objs: [Obj]
  }

  type Query {
    obj(id: Int, rev: Int, openrs2: Int, match: Int, lang: String, game: String): [Obj]
    objs(filter: [String], rev: Int, openrs2: Int, match: Int, lang: String, game: String): [Obj]
    objsByCategory(category: Int, rev: Int, openrs2: Int, match: Int, lang: String, game: String): [ObjCategory]
  }
`;

const resolvers = {
    Query: {
        obj: async (_, { id, rev, openrs2, match, lang, game }) => {
            if (typeof id === 'undefined') {
                throw new Error('Query requires `id` filter, use objs for a full search instead');
            }

            if (!rev && !openrs2) {
                throw new Error('Cannot find a suitable cache: missing rev or openrs2 parameter');
            }

            let cache = findCache(rev, openrs2, match, lang, game);
            if (!cache) {
                throw new Error('Cannot find a suitable cache: no match found');
            }

            let js5 = new Js5MasterIndex(cache);
            let objTypes = new ObjTypeList(js5);

            let obj = await objTypes.get(id);

            return [
                obj
            ];
        },

        objs: async (_, { filter, rev, openrs2, match, lang, game }) => {
            if (!rev && !openrs2) {
                throw new Error('Cannot find a suitable cache: missing rev or openrs2 parameter');
            }

            let cache = findCache(rev, openrs2, match, lang, game);
            if (!cache) {
                throw new Error('Cannot find a suitable cache: no match found');
            }

            let js5 = new Js5MasterIndex(cache);
            let objTypes = new ObjTypeList(js5);

            await objTypes.load();

            if (filter) {
                let objs = objTypes.configs;

                for (let i = 0; i < filter.length; i++) {
                    let subject = filter[i];
                    if (subject.indexOf('=')) {
                        let [key, value] = subject.split('=');
                        objs = objs.filter(obj => obj[key] == value);
                    } else {
                        objs = objs.filter(obj => obj[subject]);
                    }
                }

                return objs;
            } else {
                return objTypes.configs;
            }
        },

        objsByCategory: async (_, { category, rev, openrs2, match, lang, game }) => {
            if (!rev && !openrs2) {
                throw new Error('Cannot find a suitable cache: missing rev or openrs2 parameter');
            }

            let cache = findCache(rev, openrs2, match, lang, game);
            if (!cache) {
                throw new Error('Cannot find a suitable cache: no match found');
            }

            let js5 = new Js5MasterIndex(cache);
            let objTypes = new ObjTypeList(js5);
            await objTypes.load();

            let categories = [];

            for (let i = 0; i < objTypes.count; i++) {
                let obj = await objTypes.get(i);
                if (typeof obj.category === 'undefined') {
                    continue;
                }

                if (typeof category !== 'undefined' && obj.category !== category) {
                    continue;
                }

                let index = categories.findIndex(x => x.category === obj.category);
                if (index === -1) {
                    categories.push({
                        category: obj.category,
                        objs: [obj]
                    });
                } else {
                    categories[index].objs.push(obj);
                }
            }

            categories.sort((a, b) => a.category - b.category);
            return categories;
        }
    }
};

app.register(mercurius, {
    schema,
    resolvers,
    graphiql: true
});

// ----

await app.register(import('@fastify/view'), {
    engine: {
        ejs
    }
});

await app.register(import('@fastify/formbody'));
await app.register(import('@fastify/multipart'));

await app.register(import('@fastify/autoload'), {
    dir: path.join(process.cwd(), 'src', 'rsdata', 'web', 'routes')
});

app.listen({ port: process.env.WEB_PORT, host: '0.0.0.0' }, () => {
    // non-dev mode initializes the hash list
    if (!process.env.DEV_MODE) {
        initHashes();
    }
});
