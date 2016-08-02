var expect = require('chai').expect;
var Registrant = require('./lib/registrant');
var Certifier = require('./lib/certifier');
var Consumer = require('./lib/consumer');
var ProtoBuf = require("protobufjs");
var sinon = require('sinon');
var ByteBuffer = require('bytebuffer');
require('chai').use(require('sinon-chai'));
var proto = require('./schemas/schema.proto.json');
var Provider = require('./lib/provider');
var provider = new Provider();



var thingToAdd = {
  identities: [ {
    pubKey: ByteBuffer.fromHex('10238a3b4610238a3b3610238a3b3610238a3b4610238a3b46'),
    schema: 'urn:test'
  } ],
  data: {
    service_url: 'http://www.cosign.io'
  }
};


var thingResponse = [ [ '0x076e66633a312e30102300000000000000000000000000000000000000000000' ],
  [ '0x0a14687474703a2f2f7777772e636f7369676e2e696f00000000000000000000' ],
  '0x0000000000000000000000000000000000000000000000000000000000000001',
  'message Thing {required string service_url = 1;}',
  '0x202c31ca637d459bcd51a7bf77cc2c5a1c8489d1',
  true ];

describe('Registrant SDK', function() {

   afterEach(function () {
      provider.getRegistry.restore();
   });

  it('should allow to read Thing and parse into object.', function(done) {

    var contract = { 
      getThing: { call: function() {} } 
    };
    sinon.stub(contract.getThing, 'call').yields(null, thingResponse);
    sinon.stub(provider, 'getRegistry').returns(contract);

    new Registrant(provider).getThing(['urn:test:1023']).then(function(rv) {
      expect(rv.service_url).to.eql('http://www.cosign.io');
      done();
    }).catch(done);
  });

  it('should allow to create Thing that is correctly serialized.', function(done) {

    var contract = { createThing: function() {} , schemas: { call: function() {} }};
    sinon.stub(contract, 'createThing').yields(null, '0x4321');
    sinon.stub(contract.schemas, 'call').yields(null, '0a0562617369631204646573631a306d657373616765205468696e67207b726571756972656420737472696e6720736572766963655f75726c203d20313b7d');
    sinon.stub(provider, 'getRegistry').returns(contract);

    new Registrant(provider).createThing(['urn:test:1023'], thingToAdd.data).then(function(rv) {
      console.log(rv);
      expect(contract.createThing).calledWith([ '0x0875726e3a746573740002102300000000000000000000000000000000000000' ], [ '0x0a14687474703a2f2f7777772e636f7369676e2e696f' ], sinon.match.any, sinon.match.any);
      expect(rv).to.eql('0x4321');
      done();
    }).catch(done);
  });

  it('should allow to create Thing with reference for each id.', function(done) {

    var contract = { createThing: function() {} , schemas: { call: function() {} }};
    sinon.stub(contract, 'createThing').yields(null, '0x4321');
    console.log(thingResponse[4]);
    sinon.stub(contract.schemas, 'call').yields(null, thingResponse[4]);

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

    var contract = { createThings: function() {} , schemas: { call: function() {} }};
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