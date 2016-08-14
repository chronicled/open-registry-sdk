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

var severalIds = ["pbk:ec:secp256r1:0211fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f01", "ble:1.0:aabbccddee02", "pbk:ec:secp256r1:0408e07141e07e622242f954dc89b656597a23a4dd3d212987c8cc0d827deccf7b704e94fb02bf21f54f622a9cdcb6a34981b91735d8227120a11c1b7eee983c50"]

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
  identities: ['pbk:ec:secp256r1:0408e07141e07e622242f954dc89b656597a23a4dd3d212987c8cc0d827deccf7b704e94fb02bf21f54f622a9cdcb6a34981b91735d8227120a11c1b7eee983c51', "ble:1.0:aabbccddee04"],
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
	// registryAbi : config.registryABI,
	registrarAddress : config.registrarAddress,
	// registrarABI : config.registrarABI,
}






describe('Open Registry SDK', function() {



	test('Start certifier SDK', function(done) {
		console.log('Starting sdk..');
		web3.setProvider(new web3.providers.HttpProvider(config.urlProvider));
    // config.seedKey
    // config.seedKey
		sdk = new Provider(config.urlProvider, 'registrar', "f779e7e7fdb6d022781994a02450ef818b08567e1161946cc57f0207a9c1b5bf", contracts);

    done();

    // provider.addShim(config.registryAddress, registrantToAddAddress);
	});


  test('ECC signature verification', function(done){
    var urn = 'pbk:ec:secp256r1:0360fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6';
    var challenge = 'af2bdbe1aa9b6ec1e2ade1d694f41fc71a831d0268e9891562113d8a62add1bf';
    var signature = '3046022100efd48b2aacb6a8fd1140dd9cd45e81d69d2c877b56aaf991c34d0ea84eaf3716022100f7cb1c942d657c41d436c7a1b6e29f65f3e900dbb9aff4064dc4ab2f843acda8';

    assert.equal(sdk.verifyIdentity(urn, challenge, signature), true);
    assert.equal(sdk.verifyIdentity(urn, challenge + '1', signature), false);
    done();
  });


  test('RSA signature verification', function(done){
    var urn = 'pbk:rsa:2048:cb47e6aada931986bb6bbf02c8618437c072cefa4e19c1ee6cb189b95a49e3ce94fb4de129c30ab7e683f827c98eb05e844af24f809ed5f217e93c14d58f64b98fc9136d3c2b56a672853a8f52c7ac7acd201b09d0f578f32f377f954905e18fa360448901d0ac538cd1102dc0821cd13a843e370471c00e95daf4bba001186c5b2220e15f2f4777aa9b0a823186c34d82fd557e245b4d5816f48bdc09dd34806982609b63012dd13fe603f23730940e68463b1b68f24ee77907925d286d55ec22bad53119f8354388e051854ef436589538f1efbf104af477dc3ca2cf29974fcf432639b8716c38c717d44c8f0c90d59f02f2ab0aef8b59c2feb460e2cbfb57010001';
    var challenge = 'e3ecf72fa4143b3416154b62d0b570609d13f080';
    var signature = '2f6b41e6091269af8782b0b3e62f00cadd9c724c4ed50fd1c5f04bb1ea45796d71192ea297b0b1c161ae619243eecaaf20794e0abc397705e357941435fcdbcf45b9dc955ae5a366eb4b991a947941f0a94e41b81c4c13453f0ca0230ba6063d7f79f437c2ea26db40d6eafaecf6df7565b6a7673b05d5c5ff6d9420c4acb72a8905f6f79e9026940ce9c8d38c96dbf5a0388d3965caea316456553fbf4818c12c213c88015eaf2930148d7b23a57a71994bdea5113f661a24b6fe74d6fd347d41a0c63638be28f8410d4c1cd441fc38b5a0d4bbee1410babe5b4e5768a55f1f321354acecaf9e14981434bbe1c72fcfb0153b94141f6c48198f3890f95e8ce3';

    assert.equal(sdk.verifyIdentity(urn, challenge, signature), true);
    assert.equal(sdk.verifyIdentity(urn, challenge + '1', signature), false);
    done();
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
  return sdk.getSchema(schemaToGet).then(function(schema) {
    assert.deepEqual(schema, schemaToAdd);
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
      sdk.getTransactionResult(tx).then(function(result) {
        assert.equal(result, true);

        waitForTx(tx, function(txData) {
          console.log(txData);
          assert.notEqual(txData.logs.length, 0, 'Cant add new things if you are not a registrant');
          //assert.equal(txData.logs[0].data.toString(), '0x0000000000000000000000000000000000000000000000000000000000000001', 'Identity already used');
          waitBlocks(1, done);
        });
      }).catch(console.log);
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
 		assert.deepEqual(OrUtils.common.compressAll(severalIds.slice(-1)), thing.identities);
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
      console.log(thing);
      assert.deepEqual(thingToAdd.data, thing.data);
      assert.deepEqual(OrUtils.common.compressAll(thingToAdd.identities), thing.identities);
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
