
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

console.log("Test thing init");

var config = require('./config');

web3 = new Web3();

var provider = null;

var thingToAdd = {
	identities: ["pbk:ec:secp256r1:0211fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6", "ble:1.0:aabbccddeeff"],
	data: {
		service_url: 'http://test.com/1.json',
	}
};


var severalIds = ["pbk:ec:secp256r1:0211fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f03", "ble:1.0:aabbccddee01", "pbk:ec:secp256r1:0222fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6"]
var things = [
	{identities: severalIds.slice(0, 2), data: {service_url: 'abc.com'}},
	{identities: severalIds.slice(-1), data: {service_url: 'http://chronicled.com/'}},
];


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

	test('Add Things', function(done) {
		console.log('Adding things', thingToAdd.data.name);
		sdk.registrant.createThing(things, 1).then(function(tx){
            waitForTx(tx, function(txData){
				assert.notEqual(txData.logs.length, 0, 'Cant add new things if you are not a registrant');
				assert.equal(txData.logs[0].data.toString(), '0x0000000000000000000000000000000000000000000000000000000000000001', 'Identity already used');
                waitBlocks(1,done);
            })
        });
	});

});
