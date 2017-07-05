/* eslint-env node, mocha */
// Copyright 2016 Chronicled
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var expect = require('chai').expect;
var sinon = require('sinon');
require('chai').use(require('sinon-chai'));
var Provider = require('../lib/provider');
var provider;


var thingToAdd = {
  identities: ['pbk:ec:secp256r1:0360fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f04'],
  data: {
    name: 'Test thing',
    description: 'Test description of the thing'
  }
};

var thingResponse = [
  [ '0x1070626b3a65633a73656370323536723100210360fed4ba255a9d31c961eb74',
    '0xc6356d68c049b8923b61fa6ce669622e60f29f04000000000000000000000000' ],
  [ '0x0a0a54657374207468696e67121d54657374206465736372697074696f6e206f',
    '0x6620746865207468696e67' ],
  1,
  '0a054261736963123f536368656d612077697468206f6e65206f72206d6f7265206964656e74697469657320616e64206f6e65206e616d6520616e64206465736372697074696f6e1a4c6d657373616765205468696e67207b206f7074696f6e616c20737472696e67206e616d65203d20313b206f7074696f6e616c20737472696e67206465736372697074696f6e203d20323b207d',
  '0x300221400d539cb5d15940c56239e6353287eba2',
  true
];

// get schemaHex like this:
// > var schema = new Schema({name:"basic",description:"desc",definition:"message Thing {required string service_url = 1;}"});
// > schema.encodeHex();
var schemaHex = '0a054261736963123f536368656d612077697468206f6e65206f72206d6f7265206964656e74697469657320616e64206f6e65206e616d6520616e64206465736372697074696f6e1a4c6d657373616765205468696e67207b206f7074696f6e616c20737472696e67206e616d65203d20313b206f7074696f6e616c20737472696e67206465736372697074696f6e203d20323b207d';

describe('Registrant SDK', function() {

   beforeEach(function () {
      provider = new Provider('', 'registrar');
   });

  it('should allow to read Thing and parse into object.', function(done) {
    sinon.stub(provider.registry, 'getThing').yields(null, thingResponse);

    provider.getThing(thingToAdd.identities[0]).then(function(rv) {
      expect(rv.data.name).to.eql(thingToAdd.data.name);
      done();
    }).catch(done);
  });

  it('should allow to create Thing that is correctly serialized.', function(done) {
    sinon.stub(provider.registry, 'createThing').yields(null, '0x4321');
    sinon.stub(provider.registry, 'schemas').yields(null, schemaHex);

    provider.createThing(thingToAdd).then(function(rv) {
      expect(provider.registry.createThing).calledWith(thingResponse[0], thingResponse[1], sinon.match.any, sinon.match.any);
      expect(rv).to.eql('0x4321');
      done();
    }).catch(done);
  });

  it('should allow to create Thing with reference for each id.');

  it('should allow to batch-create Things.');

});










var registrantToAddAddress = '0x6f37ffcf91bf95fd5956a6e82fac965a81efbe84';
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
};
//created by creating protbuf from the object above and then calling '.encodeHex()'
var regEncoded = '0x0a0f546573742052656769737472616e74122254657374206465736372697074696f6e206f66207468652072656769737472616e741a1374657374406368726f6e69636c65642e636f6d2216687474703a2f2f74657374776562736974652e636f6d2a115465737420436f6d70616e7920494e432e32420a0e526564207374726565742036363612001a0d53616e204672616e636973636f220a43616c69666f726e69612a0436363636320d556e6974656420537461746573';

describe('Certifier SDK', function() {

  it('should allow to add registrant.', function(done) {

    sinon.stub(provider.registrar, 'add').yields(null, 'txhash');

    provider.addRegistrant(registrantToAddAddress, registrantToAdd).then(function() {
      expect(provider.registrar.add).calledWith(registrantToAddAddress, regEncoded, sinon.match.any, sinon.match.any);
      done();
    }).catch(done);
  });

  it('should allow to edit registrant.');

});
