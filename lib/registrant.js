const tools = require('./tools.js');
var ProtoBuf = require("protobufjs");

function Registrant (provider, registryAddress) {
  if (provider) {
    this.registry = provider.getRegistry(registryAddress);
    this.address = provider.getAddress();
    this.web3 = provider.getWeb3();
  }
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



Registrant.prototype.createThing = function (dataObject) {
  var schemaIndex = 1;
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registry.schemas.call(schemaIndex, function(error, proto) {
      if (error) {
        reject(error);
      }
      var builder = ProtoBuf.loadJson(ProtoBuf.DotProto.Parser.parse(proto));
      var Thing = builder.build("Thing");
      var data = new Thing(dataObject);
      identities = [];
      for (id in data.identities) {
        identities.push('0x' + data.identities[id].pubKey.toString('hex'));
      }
      if (identities.length == 0)
        reject('error, no identities supplied.');
      var slices = tools.slice(data.encodeHex());
      self.registry.create(schemaIndex, slices, identities, {from: self.address}, function(err, data) {
        if (err) {
          reject(err);
        }
        fulfill(data);
      });
    });
  });
}

Registrant.prototype.setValid = function (identity, isValid) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registry.setValid(identity, isValid, {from: self.address}, function(err, data) {
      if (err) {
        reject(err);
      }
      fulfill(data);
    });
  });
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
      var Thing = builder.build("Thing");

      var schemaIndezes = [];
      var slicesLength = [];
      var slicesArray = [];
      var references = [];
      for (var i = 0; i < list.length; i++) {
        schemaIndezes.push(schemaIndex);
        var ids = new Thing(list[i].identities);
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


module.exports = Registrant;