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

var path = require('path');
var webpack = require('webpack');
var libraryName = 'open-registry-sdk';
var outputFile = libraryName + '.js';
var nodeExternals = require('webpack-node-externals');


module.exports = {

  target: 'node',
  externals: {
    'crypto': 'crypto',
    'memcpy': 'memcpy',
    'sha3': 'sha3',
    'fs': 'fs',
    'vertx': 'vertx',
  },
  entry: "./index.js",
  output: {
    path: path.join(__dirname, 'build'),
    filename: libraryName + ".js",
    library: libraryName,
    libraryTarget: "umd",
    umdNamedDefine: true
  },

  node: {
    // fs: "empty",
    console: false,
    global: true,
    process: true,
    Buffer: true,
  },

  resolve: {
    extensions: ['', '.js', 'index.js', '.json', 'index.json'],
    modulesDirectories: [
      'node_modules'
    ]
  },

  module: {
    preLoaders: [
        { test: /\.json$/, loader: 'json'}
    ],
    noParse: [/(node_modules\/json-schema\/lib\/validate\.js|\.md)/, /node_modules\/crypto-js/],
    loaders: [
        { test: /\.js$/,
          exclude: [
            // /node_modules\/(?!(ethereumjs-tx|web3\-provider\-engine|crypto\-js)\/).*/,
            ///node_modules\/crypto-js/
          ],
          loader: 'babel',
          query: {
            presets: ['es2015'],
            plugins: ['transform-remove-strict-mode']
          }
        },
    ]
  },
  resolveLoader: {
        root: path.join(__dirname, 'node_modules'),
        packageMains: ['json-loader']
  },
  devtool: '#eval',

  plugins: [
    new webpack.ProvidePlugin({
      'Promise': 'es6-promise',
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
  ]
};
