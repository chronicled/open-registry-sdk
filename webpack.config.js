var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: path.join(__dirname, 'index.js'),
    output: {
        path: path.join(__dirname, 'browser'),
        filename: "bundle.min.js",
        library: "OpenRegistrySDK",
        libraryTarget: "var"
    },
    module: {
        preLoaders: [
            { test: /\.json/, loader: "json-loader" }
        ],
        loaders: [
            {
                test: /\.js/,
                exclude: /node_modules\/(?!(ethereumjs-tx|web3-provider-engine|es6-promises)\/).*/,
                loader: "babel",
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },
    node: {
      fs: "empty"
    },
    plugins: [
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
    ]
};