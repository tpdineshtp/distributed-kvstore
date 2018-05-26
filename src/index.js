const sprintf = require("sprintf").sprintf;
const Server = require("./server.js")


var port = parseInt(process.argv[2]), liveProcess;

if (process.argv.length > 3) {
    liveProcess = parseInt(process.argv[3])
}

console.log( sprintf("Process spawned with port: %d Existing Process: %s", port, (liveProcess) ? liveProcess : "NONE"));

var server = new Server(port, liveProcess)
