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

module.exports = {
  entry: path.join(__dirname, 'index.js'),
  target: 'node',
  output: {
    path: path.join(__dirname, 'build'),
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    preLoaders: [
      {test: /\.json/, loader: "json-loader"}
    ],
    noParse: /node_modules\/json-schema\/lib\/validate\.js/,
    loaders: [{
      test: /\.js/,
      loader: "babel",
      query: {
        presets: ['es2015']
      }
    }]
  },
  node: {
    console: true,
    fs: "empty",
    net: 'empty',
    tls: 'emtpy'
  },
  plugins: [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
  ]
};
