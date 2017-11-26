const Web3 = require('web3');
module.exports = (function () {
  let lib = {};
  lib.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
  lib.deploy = async function (abi, bytecode, user, arguments) {
    const contract = new lib.web3.eth.Contract(abi);
    return await contract.deploy({data: bytecode, arguments:arguments}).send({
      from: user,
      gas: 4e6,
      gasPrice: '30000000000000'
    });
  };

  return lib;
})();