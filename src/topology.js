const express = require('express')
const sprintf = require('sprintf').sprintf;
const SWIM = require('./swim.js')
const Datastore = require('./datastore.js')
const Utility = require('./utility.js')

var Topology = function(app, port, liveProcess = null) {
    this.app = app;
    this.port = port;
    this.datastore = new Datastore()
    this.maxReplicas = 3;

    var $this = this;
    var id = Utility.hashPort(this.port);
    var list = [id];
    var listPortMapping = {};
    listPortMapping[id] = this.port;


    var joinProcess = (joinPort) => {
        console.log("Topology Initiated with: ", joinPort)
        var joinPortId = Utility.hashPort(joinPort);
        listPortMapping[joinPortId] = joinPort;
        list.push(joinPortId);
    }

    this.swim = new SWIM(app, port, joinProcess);
    if (liveProcess) {
        this.swim.sendJoinReq(liveProcess);
    }

    this.app.get('/d/read', (req, res) => {
        var key = req.query.key;
        console.log(sprintf("dREAD: %s", key));

        res.json({value: $this.datastore.get(key)});
    })

    this.app.post('/d/write', (req, res) => {
        var key = req.body.key;
        var value = req.body.value;
        var timestamp = req.body.timestamp;

        console.log(sprintf("dWRITE: %s, val: %s", key, value));

        try {
            $this.datastore.set(key, value, timestamp);
        } catch (ex) {
            console.log(ex);
        }
        res.json({ack: true});
    });

    this.get = (key, callback) => {
        var indexes = Utility.hashKey(key, list.length, this.maxReplicas);
        var responses = [];

        var responseCallback = () => {
            if (responses.length != indexes.length) return;

            var val = null, positiveCount = 0;
            responses.forEach((response) => {

                if (response != null && response.value != null) {
                    ++positiveCount;
                    val = response;
                }
            });
            callback(val.value);
        }

        indexes.forEach((index) => {
            var port = listPortMapping[list[index]];
            if (port == $this.port) {
                responses.push({
                    value: $this.datastore.get(key),
                    by: port
                });
                responseCallback();
            } else {
                Utility.send(
                    port,
                    "d/read",
                    Utility.RequestTypes.GET,
                    sprintf("key=%s", key),
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
        var indexes = Utility.hashKey(key, list.length, this.maxReplicas);
        var responses = [];

        var responseCallback = function() {
            if (responses.length != indexes.length) return;
            var positiveCount = 0;
            responses.forEach(function(response) {
                if (response) positiveCount++;
            });
            callback(null);
        }

        indexes.forEach(function(index) {
            var port = listPortMapping[list[index]];
            if (port == $this.port) {
                $this.datastore.set(key, value);
                responses.push(true);
                responseCallback();
            } else {
                Utility.send(
                    port,
                    "d/write",
                    "POST",
                    {key: key, value: value, timestamp: Utility.getTimestamp()},
                    function(resp, body) {
                        responses.push(true);
                        responseCallback();
                    }, function(err) {
                        responses.push(false);
                        responseCallback();
                    }
                );
            }
        });
    }
}

module.exports = Topology;
