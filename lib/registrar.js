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
var Promise = require('bluebird');

var builder = ProtoBuf.loadJson(require('../schemas/registrant.proto.json'));
var Registrant = builder.build('Registrant').Registrant;
builder = ProtoBuf.loadJson(require('../schemas/schema.proto.json'));
var Schema = builder.build('Schema').Schema;

/**
 * Instantiates RegistrarSdk.
 * @constructor
 * @param {Provider} provider to communicate with blockchain.
 * @returns {Consumer} sdk that uses specified provider to communicate with blockchain.
 */
function Registrar(provider) {
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
 * Whitelist Registrant on the blockchain.
 * @function
 * @param {string} address of the Registrant's ethereum account.
 * @param {Object} data of the Registrant to submit.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Registrant data object is of template: { name: '', description: '', website: '', legalName: '', address: { street_1: '', street_2: '', city: '', state: '', zip: '', country: ''}};
 * @note Sends transaction, costs Ether.
 */
Registrar.prototype.addRegistrant = function(address, data) {
  var regData = new Registrant({
    name: data.name,
    description: data.description,
    website: data.website,
    legalName: data.legalName,
    legalAddress: data.address
  });
  return this.registrar.addAsync(address, '0x' + regData.encodeHex(), {from: this.address});
};

/**
 * Update existing Registrant on blockchain.
 * @function
 * @param {string} address of the ethereum account of the existing Registrant.
 * @param {Object} data of the Registrant to submit.
 * @param {boolean} isActive to activate/deactivate the Registrant.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Registrant data object is of template: { name: '', description: '', website: '', legalName: '', address: { street_1: '', street_2: '', city: '', state: '', zip: '', country: ''}};
 * @note Sends transaction, costs Ether.
 */
Registrar.prototype.editRegistrant = function(address, data, isActive) {
  var regData = new Registrant({
    name: data.name,
    description: data.description,
    website: data.website,
    legalName: data.legalName,
    legalAddress: data.address
  });
  return this.registrar.editAsync(address, '0x' + regData.encodeHex(), isActive, {from: this.address});
};

/**
 * Change registrar's address in the Registrar contract.
 * @function
 * @param {string} address of ethereum account of the new Registrar.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Sends transaction, costs Ether.
 */
Registrar.prototype.setRegistrar = function(registrarAddress) {
  if (!this.registry) {
    return Promise.reject('no registry contract address provided to constructor');
  }
  return this.registry.configureAsync(registrarAddress, {from: this.address});
};

/**
 * Add new schema for Thing's data to the Registry on blockchain.
 * @function
 * @param {Object} Protocol Buffers schema definition to be added.
 * @returns {Promise} that resolves with transaction hash of the operation.
 * @note Schema object is of template: { name: '', description: '', definition: '' };
 * @note Sends transaction, costs Ether.
 */
Registrar.prototype.createSchema = function(schema) {
  if (!this.registry) {
    return Promise.reject('no registry contract address provided to constructor');
  }
  var schemaData = new Schema({
    name: schema.name,
    description: schema.description,
    definition: schema.definition
  });
  return this.registry.createSchemaAsync('0x' + schemaData.encodeHex(), {from: this.address});
};

module.exports = Registrar;
