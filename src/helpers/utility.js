const request = require('request');
const sha1 = require('sha1');
const sprintf = require('sprintf').sprintf;

var Utility = {
    send: function(port, path, type, object, callback, errcallback) {

        var url = sprintf("http://localhost:%d/%s", port, path);

        var requestCallback = (err, response, body) => {
            if (err && errcallback) errcallback(err);
            if (!err && callback) callback(response, body);
        }

        switch (type) {
            case "GET":
            url += '?' +object;
            request.get(url, requestCallback);
            break;

            case "POST":
            request.post(url, {form: object}, requestCallback);
            break;
        }
    },

    getTimestamp: function() {
        return (new Date()).getTime();
    },

    hash: function(key) {

        var hash = 0
        for (i = 0; i < key.length; i++) {
            if (key[i].charCodeAt(0) < 97) {
                hash += (key[i].charCodeAt(0) - 48);
            } else {
                hash += ((key[i].charCodeAt(0) - 97) + 10);
            }
        }
        return hash;
    },

    getId: function(port) {
        return port - 8080;
    },

    hashKey: function(key, max) {

        var indexes = [];
        for(i = 0; i < max; i++) indexes.push(i);
        return indexes;
    },
}

module.exports = Utility;
