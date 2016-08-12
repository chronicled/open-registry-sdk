var ProtoBuf = require('protobufjs');
var Promise = require('es6-promise').Promise;
var async = require('async');
var parser = require('json-parser');
var OrUtils = require('open-registry-utils');

var builder = ProtoBuf.loadJson(require('../schemas/registrant.proto.json'));
var Registrant = builder.build('Registrant').Registrant;
builder = ProtoBuf.loadJson(require('../schemas/schema.proto.json'));
var Schema = builder.build('Schema').Schema;

function Consumer(provider) {
  this.registry = provider.getRegistry();
  this.registrar = provider.getRegistrar();
  this.registrarAddress = provider.registrarAddress;
  this.registryAddress = provider.registryAddress;
  this.web3 = provider.getWeb3();
  this.address = provider.getAddress();
  this.provider = provider;
}

Consumer.prototype.getRegistrar = function() {
  var self = this;
  return new Promise(function(fulfill, reject) {
    self.registrar.registrar.call({from: self.address}, function(err, data) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      fulfill(data);
    });
  });
};

Consumer.prototype.getRegistrant = function(address) {
  var self = this;
  return new Promise(function(fulfill, reject) {
    self.registrar.registrantIndex.call(address, {from: self.address}, function(err, index) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      self.registrar.registrants.call(index, {from: self.address}, function(err, data) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        data[1] = self.decodeRegistrant(data[1]);
        fulfill(data);
      });
    });
  });
};

Consumer.prototype.decodeRegistrant = function(registrantData) {
  return Registrant.decodeHex(registrantData);
};

Consumer.prototype.getRegistrarAddressOnRegistry = function() {
  var self = this;
  return new Promise(function(fulfill, reject) {
    self.registry.registrarAddress.call({}, {from: self.address}, function(err, data) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      fulfill(data);
    });
  });
};

Consumer.prototype.getThing = function(identity) {
  var self = this;
  return new Promise(function(fulfill, reject) {
    var encodedIdentity = OrUtils.urn.packer.encodeAndChunk(OrUtils.common.compressAll(identity));
    self.registry.getThing.call(encodedIdentity, {from: self.address}, function(err, data) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      var encodedIdentities = data[0];
      if (encodedIdentities.length == 0) {
        reject('Thing is not existing');
        return;
      }

      var identities = OrUtils.urn.packer.decode(encodedIdentities);
      var dataSlices = data[1];
      var schemaIndex = data[2];
      var schema = data[3];
      var owner = data[4];
      var isValid = data[5];

      if (!isValid) {
        console.error('Error: record marked as invalid.');
        reject('Error: record marked as invalid.');
        return;
      }

      var builder = ProtoBuf.loadProto(Schema.decodeHex(schema).get('definition'));
      // var builder = ProtoBuf.loadJson(ProtoBuf.DotProto.Parser.parse(schema));
      var Thing = builder.build('Thing');
      var merged = OrUtils.bytes32Array.merge(dataSlices);
      var merged = OrUtils.bytes32Array.merge(dataSlices);

      var decoded = '';
      try {
        decoded = Thing.decodeHex(merged.replace('0x', ''));
      }
      catch(e) {
        decoded = Thing.decodeHex(merged.replace('0x', '').slice(0, -2));
      }

      fulfill({
        identities: OrUtils.common.compressAll(identities),
        data: decoded,
        owner: owner,
        isValid: isValid
      });
    });
  });
};


Consumer.prototype.getErrors = function(finalCallback) {
  var self = this;
  async.parallel([
    function(callback) {
      self.registry.Error({}, {fromBlock: 0}).get(function(err, errors) {
        if (err) {
          callback(err);
        }
        else {
          callback(null, errors);
        }
      });
    },
    function(callback) {
      self.registrar.Error({}, {fromBlock: 0}).get(function(err, errors) {
        if (err) {
          callback(err);
        }
        else {
          callback(null, errors);
        }
      });
    }
  ],
  function(err, results) {
    if (err) {
      console.error(err);
    }
    else {
      finalCallback(results);
    }
  });
};

Consumer.prototype.getSchema = function(index) {
  var self = this;
  return new Promise(function (fulfill, reject) {
      self.registry.schemas.call(index, {from: self.address}, function(error, proto) {
        if (error) {
            console.error(error);
            reject(error);
            return;
        }
        fulfill(Schema.decodeHex(proto));
    });
  });
};

Consumer.prototype.getSchemas = function() {
  var self = this;
  return new Promise(function(fulfill, reject) {
    self.registry.getSchemasLenght.call({from: self.address}, function(error, data) {
      if (error) {
        console.error(error)
        reject(error);
        return;
      }
      fulfill(data);
    });
  });
};

Consumer.prototype.getRegistrantbyIndex = function(index) {
  var self = this;
  return new Promise(function(fulfill, reject) {
    self.registrar.registrants.call(index, function(error, data) {
      if (error) {
        console.error(err);
        reject(error);
        return;
      }
      fulfill(data);
    });
  });
};

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
}

