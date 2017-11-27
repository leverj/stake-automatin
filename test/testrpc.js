const testrpc = require('ethereumjs-testrpc');
const hdkey = require('ethereumjs-wallet/hdkey');
const HttpProvider = require('ethjs-provider-http');
const EthRPC = require('ethjs-rpc');
const ethRPC = new EthRPC(new HttpProvider('http://localhost:8545'));
const bip39 = require('bip39');
const ACCOUNTFUNDING = '0x33B2E3C9FD0804000000000'; // One billion Ether in Wei
const HDPATH = 'm/44\'/60\'/0\'/0/';
const mnemonic = "economy chuckle twin square rose provide friend combine fashion wheel purse huge";
let accounts = [];
let server, snapshotid;

function generateAccounts(mnemonic, hdPathIndex, totalToGenerate, accumulatedAddrs) {
  const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
  const node = hdwallet.derivePath(HDPATH + hdPathIndex.toString());
  let wallet = node.getWallet();
  const secretKey = wallet.getPrivateKeyString();
  const address = wallet.getAddressString();
  accumulatedAddrs.push({
    secretKey,
    address,
    balance: ACCOUNTFUNDING,
  });

  const nextHDPathIndex = hdPathIndex + 1;
  if (nextHDPathIndex === totalToGenerate) {
    return accumulatedAddrs;
  }

  return generateAccounts(mnemonic, nextHDPathIndex, totalToGenerate, accumulatedAddrs);
}

async function start() {
  accounts = generateAccounts(mnemonic, 0, 100, []);
  const testRPCInput = {
    accounts,
    locked: false,
    time:new Date(0)
  };
  server = testrpc.server(testRPCInput);
  server.listen(8545);
  await snapshot();
}

function stop() {
  if (server) server.close();
}

async function reset(){
  await ethRPC.sendAsync({method:'evm_revert', params:[snapshotid]});
  await snapshot();
}

async function snapshot(){
  snapshotid = await ethRPC.sendAsync({method:'evm_snapshot'});
}

module.exports = {
  start,
  stop,
  reset,
  account: function (index) {
    return accounts[index];
  }
};
