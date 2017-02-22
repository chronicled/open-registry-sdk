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

var Promise = require('bluebird');
var Web3 = require('web3');
var ProviderEngine = require('web3-provider-engine');
var CacheSubprovider = require('web3-provider-engine/subproviders/cache.js');
var FixtureSubprovider = require('web3-provider-engine/subproviders/fixture.js');
// vm subprovider is poorly implemented, not fully-compatible with the geth, and breaks browser compatibility.
// var VmSubprovider = require('web3-provider-engine/subproviders/vm.js');
var RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');
var HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js');
var NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js');
var wallet = require('eth-lightwallet');

var ConsumerSdk = require('./consumer.js');
var RegistrantSdk = require('./registrant.js');
var RegistrarSdk = require('./registrar.js');

// Fix webpack bitcore error
delete global._bitcore;

/* global Uint8Array */
var pwDerivedKey = new Uint8Array([215,152,86,175,5,168,43,177,135,97,218,89,136,5,110,93,193,114,94,197,247,212,127,83,200,150,255,124,17,245,91,10]);

var registryAddress = '0x07315477a3f2887eeb4a1b6ac61e34850755d1ae';
var registryABI = [{"constant":true,"inputs":[],"name":"registrarAddress","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":false,"inputs":[{"name":"_ids","type":"bytes32[]"},{"name":"_data","type":"bytes32[]"},{"name":"_schemaIndex","type":"uint88"}],"name":"createThing","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"_id","type":"bytes32[]"}],"name":"thingExist","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"schemas","outputs":[{"name":"","type":"bytes"}],"type":"function"},{"constant":false,"inputs":[],"name":"discontinue","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"_schema","type":"bytes"}],"name":"createSchema","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"idToThing","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32[]"},{"name":"_newIds","type":"bytes32[]"}],"name":"addIdentities","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_registrarAddress","type":"address"}],"name":"configure","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_ids","type":"bytes32[]"},{"name":"_idsPerThing","type":"uint16[]"},{"name":"_data","type":"bytes32[]"},{"name":"_dataLength","type":"uint16[]"},{"name":"_schemaIndex","type":"uint88"}],"name":"createThings","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32[]"},{"name":"_isValid","type":"bool"}],"name":"setThingValid","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32[]"},{"name":"_data","type":"bytes32[]"},{"name":"_schemaIndex","type":"uint88"}],"name":"updateThingData","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32[]"}],"name":"deleteThing","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"getSchemasLenght","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"_id","type":"bytes32[]"}],"name":"getThing","outputs":[{"name":"","type":"bytes32[]"},{"name":"","type":"bytes32[]"},{"name":"","type":"uint88"},{"name":"","type":"bytes"},{"name":"","type":"address"},{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"things","outputs":[{"name":"ownerAddress","type":"address"},{"name":"schemaIndex","type":"uint88"},{"name":"isValid","type":"bool"}],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ids","type":"bytes32[]"},{"indexed":true,"name":"owner","type":"address"}],"name":"Created","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ids","type":"bytes32[]"},{"indexed":true,"name":"owner","type":"address"},{"indexed":false,"name":"isValid","type":"bool"}],"name":"Updated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ids","type":"bytes32[]"},{"indexed":true,"name":"owner","type":"address"}],"name":"Deleted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"code","type":"uint256"},{"indexed":false,"name":"reference","type":"bytes32[]"}],"name":"Error","type":"event"}];

