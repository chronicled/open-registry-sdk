const tools = require('./tools.js');
var ProtoBuf = require("protobufjs");

function Consumer (provider, registryAddress) {
  this.registry = provider.getRegistry(registryAddress);
}

Consumer.prototype.getAsset = function (reference) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registry.getAsset.call(reference, function(err, data) {
      if (err) {
        reject(err);
      }
      var schema = data[0];
      var identities = data[1];
      var isValid = data[2];
      if (!isValid) {
        reject('Error: record marked as invalid.');
      }
      var builder = ProtoBuf.loadJson(ProtoBuf.DotProto.Parser.parse(schema));
      var Identities = builder.build("Identities");
      var merged = tools.merge(identities);
      var decoded = Identities.decodeHex(merged.replace('0x',''));
      fulfill(decoded);
    });
  });
}

module.exports = Consumer;