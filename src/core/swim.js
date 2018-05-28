const express = require('express')
const sprintf = require('sprintf').sprintf;
const Utility = require('../helpers/utility.js');

var SWIM = function(app, port, joincb) {
    var $this = this;

    this.app = app;
    this.port = port;
    this.joincb = joincb;

    this.list = {};

    var createListEntry = (heartbeat, timestamp, status) => {
        if (!status) status = "active";

        return {
            heartbeat: heartbeat,
            timestamp: timestamp,
            status: status
        };
    }

    this.addToList = (port, heartbeat) => {
        this.list[port] = createListEntry(heartbeat, Utility.getTimestamp());
        if (this.joincb) this.joincb(port);
    }

    this.updateMyHeartbeat = () => {
        this.list[this.port].heartbeat = Utility.getTimestamp();
    }

    this.init = () => {
        this.app.get('/m/JOINREQ', function (req, res) {

            var reqPort = parseInt(req.query.port);

            var heartbeat = parseInt(req.query.heartbeat);
            $this.addToList(reqPort, heartbeat)

            $this.updateMyHeartbeat();
            res.json({ list: $this.list });
        });

        this.app.post('/m/PING', function( req, res) {

            var list = req.body.list;
            $this.mergeList(list);

            $this.updateMyHeartbeat();
            res.json({list: $this.list})
        });

        this.app.post('/m/PINGREQ', function(req, res) {
            var list = req.body.list;
            $this.mergeList(list);

            var target = parseInt(req.query.target);
            $this.updateMyHeartbeat();
            $this.sendPing(res, target);
        });

        this.sendPing();
    }

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

    this.sendPing = (_res = null, receiverPort = 0) => {
        this.updateMyHeartbeat();

        if (receiverPort > 0) {
            Utility.send(
                receiverPort,
                "m/PING?port=" +this.port,
                "POST",
                { list: $this.list },
                function (resp, body) {
                    if (_res != null) {
                        return _res.json({list: $this.list, ack: true});
                    }

                    try {
                        $this.mergeList(JSON.parse(body)["list"]);
                        receiverPort = 0;
                    } catch (ex) {
                    }
                });
        }
    }

    this.sendJoinReq = (receiverPort) => {

        Utility.send(
            receiverPort,
            "m/JOINREQ",
            "GET",
            sprintf("port=%d&heartbeat=%s", this.port, Utility.getTimestamp()),
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
    console.log(sprintf("SWIM list initialized for #%d", this.port));
};

module.exports = SWIM;
