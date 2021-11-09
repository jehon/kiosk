
// Startup log

const fs = require('fs');
fs.writeFileSync('tmp/started.log', `
started
${JSON.stringify(new Date())}

${JSON.stringify(process.argv, null, 2)}
`);

import('./server/server.js');
