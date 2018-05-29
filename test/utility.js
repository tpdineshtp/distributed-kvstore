const assert = require('assert'),
      Utility = require('../src/helpers/utility.js');

describe('correctness of getTimestamp', function() {
    var t1 = (new Date()).getTime();
    it('should return current timestamp', function() {
        var t2 = Utility.getTimestamp();
        var t3 = (new Date()).getTime();

        assert.ok(t2 >= t1);
        assert.ok(t3 >= t2);
    });
});
