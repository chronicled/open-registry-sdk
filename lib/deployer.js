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
  var that = this;
  var contractCode = that.readSourceCode(contractPath);
  var w = that.Waiter();

  that.web3.eth.compile.solidity(contractCode, function(err, compiled) {
    if (err) {
      w.c(err);
      return;
    } else {
      var Contract = that.web3.eth.contract(compiled[contractName].info.abiDefinition);
      Contract.new({from: that.address, gas: 3000000, data: that.addHexPrefix(compiled[contractName].code)}, function(err, contract) {
        if (!err) {
          if(!contract.address) {
             console.log(contract.transactionHash);
          } else {
             console.log('Broadcasted & Mined');
             that.contract = contract;
             w.txMined(null, contract.transactionHash, false, contract);
          }
        }
      });
    }
  });

  return w.p;
};

Deployer.prototype.addHexPrefix = function(hex) {
  if (hex.slice(0, 2) != '0x') {
    hex = '0x' + hex;
  }
  return hex;
};

Deployer.prototype.Waiter = function() {
  var that = this;

  return new function() {
    var f, r;
    var this_ = this;

    this.c = function(error, data) {
      if (error) {
        r(error);
      } else {
        f(data);
      }
    };
    this.p = new Promise(function(fulfill, reject) {f = fulfill, r = reject});

    this.txMined = function(error, txHash) {
      if (error) {
        console.error(error);
      }

      var args = [].slice.apply(arguments, [2]);
      that.waitForTx(txHash, function() {
        if (args.length == 0) {
          args = [].slice.apply(arguments);
          args.unshift(null); // Error position
        }

        this_.c.apply(this_, args);
      });
    }
  }
};
