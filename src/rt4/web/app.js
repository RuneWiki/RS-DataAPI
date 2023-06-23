import {} from 'dotenv/config';
import path from 'path';

import Fastify from 'fastify';
import ejs from 'ejs';

import Autoload from '@fastify/autoload';
import FormBody from '@fastify/formbody';
import Static from '@fastify/static';
import View from '@fastify/view';
import Multipart from '@fastify/multipart';

const fastify = Fastify({
	logger: true
});

fastify.register(View, {
	engine: {
		ejs
	}
});

fastify.register(Static, {
	root: path.join(process.cwd(), 'public')
});

fastify.register(FormBody);
fastify.register(Multipart);

fastify.register(Autoload, {
	dir: path.join(process.cwd(), 'routes')
});

fastify.listen({ port: process.env.WEB_PORT, host: '0.0.0.0' });
