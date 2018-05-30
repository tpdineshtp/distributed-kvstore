const express = require('express')
const Utility = require('../helpers/utility.js');

var SWIM = function(app, port, joincb) {
    var $this = this;

    this.app = app;
    this.port = port;
    this.joincb = joincb;

    this.list = {};

    // returns the details to set heartbeat for each port
    var createListEntry = (heartbeat, timestamp, status) => {
        if (!status) status = "active";
        return {
            heartbeat: heartbeat,
            timestamp: timestamp,
            status: status
        };
    }

    // assigns hearbeat values for each port
    this.addToList = (port, heartbeat) => {
        this.list[port] = createListEntry(heartbeat, Utility.getTimestamp());
        if (this.joincb) this.joincb(port);
    }

    this.updateMyHeartbeat = () => {
        this.list[this.port].heartbeat = Utility.getTimestamp();
    }

    // Method to  initialize listeners
    this.init = () => {
        //to send join request
        this.app.get('/m/JOINREQ', function (req, res) {
            var reqPort = parseInt(req.query.port);
            var heartbeat = parseInt(req.query.heartbeat);
            $this.addToList(reqPort, heartbeat)

            $this.updateMyHeartbeat();
            res.json({ list: $this.list });
        });
    }

    // Helper method to merge an incoming membership list with
    // self membership list
    this.mergeList = (newlist) => {
        Object.keys(newlist).forEach(function(port) {
            port = parseInt(port)

            if (!(port in $this.list)) {
                if (newlist[port].status == "active") {
                    $this.addToList(port, newlist[port].heartbeat);
                }
            }
        });
    }

    // Method to send join request to a known process
    this.sendJoinReq = (receiverPort) => {
        var url = "http://localhost:"+receiverPort+"/m/JOINREQ";
        Utility.send(
            url,
            "GET",
            "port="+this.port+"&heartbeat="+Utility.getTimestamp(),
            function(resp, body) {
                try {
                    $this.mergeList(JSON.parse(body)["list"]);
                } catch (ex) {
                }
            });
    }

    this.list[this.port] = createListEntry(
        Utility.getTimestamp(), Utility.getTimestamp());

    this.init();
    console.log("SWIM list initialized for #"+ this.port);
};

module.exports = SWIM;
