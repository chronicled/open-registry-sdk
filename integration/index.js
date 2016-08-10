// To run tests successfully:
// 1) Run  testrpc --account="0xf779e7e7fdb6d022781994a02450ef818b08567e1161946cc57f0207a9c1b5bf,9999999999999999999999999" --gasLimit=4000000 -b=1
// 2) Have your contracts deployed, you can do that with "truffle deploy"    in open-registry-ethereum
// 3) Update addresses of contracts if necessary in integration/config.js file
// 4) npm test




var sniff = function(o, parentName, level) {
  if (parentName) {
    parentName += '.';
  } else {
    parentName = '';
  }

	if (!level) {
		level = 0;
	}
	else if (level > 2) {
		return;
	}

  for (prop in o) {
    if (typeof(o[prop]) == 'function') {
			var replacement = sniffWrap(o, o[prop], parentName + prop);

			for (key in o[prop]) {
				// console.log('PROP', key);
				if (key) {
					replacement[key] = o[prop][key];
				}
			}

			o[prop] = replacement;
			// Recursion
			sniff(o[prop], parentName + prop, level + 1);


    } else if (typeof(o[prop]) == 'object' || typeof(o[prop].call) == 'function') {
			// Recursion
  	}
  }
}

var sniffWrap = function(self, func, name) {
		return function() {
			console.log('———————————————————');
			console.log('CALL: ' + name + '()');
			var args = [].slice.apply(arguments);
			// Callback
			if (typeof(args[args.length-1]) == 'function' ) {
				args[args.length-1] = sniffWrap(self, args[args.length-1], 'Callback of ' + name);
			}

			console.log('PRMS:', args);
			var res = func.apply(self, args);
			console.log('RSLT:', res);
			console.log("\n");
			return res;
		};
}


var assert = require("assert");
var ProtoBuf = require("protobufjs");
var OrUtils = require('../../open-registry-utils');
var Web3 = require('web3');
var ByteBuffer = require('bytebuffer');
var Provider = require('../lib/provider.js');

builder = ProtoBuf.loadJson(require('../schemas/schema.proto.json'));
var Schema = builder.build("Schema").Schema;

console.log("Tests init");

var config = require('./config');

web3 = new Web3();

var provider = null;

var registrantToAddAddress = config.myAddress;
// MultiAccess contract
// var registrantToAddAddress = '0x430b0f97955b798d4d3fb0f806cd13f8a02f3073';
// config.seedKey = '0xed465b64c814fcd2eced222ba73ed208062417fbf8b0e4ec12bd0226b493770e';




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
  identities: ['pbk:ec:secp256r1:0360fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f06', "ble:1.0:aabbccddee04"],
  data: {
    name: 'Test thing',
    description: ''
  }
};

var sdk = null;

var waitForTx = function(txHash, callback){
    console.log('Waiting for TX', txHash, 'to be mined.');
    function checkTX(){
        web3.eth.getTransactionReceipt(txHash, function(error, txData) {
            if (txData){
                clearInterval(interval);
                console.log('Mined!');
                callback(txData);
            }
        })
    }
    var interval = setInterval(function(){
        checkTX()
    }, 2000);
}

var waitBlocks = function(blocks, callback){
	var currentBlock = web3.eth.blockNumber;
    console.log('Waiting for', blocks, 'blocks to be mined.');
    function checkBlocks(){
		    if ((currentBlock+blocks) < web3.eth.blockNumber) {
            clearInterval(interval);
            callback();
        }
    }
    var interval = setInterval(function(){
        checkBlocks();
    }, 1000);
}

var contracts = {
	registryAddress : config.registryAddress,
	registryAbi : config.registryABI,
	registrarAddress : config.registrarAddress,
	registrarABI : config.registrarABI,
}






