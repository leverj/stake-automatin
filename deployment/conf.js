const fs = require('fs');
const affirm = require('affirm.js');
let env = process.env.NODE_ENV || 'develop';
let configuration = require(`./${env}.json`);

function getPrivateKey() {
  let pkfile = process.argv[3];
  if(!pkfile) {
		console.error('You must provide the location of the private key file');
		process.exit(0);
	}
  affirm(pkfile, 'Provide private key file location of Operator');
  try {
    let keyFile = fs.readFileSync(pkfile);
    return JSON.parse(keyFile).privateKey;
  } catch (e) {
    console.log("Operator private ky file is invalid.", pkfile, e);
    process.exit(1);
  }
}

module.exports = {configuration, key: getPrivateKey()};
