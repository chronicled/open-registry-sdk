cp -R $(ls | grep -v '^build$' | grep -v '^\.') build/
node_modules/babel-cli/bin/babel.js --presets es2015 node_modules/web3-provider-engine --out-dir build/node_modules/web3-provider-engine
node_modules/babel-cli/bin/babel.js --presets es2015 node_modules/ethereumjs-tx --out-dir build/node_modules/ethereumjs-tx
