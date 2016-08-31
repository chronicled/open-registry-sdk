// Copyright 2016 Chronicled
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// To run tests
// mocha unit-tests-registry.js


var assert = require("assert");
var ProtoBuf = require("protobufjs");
var OrUtils = require('open-registry-utils');
var Web3 = require('web3');
var ByteBuffer = require('bytebuffer');
var Provider = require('../build/open-registry-sdk.js');
var sinon = require('sinon');

var provider = null;

var registrantToAddAddress = '0x1234';
var schemaToGet = 0;
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
                  schemaToGet,
                  schemaToAdd.definition,
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

  createSchema: function(name, description, definition){
    assert.equal(name, schemaToAdd.name);
    assert.equal(description, schemaToAdd.description);
    assert.equal(definition, schemaToAdd.definition);
    invokeCallback(arguments, [ null, '0x52350d231f54851cf066d5b6482fe041edd63909da48c08ffa93645f44ff76bf' ]);
  },

  schemas: {
    call: function(schemaIndex) {
      assert.equal(schemaIndex, schemaToGet);
      invokeCallback(arguments, [null, [schemaToAdd.name, schemaToAdd.description, schemaToAdd.definition]])
    }
  },

  standardSchema: {
    call: function() {
      invokeCallback(arguments, [null, ['', '', '']])
    }
  },

  createThing: function() {
    assert.deepEqual([].slice.apply(arguments).slice(0,3), [
      [ '0x1070626b3a65633a73656370323536723100210360fed4ba255a9d31c961eb74',
        '0xc6356d68c049b8923b61fa6ce669622e60f29f04000000000000000000000000' ],
      [ '0x0a0a54657374207468696e67121d54657374206465736372697074696f6e206f',
        '0x6620746865207468696e67' ]
      , schemaToGet]);

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
      schemaToGet
    ]);

      invokeCallback(arguments, [ null, '0xa967a1338a93b79830874d6fa064eed38ee3705d7e6ae25f643a68eddf15d4b5' ]);
  },


};

var registrar = {
  address: '0x15034797709cc5f0a07f5e878ec3e87b3f05e316',
};


describe('Open Registry SDK', function() {
	it('Start Registrar SDK', function(done) {


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

	it('Incorrect URN protocol', function(done, error) {
		var errors = 0;
    sdk.createThing({identities: ["ble:2.0:aabbccddee02"], data: {}})
		.then(console.log).catch(function(error){
			errors++;
			return sdk.createThing({identities: ["ble:1.5:aabbccddee"], data: {}});
		}).then(console.log).catch(function() {
			errors++;
			return sdk.createThing({identities: ["pbk:ec:secp256k1:aabbccddee"], data: {}});
		}).then(console.log).catch(function() {
			errors++;
			return sdk.createThing({identities: ["pbk:ec:secp256r1d:aabbccddee"], data: {}});
		}).then(console.log).catch(function() {
			errors++;
			assert.equal(errors, 4);
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
    sdk.createThing(thingToAdd, schemaToGet).then(function(tx){
      done();
    });
  });

 it('Add Things (PLURAL)', function(done) {

  sdk.createThings(things, schemaToGet)
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
    sdk.createSchema(schemaToAdd, thingToAdd.data).then(function(tx){
      done();
    }).catch(console.log);
 });



});
