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
var builder = ProtoBuf.loadJson(require('../schemas/schema.proto.json'));
var Schema = builder.build('Schema').Schema;

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
 * @param {Object} Thing information object that is going to be added. Should complement the specified schema.
 * @param {number} schemaIndex of one of the Protocol Buffers schemas stored in Registry contract.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Thing object is of template: { identities: '', data: { name: '', description: '' }};
 * @note Sends transaction, costs Ether.
 */
Registrant.prototype.createThing = function(thing, schemaIndex) {
  if (!schemaIndex) {
    schemaIndex = 1;
  }
  var self = this;
  return self.registry.schemasAsync(schemaIndex, {from: self.address}).then(function(protoBufferSchema) {
    if (protoBufferSchema.slice(0, 2) == '0x') {
      protoBufferSchema = protoBufferSchema.slice(2);
    }
    var builder = ProtoBuf.loadProto(Schema.decodeHex(protoBufferSchema).get('definition'));
    var Thing = builder.build("Thing");
    var dataProto = new Thing(thing.data);
    var dataChunks = OrUtils.bytes32Array.slice(dataProto.encodeHex());

    if (thing.identities.length == 0){
      throw('Error, no identities supplied.');
    }
    // if (!OrUtils.urn.check(thing.identities)) {
    //   throw('Error, identities format is invalid. Details: https://github.com/chronicled/open-registry-ethereum/wiki');
    // }
    var encodedIdentities = OrUtils.urn.packer.encodeAndChunk(OrUtils.common.compressAll(thing.identities));

    return self.registry.createThingAsync(encodedIdentities, dataChunks, schemaIndex, {from: self.address});
  });
};

/**
 * Publish many Things on the blockchain.
 * @function
 * @param {Object[]} Things that are going to be added. Should be an array of Things and complement the specified schema.
 * @param {number} schemaIndex of one of the Protocol Buffers schemas stored in Registry contract.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Things object is of template: [{ identities: '', data: { name: '', description: '' }}, ...];
 * @note Same schemaIndex will be used for all the items.
 * @note Sends transaction, costs Ether.
 */
Registrant.prototype.createThings = function(things, schemaIndex) {
  if (!schemaIndex){
    schemaIndex = 1;
  }
  var self = this;
  return self.registry.schemasAsync(schemaIndex, {from: self.address}).then(function(protoBufferSchema) {
    if (protoBufferSchema.slice(0, 2) == '0x') {
      protoBufferSchema = protoBufferSchema.slice(2);
    }
    // Pack data into chunked hex bytes32 packets using ProtoBuffer
    var builder = ProtoBuf.loadProto(Schema.decodeHex(protoBufferSchema).get('definition'));
    var Thing = builder.build("Thing");

    var idsChunks = [];
    var idsPerThing = [];
    var dataLength = [];
    var dataChunks = [];

    for (var index in things) {
      var thing = things[index];
      if (!OrUtils.urn.check(thing.identities)) {
        throw ('Error, identities format is invalid. Details: https://github.com/chronicled/open-registry-ethereum/#urn-specification . Identities: ' + thing.identities.join(', '));
      }
      idsPerThing.push(thing.identities.length);
      var encodedIdentities = OrUtils.urn.packer.encodeAndChunk(OrUtils.common.compressAll(thing.identities));
      idsChunks = idsChunks.concat(encodedIdentities);

      var chunks = OrUtils.bytes32Array.slice((new Thing(thing.data)).encodeHex());
      dataChunks = dataChunks.concat(chunks);
      dataLength.push(chunks.length);
    }

    return self.registry.createThingsAsync(idsChunks, idsPerThing, dataChunks, dataLength, schemaIndex, {from: self.address, gas: 4500000});
  });
};

/**
 * Update existing Thing data on the blockchain.
 * @function
 * @param {string} identity in URN format of the Thing to be updated.
 * @param {Object} data of the Thing to be replaced by.
 * @param {number} schemaIndex of one of the Protocol Buffers schemas stored in Registry contract.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Data object is of template: { name: '', description: '' };
 * @note Sends transaction, costs Ether.
 */
Registrant.prototype.updateThingData = function(identity, data, schemaIndex) {
  if (!schemaIndex){
    schemaIndex = 1;
  }
  var self = this;
  return self.registry.schemasAsync(schemaIndex, {from: self.address}).then(function(protoBufferSchema) {
    if (protoBufferSchema.slice(0, 2) == '0x') {
      protoBufferSchema = protoBufferSchema.slice(2);
    }
    var builder = ProtoBuf.loadProto(Schema.decodeHex(protoBufferSchema).get('definition'));
    var Thing = builder.build("Thing");
    var dataProto = new Thing(data);
    var dataChunks = OrUtils.bytes32Array.slice(dataProto.encodeHex());

    var encodedIdentity = OrUtils.urn.packer.encodeAndChunk(OrUtils.common.compressAll(identity));

    return self.registry.updateThingDataAsync(encodedIdentity, dataChunks, schemaIndex, {from: self.address});
  });
};

/**
 * Add identities to the existing Thing on the blockchain.
 * @function
 * @param {string} identity in the URN format of the Thing to be updated.
 * @param {string[]} newIdentities to be added to the Thing.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Sends transaction, costs Ether.
 */
Registrant.prototype.addIdentities = function(identity, newIdentities) {
  var self = this;
  return Promise.try(function() {
    var encodedIdentity = OrUtils.urn.packer.encodeAndChunk(OrUtils.common.compressAll(identity));
    if (!OrUtils.urn.check(newIdentities)) {
      throw ('Error, identities format is invalid. Details: https://github.com/chronicled/open-registry-ethereum/wiki . Identities: ' + newIdentities.join(', '));
    }
    var encodedNewIdentities = OrUtils.urn.packer.encodeAndChunk(OrUtils.common.compressAll(newIdentities));

    return self.registry.addIdentitiesAsync(encodedIdentity, encodedNewIdentities, {from: self.address});
  });
};

/**
 * Set validity of the existing Thing on the blockchain.
 * @function
 * @param {string} identity, in URN format, of the Thing to be updated.
 * @param {boolean} isValid thing validity value to be replaced by.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Sends transaction, costs Ether.
 */
Registrant.prototype.setThingValid = function(identity, isValid) {
  var self = this;
  return Promise.try(function() {
    var encodedIdentity = OrUtils.urn.packer.encodeAndChunk(OrUtils.common.compressAll(identity));
    return self.registry.setThingValidAsync(encodedIdentity, isValid, {from: self.address});
  });
};

/**
 * Get result of the blockchain operation / transaction.
 * @function
 * @param {string} transactionHash that was returned by one of the "write" functions.
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
  var checkTx = function() {
    return web3.eth.getTransactionReceiptAsync(txHash);
  };
  return checkTx().catch(function() {
    return Promise.delay(100).then(checkTx);
  });
}

module.exports = Registrant;
