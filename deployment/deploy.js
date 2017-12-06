const Web3 = require('web3');
const key = require('./conf').key;
const configuration = require('./conf').configuration;
const fs = require('fs');
const path = require('path');
const affirm = require('affirm.js');
const web3 = new Web3(new Web3.providers.HttpProvider(configuration.network));
const tokenLockJson = require('./../build/contracts/TokenLock.json');
const disbursementJson = require('./../build/contracts/Disbursement.json');
const _ = require('lodash');
let tokenLock;
let disbursement;
let deployer;
let sendOptions;
let env = process.env.NODE_ENV || 'develop';
let configurationFile = `./${env}.json`;

async function startAutomation() {
  let actions = {
    tokenlock: async () => {
      await deployTokenLock()
      await removeDeployer()
    },
    disbursement: async () => await deployDisbursement(),
    setup: async () => await setupCall()
  }

  async function init() {
    let env = process.env.NODE_ENV || 'develop';
    await createAccount();
    if (env === 'develop') {
      let tokenLockAddress = await deployTokenLock();
      let disbursementAddress = await deployDisbursement();
      await setupCall();
      await removeDeployer();
    } else {
      let action = process.argv[2].toLowerCase();
      affirm(actions[action], `usage: node deployment/deploy.js tokenlock|disbursement|setup /path/to/privatekey/file. action is ${action}`)
      await createAccount();
      await actions[action]();
    }
  }

  async function createAccount() {
    deployer = await web3.eth.accounts.privateKeyToAccount(key);
    web3.eth.accounts.wallet.add(deployer);
    sendOptions = {from: deployer.address, gas: 4e6}
  }

  async function deployTokenLock() {
    console.log('Deploying the token lock contract...');
    const tokenLockContract = await deploy(tokenLockJson.abi, tokenLockJson.bytecode, addDeployerToAdmin(configuration.tokenLock.parameters.values));
    configuration.tokenLockAddress = tokenLockContract.contractAddress;
    tokenLock = new web3.eth.Contract(tokenLockJson.abi, tokenLockContract.contractAddress, sendOptions);
    tokenLock.options.from = deployer.address;
    console.log('token lock address...', configuration.tokenLockAddress);
    console.log('Writing changes in the configuration file...');
    fs.writeFileSync(path.join(__dirname, configurationFile), JSON.stringify(configuration));
    console.log('Done');
    return configuration.tokenLockAddress;
  }

  // The constructor values are generated here instead of getting them from the configuration file
  async function deployDisbursement() {
    const now = String(Date.now()).substring(0, String(Date.now()).length - 3);
    const receiver = configuration.tokenLockAddress;
    const disbursementPeriod = 60 * 15; // 15 minutes
    const constructor = [receiver, disbursementPeriod, now];
    console.log('Deploying the disbursement contract...');
    const disbursementContract = await deploy(disbursementJson.abi, disbursementJson.bytecode, constructor);
    configuration.disbursementAddress = disbursementContract.contractAddress;
    disbursement = new web3.eth.Contract(disbursementJson.abi, disbursementContract.contractAddress, sendOptions);
    disbursement.options.from = deployer.address;
    console.log('disbursement address', configuration.disbursementAddress);
    console.log('Writing changes in the configuration file...');
    fs.writeFileSync(path.join(__dirname, configurationFile), JSON.stringify(configuration));
    console.log('Setting up the lev token address from the configuration in the contract...');
    await disbursement.methods.setup(configuration.tokenAddress).send({from: deployer.address, gas: 4e6});
    console.log('Done');
    return configuration.disbursementAddress;
  }

  async function setupCall() {
    console.log('In the contract TokenLock.sol setting up the disbursement and token LEV addresses...');
    tokenLock = new web3.eth.Contract(tokenLockJson.abi, configuration.tokenLockAddress, sendOptions);
    await tokenLock.methods.setup(configuration.disbursementAddress, configuration.tokenAddress).send({
      from: deployer.address,
      gas: 4e6
    });
    console.log('Done');
  }

  async function removeDeployer() {
    let tokenLock = new web3.eth.Contract(tokenLockJson.abi, configuration.tokenLockAddress, sendOptions);
    console.log('Removing the admin deployer from TokenLock.sol...');
    await tokenLock.methods.removeOwner(deployer.address).send({from: deployer.address, gas: 4e6});
  }

  function addDeployerToAdmin(values) {
    let valuesCopy = _.cloneDeep(values)
    valuesCopy[0].push(deployer.address);
    return valuesCopy;
  }

  async function deploy(abi, bytecode, parameters) {
    await createAccount()
    const contract = new web3.eth.Contract(abi);
    let tx = contract.deploy({data: bytecode, arguments: parameters});
    console.log(tx.encodeABI().substr(bytecode.length))
    return await tx.send(sendOptions);
  }

  await init()
}

startAutomation().catch(console.error);
