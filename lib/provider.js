const Web3 = require('web3');
const ProviderEngine = require('web3-provider-engine');
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js');
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture.js');
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');
const VmSubprovider = require('web3-provider-engine/subproviders/vm.js');
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js');
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js');
const wallet = require('eth-lightwallet');

const pwDerivedKey = new Uint8Array([215,152,86,175,5,168,43,177,135,97,218,89,136,5,110,93,193,114,94,197,247,212,127,83,200,150,255,124,17,245,91,10]);

var registryAddress = '0xef52857da944b82902ec3bf79492a63b82ac69ba';
var registryABI = [{"constant":true,"inputs":[],"name":"registrarAddress","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":false,"inputs":[{"name":"_ids","type":"bytes32[]"},{"name":"_data","type":"bytes32[]"},{"name":"_schemaIndex","type":"uint88"}],"name":"createThing","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"_id","type":"bytes32[]"}],"name":"thingExist","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"schemas","outputs":[{"name":"","type":"string"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"idToThing","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32[]"},{"name":"_newIds","type":"bytes32[]"}],"name":"addIdentities","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_schema","type":"string"}],"name":"createSchema","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_registrarAddress","type":"address"}],"name":"configure","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_ids","type":"bytes32[]"},{"name":"_idsPerThing","type":"uint16[]"},{"name":"_data","type":"bytes32[]"},{"name":"_dataLength","type":"uint16[]"},{"name":"_schemaIndex","type":"uint88"}],"name":"createThings","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"_index","type":"uint256"}],"name":"getThingByIndexDEBUG","outputs":[{"name":"","type":"bytes32[]"},{"name":"","type":"bytes32[]"},{"name":"","type":"uint88"},{"name":"","type":"string"},{"name":"","type":"address"},{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32[]"},{"name":"_isValid","type":"bool"}],"name":"setThingValid","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32[]"},{"name":"_data","type":"bytes32[]"},{"name":"_schemaIndex","type":"uint88"}],"name":"updateThingData","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32[]"}],"name":"deleteThing","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"_id","type":"bytes32[]"}],"name":"getThing","outputs":[{"name":"","type":"bytes32[]"},{"name":"","type":"bytes32[]"},{"name":"","type":"uint88"},{"name":"","type":"string"},{"name":"","type":"address"},{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"things","outputs":[{"name":"ownerAddress","type":"address"},{"name":"schemaIndex","type":"uint88"},{"name":"isValid","type":"bool"}],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ids","type":"bytes32[]"},{"indexed":true,"name":"owner","type":"address"}],"name":"Created","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ids","type":"bytes32[]"},{"indexed":true,"name":"owner","type":"address"},{"indexed":false,"name":"isValid","type":"bool"}],"name":"Updated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ids","type":"bytes32[]"},{"indexed":true,"name":"owner","type":"address"}],"name":"Deleted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"code","type":"uint256"},{"indexed":false,"name":"reference","type":"bytes32[]"}],"name":"Error","type":"event"}];

var registrarAddress = '0x042e3e77c4a3a312c9683570902969ca711dc73e';
var registrarABI = [{"constant":true,"inputs":[],"name":"getRegistrants","outputs":[{"name":"","type":"address[]"}],"type":"function"},{"constant":true,"inputs":[{"name":"_registrant","type":"address"}],"name":"isActiveRegistrant","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"registrantIndex","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_registrant","type":"address"},{"name":"_data","type":"string"}],"name":"add","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"registrants","outputs":[{"name":"addr","type":"address"},{"name":"data","type":"string"},{"name":"active","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"certificationAuthority","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":false,"inputs":[{"name":"_ca","type":"address"}],"name":"setNextAuthority","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_registrant","type":"address"},{"name":"_data","type":"string"},{"name":"_active","type":"bool"}],"name":"edit","outputs":[{"name":"","type":"bool"}],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"registrant","type":"address"},{"indexed":false,"name":"authority","type":"address"},{"indexed":false,"name":"data","type":"string"}],"name":"Creation","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"registrant","type":"address"},{"indexed":false,"name":"authority","type":"address"},{"indexed":false,"name":"data","type":"string"},{"indexed":false,"name":"active","type":"bool"}],"name":"Update","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"code","type":"uint256"}],"name":"Error","type":"event"}];

var ConsumerSdk = require('./consumer.js');
var RegistrantSdk = require('./registrant.js');
var CertifierSdk = require('./certifier.js');

function extend(classA, classB) {
    for(var prop in classB.prototype) {
      classA.prototype[prop] = classB.prototype[prop];
    }
}

function Provider (rpcUrl, secretSeed, contracts, userType, finalCallback) {
  var engine = new ProviderEngine();
  var web3 = new Web3(engine);
  var self = this;

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
  engine.addProvider(new VmSubprovider());
  var addr = "";
  if (secretSeed) {
    var ks = new wallet.keystore(secretSeed, pwDerivedKey);
    ks.generateNewAddress(pwDerivedKey, 1);
    addr = '0x' + ks.getAddresses()[0];
    //console.log('Private: ', ks.exportPrivateKey(addr, pwDerivedKey));
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

        var tx = wallet.txutils.createContractTx(addr, txData);
        var signed = wallet.signing.signTx(ks, pwDerivedKey, tx.tx, addr);
        cb(null, signed);
      }
    }));
  }

  engine.addProvider(new RpcSubprovider({
    rpcUrl: rpcUrl,
  }));

  engine.on('error', function(err){
    console.error(err.stack)
});

  var firstBlock = true;
  engine.on('block', function(block){
    if (firstBlock){
      firstBlock = false;
      var sdk = null;
      switch (userType){
        case "consumer":
    			sdk = new ConsumerSdk(self);
    		break;
    		case "registrant":
          var Sdk = RegistrantSdk;
          extend(Sdk, ConsumerSdk);
          sdk = new Sdk(self);
    		break;
    		case "certifier":
          var Sdk = CertifierSdk;
          extend(Sdk, ConsumerSdk);
          extend(Sdk, RegistrantSdk);
          sdk = new Sdk(self);
    		break;
    	}
      finalCallback(sdk);
    }
  });

  engine.start();

  this.web3 = web3;
  this.address = addr;
  this.registryAddress = registryAddress;
  this.registrarAddress = registrarAddress;
  this.registryABI = registryABI;
  this.registrarABI = registrarABI;
  if (contracts){
    if (contracts.registryAddress)
      this.registryAddress = contracts.registryAddress;
    if (contracts.registryABI)
      this.registryABI = contracts.registryABI;
    if (contracts.registrarAddress)
      this.registrarAddress = contracts.registrarAddress;
    if (contracts.registrarABI)
      this.registrarABI = contracts.registrarABI;
  }
}

Provider.prototype.getRegistry = function () {
  return this.web3.eth.contract(this.registryABI).at(this.registryAddress);
}

Provider.prototype.getRegistrar = function () {
  return this.web3.eth.contract(this.registrarABI).at(this.registrarAddress);
}

Provider.prototype.getWeb3 = function () {
  return this.web3;
}

Provider.prototype.getAddress = function () {
  return this.address;
}

module.exports = Provider;
