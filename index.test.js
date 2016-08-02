var expect = require('chai').expect;
var Registrant = require('./lib/registrant');
var ProtoBuf = require("protobufjs");
var sinon = require('sinon');
var ByteBuffer = require('bytebuffer');
require('chai').use(require('sinon-chai'));













var entry = { identities: [ { pubKey: ByteBuffer.fromHex('aabb'), schema: 'urn:test' } ], data: null };

var multiRefEntry = { identities: [ 
  { pubKey: ByteBuffer.fromHex('1233333333333333333333333333333333333333333333333333333333333321'), schema: 'urn:test' },
  { pubKey: ByteBuffer.fromHex('1234444444444444444444444444444444444444444444444444444444444321'), schema: 'urn:test' } ], data: null };

describe('Registrant SDK', function() {

  it('should allow to read Thing and parse into object.', function(done) {

    var contract = { getThing: { call: function() {} } };
    sinon.stub(contract.getThing, 'call').yields(null, [
      proto,
      ['0x0a0e0a02aabb120875726e3a7465737400000000000000000000000000000000'],
      true
    ]);

    var registrant = new Registrant({ getRegistry: function() {return contract;}, getWeb3: function() {}, getAddress: function() {}});

    registrant.getThing('0xaabb').then(function(rv) {
      expect(rv.identities[0].pubKey.toString('hex')).to.eql('aabb');
      done();
    }).catch(done);
  });

  it('should allow to create Thing that is correctly serialized.', function(done) {

    var contract = { create: function() {} , schemas: { call: function() {} }};
    sinon.stub(contract, 'createThing').yields(null, '0x4321');
    sinon.stub(contract.schemas, 'call').yields(null, proto);

    var registrant = new Registrant({ getRegistry: function() {return contract;}, getWeb3: function() {}, getAddress: function() {}});

    registrant.createThing(entry.identities, entry.data).then(function(rv) {
      expect(contract.create).calledWith(sinon.match.any, ['0x0a0e0a02aabb120875726e3a74657374'], sinon.match.any, sinon.match.any);
      expect(rv).to.eql('0x4321');
      done();
    }).catch(done);
  });

  it('should allow to create Thing with reference for each id.', function(done) {

    var contract = { create: function() {} , schemas: { call: function() {} }};
    sinon.stub(contract, 'createThing').yields(null, '0x4321');
    sinon.stub(contract.schemas, 'call').yields(null, proto);

    var registrant = new Registrant({ getRegistry: function() {return contract;}, getWeb3: function() {}, getAddress: function() {}});

    registrant.createThing(multiRefEntry).then(function(rv) {
      expect(contract.createThing).calledWith(sinon.match.any, ["0x0a2c0a2012333333333333333333333333333333333333333333333333333333", "0x33333321120875726e3a746573740a2c0a201234444444444444444444444444", "0x444444444444444444444444444444444321120875726e3a74657374"], ["0x1233333333333333333333333333333333333333333333333333333333333321", "0x1234444444444444444444444444444444444444444444444444444444444321"], sinon.match.any);
      expect(rv).to.eql('0x4321');
      done();
    }).catch(done);
  });

  it('should allow to batch-create Things.', function(done) {
    var entries = [{
      identities: entry,
      reference: '0x1234'
    },{
      identities: entry,
      reference: '0x3456'
    }]

    var contract = { createMany: function() {} , schemas: { call: function() {} }};
    sinon.stub(contract, 'createThings').yields(null, [0, 1]);
    sinon.stub(contract.schemas, 'call').yields(null, proto);

    var registrant = new Registrant({ getRegistry: function() {return contract;}, getWeb3: function() {}, getAddress: function() {}});

    registrant.createThings(entries).then(function(rv) {
      expect(contract.createThings).calledWith(sinon.match.any, [1, 1],["0x0a0e0a02aabb120875726e3a74657374", "0x0a0e0a02aabb120875726e3a74657374"], ['0x1234', '0x3456'], sinon.match.any, sinon.match.any);
      expect(rv).to.eql([0, 1]);
      done();
    }).catch(done);
  });

});










var registrantToAddAddress = '0x6f37ffcf91bf95fd5956a6e82fac965a81efbe84';
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
//created by creating protbuf from the object above and then calling '.encodeHex()'
var regEncoded = '0a0f546573742052656769737472616e74122254657374206465736372697074696f6e206f66207468652072656769737472616e741a1374657374406368726f6e69636c65642e636f6d2216687474703a2f2f74657374776562736974652e636f6d2a115465737420436f6d70616e7920494e432e32420a0e526564207374726565742036363612001a0d53616e204672616e636973636f220a43616c69666f726e69612a0436363636320d556e6974656420537461746573';

describe('Certifier SDK', function() {

  it('should allow to add registrant.', function(done) {

    var contract = { add: function() {} , schemas: { call: function() {} }};
    sinon.stub(contract, 'add').yields(null, 'txhash');

    var certifier = new Certifier({
      getRegistrar: function() {return contract;},
      getWeb3: function() {},
      getAddress: function() {}
    });

    certifier.addRegistrant(registrantToAddAddress, registrantToAdd).then(function(tx) {
      expect(contract.add).calledWith(registrantToAddAddress, regEncoded, sinon.match.any, sinon.match.any);
      done();
    }).catch(done);
  });

  it('should allow to edit registrant.');

});