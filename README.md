# Open Registry for IoT: SDK

## Introduction

Presented SDK provides you with interfaces to all Open Registry smart contracts' APIs in Ethereum blockchain.

Entities of the Open Registry for IoT:
- Registrant — entity which is allowed to create new records, e.g. adding new Things.
  Contains blockchain address, real-world address, legal information.
- Thing — record which represents real-world object, like:
  device, ticket, credit card, access card, any kind of product (bike, shoe, car, coffee maker), etc.
  Contains identities of the Thing (public key, wireless device id, hashed serial number) and it's metadata (name, description, service url... fully customizable data set);
- Metadata schema — is a Protocol Buffers schema describing which data fields which can go into Thing's metadata.
  Currently Registrar is managing those schemas, but any Registrant will be allowed to that in next release iteration.
- Registrar — is a whitelisting organization, have rights to add new Registrants. Basically it's needed just to verify that Registrant's details are correct.
  We're still figuring out best possible solution and in next iterations it may end up as:
  - decentralized autonomous whitelisting organization;
  - anyone can register without permission, and certifiers will be introduced to validate Registrants.
    And it will be a matter of trust from community to accept "approvals" from those certifiers.

Please find information on smart contracts and Thing's identity format in the repo [TODO: include ethereum repo link]


There's 3 basic user-roles, and functionality is wrapped around them:
- Consumer — readonly access: fetch Things and Registrants, verify ECC and RSA signature of a hardware Thing.
- Registrant — add new Things to the Registry, add new identities to a Thing, update metadata, set Thing as invalid / disabled (can be useful if Thing is hacked, or manufacturer recalled product after publishing it in Open Registry).
- Registrar — add / whitelist Registrants, update it's data on request, set as disabled on request or if Registrant is compromised.

Note: When instantiating SDK, role name is provided, each higher-level role automatically inherits functionality from it's lower-level siblings.


## SDK Usage by Example

### Prerequisites

- Ethereum node up and running on mainnet, accepting RPC requests through http protocol. Find how to this in official instructions: https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum.
- Open Registry for IoT is installed: `npm install open-registry-sdk`

### Consumer

Can fetch Things and Registrants from smart contracts and verify Thing's signature.
```js
var Provider = require('open-registry-sdk');
var sdk = new Provider('http://localhost:8545');

consumer.getThing('pbk:ec:secp256r1:03267b55460f97c2b5db61296b89fb976be632170900ca4f063fda13be5deb334c').then(function(thing) {
    console.log(thing);
});

consumer.getRegistrant('0x4a282993420bd9770b410b9b0324f2b8bf5964ab').then(function(registrant) {
    console.log(registrant);
});


var identity = 'pbk:ec:secp256r1:0360fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6';
var message = 'af2bdbe1aa9b6ec1e2ade1d694f41fc71a831d0268e9891562113d8a62add1bf';
// Message signed by Thing
var signature = '3046022100efd48b2aacb6a8fd1140dd9cd45e81d69d2c877b56aaf991c34d0ea84eaf3716022100f7cb1c942d657c41d436c7a1b6e29f65f3e900dbb9aff4064dc4ab2f843acda8';
// Returns true if signature is correct
consumer.verifyIdentity(identity, message, signature);

```


### Registrant

Can create and manage Things.

[TODO: publish private key of the community Registrant]
Note: when creating Thing unique identities have to be used.

```js
var Provider = require('open-registry-sdk');

// Registrant's private key or mnemonic
var secret = '651fd614a325efb4a68a8f2c3368ee25f46043596dbbb329d1bb4cfcfe1ff265';
var rpcUrl = 'http://localhost:8545';

var sdk = new Provider(rpcUrl, 'registrant', secret);

// Creating Thing
var thing = {
  identities: ["pbk:ec:secp256r1:0211fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f01", "ble:1.0:0011223344"],
  data: {
    name: 'Demo Thing',
    description: 'This is demo product',
    service_url: 'chronicled.org/demo.json'
  }
}

sdk.createThing(thing, 1).then(function(txHash) {
  // Ethereum transaction hash. Can be used to lookup status of the transaction and it's details.
  console.log(txHash);
});


// Fetching Thing from registry. After transaction is committed.
sdk.getThing("ble:1.0:0011223344").then(function(thing) {
    console.log(thing);
});


// Alternatively. Both identities are searchable.
sdk.getThing('pbk:ec:secp256r1:0211fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f01').then(function(thing) {
    console.log(thing);
});


// Update Thing's data
var data = {
  name: 'Demo Thing, New label same quality',
  description: 'This is demo product, which looks better',
  service_url: 'chronicled.org/demo.json'
};

sdk.updateThingData("ble:1.0:0011223344", data).then(function(txHash) {
  // Ethereum transaction hash. Can be used to lookup status of the transaction and it's details.
  console.log(txHash);
});


// Add identity
sdk.addIdentities("ble:1.0:0011223344", ["sn:12345678"]).then(function(txHash) {
  // Ethereum transaction hash. Can be used to lookup status of the transaction and it's details.
  console.log(txHash);
});


// Set Thing valid / invalid. Available when executing sdk.getThing() as one of parameters of returned object.
var valid = false;
sdk.setThingValid("ble:1.0:0011223344", valid).then(function(txHash) {
  // Ethereum transaction hash. Can be used to lookup status of the transaction and it's details.
  console.log(txHash);
});

```
Also `createThings()` method is available to create multiple Things in one call, which allows to save on transaction cost.


### Registrar

Whitelisting, Thing metadata schema functionality.

```js
var Provider = require('open-registry-sdk');

var secret = '<private key>';
var rpcUrl = 'http://localhost:8545';

var sdk = new Provider(rpcUrl, 'registrar', secret);


// Add Registrant
var registrant = {
    name: "Company",
    description: "Open Registry participator",
    contact: "+1 800 123 4567",
    website: "company.com",
    legalName: "Company Inc.",
    address: {
        street_1: "121 Minna Street",
        street_2: "",
        city: "San Francisco",
        state: "CA",
        zip: "94000",
        country: "USA"
    }
};

var address = '0x7111b812c1f8c93abb2c795f8fd5a202264c1111';
sdk.addRegistrant(address, registrant).then(function(txHash) {
  // Ethereum transaction hash. Can be used to lookup status of the transaction and it's details.
  console.log(txHash);
});


// Get Registrant's information. After transaction is committed
sdk.getRegistrant(address).then(function(registrant) {
  // Ethereum transaction hash. Can be used to lookup status of the transaction and it's details.
  console.log(registrant);
});


//Add Thing metadata schema
var metadataSchema = 'message Thing { optional string name = 1; optional string description = 2; optional string service_url = 3; }';

var schemaContainer = {
	name: 'Default.v1',
	description: 'Basic schema with suggested fields to describe Thing',
	definition: metadataSchema
};

sdk.createSchema(schemaContainer).then(function(txHash) {
  // Ethereum transaction hash. Can be used to lookup status of the transaction and it's details.
  console.log(txHash);
});
```


## Metadata

### Thing Metadata Format

Due to the limitation, that public functions can not receive arrays of dynamicly-sized types, data in the storage of the contract has been sliced into `byte32` records. The content of the arrays is encoded tightly using the a protobuf schema. The schema is stored in the contract, and each Thing record contains a reference to a schema. A schema can look like this:

```
message Thing {
  optional string name = 1;
  optional string description = 2;
  optional string service_url = 3;
}
```


Schema itself is stored as a string in a Schema container's `definition` field:

```
message Schema {
    required string name = 1;
    required string description = 2;
    required string definition = 3;
}
```

### Registrant Metadata Protocol Buffers Schema

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
