
var assert = require("assert");
var ProtoBuf = require("protobufjs");
var tools = require('../lib/tools');
var Web3 = require('web3');
var ByteBuffer = require('bytebuffer');
var ConsumerSdk = require('../lib/consumer.js');
var RegistrantSdk = require('../lib/registrant.js');
var CertifierSdk = require('../lib/certifier.js');
var Provider = require('../lib/provider.js');

builder = ProtoBuf.loadJson(require('../schemas/schema.proto.json'));
var Schema = builder.build("Schema").Schema;

console.log("Tests init");

var config = require('./config');

web3 = new Web3();

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

/*
BASIC SCHEMA
message Thing {
  repeated Identity identities = 1;
  optional Data data = 2;
}

message Identity {
  optional bytes pubKey = 1;
  required string schema = 2;
}

message Data {
  optional string name = 1;
  optional string description = 2;
}
*/
var schemaToAdd = {
	name: 'Basic',
	description: 'Schema with one or more identities and one name and description',
	definition: 'message Thing { repeated Identity identities = 1; optional Data data = 2; } message Identity { optional bytes pubKey = 1; required string schema = 2; } message Data { optional string name = 1; optional string description = 2; }'
};

var thingToAdd = {
	identities: [ {
		pubKey: ByteBuffer.fromHex('10238a3b4610238a3b3610238a3b3610238a3b4610238a3b46'),
		schema: 'urn:test'
	} ],
	data: {
		name: 'Test thing',
		description: 'Test description of the thing'
	}
};

var sdk = {
	certifier: null,
	registrant: null,
	consumer: null
};

var waitForTx = function(txHash, callback){
    console.log('Waiting for TX', txHash, 'to be mined.');
    function checkTX(){
        web3.eth.getTransactionReceipt(txHash, function(error, txData) {
            if (txData){
                clearInterval(interval);
                console.log('Mined !');
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

describe('Open Registry SDK', function() {

	test('Start SDK', function(done) {
		console.log('Starting sdk..');
		web3.setProvider(new web3.providers.HttpProvider(config.urlProvider));
		provider = new Provider(config.urlProvider, config.seedKey, function(){
			sdk.consumer = new ConsumerSdk(provider, config.registryAddress, config.registrarAddress),
			sdk.registrant = new RegistrantSdk(provider, config.registryAddress);
			sdk.certifier = new CertifierSdk(provider, config.registryAddress,  config.registrarAddress);
			done();
		});
	});

	test('Configure Registrar', function(done) {
		console.log('Configuring registrar address..');
		sdk.certifier.setRegistrar(config.registrarAddress).then(function(tx){
			waitForTx(tx, function(txData){
				if (txData.logs.length > 0){
					assert.notEqual(parseInt(txData.logs[0].data.substring(65,66)),3, 'Already configured');
				}
				waitBlocks(1,done);
			})
		});
	});

	test('Create Schema', function(done) {
		console.log('Creating Schema..');
        sdk.certifier.createSchema(schemaToAdd).then(function(tx){
            waitForTx(tx, function(txData){
                waitBlocks(1,done);
            })
        });
	});

	test('Get Schema info', function(done) {
		console.log('Getting Schema..');
		sdk.consumer.registry.schemas.call(schemaToGet, {from: config.myAddress}, function(error, data) {
			assert.notEqual(error, 'null', error);
			console.log('Schema at', schemaToGet, ':', Schema.decodeHex(data));
            done();
        });
	});

	test('Add Registrant', function(done) {
		console.log('Adding registrant',registrantToAddAddress);
		sdk.certifier.addRegistrant(registrantToAddAddress, registrantToAdd).then(function(tx){
            waitForTx(tx, function(txData){
				assert.notEqual(txData.logs[0].data.toString(), '0x0000000000000000000000000000000000000000000000000000000000000001', 'Registrant address already registered or not CA permission.');
                waitBlocks(1,done);
            })
        });
	});

	test('Get new registrant info', function(done) {
		console.log('Getting info of registrant',registrantToAddAddress);
		sdk.consumer.getRegistrant(registrantToAddAddress).then(function(data){
			console.log('Registrant data', sdk.consumer.decodeRegistrant(data[1]));
            done();
        });
	});

	test('Edit Registrant', function(done) {
		console.log('Editing registrant',registrantToAddAddress);
		sdk.certifier.editRegistrant(registrantToAddAddress, registrantToAdd, true).then(function(tx){
            waitForTx(tx, function(txData){
				assert.notEqual(txData.logs[0].data.toString(), '0x0000000000000000000000000000000000000000000000000000000000000001', 'Registrant address not registered or not CA permission.');
                waitBlocks(1,done);
            })
        });
	});

	test('Get edited registrant info', function(done) {
		console.log('Getting edited info of registrant',registrantToAddAddress);
		sdk.consumer.getRegistrant(registrantToAddAddress).then(function(data){
			console.log('Registrant data', sdk.consumer.decodeRegistrant(data[1]));
            done();
        });
	});

	test('Add Thing', function(done) {
		console.log('Adding thing', thingToAdd.data.name);
		sdk.registrant.createThing(thingToAdd, 1).then(function(tx){
            waitForTx(tx, function(txData){
				assert.notEqual(txData.logs.length, 0, 'Cant add new things if you are not a registrant');
				assert.equal(txData.logs[0].data.toString(), '0x0000000000000000000000000000000000000000000000000000000000000001', 'Identity already used');
                waitBlocks(1,done);
            })
        });
	});

	test('Get Things', function(done) {
		console.log('Get Things..');
		sdk.consumer.getThings(true, config.fromBlock, function(things){
            console.log(things.length, 'Things registered');
            if (things.length > 0){
                console.log('Getting Thing', things[0].args.identity);
                sdk.consumer.getThing(things[0].args.identity).then(function(thing){
                    console.log('Thing', things[0].args.identity, 'data:',thing);
                    done();
                });
            } else {
                done();
            }
        });
	});

    test('Get Registrants', function(done) {
		console.log('Get Registrants..');
		sdk.consumer.getRegistrants(false, config.fromBlock, function(registrants){
            console.log(registrants.length, 'Registrants registered');
            if (registrants.length > 0){
                console.log('Getting Registrant', registrants[0].args.registrant);
                sdk.consumer.getRegistrant(registrants[0].args.registrant).then(function(registrant){
                    console.log('Registrant', registrants[0].args.registrant, 'data:',sdk.consumer.decodeRegistrant(registrant[1]));
                    done();
                });
            } else {
                done();
            }
        });
	});

});
