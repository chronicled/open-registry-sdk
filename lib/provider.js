const Web3 = require('web3');
const ProviderEngine = require('web3-provider-engine');
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js');
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture.js');
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');
// vm subprovider is poorly implemented, not fully-compatible with the geth, and breaks browser compatibility.
// const VmSubprovider = require('web3-provider-engine/subproviders/vm.js');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js');
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js');
const wallet = require('eth-lightwallet');

const pwDerivedKey = new Uint8Array([215,152,86,175,5,168,43,177,135,97,218,89,136,5,110,93,193,114,94,197,247,212,127,83,200,150,255,124,17,245,91,10]);

var registryAddress = '0x7a23e9b394d42bb56a2d578606774dc0ef385897';
var registryABI = [{"constant":true,"inputs":[],"name":"registrarAddress","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":false,"inputs":[{"name":"_ids","type":"bytes32[]"},{"name":"_data","type":"bytes32[]"},{"name":"_schemaIndex","type":"uint88"}],"name":"createThing","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"_id","type":"bytes32[]"}],"name":"thingExist","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"schemas","outputs":[{"name":"","type":"string"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"idToThing","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32[]"},{"name":"_newIds","type":"bytes32[]"}],"name":"addIdentities","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_schema","type":"string"}],"name":"createSchema","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_registrarAddress","type":"address"}],"name":"configure","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_ids","type":"bytes32[]"},{"name":"_idsPerThing","type":"uint16[]"},{"name":"_data","type":"bytes32[]"},{"name":"_dataLength","type":"uint16[]"},{"name":"_schemaIndex","type":"uint88"}],"name":"createThings","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32[]"},{"name":"_isValid","type":"bool"}],"name":"setThingValid","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32[]"},{"name":"_data","type":"bytes32[]"},{"name":"_schemaIndex","type":"uint88"}],"name":"updateThingData","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32[]"}],"name":"deleteThing","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"getSchemasLenght","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"_id","type":"bytes32[]"}],"name":"getThing","outputs":[{"name":"","type":"bytes32[]"},{"name":"","type":"bytes32[]"},{"name":"","type":"uint88"},{"name":"","type":"string"},{"name":"","type":"address"},{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"things","outputs":[{"name":"ownerAddress","type":"address"},{"name":"schemaIndex","type":"uint88"},{"name":"isValid","type":"bool"}],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ids","type":"bytes32[]"},{"indexed":true,"name":"owner","type":"address"}],"name":"Created","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ids","type":"bytes32[]"},{"indexed":true,"name":"owner","type":"address"},{"indexed":false,"name":"isValid","type":"bool"}],"name":"Updated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ids","type":"bytes32[]"},{"indexed":true,"name":"owner","type":"address"}],"name":"Deleted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"code","type":"uint256"},{"indexed":false,"name":"reference","type":"bytes32[]"}],"name":"Error","type":"event"}];

var registrarAddress = '0xf31fa6098e031f79179ef1569438b08c8878c4f4';
var registrarABI = [{"constant":true,"inputs":[],"name":"getRegistrants","outputs":[{"name":"","type":"address[]"}],"type":"function"},{"constant":true,"inputs":[{"name":"_registrant","type":"address"}],"name":"isActiveRegistrant","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"registrar","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"registrantIndex","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_registrant","type":"address"},{"name":"_data","type":"string"}],"name":"add","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"registrants","outputs":[{"name":"addr","type":"address"},{"name":"data","type":"string"},{"name":"active","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_registrant","type":"address"},{"name":"_data","type":"string"},{"name":"_active","type":"bool"}],"name":"edit","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_registrar","type":"address"}],"name":"setNextRegistrar","outputs":[{"name":"","type":"bool"}],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"registrant","type":"address"},{"indexed":false,"name":"registrar","type":"address"},{"indexed":false,"name":"data","type":"string"}],"name":"Created","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"registrant","type":"address"},{"indexed":false,"name":"registrar","type":"address"},{"indexed":false,"name":"data","type":"string"},{"indexed":false,"name":"active","type":"bool"}],"name":"Updated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"code","type":"uint256"}],"name":"Error","type":"event"}];

