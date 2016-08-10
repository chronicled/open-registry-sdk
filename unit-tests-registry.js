// To run tests successfully:
// 1) Run  testrpc --account="0xf779e7e7fdb6d022781994a02450ef818b08567e1161946cc57f0207a9c1b5bf,9999999999999999999999999" --gasLimit=4000000 -b=1
// 2) Have your contracts deployed, you can do that with "truffle deploy"    in open-registry-ethereum
// 3) Update addresses of contracts if necessary in integration/config.js file
// 4) npm test


var assert = require("assert");
var ProtoBuf = require("protobufjs");
var OrUtils = require('../open-registry-utils');
var Web3 = require('web3');
var ByteBuffer = require('bytebuffer');
var Provider = require('./lib/provider.js');
var sinon = require('sinon');


builder = ProtoBuf.loadJson(require('./schemas/schema.proto.json'));
var Schema = builder.build("Schema").Schema;




var provider = null;

var registrantToAddAddress = '0x1234';
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

var severalIds = ["pbk:ec:secp256r1:0211fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f01", "ble:1.0:aabbccddee02", "pbk:ec:secp256r1:0222fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f03"]

var things = [
  {identities: severalIds.slice(0, 2), data: {name: 'abc.com', description: 'Testing'}},
  {identities: severalIds.slice(-1), data: {name: 'http://chronicled.com/', description: 'Testing again'}},
];

var schemaToAdd = {
	name: 'Basic',
	description: 'Schema with one or more identities and one name and description',
	definition: 'message Thing { optional string name = 1; optional string description = 2; }'
};

var thingToAdd = {
  identities: ['pbk:ec:secp256r1:0360fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f04'],
  data: {
    name: 'Test thing',
    description: 'Test description of the thing'
  }
};

var sdk = null;



var invokeCallback = function(args, params) {
  // console.log([].slice.apply(args).slice(-1)[0].toString());
  [].slice.apply(args).slice(-1)[0].apply(null, params);
}

