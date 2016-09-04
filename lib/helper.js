module.exports = {
  catcher: function catcher(promiseFunction) {
    return Promise.resolve().then(function() {
      return new Promise(promiseFunction);
    });
  l}
};