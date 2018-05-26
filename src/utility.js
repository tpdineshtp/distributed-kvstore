const request = require('request');
const sha1 = require('sha1');
const sprintf = require('sprintf').sprintf;

var Utility = {
    RequestTypes: {
        POST: "POST",
        GET: "GET",
        DELETE: "DELETE"
    },

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

    random: function(min, max) {
        return Math.floor((Math.random() * (max - min) % (max-min))) + min;
    },

    shuffle: function(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            if (Math.random() > 0.5) continue;

            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        tmp = []
        array.forEach(function(a) {tmp.push(a)})
        return tmp;
    },

    hashPort: function(port) {
        return port - 8080;
    },

    hashKey: function(key, max, maxReplicas) {

        var indexes = [];
        if (max < maxReplicas) {
            for(i = 0; i < max; i++) indexes.push(i);
        } else {
            var _hash = this.hash(sha1(key));
            for (i = 0; i < maxReplicas; i++) {
                indexes.push((_hash + i) % max);
            }
        }
        return indexes;
    },
}

module.exports = Utility;
