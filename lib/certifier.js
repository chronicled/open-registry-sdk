
const tools = require('./tools.js');

function Certifier (provider, registrarAddress) {
  if (provider) {
    this.registrar = provider.getRegistrar(registrarAddress);
    this.address = provider.getAddress();
    this.web3 = provider.getWeb3();
  }
}

Certifier.prototype.listActiveRegistrants = function () {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registrar.getRegistrants.call({from: self.address}, function(err, data) {
      if (err) {
        reject(err);
      }
      fulfill(data);
    });
  });
}

Certifier.prototype.addRegistrant = function (registrant, reference) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registrar.add(registrant, reference, {from: self.address}, function(err, data) {
      if (err) {
        reject(err);
      }
      fulfill(data);
    });
  });
}

Certifier.prototype.setActive = function (registrant, isActive, reference) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registrar.setActive(registrant, isActive, reference, {from: self.address}, function(err, data) {
      if (err) {
        reject(err);
      }
      fulfill(data);
    });
  });
}

module.exports = Certifier;