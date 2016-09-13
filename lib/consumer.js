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

var builder = ProtoBuf.loadJson(require('../schemas/registrant.proto.json'));
var Registrant = builder.build('Registrant').Registrant;
builder = ProtoBuf.loadJson(require('../schemas/schema.proto.json'));
var Schema = builder.build('Schema').Schema;

/**
 * Instantiates ConsumerSdk.
 * @constructor
 * @param {Provider} provider to communicate with blockchain.
 * @returns {Consumer} sdk that uses specified provider to communicate with blockchain.
 */
function Consumer(provider) {
  this.registry = provider.getRegistry();
  this.registrar = provider.getRegistrar();
  this.registrarAddress = provider.registrarAddress;
  this.registryAddress = provider.registryAddress;
  this.web3 = provider.getWeb3();
  this.address = provider.getAddress();
  this.provider = provider;
}

/**
 * Get registrar address from the Registrar contract.
 * @function
 * @returns {Promise} that resolves with ethereum account address that have registrar rights.
 */
Consumer.prototype.getRegistrar = function() {
  return this.registrar.registrarAsync({from: this.address});
};

/**
 * Get registrant information from Registrar contract.
 * @function
 * @param {string} address of the ethereum account of the registrant.
 * @returns {Promise} that resolves with info about registrant as it is on blockchain at the moment.
 */
Consumer.prototype.getRegistrant = function(address) {
  var self = this;
  return self.registrar.registrantIndexAsync(address, {from: self.address}).then(function(index) {
    return self.getRegistrantbyIndex(index);
  });
};

/**
 * Decode raw registrant data into object.
 * @function
 * @param {string} registrantData is raw registrant data string.
 * @returns {Object} decoded data.
 */
Consumer.prototype.decodeRegistrant = function(registrantData) {
  if (registrantData.slice(0, 2) == '0x') {
    registrantData = registrantData.slice(2);
  }
  return Registrant.decodeHex(registrantData);
};

/**
 * Get Registrar contract address linked to the Registry contract.
 * @function
 * @returns {Promise} that resolves with linked Registrar contract address.
 */
Consumer.prototype.getRegistrarAddressOnRegistry = function() {
  return this.registry.registrarAddressAsync({from: this.address});
};

/**
 * Get Thing data from the blockchain.
 * @function
 * @param {string} identity of the Thing in URN format.
 * @returns {Promise} that resolves with info about requested thing as it is on blockchain at the moment.
 */
Consumer.prototype.getThing = function(identity) {
  var self = this;
  return Promise.try(function() {
    return OrUtils.urn.packer.encodeAndChunk(OrUtils.common.compressAll(identity));
  }).then(function(encodedIdentity) {
    return self.registry.getThingAsync(encodedIdentity, {from: self.address});
  }).then(function(data) {
    var encodedIdentities = data[0];
    if (encodedIdentities.length == 0) {
      throw('Thing is not existing');
    }

    var identities = OrUtils.urn.packer.decode(encodedIdentities);
    var dataSlices = data[1];
    var schema = data[3];
    var owner = data[4];
    var isValid = data[5];

    if (!isValid) {
      throw('Error: record marked as invalid.');
    }

    if (schema.slice(0, 2) == '0x') {
      schema = schema.slice(2);
    }
    var builder = ProtoBuf.loadProto(Schema.decodeHex(schema).get('definition'));
    // var builder = ProtoBuf.loadJson(ProtoBuf.DotProto.Parser.parse(schema));
    var Thing = builder.build('Thing');
    var merged = OrUtils.bytes32Array.merge(dataSlices);

    var decoded = '';
    try {
      decoded = Thing.decodeHex(merged.replace('0x', ''));
    }
    catch(e) {
      decoded = Thing.decodeHex(merged.replace('0x', '').slice(0, -2));
    }

    return {
      identities: OrUtils.common.compressAll(identities),
      data: decoded,
      owner: owner,
      isValid: isValid
    };
  });
};

/**
 * Get decoded Thing schema structure from the blockchain by index.
 * @function
 * @param {number} index of the schema starting from 1.
 * @returns {Promise} that resolves with decoded thing schema as it is on blockchain at the moment.
 */
Consumer.prototype.getSchema = function(index) {
  return this.registry.schemasAsync(index, {from: this.address}).then(function(proto) {
    if (proto.slice(0, 2) == '0x') {
      proto = proto.slice(2);
    }
    return Schema.decodeHex(proto);
  });
};

/**
 * Get all decoded Thing schemas from the blockchain.
 * @function
 * @returns {Promise} that resolves with all decoded thing schemas as it is on blockchain at the moment.
 */
Consumer.prototype.getSchemas = function() {
  var self = this;
  return self.registry.getSchemasLenghtAsync({from: self.address}).then(function(length) {
    var promises = [];
    for (var i = 1; i < length; i++) {
      promises.push(self.getSchema(i));
    }
    return Promise.all(promises);
  });
};

/**
 * Get registrant information by index from Registrar contract.
 * @function
 * @param {number} index of the registrant.
 * @returns {Promise} that resolves with info about registrant as it is on blockchain at the moment.
 */
Consumer.prototype.getRegistrantbyIndex = function(index) {
  var self = this;
  return self.registrar.registrantsAsync(index).then(function(data) {
    data[1] = self.decodeRegistrant(data[1]);
    return data;
  });
};

/**
 * Verify identity against signed message. Only EC secp256r1 (NIST P-256) and RSA signatures are supported at the moment.
 * @function
 * @param {string} identityURN — public key in URN format to be verified.
 * @param {string} message that have been signed.
 * @param {string} signature for the message recieved from the Thing.
 * @returns {boolean} true if identity matches signature, false otherwise.
 */
