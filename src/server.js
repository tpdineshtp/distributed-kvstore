const express = require('express')
const bodyParser = require('body-parser')
const Topology = require('./core/topology.js')

var Server = function(port, liveProcess) {
    var $this = this;
    var topology = null;

    app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    function initializeRoutes() {
        //to get value for the given key
        app.get('/s/key', function(req, res) {
            topology.get(req.query.key, function(value) {
                if (!value) {
                    res.status(400).send('Key Not Found');
                } else {
                    res.json(value);
                }
            });
        });

        //to post the key to kv store
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
            console.log("Listening to port: "+port)
            if (callback) callback();
        });
    };

    // Initialize the process - bind to the port
    this.bind(function() {
        topology = new Topology(app, port, liveProcess);
        initializeRoutes();
    });

    this.getApp = function() {
          return app;
    }
}

module.exports = Server;
