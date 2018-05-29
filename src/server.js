const express = require('express')
const bodyParser = require('body-parser')
const sprintf = require('sprintf').sprintf;
const Topology = require('./core/topology.js')

var Server = function(port, liveProcess) {
    var $this = this;
    var topology = null;

    app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    function initializeListeners() {
        app.get('/s/key', function(req, res) {
            topology.get(req.query.key, function(value) {
                if (!value) {
                    res.status(400).send('Key Not Found');
                } else {
                    res.json(value);
                }
            });
        });

        app.post('/s/key', function(req, res) {
            topology.set(req.body.key, req.body.value, function(err) {
                if (err) {
                    res.status(400).send(err.message);
                } else {
                    res.status(200).send('OK');
                }
            })
        });
    }

    this.bind = function(callback) {
        app.listen(port, function () {
            console.log(sprintf("Listening to port: %d", port))
            if (callback) callback();
        });
    };

    this.bind(function() {
        topology = new Topology(app, port, liveProcess);
        initializeListeners();
    });

    this.getApp = function() {
          return app;
    }
}

module.exports = Server;
