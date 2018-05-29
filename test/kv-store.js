var assert = require('assert'),
    chai = require('chai'),
    KVstore = require("../src/models/store.js");

var kvstore = new KVstore();

describe('Key value store', function(){
  it ('Should set and get a value', function() {
      kvstore.set('abc', 'xyz')
      assert.equal(kvstore.get('abc').value, 'xyz');
  });
})
