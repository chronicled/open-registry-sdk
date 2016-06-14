const tools = require('./tools.js');
var ProtoBuf = require("protobufjs");

function Registrant (provider, registryAddress) {
  if (provider) {
    this.registry = provider.getRegistry(registryAddress);
    this.address = provider.getAddress();
    this.web3 = provider.getWeb3();
  }
}

Registrant.prototype.createMany = function (list) {
  var schemaIndex = 1;
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registry.schemas.call(schemaIndex, function(error, proto) {
      if (error) {
        reject(error);
      }
      var builder = ProtoBuf.loadJson(ProtoBuf.DotProto.Parser.parse(proto));
      var Identities = builder.build("Identities");

      var schemaIndezes = [];
      var slicesLength = [];
      var slicesArray = [];
      var references = [];
      for (var i = 0; i < list.length; i++) {
        schemaIndezes.push(schemaIndex);
        var ids = new Identities(list[i].identities);
        var slices = tools.slice(ids.encodeHex());
        slicesLength.push(slices.length);
        slicesArray = slicesArray.concat(slices);
        references.push(list[i].reference);
      }

      self.registry.createMany(schemaIndezes, slicesLength, slicesArray, references, {from: self.address}, function(err, data) {
        if (err) {
          reject(err);
        }
        fulfill(data);
      });

    });
  });
}

Registrant.prototype.createAsset = function (identities, reference) {
  var schemaIndex = 1;
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registry.schemas.call(schemaIndex, function(error, proto) {
      if (error) {
        reject(error);
      }
      var builder = ProtoBuf.loadJson(ProtoBuf.DotProto.Parser.parse(proto));
      var Identities = builder.build("Identities");
      var ids = new Identities(identities);
      var slices = tools.slice(ids.encodeHex());
      self.registry.create(schemaIndex, slices, reference, {from: self.address}, function(err, data) {
        if (err) {
          reject(err);
        }
        fulfill(data);
      });
    });
  });
}

Registrant.prototype.getAsset = function (reference) {
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

module.exports = Registrant;