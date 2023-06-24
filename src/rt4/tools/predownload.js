import {} from 'dotenv/config.js';

import { extractFlatFiles, findCache } from '#rt4/util/OpenRS2.js';

await extractFlatFiles(findCache(930, -1, 1).id);
