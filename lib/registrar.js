var Promise = require('es6-promise').Promise;
var ProtoBuf = require('protobufjs');

var builder = ProtoBuf.loadJson(require('../schemas/registrant.proto.json'));
var Registrant = builder.build('Registrant').Registrant;
builder = ProtoBuf.loadJson(require('../schemas/schema.proto.json'));
var Schema = builder.build('Schema').Schema;

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

Registrar.prototype.addRegistrant = function(registrant, data) {
  var self = this;
  var regData = new Registrant({
    name: data.name,
    description: data.description,
    contact: data.contact,
    website: data.website,
    legalName: data.legalName,
    legalAddress: data.address
  });
  return new Promise(function(fulfill, reject) {
    self.registrar.add(registrant, regData.encodeHex(), {from: self.address, gas: 2000000}, function(err, tx) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      fulfill(tx);
    });
  });
};

Registrar.prototype.editRegistrant = function(registrant, data, isActive) {
  var self = this;
  var regData = new Registrant({
    name: data.name,
    description: data.description,
    contact: data.contact,
    website: data.website,
    legalName: data.legalName,
    legalAddress: data.address
  });
  return new Promise(function(fulfill, reject) {
    self.registrar.edit(registrant, regData.encodeHex(), isActive, {from: self.address, gas: 2000000}, function(err, tx) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      fulfill(tx);
    });
  });
};

Registrar.prototype.setRegistrar = function(registrarAddress) {
  if (!this.registry) {
    return Promise.reject('no registry contract address provided to constructor');
  }

  var self = this;
  return new Promise(function(fulfill, reject) {
    self.registry.configure(registrarAddress, {from: self.address, gas: 2000000}, function(err, tx) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      fulfill(tx);
    });
  });
};

Registrar.prototype.createSchema = function(schema) {
  if (!this.registry) {
    return Promise.reject('no registry contract address provided to constructor');
  }
  var self = this;
  var schemaData = new Schema({
    name: schema.name,
    description: schema.description,
    definition: schema.definition
  });

  return new Promise(function(fulfill, reject) {
    self.registry.createSchema(schemaData.encodeHex(), {from: self.address, gas: 2000000}, function(err, tx) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      fulfill(tx);
    });
  });
};

module.exports = Registrar;
