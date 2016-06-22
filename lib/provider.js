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
const registryAbi = [{"constant":true,"inputs":[],"name":"registrarAddress","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"schemas","outputs":[{"name":"","type":"string"}],"type":"function"},{"constant":false,"inputs":[{"name":"_schemaIndex","type":"uint256"},{"name":"_data","type":"bytes32[]"},{"name":"_identities","type":"bytes32[]"}],"name":"create","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"_identity","type":"bytes32"}],"name":"getThing","outputs":[{"name":"","type":"string"},{"name":"","type":"bytes32[]"},{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_schema","type":"string"}],"name":"addSchema","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_registrarAddress","type":"address"}],"name":"configure","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_identity","type":"bytes32"},{"name":"_isValid","type":"bool"}],"name":"setValid","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"identities","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_schemaIndex","type":"uint256"},{"name":"_data","type":"bytes32[]"},{"name":"_idLength","type":"uint8[]"},{"name":"_identities","type":"bytes32[]"}],"name":"createMany","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"_identities","type":"bytes32[]"}],"name":"checkIdentities","outputs":[{"name":"isFound","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_pos","type":"uint256"},{"name":"_identity","type":"bytes32"}],"name":"linkIdentity","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"things","outputs":[{"name":"ownerAddress","type":"address"},{"name":"schemaReference","type":"uint256"},{"name":"isValid","type":"bool"}],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"identity","type":"bytes32"},{"indexed":true,"name":"owner","type":"address"},{"indexed":false,"name":"position","type":"uint256"}],"name":"Creation","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"identity","type":"bytes32"},{"indexed":true,"name":"owner","type":"address"},{"indexed":false,"name":"isValid","type":"bool"},{"indexed":false,"name":"position","type":"uint256"}],"name":"Alternation","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"code","type":"uint256"},{"indexed":false,"name":"reference","type":"bytes32"}],"name":"Error","type":"event"}];
const registrarAbi = [{"constant":true,"inputs":[],"name":"getRegistrants","outputs":[{"name":"","type":"address[]"}],"type":"function"},{"constant":true,"inputs":[{"name":"_registrant","type":"address"}],"name":"isActiveRegistrant","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"registrantIndex","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_registrant","type":"address"},{"name":"_reference","type":"string"}],"name":"add","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"registrants","outputs":[{"name":"addr","type":"address"},{"name":"reference","type":"string"},{"name":"isActive","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"registry","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":false,"inputs":[{"name":"_registrant","type":"address"},{"name":"_isActive","type":"bool"},{"name":"_reference","type":"string"}],"name":"setActive","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"certificationAuthority","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":false,"inputs":[{"name":"_ca","type":"address"}],"name":"setNextAuthority","outputs":[{"name":"","type":"bool"}],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"registrant","type":"address"},{"indexed":false,"name":"authority","type":"address"},{"indexed":false,"name":"reference","type":"string"}],"name":"Creation","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"registrant","type":"address"},{"indexed":false,"name":"authority","type":"address"},{"indexed":false,"name":"isActive","type":"bool"},{"indexed":false,"name":"reference","type":"string"}],"name":"Alternation","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"code","type":"uint256"}],"name":"Error","type":"event"}];

function Provider (rpcUrl, secretSeed) {
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

  // filters 
  engine.addProvider(new FilterSubprovider())

  // pending nonce
  engine.addProvider(new NonceSubprovider());

  // vm
  //engine.addProvider(new VmSubprovider());

  if (secretSeed) {
    var ks = new wallet.keystore(secretSeed, pwDerivedKey);
    ks.generateNewAddress(pwDerivedKey, 1);
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
        var tx = wallet.txutils.createContractTx(addr, txData);
        var signed = wallet.signing.signTx(ks, pwDerivedKey, tx.tx, addr);
        cb(null, signed);
      }
    }));
  }

  engine.addProvider(new RpcSubprovider({
    rpcUrl: rpcUrl,
  }));
  engine.start();

  this.web3 = web3;
  this.address = addr;
}

Provider.prototype.getRegistry = function (registryAddress) {
  return this.web3.eth.contract(registryAbi).at(registryAddress);
}

Provider.prototype.getRegistrar = function (registrarAddress) {
  return this.web3.eth.contract(registrarAbi).at(registrarAddress);
}

Provider.prototype.getWeb3 = function () {
  return this.web3;
}

Provider.prototype.getAddress = function () {
  return this.address;
}

module.exports = Provider;