var registrarAddress = '0xb98fdd97f3da105e6b166461afac208981bc786b';
var registrarABI = [{"constant":true,"inputs":[],"name":"getRegistrants","outputs":[{"name":"","type":"address[]"}],"type":"function"},{"constant":false,"inputs":[{"name":"_registrant","type":"address"},{"name":"_data","type":"bytes"}],"name":"add","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_registrant","type":"address"},{"name":"_data","type":"bytes"},{"name":"_active","type":"bool"}],"name":"edit","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"_registrant","type":"address"}],"name":"isActiveRegistrant","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[],"name":"discontinue","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"registrar","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"registrantIndex","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"registrants","outputs":[{"name":"addr","type":"address"},{"name":"data","type":"bytes"},{"name":"active","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_registrar","type":"address"}],"name":"setNextRegistrar","outputs":[{"name":"","type":"bool"}],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"registrant","type":"address"},{"indexed":false,"name":"registrar","type":"address"},{"indexed":false,"name":"data","type":"bytes"}],"name":"Created","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"registrant","type":"address"},{"indexed":false,"name":"registrar","type":"address"},{"indexed":false,"name":"data","type":"bytes"},{"indexed":false,"name":"active","type":"bool"}],"name":"Updated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"code","type":"uint256"}],"name":"Error","type":"event"}];

var gasLimit = 1400000;

function extend(child, parent) {
  for(var prop in parent.prototype) {
    child.prototype[prop] = parent.prototype[prop];
  }
}

/**
 * Instantiates Sdk.
 * @constructor
 * @param {string} [rpcUrl='https://node.ambisafe.co'] geth node url.
 * @param {string} [userType='consumer'] Open Registry role to construct. One of 'consumer', 'registrant' or 'registrar'.
 * @param {string} [secret] private key or mnemonic to sign transactions with. Required only for "write" operation for 'registrant' and 'registrar' roles.
 * @param {Object} [contracts] contract addresses and ABI, defaults to official contracts.
 * @param {function} [finalCallback] callback that will be called with SDK instance as the only parameter.
 * @returns {Sdk} that uses this provider to communicate with blockchain.
 */
function Provider(rpcUrl, userType, secret, contracts, params, finalCallback) {
  var self = this;

  var engine = new ProviderEngine();
  var web3 = new Web3(engine);
  var addr;

  engine.addProvider(new FixtureSubprovider({
    web3_clientVersion: 'ProviderEngine/v0.0.0/javascript',
    net_listening: true,
    eth_hashrate: '0x00',
    eth_mining: false,
    eth_syncing: true
  }));

  // cache layer
  engine.addProvider(new CacheSubprovider());

  // pending nonce
  engine.addProvider(new NonceSubprovider());

  // vm
  // engine.addProvider(new VmSubprovider());

  this.params = params || {};
  this.shims = {};

  if (secret) {
    var ks;
    if (secret && secret.length > 70) {
      ks = new wallet.keystore(secret, pwDerivedKey);
      ks.generateNewAddress(pwDerivedKey, 1);
    }
    else if (secret) {
      ks = new wallet.keystore();
      ks.addPriv = function(privkeyHex) {
        var privKey = new Buffer(privkeyHex.replace('0x', ''), 'hex');
        var encPrivKey = wallet.keystore._encryptKey(privKey, pwDerivedKey);
        var address = wallet.keystore._computeAddressFromPrivKey(privKey);
        this.ksData["m/0'/0'/0'"].encPrivKeys[address] = encPrivKey;
        this.ksData["m/0'/0'/0'"].addresses.push(address);
      };
      ks.isDerivedKeyCorrect = function(pwDerivedKey) {
        if (!this.encSeed)
          return true;

        /* global KeyStore */
        var paddedSeed = KeyStore._decryptString(this.encSeed, pwDerivedKey);
        if (paddedSeed.length > 0) {
          return true;
        }
        return false;
      };
      ks.addPriv(secret);
    }
    addr = '0x' + ks.getAddresses()[0];

    engine.addProvider(new HookedWalletSubprovider({
      getAccounts: function(cb) {
        cb(null, [addr]);
      },
      approveTransaction: function(txParams, cb) {
        cb(null, true);
      },
      signTransaction: function(txData, cb) {
        // Static gas price
        var gasPrice = self.params.gasPrice || self.web3.toWei(30, 'shannon');
        txData.gasPrice = '0x' + self.web3.toBigNumber(gasPrice).toString(16);   // txData.gasPrice = parseInt(txData.gasPrice, 16);
        txData.gasLimit = '0x' + self.web3.toBigNumber(gasLimit).toString(16);
        txData.nonce = parseInt(txData.nonce, 16);
        if (self.shims[txData.to]) {
          txData.to = self.shims[txData.to];
        }

        var tx = wallet.txutils.createContractTx(addr, txData);
        var signed = '0x' + wallet.signing.signTx(ks, pwDerivedKey, tx.tx, addr);
        cb(null, signed);
      }
    }));
  }
  else {
    // Dummy address to be able to execute CALL requests
    addr = '0x0000000000000000000000000000000000000001';
  }

  engine.addProvider(new RpcSubprovider({
    rpcUrl: rpcUrl || 'http://localhost:8545'
  }));

  engine.on('error', function(err){
    console.error(err.stack);
  });

  // var firstBlock = true;
  // engine.on('block', function(block){
  //   if (firstBlock){
  //     firstBlock = false;
  //     instantiateSdk();
  //   }
  // });

  engine.start();

  this.web3 = Promise.promisifyAll(web3);
  this.address = addr;
  this.registryAddress = registryAddress;
  this.registrarAddress = registrarAddress;
  this.registryABI = registryABI;
  this.registrarABI = registrarABI;
  if (contracts) {
    this.registryAddress = contracts.registryAddress || this.registryAddress;
    this.registryABI = contracts.registryABI || this.registryABI;
    this.registrarAddress = contracts.registrarAddress || this.registrarAddress;
    this.registrarABI = contracts.registrarABI || this.registrarABI;
  }

  this.instantiateSdk(userType || 'consumer');
  if (finalCallback) {
    finalCallback(this.sdk);
  }

  return this.sdk;
}

