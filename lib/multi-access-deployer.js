var Promise = require('bluebird');

function MultiAccessDeployer(provider) {
  this.address = provider.getAddress();
  this.web3 = provider.getWeb3();
  this.provider = provider;
  this.multiAccessFactoryAddress = provider.multiAccessFactoryAddress;
  this.multiAccessFactory = provider.getMultiAccessFactory();
}

/**
 * Deploys new MultiAccess contract
 * Must be instantiated from the owner of the MultiAccessFactory contract
 *
 * @param  {[type]} cosigners [description]
 * @return {String} Address of newly created multi access contract
 */
MultiAccessDeployer.prototype.deployMultiAccess(cosigners) {
  const eventsHelper = EventsHelper();
  return this.multiAccessFactory.createMultiAccessContractAsync(cosigners, {from: this.address})
  .then(function(txHash) {
    const watcher = this.multiAccessFactory.Created();
    return eventsHelper.getEvents(txHash, watcher);
  })
  .then(function(events) {
    return events[0].args.multiaccess;
  });
}

var EventsHelper = function() {
  var allEventsWatcher = undefined;

  var waitReceipt = function(transactionHash, address) {
    return new Promise(function(resolve, reject) {
      var transactionCheck = function() {
        var receipt = this.web3.eth.getTransactionReceipt(transactionHash);
        if (receipt) {
          var count = 0;
          if (address) {
            receipt.logs.forEach(function(log) {
              count += log.address === address ? 1 : 0;
            });
          } else {
            count = receipt.logs.length;
          }
          return resolve(count);
        } else {
          setTimeout(transactionCheck, 100);
        }
      };
      transactionCheck();
    });
  };

  var waitEvents = function(watcher, count, txHash) {
    return new Promise(function(resolve, reject) {
      var transactionCheck = function() {
        watcher.get(function(err, events) {
          if (err) {
            return reject(err);
          }
          eventsTx = events.filter(function(event) { return event.transactionHash == txHash; });
          if (eventsTx) {
            if (eventsTx.length == count) {
              return resolve(eventsTx);
            }
            if (eventsTx.length > count) {
              return reject("Filter produced " + eventsTx.length + " events, while receipt produced only " + count + " logs.");
            }
          }
          setTimeout(transactionCheck, 100);
        });
      };
      transactionCheck();
    });
  };

  this.getEvents = function(transactionHash, watcher) {
    if (allEventsWatcher === undefined) {
      throw "Call setupEvents before target transaction send."
    }
    return new Promise(function(resolve, reject) {
      waitReceipt(transactionHash, watcher.options.address).then(function(logsCount) {
        return waitEvents(allEventsWatcher, logsCount, transactionHash);
      }).then(function() {
        watcher.get(function(err, events) {
          if (err) {
            return reject(err);
          }
          var filtered = events.filter(function(event) {
            return event.transactionHash === transactionHash;
          });
          return resolve(filtered);
        });
      });
    });
  };

  this.setupEvents = function(contract) {
    allEventsWatcher = contract.allEvents();
  }
};
