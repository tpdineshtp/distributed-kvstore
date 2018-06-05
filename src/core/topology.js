const express = require('express')
const SWIM = require('./swim.js')
const KVstore = require('../models/store.js')
const Utility = require('../helpers/utility.js')

var Topology = function(app, port, introducer = null) {
    this.port = port;
    this.kvstore = new KVstore()

    var $this = this;
    var id = Utility.getId(this.port);
    var list = [id];
    var listPortMapping = {};
    listPortMapping[id] = this.port;


    var joinStabalisation = (joinPort, retryCount = 0) => {
        console.log("[SIN] Stabalisation (+ve): ", joinPort)
        var joinPortId = Utility.getId(joinPort);
        listPortMapping[joinPortId] = joinPort;

        list.push(joinPortId);
    }

    var churnStabalisation = (chrunPort, retryCount = 0) => {
        console.log("[SIN] Stabalisation (-ve): ", chrunPort)
        var chrunPortId = Utility.getId(chrunPort);
        const index = list.indexOf(chrunPortId);
        list.splice(index, 1);
    }

    this.swim = new SWIM(app, port, joinStabalisation, churnStabalisation);
    if (introducer) {
        this.swim.sendJoinReq(introducer);
    }

    this.app = app;
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
              Utility.send(
                  port,
                  "d/write",
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