/**
 * Instantiates Sdk for specific user role.
 * @function
 * @param {string} userType Open Registry role to construct. One of 'consumer', 'registrant' or 'registrar'.
 * @returns {Sdk} that uses this provider to communicate with blockchain.
 */
Provider.prototype.instantiateSdk = function(userType) {
  var Sdk;

  switch (userType) {
    case 'consumer':
      this.sdk = new ConsumerSdk(this);
    break;
    case 'registrant':
      Sdk = RegistrantSdk;
      extend(Sdk, ConsumerSdk);
      this.sdk = new Sdk(this);
    break;
    case 'registrar':
      Sdk = RegistrarSdk;
      extend(Sdk, ConsumerSdk);
      extend(Sdk, RegistrantSdk);
      this.sdk = new Sdk(this);
    break;
  }

  return this.sdk;
};

/**
 * Get Registry contract instance.
 * @function
 * @returns {Contract} that allows interaction with Registry.
 */
Provider.prototype.getRegistry = function() {
  return Promise.promisifyAll(this.web3.eth.contract(this.registryABI).at(this.registryAddress));
};

/**
 * Get Registrar contract instance.
 * @function
 * @returns {Contract} that allows interaction with Registrar.
 */
Provider.prototype.getRegistrar = function() {
  return Promise.promisifyAll(this.web3.eth.contract(this.registrarABI).at(this.registrarAddress));
};

/**
 * Get web3 instance.
 * @function
 * @returns {Web3} that is using this provider to communicate with blockchain.
 */
Provider.prototype.getWeb3 = function() {
  return this.web3;
};

/**
 * Get ethereum account address.
 * @function
 * @returns {string} that is used to send transactions to blockchain.
 */
Provider.prototype.getAddress = function() {
  return this.address;
};

/**
 * Adds proxy contract to send transactions to instead of talking directly to Registry/Registrar.
 * @function
 * @param {string} targetAddress that needs to be proxied.
 * @param {string} shimAddress that will serve as proxy.
 */
Provider.prototype.addShim = function(targetAddress, shimAddress) {
  this.shims[targetAddress] = shimAddress;
};

module.exports = Provider;
