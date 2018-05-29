var assert = require('assert'),
    chai = require('chai'),
    chaiHttp = require('chai-http'),
    should = require('chai').should(),
    express = require('express'),
    request = require('request'),
    bodyParser = require('body-parser'),
    SWIM = require('../src/core/swim.js'),
    Utility = require('../src/helpers/utility.js');

var app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var membership = new SWIM(app, 8080);

describe('Should return heartbeat values correctly', function() {
    var t1 = Utility.getTimestamp();

    it ('Should have heartbeat >= t1', function() {
        membership.updateMyHeartbeat()
        assert.ok(membership.list[8080].heartbeat >= t1);
    });
});
