const tools = require('./tools.js');
var ProtoBuf = require("protobufjs");

function Consumer (provider, registryAddress) {
  this.registry = provider.getRegistry(registryAddress);
}

Registrant.prototype.getThing = function (identity) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registry.getThing.call(identity, function(err, data) {
      if (err) {
        reject(err);
      }
      var schema = data[0];
      var dataSlices = data[1];
      var isValid = data[2];
      if (!isValid) {
        reject('Error: record marked as invalid.');
      }
      var builder = ProtoBuf.loadJson(ProtoBuf.DotProto.Parser.parse(schema));
      var Thing = builder.build("Thing");
      var merged = tools.merge(dataSlices);
      var decoded = Thing.decodeHex(merged.replace('0x',''));
      fulfill(decoded);
    });
  });
}


Consumer.prototype.verifyIdentity = function (message, signature, reference) {
  this.getThing(reference).then(function(decoded){
    console.dir(decoded);
  });
}

module.exports = Consumer;