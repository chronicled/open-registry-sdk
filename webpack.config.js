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
var ignore = new webpack.IgnorePlugin(/README.md/);


module.exports = {

  target: 'node',
  entry: "./index.js",
  output: {
    path: path.join(__dirname, 'build'),
    filename: libraryName + ".js",
    library: libraryName,
    libraryTarget: "commonjs2",
  },
  resolve: {
    extensions: ['', '.js', 'index.js', '.json', 'index.json'],
    modulesDirectories: [
      'node_modules'
    ]
  },
  module: {
    preLoaders: [
      {test: /\.json$/, loader: 'json'}
    ],
    noParse: [/(node_modules\/json-schema\/lib\/validate\.js|\.md)/],
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
          plugins: ['transform-remove-strict-mode']
        }
      }
    ]
  },
  resolveLoader: {
        root: path.join(__dirname, 'node_modules'),
        packageMains: ['json-loader']
  },
  //devtool: 'sourcemap',
  plugins: [
    ignore,
    //new webpack.BannerPlugin('require("source-map-support").install();', {raw: true, entryOnly: false}),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
  ]
};
