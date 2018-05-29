var assert = require('assert'),
    chai = require('chai'),
    chaiHttp = require('chai-http'),
    should = require('chai').should(),
    request = require('request'),
    Server = require("../src/server.js");


chai.use(chaiHttp)
var server = new Server(8080, null)

describe('Server', function() {
    it ('Should return status 200 for a given key', function() {
        chai.request(server.getApp())
        .get('/d/read?key=key1')
        .end((err, res) => {
            res.should.have.status(200);
        });
    });
});
