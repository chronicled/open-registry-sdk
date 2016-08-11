var ProtoBuf = require('protobufjs');
var Promise = require('es6-promise').Promise;
var OrUtils = require('../open-registry-utils');
var builder = ProtoBuf.loadJson(require('../schemas/schema.proto.json'));
var Schema = builder.build('Schema').Schema;
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
    this.provider = provider;
  }
}

Registrant.prototype.createThing = function(thing, schemaIndex) {
  if (!schemaIndex) {
    schemaIndex = 1;
  }
  var self = this;
  return new Promise(function(fulfill, reject) {
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
        return;
      }
      if (!OrUtils.urn.check(thing.identities)) {
        console.error('Error, identities format is invalid. Details: https://github.com/chronicled/open-registry-ethereum/wiki');
        reject('Error, identities format is invalid.');
        return;
      }
      var encodedIdentities = OrUtils.urn.packer.encodeAndChunk(OrUtils.common.compressAll(thing.identities));

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
};

// things is the array of Thing objects with 2 parameters: identities, data
// same schemaIndex will be used for all the items
Registrant.prototype.createThings = function(things, schemaIndex) {
  if (!schemaIndex){
    schemaIndex = 1;
  }
  var self = this;
  return new Promise(function(fulfill, reject) {
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

      for (var thing of things) {
        if (!OrUtils.urn.check(thing.identities)) {
          console.error('Error, identities format is invalid. Details: https://github.com/chronicled/open-registry-ethereum/wiki', thing.identities);
          reject('Error, identities format is invalid.');
          return;
        }
        idsPerThing.push(thing.identities.length);
        var encodedIdentities = OrUtils.urn.packer.encodeAndChunk(OrUtils.common.compressAll(thing.identities));
        idsChunks = idsChunks.concat(encodedIdentities);

        var chunks = OrUtils.bytes32Array.slice((new Thing(thing.data)).encodeHex());
        dataChunks = dataChunks.concat(chunks);
        dataLength.push(chunks.length);
      };

      self.registry.createThings(idsChunks, idsPerThing, dataChunks, dataLength, schemaIndex, {from: self.address, gas: 2000000}, function(err, data) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        fulfill(data);
      });
    });
  });
};

Registrant.prototype.updateThingData = function(identity, data, schemaIndex) {
  if (!schemaIndex){
    schemaIndex = 1;
  }
  var self = this;
  return new Promise(function(fulfill, reject) {
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

      var encodedIdentity = OrUtils.urn.packer.encodeAndChunk(OrUtils.common.compressAll(identity));

      self.registry.updateThingData(encodedIdentity, dataChunks, schemaIndex, {from: self.address, gas: 2000000}, function(err, data) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        fulfill(data);
      });
    });
  });
};

Registrant.prototype.addIdentities = function(identity, newIdentities) {
  var self = this;
  return new Promise(function(fulfill, reject) {
    var encodedIdentity = OrUtils.urn.packer.encodeAndChunk(OrUtils.common.compressAll(identity));
    if (!OrUtils.urn.check(newIdentities)) {
      console.error('Error, identities format is invalid. Details: https://github.com/chronicled/open-registry-ethereum/wiki', newIdentities);
      reject('Error, identities format is invalid.');
      return;
    }
    var encodedNewIdentities = OrUtils.urn.packer.encodeAndChunk(OrUtils.common.compressAll(newIdentities));

    self.registry.addIdentities(encodedIdentity, encodedNewIdentities, {from: self.address, gas: 2000000}, function(err, data) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      fulfill(data);
    });
  });
};

Registrant.prototype.setThingValid = function(identity, isValid) {
  var self = this;
  return new Promise(function(fulfill, reject) {
    var encodedIdentity = OrUtils.urn.packer.encodeAndChunk(OrUtils.common.compressAll(identity));
    self.registry.setThingValid(encodedIdentity, isValid, {from: self.address, gas: 2000000}, function(err, data) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      fulfill(data);
    });
  });
};

Registrant.prototype.getTransactionResult = function(transactionHash) {
  var self = this;
  return waitForTx(transactionHash, this.web3).then(function(transactionData) {
    var events = transactionData.logs.filter(function(log) {
      return log.address === self.registryAddress;
    });
    if (events.length == 0) {
      throw 'Transaction ran out of gas.';
    }
    var errors = events.filter(function(log) {
      return log.topics[0] === '0xe887de22eef9e399f405f7821ce61fcbe181b8acba1709d9b1360af087485401';
    });
    if (errors.length == 0) {
      return true;
    }
    var errorMessages = errors.map(function(log) {
      switch (self.web3.toDecimal(log.data.slice(0, 66))) {
        case 1: return 'Identity collision, already assigned to another Thing.';
        case 2: return 'Not found, identity does not exist.';
        case 3: return 'Unauthorized, modification only by owner.';
        case 4: return 'Unknown schema specified.';
        case 5: return 'Incorrect input, at least one identity is required.';
        case 6: return 'Incorrect input, data is required.';
        case 7: return 'Incorrect format of the identity, schema length and identity length cannot be empty.';
        case 8: return 'Incorrect format of the identity, identity must be padded with trailing 0s.';
      }
    });
    throw errorMessages;
  });
};

function waitForTx(txHash, web3) {
  function checkTX(resolve) {
    web3.eth.getTransactionReceipt(txHash, function(error, txData) {
      if (txData) {
        resolve(txData);
      } else {
        setTimeout(checkTX, 100, resolve);
      }
    });
  }
  return new Promise(function(resolve, _reject) {
    setTimeout(checkTX, 100, resolve);
  });
}

module.exports = Registrant;
