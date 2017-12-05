const fs = require('fs');
const affirm = require('affirm.js');
let configuration;

if(!process.argv[2]) {
	console.error('You must specify the function to call');
	process.exit(0);
}
if(!process.argv[3]) {
	console.error('You must pass the private key json file location');
	process.exit(0);
}

// Select the right configuration json
if(process.env.NODE_ENV === 'testnet') configuration = require('./testnet.json');
else if(process.env.NODE_ENV === 'livenet') configuration = require('./livenet.json');
else configuration = require('./develop.json');

function getPrivateKey() {
	if(!process.argv[3]) {
		console.error('You must provide the location of the private key file');
		process.exit(0);
	}
  affirm(process.argv[3], 'Provide private key file location of Operator');
  try {
    let keyFile = fs.readFileSync(process.argv[3]);
    return JSON.parse(keyFile).privateKey;
  } catch (e) {
    console.log("Operator private ky file is invalid.", process.argv[3], e);
    process.exit(1);
  }
}

module.exports = {configuration, key: getPrivateKey()};
