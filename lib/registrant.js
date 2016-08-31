// Copyright 2016 Chronicled
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var ProtoBuf = require('protobufjs');
var OrUtils = require('open-registry-utils');
var Promise = require('bluebird');

/**
 * Instantiates RegistrantSdk.
 * @constructor
 * @param {Provider} provider to communicate with blockchain.
 * @returns {Consumer} sdk that uses specified provider to communicate with blockchain.
 */
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

/**
 * Publish Thing on the blockchain.
 * @function
 * @param {Object} thing that is going to be added. Should complement the specified schema.
 * @param {number} [schemaIndex=0] of the protobuf schema in Registry contract.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Thing object is of template: { identities: '', data: { name: '', description: '' }};
 * @note Sends transaction, costs Ether.
 */
Registrant.prototype.createThing = function(thing, schemaIndex) {
  if (!schemaIndex) {
    schemaIndex = 0;
  }
  var self = this;
  return new Promise(function(fulfill, reject) {
    self.registry.schemas.call(schemaIndex, {from: self.address}, function(error, protoBufferSchema) {
      if (error) {
        console.error(error);
        reject(error);
        return;
      }

      var builder = ProtoBuf.loadProto(protoBufferSchema[2]);
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

/**
 * Publish many Things on the blockchain.
 * @function
 * @param {Object[]} things that is going to be added. Should be an array of Things and complement the specified schema.
 * @param {number} [schemaIndex=0] of the protobuf schema in Registry contract.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Things object is of template: [{ identities: '', data: { name: '', description: '' }}, ...];
 * @note Same schemaIndex will be used for all the items.
 * @note Sends transaction, costs Ether.
 */
Registrant.prototype.createThings = function(things, schemaIndex) {
  if (!schemaIndex){
    schemaIndex = 0;
  }
  var self = this;
  return new Promise(function(fulfill, reject) {
    self.registry.schemas.call(schemaIndex, {from: self.address}, function(error, protoBufferSchema) {
      if (error) {
        console.error(error);
        reject(error);
        return;
      }

      // Pack data into chunked hex bytes32 packets using ProtoBuffer
      var builder = ProtoBuf.loadProto(protoBufferSchema[2]);
      var Thing = builder.build("Thing");

      var idsChunks = [];
      var idsPerThing = [];
      var dataLength = [];
      var dataChunks = [];

      for (var index in things) {
        var thing = things[index];
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

      self.registry.createThings(idsChunks, idsPerThing, dataChunks, dataLength, schemaIndex, {from: self.address, gas: 4500000}, function(err, data) {
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

/**
 * Update existing Thing data on the blockchain.
 * @function
 * @param {string} identity of the thing to update.
 * @param {Object} data of the thing to put.
 * @param {number} [schemaIndex=0] of the protobuf schema in Registry contract.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Data object is of template: { name: '', description: '' };
 * @note Sends transaction, costs Ether.
 */
Registrant.prototype.updateThingData = function(identity, data, schemaIndex) {
  if (!schemaIndex){
    schemaIndex = 0;
  }
  var self = this;
  return new Promise(function(fulfill, reject) {
    self.registry.schemas.call(schemaIndex, {from: self.address}, function(error, protoBufferSchema) {
      if (error) {
        console.error(error);
        reject(error);
        return;
      }

      var builder = ProtoBuf.loadProto(protoBufferSchema[2]);
      var Thing = builder.build("Thing");
      var dataProto = new Thing(data);
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

/**
 * Add identities to the existing Thing on the blockchain.
 * @function
 * @param {string} identity of the thing to update.
 * @param {string[]} newIdentities to be added to the thing.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Sends transaction, costs Ether.
 */
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

/**
 * Set validity of the existing Thing on the blockchain.
 * @function
 * @param {string} identity of the thing to update.
 * @param {boolean} isValid thing validity to put.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Sends transaction, costs Ether.
 */
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

/**
 * Add new Thing schema to the Registry on the blockchain.
 * @function
 * @param {Object} schema that will be added.
 * @param {Object} testThingData to try to build Thing with new schema.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Schema object is of template: { name: '', description: '', definition: '' };
 * @note Sends transaction, costs Ether.
 */
Registrant.prototype.createSchema = function(schema, testThingData) {
  if (!this.registry) {
    return Promise.reject('no registry contract address provided to constructor');
  }
  var self = this;
  return new Promise(function(fulfill, reject) {
    self.registry.standardSchema.call({from: self.address}, function(error, protoBufferSchema) {
      if (error) {
        console.error(error);
        reject(error);
        return;
      }
      try {
        var builder = ProtoBuf.loadProto(protoBufferSchema[2] + schema.definition);
        var Thing = builder.build("Thing");
        new Thing(testThingData);
      }
      catch (exception) {
        reject(exception);
        return;
      }
      fulfill();
    });
  }).then(function() {
    return new Promise(function(fulfill, reject) {
      self.registry.createSchema(schema.name, schema.description, schema.definition, {from: self.address, gas: 2000000}, function(err, tx) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        fulfill(tx);
      });
    });
  });
};

/**
 * Get result of the on blockchain operation.
 * @function
 * @param {string} transactionHash that was returned by one of the functions.
 * @returns {Promise} that resolves with true, or the error message strings array.
 */
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
