var expect = require('chai').expect;
var Registrant = require('./lib/registrant');
var tools = require('./lib/tools');
var ProtoBuf = require("protobufjs");
var sinon = require('sinon');
require('chai').use(require('sinon-chai'));


var slice1 = '0x1234000000000000000000000000000000000000000000000000000000004321';
var slice2 = '0x5678000000000000000000000000000000000000000000000000000000004321';
var total = '0x12340000000000000000000000000000000000000000000000000000000043215678000000000000000000000000000000000000000000000000000000004321';

var proto = "message Identities {    \
  repeated Identity identities = 1; \
  optional Data data = 2;           \
}                                   \
                                    \
message Identity {                  \
  required string uri = 1;          \
}                                   \
                                    \
message Data {                      \
  optional string MymeType = 1;     \
  optional string brandName = 2;    \
}";
var builder = ProtoBuf.loadJson(ProtoBuf.DotProto.Parser.parse(proto));
var Identities = builder.build("Identities");

describe('protobuf test', function() {

  it('should allow to serialize and deserialize identities.', function(done) {

    var ids = new Identities({ 
      identities: [ { uri: 'uri' } ],
      data: null
    });
    expect(ids).to.eql(Identities.decodeHex('0a050a03757269'));
    done();
  });

  it('should allow to split protobuf into 32byte parts.', function(done) {
    var registrant = new Registrant();
    var slices = tools.slice(total);
    expect(slices[0]).to.eql(slice1);
    expect(slices[1]).to.eql(slice2);
    done();
  });

  it('should allow to concatenate parts back together', function(done) {
    var registrant = new Registrant();
    var merged = tools.merge([slice1, slice2]);
    expect(merged).to.eql(total);
    done();
  });
});

var entry = { identities: [ { uri: 'uri' } ], data: null };

describe('registrant sdk', function() {

  it('should allow to read asset and parse into object.', function(done) {

    var contract = { getAsset: { call: function() {} } };
    sinon.stub(contract.getAsset, 'call').yields(null, [
      proto,
      ['0x0a050a0375726900000000000000000000000000000000000000000000000000'], // encoded: { identities: [ { uri: 'uri' } ], data: null }
      true
    ]);

    var registrant = new Registrant({ getRegistry: function() {return contract;}, getWeb3: function() {}, getAddress: function() {}});

    registrant.getAsset('0x1234').then(function(rv) {
      rv = JSON.parse(JSON.stringify(rv));
      expect(rv).to.eql(entry);
      done();
    }).catch(done);
  });

  it('should allow to create asset that is correctly serialized.', function(done) {

    var contract = { create: function() {} , schemas: { call: function() {} }};
    sinon.stub(contract, 'create').yields(null, '0x4321');
    sinon.stub(contract.schemas, 'call').yields(null, proto);

    var registrant = new Registrant({ getRegistry: function() {return contract;}, getWeb3: function() {}, getAddress: function() {}});

    registrant.createAsset(entry, '0x1234').then(function(rv) {
      expect(contract.create).calledWith(sinon.match.any, ['0x0a050a03757269'], sinon.match.any, sinon.match.any);
      expect(rv).to.eql('0x4321');
      done();
    }).catch(done);
  });

  it('should allow to batch-create assets.', function(done) {
    var entries = [{
      identities: entry,
      reference: '0x1234'
    },{
      identities: entry,
      reference: '0x3456'
    }]

    var contract = { createMany: function() {} , schemas: { call: function() {} }};
    sinon.stub(contract, 'createMany').yields(null, [0, 1]);
    sinon.stub(contract.schemas, 'call').yields(null, proto);

    var registrant = new Registrant({ getRegistry: function() {return contract;}, getWeb3: function() {}, getAddress: function() {}});

    registrant.createMany(entries).then(function(rv) {
      expect(contract.createMany).calledWith(sinon.match.any, [1, 1],['0x0a050a03757269', '0x0a050a03757269'], ['0x1234', '0x3456'], sinon.match.any, sinon.match.any);
      expect(rv).to.eql([0, 1]);
      done();
    }).catch(done);
  });

});