var ConsumerSdk = require('./consumer.js');
var RegistrantSdk = require('./registrant.js');
var RegistrarSdk = require('./registrar.js');

function extend(classA, classB) {
  for(var prop in classB.prototype) {
    classA.prototype[prop] = classB.prototype[prop];
  }
}

function Provider(rpcUrl, userType, secret, contracts, finalCallback) {
  var self = this;

  var engine = new ProviderEngine();
  var web3 = new Web3(engine);

  engine.addProvider(new FixtureSubprovider({
    web3_clientVersion: 'ProviderEngine/v0.0.0/javascript',
    net_listening: true,
    eth_hashrate: '0x00',
    eth_mining: false,
    eth_syncing: true,
  }));

  // cache layer
  engine.addProvider(new CacheSubprovider());

  // pending nonce
  engine.addProvider(new NonceSubprovider());

  // vm
  // engine.addProvider(new VmSubprovider());

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
        var paddedSeed = KeyStore._decryptString(this.encSeed, pwDerivedKey);
        if (paddedSeed.length > 0) {
          return true;
        }
        return false;
      };
      ks.addPriv(secret);
    }
    var addr = '0x' + ks.getAddresses()[0];

    engine.addProvider(new HookedWalletSubprovider({
      getAccounts: function(cb) {
        cb(null, [addr]);
      },
      approveTransaction: function(txParams, cb) {
        cb(null, true);
      },
      signTransaction: function(txData, cb) {
        txData.gasPrice = parseInt(txData.gasPrice, 16);
        txData.nonce = parseInt(txData.nonce, 16);
        txData.gasLimit = txData.gas;
        if (self.shims[txData.to]) {
          txData.to = self.shims[txData.to];
        }

        var tx = wallet.txutils.createContractTx(addr, txData);
        var signed = wallet.signing.signTx(ks, pwDerivedKey, tx.tx, addr);
        cb(null, signed);
      }
    }));
  }
  else {
    // Dummy address to be able to execute CALL requests
    var addr = '0x0000000000000000000000000000000000000001';
  }

  engine.addProvider(new RpcSubprovider({
    rpcUrl: rpcUrl || 'https://node.ambisafe.co',
  }));

  engine.on('error', function(err){
    console.error(err.stack)
  });

  // var firstBlock = true;
  // engine.on('block', function(block){
  //   if (firstBlock){
  //     firstBlock = false;
  //     instantiateSdk();
  //   }
  // });

  engine.start();

  this.web3 = web3;
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

  var sdkReady = this.instantiateSdk(userType || 'consumer');
  if (finalCallback) {
    finalCallback(sdkReady);
  }
  return sdkReady;
}

Provider.prototype.instantiateSdk = function(userType) {
  switch (userType) {
    case 'consumer':
      this.sdk = new ConsumerSdk(this);
    break;
    case 'registrant':
      var Sdk = RegistrantSdk;
      extend(Sdk, ConsumerSdk);
      this.sdk = new Sdk(this);
    break;
    case 'registrar':
      var Sdk = RegistrarSdk;
      extend(Sdk, ConsumerSdk);
      extend(Sdk, RegistrantSdk);
      this.sdk = new Sdk(this);
    break;
  }

  return this.sdk;
}

Provider.prototype.getRegistry = function() {
  return this.web3.eth.contract(this.registryABI).at(this.registryAddress);
}

Provider.prototype.getRegistrar = function() {
  return this.web3.eth.contract(this.registrarABI).at(this.registrarAddress);
}

Provider.prototype.getWeb3 = function() {
  return this.web3;
}

Provider.prototype.getAddress = function() {
  return this.address;
}

Provider.prototype.addShim = function(targetAddress, shimAddress) {
  this.shims[targetAddress] = shimAddress;
}

module.exports = Provider;