describe('Open Registry SDK', function() {
	test('Start certifier SDK', function(done) {
		console.log('Starting sdk..');
		web3.setProvider(new web3.providers.HttpProvider(config.urlProvider));
    // config.seedKey
		sdk = new Provider(config.urlProvider, 'registrar', config.seedKey, contracts);
    done();

    // provider.addShim(config.registryAddress, registrantToAddAddress);
	});


 test('Configure Registrar', function(done) {
 	console.log('Configuring registrar address..');
 	sdk.setRegistrar(config.registrarAddress).then(function(tx){
 		waitForTx(tx, function(txData){
 			if (txData.logs.length > 0){
 				assert.notEqual(parseInt(txData.logs[0].data.substring(65,66)), 3, 'Already configured');
 			}
 			waitBlocks(1, done);
 		})
 	});
 });



 test('Get registrar address from registry Registrar', function(done) {
 	console.log('Getting registrar address..');
 	sdk.getRegistrarAddressOnRegistry().then(function(address){
 	assert.equal(address, config.registrarAddress);
    done();
 	});
 });

 test('Create Schema', function(done) {
  sdk.createSchema(schemaToAdd).then(function(tx){
    waitForTx(tx, function(txData){
      waitBlocks(1, done);
    });
  });
 });

 test('Get Schema info', function(done) {
  console.log('Getting Schema..');
  return sdk.registry.schemas.call(schemaToGet, {from: config.myAddress}, function(error, data) {
 	 assert.equal(error, null);
 	 console.log('Schema at', schemaToGet, ':', Schema.decodeHex(data));
 	 done();
  });
 });


 test('Add Registrant', function(done) {
   console.log('Adding registrant', registrantToAddAddress);
   sdk.addRegistrant(registrantToAddAddress, registrantToAdd).then(function(tx){
     waitForTx(tx, function(txData){
       assert.notEqual(txData.logs[0].data.toString(), '0x0000000000000000000000000000000000000000000000000000000000000001', 'Registrant address already registered or not CA permission.');
       waitBlocks(1, done);
     })
   });
 });



  test('Add Thing', function(done) {
    console.log('Adding thing', thingToAdd.data.name);
    sdk.createThing(thingToAdd, 1).then(function(tx){
      waitForTx(tx, function(txData) {
        console.log(txData);
        assert.notEqual(txData.logs.length, 0, 'Cant add new things if you are not a registrant');
        //assert.equal(txData.logs[0].data.toString(), '0x0000000000000000000000000000000000000000000000000000000000000001', 'Identity already used');
        waitBlocks(1, done);
      });
    });
  });


	// Intentionally not getting Thing here but getting it later, because there's some timeout / operation need for successful execution
 test('Add Things (PLURAL)', function(done) {
 	console.log('Adding things (PLURAL)');
 	sdk.createThings(things, 1)
 	.then(function(tx){
 	assert.notEqual(tx, null);
 		waitForTx(tx, function(txData){
 			waitBlocks(1, done);
 		});
 	});
 });


 test('Get Things (PLURAL)', function(done) {
 	 sdk.getThing(things[0].identities[0])
 	.then(function(thing) {
 		assert.deepEqual(severalIds.slice(0,2), thing.identities);
 		assert.deepEqual(things[0].data, thing.data);
 		return sdk.getThing(severalIds.slice(-1)[0]);
 	})
 .catch(console.log)
 .then(function(thing) {
 		assert.deepEqual(severalIds.slice(-1), thing.identities);
 		assert.deepEqual(things[1].data, thing.data);
 		done();
 	})
 	.catch(console.log);
 });


test('Get Registrant', function(done) {
 	sdk.getRegistrant(registrantToAddAddress).then(function(registrant){
    assert(registrant.length > 0);
    assert.equal(registrant[0], registrantToAddAddress);
    assert.equal(registrant[1].name, registrantToAdd.name);
    done();
  })
  .catch(console.log);
});



 test('Edit Registrant', function(done) {
 	console.log('Editing registrant',registrantToAddAddress);
 	registrantToAdd.name = 'Test registrant edited';
 	sdk.editRegistrant(registrantToAddAddress, registrantToAdd, true).then(function(tx){
    	waitForTx(tx, function(txData){
 			assert.notEqual(txData.logs[0].data.toString(), '0x0000000000000000000000000000000000000000000000000000000000000001', 'Registrant address not registered or not CA permission.');
       	waitBlocks(1, done);
  		});
  	});
 });

  test('Get Thing', function(done) {
    sdk.getThing(thingToAdd.identities[0])
    .then(function(thing){
      assert.deepEqual(thingToAdd.data, thing.data);
      assert.deepEqual(thingToAdd.identities, thing.identities);
      done();
    })
    .catch(console.log);
  });


  test('Get Registrants', function(done) {
 	console.log('Get Registrants..');
 	return sdk.getRegistrants(false, config.fromBlock, function(registrants){
            console.log(registrants.length, 'Registrants registered');
            if (registrants.length > 0){
                console.log('Getting Registrant', registrants[0].args.registrant);
                sdk.getRegistrant(registrants[0].args.registrant).then(function(registrant){
                    console.log('Registrant', registrants[0].args.registrant, 'data:',registrant[1]);
                    done();
                });
            } else {
                done();
            }
        });
 });
});
