const Server = require("./server.js")
var port = parseInt(process.argv[2]), extProcess;

if (process.argv.length > 3) {
    extProcess = parseInt(process.argv[3])
}
console.log("Process spawned with port:"+port);

var server = new Server(port, extProcess)
