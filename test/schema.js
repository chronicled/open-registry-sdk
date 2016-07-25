
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

console.log("Test schema init");

var config = require('./config');

web3 = new Web3();

var provider = null;

var schemaToGet = 1;

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

});
