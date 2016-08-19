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
