const express = require('express')
const Utility = require('../helpers/utility.js');
const Topology = require('./topology.js');

var SWIM = function(app, port, joincb, churncb,kvstore) {
    var $this = this;

    this.app = app;
    this.port = port;
    this.joincb = joincb;
    this.churncb = churncb;
    this.kvstore = kvstore;

    this.list = {};
    this.pinglist = [];

    //it will return each process's status and last stablization's timestamp.
    var createListEntry = (heartbeat, timestamp, status) => {
        if (!status) status ='active';

        return {
            heartbeat: heartbeat,
            timestamp: timestamp,
            status: status
        };
    }

    var getNextNodeToPing = () => {
        var receiverPort = 0;
        while (!receiverPort) {
        if (Object.keys($this.list).length <= 1) return 0;
        if ($this.pinglist.length == 0) {
            tmp = []
            Object.keys($this.list).forEach(function(key) {
                if (key != $this.port && $this.list[key].status == 'active')
                    tmp.push(key);
            });
            if (tmp.length == 0) return 0;
            $this.pinglist = Utility.shuffle(tmp);
        }
        var key = $this.pinglist.shift();
        if (key in $this.list && $this.list[key].status == 'active')
            receiverPort = key;
        }
        return parseInt(receiverPort);
    }

    // this.list has all active process and its details
    this.addToList = (port, heartbeat) => {
        this.list[port] = createListEntry(heartbeat, Utility.getTimestamp());
        if (this.joincb) this.joincb(port);
    }

    //routes for swim check
    this.init = () => {
        this.app.get('/m/JOINREQ', function (req, res) {

            var reqPort = parseInt(req.query.port);

            var heartbeat = parseInt(req.query.heartbeat);
            $this.addToList(reqPort, heartbeat)
            res.json({ list: $this.list,
                       kvstore: $this.kvstore.getStore()});
        });

        this.app.post('/m/PING', function( req, res) {

            var list = req.body.list;
            $this.mergeList(list);


            res.json({list: $this.list})
        });

        this.app.post('/m/PINGREQ', function(req, res) {
            var list = req.body.list;
            $this.mergeList(list);

            var target = parseInt(req.query.target);
            $this.sendPing(res, target);
        });

        this.sendPing();
    }

    this.mergeList = (newlist) => {
        Object.keys(newlist).forEach(function(port) {
            port = parseInt(port)

            if (!(port in $this.list)) {
                if (newlist[port].status == 'active') {
                    $this.addToList(port, newlist[port].heartbeat);
                }
            }
        });
    }

    this.sendPing = (_res = null, receiverPort = 0) => {

        if (receiverPort === 0) receiverPort = getNextNodeToPing();

        if (receiverPort > 0) {
            Utility.send(
                receiverPort,
                "m/PING?port=" +this.port,
                'POST',
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

        setTimeout(function() {
            $this.sendPingEnd(receiverPort);
        }, 2000);
    }

    this.sendJoinReq = (receiverPort) => {
        Utility.send(
            receiverPort,
            "m/JOINREQ",
            'GET',
            "port="+this.port+"&heartbeat="+Utility.getTimestamp(),
            function(resp, body) {
                try {
                    $this.mergeList(JSON.parse(body)["list"]);
                    obj = JSON.parse(body)["kvstore"];
                    var result=[];
                    Object.keys(obj).every((key)=> result.push(key));
                    for(var i =0;i<result.length;i++){
                      $this.kvstore.set(result[i], obj[result[i]].value);
                    }
                } catch (ex) {
                }
            });
    }

    this.sendPingEnd = (receiverPort) => {
        if (receiverPort != 0) {
            setTimeout(function() {
                if (!(receiverPort in $this.list)) return;

                delete $this.list[receiverPort];
                console.log("failed: %s", receiverPort)
                if ($this.churncb) $this.churncb(receiverPort);
            }, 2000);
        }
        this.sendPing();
    };

    this.list[this.port] = createListEntry(
        Utility.getTimestamp(), Utility.getTimestamp());

    this.init();
    console.log("SWIM list initialized for #"+ this.port);
};

module.exports = SWIM;
