# Chronicled Authenticator SDK

This lib can be used on node-backend with an unmanaged key (passed programatically).

## Registrant Usage

As a registrant, i can write new assets to the blockchain and read them back by reference.

```js
//dependencies
var RegistrantSdk = require('./lib/registrant.js');
var Provider = require('./lib/provider.js');

//setting up provider for reading and writing
var secretSeed = 'general famous baby ritual flower gift exit admit rice order addict cash';
var rpcUrl = 'http://52.28.142.166:8555';

var provider = new Provider(rpcUrl, secretSeed);

//setting up sdk with provider and address of contract
var registryAddress = '0x2f3b8814c136ea5640a5c1da75f666f1565ba4ae';

var registrant = new RegistrantSdk(provider, registryAddress);

//playing with the registry
var asset = {
    identities: [{
        uri: 'pubkey-ecc://10238a3b4610238a3b4610238a3b4610238a3b4610238a3b46'
    }],
    data: null
};

registrant.createAsset(asset, 'refX').then(function(data) {
    console.log(data);
});

registrant.getAsset('refX').then(function(data) {
    console.log(data);
});
```

## Consumer Usage

As a consumer, i can can read assets from the blockchain and use the public key for verification.
```js
//dependencies
var ConsumerSdk = require('./lib/consumer.js');
var Provider = require('./lib/provider.js');

//setting up provider for reading
var provider = new Provider('http://52.28.142.166:8555');
var registryAddress = '0x2f3b8814c136ea5640a5c1da75f666f1565ba4ae';

var consumer = new ConsumerSdk(provider, registryAddress);

consumer.getAsset('ref3').then(function(data) {
    console.log(data);
});
```

## Certifier Usage

As a certification authority, I can whitelist registrants, blacklist them, and read a list of active registrants back.

```js
//dependencies
var CertifierSdk = require('./lib/certifier.js');
var Provider = require('./lib/provider.js');

//setting up provider for reading and writing
var secretSeed = 'general famous baby ritual flower gift exit admit rice order addict cash';
var rpcUrl = 'http://52.28.142.166:8555';

var provider = new Provider(rpcUrl, secretSeed);

//setting up sdk with provider and address of contract
var registrarAddress = '0x3811199c2e19592aa7df1ea96ad8cb9675343557';

var certifier = new CertifierSdk(provider, registrarAddress);

//playing with the registry
certifier.addRegistrant("0x7111b812c1f8c93abb2c795f8fd5a202264c1111").then(function(data) {
    console.log(data);
});

certifier.listActiveRegistrants().then(function(data) {
    console.log(data);
});

```

## Storage Schema

Due to the limitation, that public functions can not receive arrays of dynamicly-sized types, data in the storage of the contract has been sliced into `byte32` records. The content of the arrays is encoded tightly using the a protobuf schema. The schema is stored in the contract, and each Asset record contains a reference to a schema. A schema can look like this:

```
message Asset {    
  repeated Identity identities = 1; 
  optional Data data = 2;           
}                                   
                                    
message Identity {                  
  required string uri = 1;          
}                                   
                                    
message Data {                      
  optional string MymeType = 1;     
  optional string brandName = 2;    
}
```

### Creating a record

1. receive a javascript object

2. validate object against schema

3. serialize object to bytes using protobuf

4. slize byte-array into 32-byte chunks

5. call contract interface

### Reading a record

1. call contract and receive array of `bytes32`

2. concatanate array

3. read schema from contract

4. parse array using protobuf and validate with schema

5. get javascript object
