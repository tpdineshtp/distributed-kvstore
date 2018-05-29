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
    this.app.get('/d/read', (req, res) => {
        var key = req.query.key;
        console.log("READ: "+ key);

        res.json({value: $this.kvstore.get(key)});
    })

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
        var indexes = Utility.hashKey(key, list.length);
        var responses = [];

        var responseCallback = () => {
            if (responses.length != indexes.length) return;
            var val = null;
            responses.forEach((response) => {
                if (response != null && response.value != null) {
                    val = response;
                }
            });
            if(val){
              callback(val.value);
            }
            else {
              callback(val);
            }
        }

        indexes.forEach((index) => {
            var port = listPortMapping[list[index]];
            if (port == $this.port) {
                responses.push({
                    value: $this.kvstore.get(key),
                    by: port
                });
                responseCallback();
            } else {
                var url = "http://localhost:"+port+"/d/read";
                Utility.send(
                    url,
                    "GET",
                    "key="+key,
                    function(resp, body) {
                        try {
                            responses.push({
                                value: JSON.parse(body).value,
                                by: port
                            });
                        } catch (ex) {
                            responses.push(null);
                        }
                        responseCallback();
                    }, function(err) {
                        responses.push(null);
                        responseCallback();
                    }
                );
            }
        });
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
