var ProtoBuf = require("protobufjs");
var Promise = require('es6-promise').Promise;
var OrUtils = require('../../open-registry-utils');

var builder = ProtoBuf.loadJson(require('../schemas/schema.proto.json'));
var Schema = builder.build("Schema").Schema;


function Registrant (provider) {
  if (provider) {
    this.registrar = provider.getRegistrar();
    this.registry = provider.getRegistry();
    this.registrarAddress = provider.registrarAddress;
    this.registryAddress = provider.registryAddress;
    this.address = provider.getAddress();
    this.web3 = provider.getWeb3();
  }
}


Registrant.prototype.createThing = function (thing, schemaIndex) {
  if (!schemaIndex)
    schemaIndex = 1;
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registry.schemas.call(schemaIndex, {from: self.address}, function(error, protoBufferSchema) {
      if (error) {
        console.error(error);
        reject(error);
        return;
      }

      var builder = ProtoBuf.loadProto(Schema.decodeHex(protoBufferSchema).get('definition'));
      var Thing = builder.build("Thing");
      var dataProto = new Thing(thing.data);
      var dataChunks = OrUtils.bytes32Array.slice(dataProto.encodeHex());

      if (thing.identities.length == 0){
        console.error('Error, no identities supplied.');
        reject('Error, no identities supplied.');
      }
      var encodedIdentities = OrUtils.urn.packer.encodeAndChunk(thing.identities);

      self.registry.createThing(encodedIdentities, dataChunks, schemaIndex, {from: self.address, gas: 2000000}, function(err, data) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        fulfill(data);
      });
    });
  });
}

// Things is the array of Thing objects with 2 parameters: identities, data
// same schemaIndex will be used for all the items
Registrant.prototype.createThings = function (things, schemaIndex) {
  if (!schemaIndex)
    schemaIndex = 1;

  var self = this;
  return new Promise(function (fulfill, reject) {

    self.registry.schemas.call(schemaIndex, {from: self.address}, function(error, protoBufferSchema) {
      if (error) {
        console.error(error);
        reject(error);
        return;
      }

      if (protoBufferSchema.slice(0, 2) == '0x') {
        protoBufferSchema = protoBufferSchema.slice(2);
      }
      // Pack data into chunked hex bytes32 packets using ProtoBuffer
      // var schema = Schema.decodeHex(protoBufferSchema);
      var builder = ProtoBuf.loadProto(Schema.decodeHex(protoBufferSchema).get('definition'));
      var Thing = builder.build("Thing");

      var idsChunks = [];
      var idsPerThing = [];
      var dataLength = [];
      var dataChunks = [];

      things.forEach(function(thing) {
        idsPerThing.push(thing.identities.length);
        var encodedIdentities = OrUtils.urn.packer.encodeAndChunk(thing.identities);
        idsChunks = idsChunks.concat(encodedIdentities);

        var chunks = OrUtils.bytes32Array.slice((new Thing(thing.data)).encodeHex());
        dataChunks = dataChunks.concat(chunks);
        dataLength.push(chunks.length);
      });

      self.registry.createThings(idsChunks, idsPerThing, dataChunks, dataLength, schemaIndex, {from: self.address, gas: 2000000}, function(err, data) {
        if (err) {
          console.error(err);
          reject(err);
        }
        fulfill(data);
      });
    });
  });
};


Registrant.prototype.updateThingData = function (identity, data, schemaIndex) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registry.schemas.call(schemaIndex, {from: self.address}, function(error, protoBufferSchema) {
      if (error) {
        console.error(error);
        reject(error);
        return;
      }


      // Pack data into chunked hex bytes32 packets using ProtoBuffer
      // var schema = Schema.decodeHex(protoBufferSchema);
      var builder = ProtoBuf.loadProto(protoBufferSchema);
      var Thing = builder.build("Thing");
      var dataProto = new Thing(data);
      var dataChunks = OrUtils.bytes32Array.slice(dataProto.encodeHex());

      var encodedIdentity = OrUtils.urn.packer.encodeAndChunk(identity);

      self.registry.updateThingData(encodedIdentity, dataChunks, schemaIndex, {from: self.address, gas: 2000000}, function(err, data) {
        if (err) {
          console.error(err);
          reject(err);
        }
        fulfill(data);
      });
    });
  });
};


Registrant.prototype.addIdentities = function (identity, newIdentities) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    var encodedIdentity = OrUtils.urn.packer.encodeAndChunk(identity);
    var encodedNewIdentities = OrUtils.urn.packer.encodeAndChunk(newIdentities);

    self.registry.addIdentities(encodedIdentity, encodedNewIdentities, {from: self.address, gas: 2000000}, function(err, data) {
      if (err) {
        console.error(err);
        reject(err);
      }
      fulfill(data);
    });
  });
};


Registrant.prototype.setThingValid = function (identity, isValid) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    var encodedIdentity = OrUtils.urn.packer.encodeAndChunk(identity);

    self.registry.setThingValid(encodedIdentity, isValid, {from: self.address, gas: 2000000}, function(err, data) {
      if (err) {
        console.error(err);
        reject(err);
      }
      fulfill(data);
    });
  });
};


module.exports = Registrant;
