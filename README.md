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
- Registrar — is an organization that helps with onboarding of new Registrants (including confirmation of Registrant identities). We support only one Registrar in this release and we are working to support multiple Registrars in future releases.

Please find information on smart contracts and Thing's identity format in the repo [TODO: include ethereum repo link]


There's 3 basic user-roles, and functionality is wrapped around them:
- Consumer — read-only access: fetch Things and Registrants, verify ECC and RSA signature of a hardware Thing.
- Registrant — add new Things to the Registry, add new identities to a Thing, update metadata, set Thing as invalid / disabled (can be useful if manufacturer recalls product after publishing it in Open Registry).
- Registrar — onboard, update, and disable Registrants.

Note: When instantiating SDK, role name is provided, each higher-level role automatically inherits functionality from its lower-level siblings.


## SDK Usage by Example

Examples provided for testnet, since we're publishing private keys of Community Registrant, so anyone can try it out right away.
SDK itself is configured to work on mainnet by default, though in order to add Things you would need to be added as Registrant.
Which you can request here http://chronicled.org/connect.html

### Prerequisites

- Ethereum node up and running on testnet, accepting RPC requests through http protocol. Find how to do it in official instructions: https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum. Run `geth` with `--testnet` param.
- Open Registry for IoT SDK is installed: `npm install open-registry-sdk`

### Consumer

Can fetch Things and Registrants from smart contracts and verify Thing's signature.
```js
var Provider = require('open-registry-sdk');
var contracts = {registrarAddress: '0xd76bc6a9eac205734b6fa2f72383db8f0ddecf64', registryAddress: '0x885ef67217954b7fd5d9cd7e79f3aba1599cffe0'};
var sdk = new Provider('http://localhost:8545', 'consumer', null, contracts);

sdk.getThing('ble:1.0:00112233').then(function(thing) {
    console.log(thing);
});

sdk.getRegistrant('0x8de0dcbdb81e09c4a0a6625ee145c3997c0a2cac').then(function(registrant) {
    console.log(registrant);
}).catch(console.log); // Way to get errors from operation.


// ECC public key, stored in Open Registry
var identity = 'pbk:ec:secp256r1:0360fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6';
var message = 'af2bdbe1aa9b6ec1e2ade1d694f41fc71a831d0268e9891562113d8a62add1bf';
// Message signed by Thing
var signature = '3046022100efd48b2aacb6a8fd1140dd9cd45e81d69d2c877b56aaf991c34d0ea84eaf3716022100f7cb1c942d657c41d436c7a1b6e29f65f3e900dbb9aff4064dc4ab2f843acda8';
// Returns true if signature is correct
consumer.verifyIdentity(identity, message, signature);

```


### Registrant

Can create and manage Things.

Note: when creating Thing unique identities have to be used.

```js
var Provider = require('open-registry-sdk');

// Registrant's private key or mnemonic. This is private key of Community Registrant
var privateKey = '590929699c129de953629deb3cff4bd166754dd7dada444d8e15941cbce31eab';

var contracts = {registrarAddress: '0xd76bc6a9eac205734b6fa2f72383db8f0ddecf64', registryAddress: '0x885ef67217954b7fd5d9cd7e79f3aba1599cffe0'};
var sdk = new Provider('http://localhost:8545', 'registrant', privateKey, contracts);

// Creating Thing
var thing = {
  // Change identities each time you create a Thing. Identity must always be unique.
  identities: ["pbk:ec:secp256r1:0211fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f52", "ble:1.0:0011223345"],
  data: {
    name: 'Demo Thing',
    description: 'This is demo product',
    service_url: 'chronicled.org/demo.json'
  }
}

// Note: if you encountered out of gas error, just add some free testnet ether to this address: 0x72e09c67f37524488089ad46b176eede3cb877b3
// google testnet wei faucet
sdk.createThing(thing).then(function(txHash) {
  // Ethereum transaction hash. Can be used to lookup status of the transaction and its details.
  // use sdk.getTransactionResult(txHash).then(...)
  // Alternatively check status of your transaction on https://testnet.etherscan.io/
  console.log(txHash);
});


// Fetching Thing from registry. After transaction is committed.
sdk.getThing("ble:1.0:0011223345").then(function(thing) {
    console.log(thing);
});


// Alternatively. Both identities are searchable.
sdk.getThing('pbk:ec:secp256r1:0211fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f52').then(function(thing) {
    console.log(thing);
});


// Update Thing's data
var data = {
  name: 'Demo Thing, New label same quality',
  description: 'This is demo product, which looks better',
  service_url: 'chronicled.org/demo.json'
};

sdk.updateThingData("ble:1.0:0011223345", data).then(function(txHash) {
  // Ethereum transaction hash. Can be used to lookup status of the transaction and it's details.
  console.log(txHash);
});


// Add identity
sdk.addIdentities("ble:1.0:0011223345", ["sn:12345678"]).then(function(txHash) {
  // Ethereum transaction hash. Can be used to lookup status of the transaction and it's details.
  console.log(txHash);
});


// Set Thing valid / invalid. Available when executing sdk.getThing() as one of parameters of returned object.
var valid = false;
sdk.setThingValid("ble:1.0:0011223345", valid).then(function(txHash) {
  // Ethereum transaction hash. Can be used to lookup status of the transaction and it's details.
  console.log(txHash);
});

// Add Thing metadata schema
var metadataSchema = 'message Data { optional string custom_field = 1 }';

var schemaContainer = {
  name: 'Custom.v1',
  description: 'Schema with additional custom field',
  definition: metadataSchema
};

// To be validated against schema before sending transaction
var testThingData = {
  name: 'Demo Thing, New label same quality',
  description: 'This is demo product, which looks better',
  service_url: 'chronicled.org/demo.json',
  data: {
    custom_field: 'version 1.0'
  }
};

sdk.createSchema(schemaContainer, testThingData).then(function(txHash) {
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


// Add Thing metadata standard schema
var metadataSchema = 'message Thing { optional string name = 1; optional string description = 2; optional string service_url = 3; optional Data data = 4; }';

var schemaContainer = {
	name: 'Default.v1',
	description: 'Basic schema with suggested fields to describe Thing',
	definition: metadataSchema
};

sdk.createStandardSchema(schemaContainer).then(function(txHash) {
  // Ethereum transaction hash. Can be used to lookup status of the transaction and it's details.
  console.log(txHash);
});
```


## Metadata

### Thing Metadata Format

Due to the limitation, that public functions can not receive arrays of dynamicly-sized types, data in the storage of the contract has been sliced into `bytes32` records. The content of the arrays is encoded tightly using the a protobuf schema. The schema is stored in the contract, and each Thing record contains a reference to a schema. A schema can look like this:

```
message Thing {
  optional string name = 1;
  optional string description = 2;
  optional string service_url = 3;
  optional Data data = 4;
}

message Data {}
```


Schema itself is stored as a string in a registry's Schema struct `definition` field:

```
struct Schema {
    string name;
    string description;
    string definition;
}

// Latest standard schema.
Schema public standardSchema;

// Things schemas.
Schema[] public schemas;
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

### In browser usage

- Build the minified bundle: `npm run build`
- Reference the script on your page: `<script src="./browser/bundle.min.js"></script>`
- Instantiate SDK: `var sdk = new OpenRegistrySDK();`