Consumer.prototype.verifyIdentity = function(identityURN, message, signature) {
  var verifier;
  switch (OrUtils.urn.split(identityURN).subCats[0]) {
    case 'ec':
      verifier = OrUtils.ec;
      break;
    case 'rsa':
      verifier = OrUtils.rsa;
      break;
    default:
      console.error('Do not know how to verify: ' + identityURN);
      return false;
  }
  return verifier.verify(identityURN, message, signature);
};

/**
 * Get events emitted by Registry contract.
 * @function
 * @param {number} fromBlock at which block to start looking for the events.
 * @returns {Promise} that resolves with an array of events sorted from new to old, and decoded identities.
 */
Consumer.prototype.getThingsEvents = function(fromBlock, toBlock) {
  toBlock = toBlock || 'latest';
  var filter = Promise.promisifyAll(this.registry.allEvents({fromBlock: fromBlock, toBlock: toBlock}));
  return filter.getAsync().then(function(events) {
    var filteredEvents = events.filter(function(event) {
      return event.event !== 'Error';
    });
    var sortedEvents = sortEvents(filteredEvents);
    return sortedEvents.map(function(event) {
      event.args.identities = OrUtils.common.compressAll(OrUtils.urn.packer.decode(event.args.ids));
      return event;
    });
  }).finally(function() {
    filter.stopWatching();
  });
};

/**
 * Get Things from Registry contract.
 * @function
 * @param {boolean} onlyValid filter things by validity.
 * @param {number} fromBlock at which block to start looking for the events.
 * @param {function} [finalCallback] callback that will be called with Things array.
 * @returns {Promise} that resolves with an array of Things.
 */
Consumer.prototype.getThings = function(onlyValid, fromBlock, finalCallback) {
  if (!fromBlock) {
    fromBlock = 1;
  }
  return this.getThingsEvents(fromBlock).then(function(events) {
    var i;

    var created = events.filter(function(event) {
      return event.event === 'Created';
    });
    if (onlyValid) {
      console.warn('Deleted Things are not taken into account');
      var valid = [];
      var updated = events.filter(function(event) {
        return event.event === 'Updated';
      });
      for (i = 0; i < created.length; i++) {
        valid[created[i].args.owner] = created[i];
      }
      for (i = 0; i < updated.length; i++) {
        if (!updated[i].args.isValid && valid[updated[i].args.owner]) {
          delete valid[updated[i].args.owner];
        }
        else if (updated[i].args.isValid && !valid[updated[i].args.owner]) {
          valid[updated[i].args.owner] = updated[i];
        }
      }
      for (i = 0; i < created.length; i++) {
        if (!valid[created[i].args.owner]) {
          created.splice(i, 1);
          i--;
        }
      }
    }
    if (finalCallback) {
      finalCallback(created);
    }
    return created;
  });
};

/**
 * Get events emitted by Registrar contract.
 * @function
 * @param {number} fromBlock at which block to start looking for the events.
 * @returns {Promise} that resolves with an array of events sorted from new to old, and decoded data.
 */
Consumer.prototype.getRegistrantsEvents = function(fromBlock) {
  var self = this;
  var filter = Promise.promisifyAll(self.registrar.allEvents({fromBlock: fromBlock}));
  return filter.getAsync().then(function(events) {
    var filteredEvents = events.filter(function(event) {
      return event.event !== 'Error';
    });
    var sortedEvents = sortEvents(filteredEvents);
    return sortedEvents.map(function(event) {
      event.args.data = self.decodeRegistrant(event.args.data);
      return event;
    });
  }).finally(function() {
    filter.stopWatching();
  });
};

/**
 * Get Registrants from Registrar contract.
 * @function
 * @param {boolean} onlyActives get only active or all.
 * @param {number} fromBlock at which block to start looking for the events.
 * @param {function} [finalCallback] callback that will be called with Registrants array.
 * @returns {Promise} that resolves with an array of Registrants.
 */
Consumer.prototype.getRegistrants = function(onlyActives, fromBlock, finalCallback) {
  if (!fromBlock) {
    fromBlock = 1;
  }
  return this.getRegistrantsEvents(fromBlock).then(function(events) {
    var i;
    var created = events.filter(function(event) {
      return event.event === 'Created';
    });
    if (onlyActives) {
      var actives = [];
      var updated = events.filter(function(event) {
        return event.event === 'Updated';
      });
      for (i = 0; i < created.length; i++) {
        actives[created[i].args.registrant] = created[i];
      }
      for (i = 0; i < updated.length; i++) {
        if (!updated[i].args.isActive && actives[updated[i].args.registrant]) {
          delete actives[updated[i].args.registrant];
        }
        else if (updated[i].args.isActive && !actives[updated[i].args.registrant]) {
          actives[updated[i].args.registrant] = updated[i];
        }
      }
      for (i = 0; i < created.length; i++) {
        if (!actives[created[i].args.registrant]) {
          created.splice(i, 1);
          i--;
        }
      }
    }
    if (finalCallback) {
      finalCallback(created);
    }
    return created;
  });
};

function sortEvents(events) {
  return events.sort(function(a, b) {
    if (b.blockNumber == a.blockNumber) {
      if (b.transactionIndex == a.transactionIndex) {
        return b.logIndex - a.logIndex;
      }
      return b.transactionIndex - a.transactionIndex;
    }
    return b.blockNumber - a.blockNumber;
  });
}

module.exports = Consumer;
