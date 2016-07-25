
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

console.log("Test consumer init");

var config = require('./config');

web3 = new Web3();

var provider = null;

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
