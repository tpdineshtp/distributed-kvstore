const Utility = require('../helpers/Utility.js')

var KVstore = function() {
    var store = {}

    // add an entry
    this.set = function(key, value, timestamp = null) {
        if (!timestamp) {
            timestamp = Utility.getTimestamp()
        } else {
            timestamp = parseInt(timestamp);
        }

        store[key] = {
            value: value,
            timestamp: timestamp
        }
    }
    
    // get the value for the input key
    this.get = function(key) {
        if (key in store) return store[key];
        return null;
    }
}

module.exports = KVstore;
