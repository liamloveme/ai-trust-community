require('dotenv').config();
const {cleanup} = require('../src/maintenance');
const {pool} = require('../src/db');
cleanup().then(result => console.log('[cleanup]',result)).catch(e=>{console.error('[cleanup] failed:',e.message);process.exitCode=1;}).finally(()=>pool.end());
