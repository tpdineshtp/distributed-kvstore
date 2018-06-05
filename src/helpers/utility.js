const request = require('request');
const sha1 = require('sha1');

var Utility = {
    send: function(port, path, type, object, callback, errcallback) {

        var url = "http://localhost:"+port+"/"+path;
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

    // to shuffle ports, referred https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
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
