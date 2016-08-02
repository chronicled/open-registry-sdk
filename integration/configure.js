
var assert = require("assert");
var ProtoBuf = require("protobufjs");
var OrUtils = require('../open-registry-utils');
var Web3 = require('web3');
var ByteBuffer = require('bytebuffer');
var ConsumerSdk = require('../lib/consumer.js');
var RegistrantSdk = require('../lib/registrant.js');
var CertifierSdk = require('../lib/certifier.js');
var Provider = require('../lib/provider.js');

builder = ProtoBuf.loadJson(require('../schemas/schema.proto.json'));
var Schema = builder.build("Schema").Schema;

console.log("Test configure init");

var config = require('./config');

web3 = new Web3();

var provider = null;

var sdk = null;

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

var contracts = {
  registryAddress : config.registryAddress,
  registryAbi : config.registryABI,
  registrarAddress : config.registrarAddress,
  registrarABI : config.registrarABI,
}

describe('Open Registry SDK', function() {

    test('Start certifier SDK', function(done) {
		console.log('Starting certifier sdk..');
		web3.setProvider(new web3.providers.HttpProvider(config.urlProvider));
		provider = new Provider(config.urlProvider, config.seedKey, contracts, 'certifier', function(newSdk){
			sdk = newSdk;
			done();
		});
	});

	test('Configure Registrar', function(done) {
		console.log('Configuring registrar address..');
		sdk.setRegistrar(config.registrarAddress).then(function(tx){
			waitForTx(tx, function(txData){
				if (txData.logs.length > 0){
					assert.notEqual(parseInt(txData.logs[0].data.substring(65,66)),3, 'Already configured');
				}
				waitBlocks(1,done);
			})
		});
	});

    test('Start consumer SDK', function(done) {
		console.log('Starting consumer sdk..');
		web3.setProvider(new web3.providers.HttpProvider(config.urlProvider));
		provider = new Provider(config.urlProvider, config.seedKey, contracts, 'consumer', function(newSdk){
			sdk = newSdk;
			done();
		});
	});

    test('Get registrar address from registry Registrar', function(done) {
		console.log('Configuring registrar address..');
		sdk.getRegistrarAddressOnRegistry().then(function(address){
			console.log('Registrar address:', address);
            done()
		});
	});

});