// Mock Registry
var registry = {
  configure: function() {
    assert.equal(arguments[0], registrar.address);
    invokeCallback(arguments, [null, '0x292726591aee1f1a36daee6a9e2726751e8c22222bc0db663812998cf5142899' ]);
  },
  getThing: {
    call: function() {
      // Verifying is input correct
      assert.deepEqual(arguments[0], [ '0x1070626b3a65633a73656370323536723100210360fed4ba255a9d31c961eb74', '0xc6356d68c049b8923b61fa6ce669622e60f29f04000000000000000000000000' ]);

      invokeCallback(arguments,
              [null,
                [
                  [ '0x1070626b3a65633a73656370323536723100210360fed4ba255a9d31c961eb74',
                    '0xc6356d68c049b8923b61fa6ce669622e60f29f04000000000000000000000000' ],
                  [ '0x0a0a54657374207468696e67121d54657374206465736372697074696f6e206f',
                    '0x6620746865207468696e67000000000000000000000000000000000000000000' ],
                  1,
                  '0a054261736963123f536368656d612077697468206f6e65206f72206d6f7265206964656e74697469657320616e64206f6e65206e616d6520616e64206465736372697074696f6e1a4c6d657373616765205468696e67207b206f7074696f6e616c20737472696e67206e616d65203d20313b206f7074696f6e616c20737472696e67206465736372697074696f6e203d20323b207d',
                  '0x300221400d539cb5d15940c56239e6353287eba2',
                  true
                ]
              ]);
    }
  },

  registrarAddress: {
    call: function() {
      invokeCallback(arguments, [null, '0x15034797709cc5f0a07f5e878ec3e87b3f05e316']);
    }
  },

  createSchema: function(schema){
    assert.equal(schema, '0a054261736963123f536368656d612077697468206f6e65206f72206d6f7265206964656e74697469657320616e64206f6e65206e616d6520616e64206465736372697074696f6e1a4c6d657373616765205468696e67207b206f7074696f6e616c20737472696e67206e616d65203d20313b206f7074696f6e616c20737472696e67206465736372697074696f6e203d20323b207d');
    invokeCallback(arguments, [ null, '0x52350d231f54851cf066d5b6482fe041edd63909da48c08ffa93645f44ff76bf' ]);
  },

  schemas: {
    call: function(schemaIndex) {
      assert.equal(schemaIndex, schemaToGet);
      invokeCallback(arguments, [null, '0a054261736963123f536368656d612077697468206f6e65206f72206d6f7265206964656e74697469657320616e64206f6e65206e616d6520616e64206465736372697074696f6e1a4c6d657373616765205468696e67207b206f7074696f6e616c20737472696e67206e616d65203d20313b206f7074696f6e616c20737472696e67206465736372697074696f6e203d20323b207d'])
    }
  },

  createThing: function() {
    assert.deepEqual([].slice.apply(arguments).slice(0,3), [
      [ '0x1070626b3a65633a73656370323536723100210360fed4ba255a9d31c961eb74',
        '0xc6356d68c049b8923b61fa6ce669622e60f29f04000000000000000000000000' ],
      [ '0x0a0a54657374207468696e67121d54657374206465736372697074696f6e206f',
        '0x6620746865207468696e67' ]
      , 1]);

      invokeCallback(arguments, [ null, '0xcc8ea35f1b8e727f935acb7411aa4c7bd1e31d534a5fab15299d502e9ff8aa2e' ]);
  },

  createThings: function() {
    assert.deepEqual([].slice.apply(arguments).slice(0,5), [
      [ '0x1070626b3a65633a73656370323536723100210211fed4ba255a9d31c961eb74',
        '0xc6356d68c049b8923b61fa6ce669622e60f29f01000000000000000000000000',
        '0x07626c653a312e300006aabbccddee0200000000000000000000000000000000',
        '0x1070626b3a65633a73656370323536723100210222fed4ba255a9d31c961eb74',
        '0xc6356d68c049b8923b61fa6ce669622e60f29f03000000000000000000000000' ],
      [ 2, 1 ],
      [ '0x0a076162632e636f6d120754657374696e67',
        '0x0a16687474703a2f2f6368726f6e69636c65642e636f6d2f120d54657374696e',
        '0x6720616761696e' ],
      [ 1, 2 ],
      1
    ]);

      invokeCallback(arguments, [ null, '0xa967a1338a93b79830874d6fa064eed38ee3705d7e6ae25f643a68eddf15d4b5' ]);
  },


};

var registrar = {
  address: '0x15034797709cc5f0a07f5e878ec3e87b3f05e316',
};


describe('Open Registry SDK', function() {
	it('Start certifier SDK', function(done) {


    // console.log(Provider.prototype.getRegistry)
    sinon.stub(Provider.prototype, 'getRegistry').returns(registry);
    sinon.stub(Provider.prototype, 'getRegistrar').returns(registrar);

		sdk = new Provider('', 'registrar');
		done();
	});


  it('Configure Registrar', function(done) {
    sdk.setRegistrar(registrar.address).then(function(tx){
      done();
    });
  });

  it('Get registrar address from registry Registrar', function(done) {
     sdk.getRegistrarAddressOnRegistry().then(function(address){
       assert.equal(address, registrar.address);
       done();
     });
  });

  it('Add Thing', function(done) {
    sdk.createThing(thingToAdd, 1).then(function(tx){
      done();
    });
  });

 it('Add Things (PLURAL)', function(done) {

  sdk.createThings(things, 1)
  .then(function(tx){
    assert.notEqual(tx, null);
    done();
  });
 });

  it('Get Thing', function(done) {
    sdk.getThing(thingToAdd.identities[0])
    .then(function(thing){
      assert.deepEqual(thingToAdd.data, thing.data);
      assert.deepEqual(thingToAdd.identities, thing.identities);
      done();
    })
    .catch(console.log);
  });

 it('Create Schema', function(done) {
    sdk.createSchema(schemaToAdd).then(function(tx){
      done();
    });
 });



});
