var Promise = require('bluebird');

function Deployer(provider) {
  this.address = provider.getAddress();
  this.web3 = provider.getWeb3();
  this.provider = provider;
}

Deployer.prototype.readSourceCode(path) {
  var dir = require('path').dirname(file);
  var source = fs.readFileSync(file).toString('ascii');

  // Parse "import" statements and inject contract code instead.
  var reg = new RegExp(/import\s+['"]([^'"\n]+)['"];/g);

  while ((match = reg.exec(source)) !== null) {
    var wholeMatch = match[0];
    var importFile = match[1];

    var subfileContent = this.readSourceCode(dir + '/' + importFile);
    source = source.slice(0, reg.lastIndex - wholeMatch.length) + subfileContent + source.slice(reg.lastIndex);
    reg.lastIndex += subfileContent.length;
  }

  return source;  
};

Deployer.prototype.deployContract(contractPath, contractName) {
  return new Promise(function(resolve, reject) {
    var that = this;
    var contractCode = that.readSourceCode(contractPath);
    that.web3.eth.compiled.solidity(contractCode, function(err, compiled) {
      if (err) {
        return reject(err);
      } else {
        var Contract = that.web3.eth.contract(compiled[contractName].info.abiDefinition);
        Contract.new({from: that.address, gas: 3000000, data: that.addHexPrefix(compiled[contractName].code)}, function(err, contract) {
          if (err) {
            return reject(err);
          } else {
            return resolve(contract);
          }
        });
      }
    });
  });
};

Deployer.prototype.addHexPrefix = function(hex) {
  if (hex.slice(0, 2) != '0x') {
    hex = '0x' + hex;
  }
  return hex;
};
