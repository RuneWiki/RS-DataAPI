import {} from 'dotenv/config.js';

import { extractFlatFiles, findCache } from '#rsdata/util/OpenRS2.js';

await extractFlatFiles(findCache(727).id);