Consumer.prototype.getThingsEvents = function(fromBlock) {
  var self = this;
  return Promise.all([
    new Promise(function(resolve, reject) {
      var filter = self.registry.Created({}, {fromBlock: fromBlock});
      filter.get(function(err, creations) {
        filter.stopWatching();
        if (err) {
          reject(err);
          return;
        }
        resolve(creations);
      });
    }),
    new Promise(function(resolve, reject) {
      var filter = self.registry.Updated({}, {fromBlock: fromBlock});
      filter.get(function(err, alternations) {
        filter.stopWatching();
        if (err) {
          reject(err);
          return;
        }
        resolve(alternations);
      });
    }),
    new Promise(function(resolve, reject) {
      var filter = self.registry.Deleted({}, {fromBlock: fromBlock});
      filter.get(function(err, deletions) {
        filter.stopWatching();
        if (err) {
          reject(err);
          return;
        }
        resolve(deletions);
      });
    })
  ]).then(function(results) {
    var events = results[0].concat(results[1]).concat(results[2]);
    var sortedEvents = sortEvents(events);
    return sortedEvents.map(function(event) {
      event.args.identities = OrUtils.common.compressAll(OrUtils.urn.packer.decode(event.args.ids));
      return event;
    });
  });
};

Consumer.prototype.getThings = function(onlyValid, fromBlock, finalCallback) {
  var self = this;
  if (!fromBlock) {
    fromBlock = 1;
  }
  return this.getThingsEvents(fromBlock).then(function(events) {
    var created = events.filter(function(event) {
      return event.event === 'Created';
    });
    if (onlyValid) {
      console.warn('Deleted Things are not taken into account');
      var valid = [];
      var updated = events.filter(function(event) {
        return event.event === 'Updated';
      });
      for (var i = 0; i < created.length; i++) {
        valid[created[i].args.owner] = created[i];
      }
      for (var i = 0; i < updated.length; i++) {
        if (!updated[i].args.isValid && valid[updated[i].args.owner]) {
          delete valid[updated[i].args.owner];
        }
        else if (updated[i].args.isValid && !valid[updated[i].args.owner]) {
          valid[updated[i].args.owner] = updated[i];
        }
      }
      for (var i = 0; i < created.length; i++) {
        if (!valid[created[i].args.owner]) {
          created.splice(i, 1);
          i--;
        }
      }
    }
    finalCallback(created);
  });
};

Consumer.prototype.getRegistrantsEvents = function(fromBlock) {
  var self = this;
  return Promise.all([
    new Promise(function(resolve, reject) {
      var filter = self.registrar.Created({}, {fromBlock: fromBlock});
      filter.get(function(err, creations) {
        filter.stopWatching();
        if (err) {
          reject(err);
          return;
        }
        resolve(creations);
      });
    }),
    new Promise(function(resolve, reject) {
      var filter = self.registrar.Updated({}, {fromBlock: fromBlock});
      filter.get(function(err, alternations) {
        filter.stopWatching();
        if (err) {
          reject(err);
          return;
        }
        resolve(alternations);
      });
    })
  ]).then(function(results) {
    var events = results[0].concat(results[1]);
    var sortedEvents = sortEvents(events);
    return sortedEvents.map(function(event) {
      event.args.data = self.decodeRegistrant(event.args.data);
      return event;
    });
  });
};

Consumer.prototype.getRegistrants = function(onlyActives, fromBlock, finalCallback) {
  var self = this;
  if (!fromBlock) {
    fromBlock = 1;
  }
  return this.getRegistrantsEvents(fromBlock).then(function(events) {
    var created = events.filter(function(event) {
      return event.event === 'Created';
    });
    if (onlyActives) {
      var actives = [];
      var updated = events.filter(function(event) {
        return event.event === 'Updated';
      });
      for (var i = 0; i < created.length; i++) {
        actives[created[i].args.registrant] = created[i];
      }
      for (var i = 0; i < updated.length; i++) {
        if (!updated[i].args.isActive && actives[updated[i].args.registrant]) {
          delete actives[updated[i].args.registrant];
        }
        else if (updated[i].args.isActive && !actives[updated[i].args.registrant]) {
          actives[updated[i].args.registrant] = updated[i];
        }
      }
      for (var i = 0; i < created.length; i++) {
        if (!actives[created[i].args.registrant]) {
          created.splice(i, 1);
          i--;
        }
      }
    }
    finalCallback(created);
  });
};

function sortEvents(events) {
  return events.sort(function(a, b) {
    if (b.blockNumber == a.blockNumber) {
      if (b.transactionIndex == a.transactionIndex) {
        return a.logIndex - b.logIndex;
      }
      return a.transactionIndex - b.transactionIndex;
    }
    return a.blockNumber - b.blockNumber;
  });
}

module.exports = Consumer;
