'use strict';

var ProtoBuf = require("protobufjs");
var tools = require('../lib/tools');
var Web3 = require('web3');
var ByteBuffer = require('bytebuffer');
var ConsumerSdk = require('../lib/consumer.js');
var RegistrantSdk = require('../lib/registrant.js');
var CertifierSdk = require('../lib/certifier.js');
var Provider = require('../lib/provider.js');

var builder = ProtoBuf.loadJson(require('../schemas/schema.proto.json'));
var Schema = builder.build("Schema").Schema;
var config = require('./config');

var web3 = new Web3();
var sdk = {
  certifier: null,
  registrant: null,
  consumer: null
};

var provider = null;

var registrantToAddAddress = config.myAddress;
var schemaToGet = 1;
var registrantToAdd = {
  name: 'Test Registrant',
  description: 'Test description of the registrant',
  contact: 'test@chronicled.com',
  website: 'http://testwebsite.com',
  legalName: 'Test Company INC.',
  address: {
    street_1: 'Red street 666',
    street_2: '',
    city: 'San Francisco',
    state: 'California',
    zip: '6666',
    country: 'United States'
  }
}

describe('SDK Tests', function() {
  before(function(done) {
    web3.setProvider(new web3.providers.HttpProvider(config.urlProvider));
    provider = new Provider(config.urlProvider, config.seedKey, function() {
      sdk.consumer = new ConsumerSdk(provider, config.registryAddress, config.registrarAddress),
      sdk.registrant = new RegistrantSdk(provider, config.registryAddress);
      sdk.certifier = new CertifierSdk(provider, config.registryAddress,  config.registrarAddress);
      done();
    });
  });

  describe('OPENSRC-96: Dev can add new identity to a Thing in Open Registry', function() {
    it('should configure the registrar of Open Registry', function(done) {
      sdk.certifier.setRegistrar(config.registrarAddress)
      .then(function(txHash) {
        web3.eth.getTransactionReceipt(txHash, function(err, data) {
          if (!err) {
            done();
          } else {
            done(err);
          }
        });
      });
    });

    it('should add a new registrant to the Open Registry', function(done) {
      sdk.certifier.addRegistrant(registrantToAddAddress, registrantToAdd)
      .then(function(txHash) {
        return sdk.consumer.getRegistrant(registrantToAddAddress);
      })
      .then(function(registrant) {
        console.log(registrant);
        done();
      })
    });
  });
});
