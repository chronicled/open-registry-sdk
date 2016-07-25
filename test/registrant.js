
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

console.log("Test registrant init");

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

});
