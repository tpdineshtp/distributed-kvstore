const request = require('request');
const sha1 = require('sha1');

var Utility = {
    send: function(url, type, object, callback, errcallback) {

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

    // method to get current timestamp
    getTimestamp: function() {
        return (new Date()).getTime();
    },

    // Method to calculate hash count of any key
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

    //returns unique id from the given port number.
    //assume we always use ports greater than 8080
    getId: function(port) {
        return port - 8080;
    },

    //returns the current processes
    hashKey: function(key, max) {
        var indexes = [];
        for(i = 0; i < max; i++) indexes.push(i);
        return indexes;
    },
}

module.exports = Utility;
