
// Startup log

const fs = require('fs');
const path = require('path');
const os = require('os');

fs.writeFileSync(path.join(os.homedir(), 'kiosk-startup-cmd.log'), `
started
${JSON.stringify(new Date())}

${JSON.stringify(process.argv, null, 2)}
`);

import('./server/server.js');
