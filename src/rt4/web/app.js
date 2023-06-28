import { } from 'dotenv/config';
import path from 'path';

import Fastify from 'fastify';
import ejs from 'ejs';

import { initHashes } from '#rt4/enum/hashes.js';

const fastify = Fastify({
    logger: process.env.DEV_MODE == 1
});

if (process.env.RATE_LIMIT == 1 && process.env.DEV_MODE != 1) {
    await fastify.register(import('@fastify/rate-limit'), {
        max: 10,
        timeWindow: 1000 * 5
    });

    fastify.setNotFoundHandler({
        preHandler: fastify.rateLimit()
    }, function (req, reply) {
        reply.code(404).send('');
    });
}

await fastify.register(import('@fastify/view'), {
    engine: {
        ejs
    }
});

await fastify.register(import('@fastify/static'), {
    root: path.join(process.cwd(), 'public')
});

await fastify.register(import('@fastify/formbody'));
await fastify.register(import('@fastify/multipart'));

await fastify.register(import('@fastify/autoload'), {
    dir: path.join(process.cwd(), 'routes')
});

fastify.listen({ port: process.env.WEB_PORT, host: '0.0.0.0' }, () => {
    // non-dev mode initializes the hash list
    if (!process.env.DEV_MODE) {
        initHashes();
    }
});
