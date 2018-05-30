const express = require('express')
const SWIM = require('./swim.js')
const KVstore = require('../models/store.js')
const Utility = require('../helpers/utility.js')

var Topology = function(app, port, extProcess = null) {
    this.port = port;

    var $this = this,
        id = Utility.getId(this.port),
        list = [id],
        listPortMapping = {};
    listPortMapping[id] = this.port;

    //to perform when a new member joins
    var joinProcess = (joinPort) => {
        var joinPortId = Utility.getId(joinPort);
        listPortMapping[joinPortId] = joinPort;
        list.push(joinPortId);
    }

    this.swim = new SWIM(app, port, joinProcess);
    if (extProcess) {
        this.swim.sendJoinReq(extProcess);
    }

    this.app = app;
    this.kvstore = new KVstore()

    this.app.post('/d/write', (req, res) => {
        var key = req.body.key;
        var value = req.body.value;
        var timestamp = req.body.timestamp;

        console.log("WRITE: "+key+", val: "+ value);

        try {
            $this.kvstore.set(key, value, timestamp);
        } catch (ex) {
            console.log(ex);
        }
        res.json({ack: true});
    });

    this.get = (key, callback) => {
        var responses = [];
        var responseCallback = () => {
            var val = null;
            responses.forEach((response) => {
                if (response != null && response.value != null) {
                    val = response;
                }
            });
            if(val){
              console.log("READ: "+ key);
              callback(val.value);
            }
            else {
              callback(val);
            }
        }

        responses.push({
            value: $this.kvstore.get(key),
            by: port
        });
        responseCallback();
    }

    this.set = (key, value, callback) => {
        var indexes = Utility.hashKey(key, list.length);
        var responses = [];

        indexes.forEach(function(index) {
            var port = listPortMapping[list[index]];
            if (port == $this.port) {
                $this.kvstore.set(key, value);
                responses.push(true);
                if (responses.length != indexes.length) return;
                callback(null);
            } else {
                var url = "http://localhost:"+port+"/d/write";
                Utility.send(
                    url,
                    "POST",
                    {key: key, value: value, timestamp: Utility.getTimestamp()},
                    function(resp, body) {
                        responses.push(true);
                        if (responses.length != indexes.length) return;
                        callback(null);
                    }, function(err) {
                        responses.push(false);
                        callback(null);
                    }
                );
            }
        });
    }
}

module.exports = Topology;
