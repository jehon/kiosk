// Startup log

process.stdout.write(
  `${JSON.stringify(new Date())} - ${JSON.stringify(process.argv, null, 2)}`
);

import("./server/server.js");
