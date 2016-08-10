# Chronicled Authenticator SDK

This lib can be used on node-backend with an unmanaged key (passed programatically).

## Registrant Usage

As a registrant, i can write new Things to the blockchain and read them back by identity.

```js
//dependencies
var RegistrantSdk = require('./lib/registrant.js');
var Provider = require('./lib/provider.js');

//setting up provider for reading and writing
var secretSeed = 'general famous baby ritual flower gift exit admit rice order addict cash';
var rpcUrl = 'http://52.28.142.166:8555';

var provider = new Provider(rpcUrl, secretSeed);

//setting up sdk with provider and address of contract
var registryAddress = '0x445116d182627e5a68878daa21fbf61845c02ef9';

var registrant = new RegistrantSdk(provider, registryAddress);

//playing with the registry
var thing = {
    identities: [ {
        pubKey: ByteBuffer.fromHex('10238a3b4610238a3b4610238a3b4610238a3b4610238a3b46'),
        schema: 'urn:test' } ],
    data: null
};

registrant.createThing(thing, 1).then(function(data) {
    console.log(data);
});

registrant.getThing('0x10238a3b4610238a3b4610238a3b4610238a3b4610238a3b46').then(function(data) {
    console.log(data);
});

//or

registrant.getThing('0x10238a3b4610238a3b4610238a3b4610238a3b4610238a3b46').then(function(data) {
    console.log(data.identities[0].pubKey.toString('hex'));
});
```

## Consumer Usage

As a consumer, i can can read Things from the blockchain and use the public key for verification.
```js
//dependencies
var ConsumerSdk = require('./lib/consumer.js');
var Provider = require('./lib/provider.js');

//setting up provider for reading
var provider = new Provider('http://52.28.142.166:8555');
var registryAddress = '0x445116d182627e5a68878daa21fbf61845c02ef9';

var consumer = new ConsumerSdk(provider, registryAddress);

consumer.getThing('0x10238a3b4610238a3b4610238a3b4610238a3b4610238a3b46').then(function(data) {
    console.log(data);
});

consumer.getRegistrant('0x7111b812c1f8c93abb2c795f8fd5a202264c1111').then(function(data) {
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
var registrarAddress = '0xa1764df8d613c2223f09af603f527dbb207fcc43';

var certifier = new CertifierSdk(provider, registrarAddress);

var regData = {
    name: "required value here",
    description: "required value here",
    contact: "required value here",
    website: "required value here",
    legalName: "required value here",
    address: {
        street_1: "required value here",
        street_2: "optional value here",
        city: "required value here",
        state: "optional value here",
        zip: "required value here",
        country: "required value here"
    }
}

//Add a registrant
certifier.addRegistrant('0x7111b812c1f8c93abb2c795f8fd5a202264c1111', registrantObject).then(function(data) {
    console.log(data);
});

//Add a schema
var schemaData = "Schema name" + ";#;" + "Schema description" + ";#;" + "Schema definition";
certifier.addChema(schemaData).then(function(data) {
    console.log(data);
});
```

## Storage Schema

Due to the limitation, that public functions can not receive arrays of dynamicly-sized types, data in the storage of the contract has been sliced into `byte32` records. The content of the arrays is encoded tightly using the a protobuf schema. The schema is stored in the contract, and each Thing record contains a reference to a schema. A schema can look like this:

```
message Thing {
  repeated Identity identities = 1;
  optional Data data = 2;
}

message Identity {
  required bytes pubKey = 1;
  optional string schema = 2;
}

message Data {
  optional string name = 1;
  optional string description = 2;
}
```

### Registrant schema

```
message Registrant {
    required string name = 1;
    required string description = 2;
    required string contact = 3;
    required string website = 4;
    required string legalName = 5;
    required Address legalAddress = 6;
}

message Address {
    required string street_1 = 1;
    optional string street_2 = 2;
    required string city = 3;
    optional string state = 4;
    required string zip = 5;
    required string country = 6;
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


## Integration testing

To run a full integration test first configure the config file on integration/config.js. After doing it you can run a complete inetgration test with `npm run integration`, to tests specific methods another scripts like `npm run integration-configure` `npm run integration-schema` `npm run integration-registrant` `npm run integration-thing` `npm run integration-consumer` are available.
