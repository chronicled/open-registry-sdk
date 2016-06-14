var ProtoBuf = require("protobufjs");

module.exports = {
  slice: function (bytes) {
    bytes = bytes.replace('0x','');
    var slices = [];
    while (bytes.length > 64) {
      slices.push('0x' + bytes.substring(0, 64));
      bytes = bytes.substring(64, bytes.length);
    }
    slices.push('0x' + bytes);
    return slices;
  },
  merge: function (bytes32Array) {
    var merged = '0x';
    for (var i = 0; i < bytes32Array.length; i++) {
      merged += bytes32Array[i].replace('0x','');
    }
    return merged;
  }
};