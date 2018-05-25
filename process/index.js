const sprintf = require("sprintf").sprintf;
const Server = require("./server.js")


var port = parseInt(process.argv[2]), introducer;

if (process.argv.length > 3) {
    introducer = parseInt(process.argv[3])
}

console.log(
    sprintf("Process spawned with port: %d introducer: %s",
    port, (introducer) ? introducer : "NONE"));

// Bind to port; and INIT
var server = new Server(port, introducer)
