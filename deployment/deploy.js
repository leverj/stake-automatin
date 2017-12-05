const Web3 = require('web3');
const key = require('./conf').key;
const configuration = require('./conf').configuration;
const fs = require('fs');
const path = require('path');
const web3 = new Web3(new Web3.providers.HttpProvider(configuration.network));
const tokenLockJson = require('./../build/contracts/TokenLock.json');
const disbursementJson = require('./../build/contracts/Disbursement.json');
const _ = require('lodash')
let tokenLock;
let disbursement;
let deployer;
let sendOptions;

async function startAutomation() {
	async function init() {
		if(process.argv[2].toLowerCase() === 'tokenlock') {
			await createAccount();
			await deployTokenLock();
		} else if(process.argv[2].toLowerCase() === 'disbursement') {
			await createAccount();
			await deployDisbursement();
		} else if(process.argv[2].toLowerCase() === 'setup') {
			await createAccount();
			await setupCall();
		} else {
			console.error('Error you must specify the function to execute from deploy.js');
			process.exit(1);
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
		console.log('Writing changes in the configuration file...');
		fs.writeFileSync(path.join(__dirname, 'configuration.json'), JSON.stringify(configuration));
		console.log('Removing the admin deployer from TokenLock.sol...');
		await tokenLock.methods.removeOwner(deployer.address).send({from: deployer.address, gas: 4e6});
		console.log('Done');
	}

	// The constructor values are generated here instead of getting them from the configuration file
	async function deployDisbursement() {
		const now = String(Date.now()).substring(0, String(Date.now()).length - 3);
		const receiver = configuration.tokenLockAddress;
		const disbursementPeriod = 60 * 60 * 24 * 365;
		const constructor = [ receiver, disbursementPeriod, now ];
		console.log('Deploying the disbursement contract...');
		const disbursementContract = await deploy(disbursementJson.abi, disbursementJson.bytecode, constructor);
		configuration.tokenLockAddress = disbursementContract.contractAddress;
		disbursement = new web3.eth.Contract(tokenLockJson.abi, disbursementContract.contractAddress, sendOptions);
		disbursement.options.from = deployer.address;
		console.log('Writing changes in the configuration file...');
		fs.writeFileSync(path.join(__dirname, 'configuration.json'), JSON.stringify(configuration));
		console.log('Setting up the lev token address from the configuration in the contract...');
		await disbursement.methods.setup(configuration.tokenAddress).send({from: deployer.address, gas: 4e6});
		console.log('Done');
	}

	async function setupCall() {
		console.log('In the contract TokenLock.sol setting up the disbursement and token LEV addresses...');
		tokenLock = new web3.eth.Contract(tokenLockJson.abi, configuration.tokenLockAddress, sendOptions);
		await tokenLock.methods.setup(configuration.disbursementAddress, configuration.tokenAddress).send({from: deployer.address, gas: 4e6});
		console.log('Done');
	}

	function addDeployerToAdmin(values){
		let valuesCopy = _.cloneDeep(values)
		valuesCopy[0].push(deployer.address);
		return valuesCopy;
	}

	async function deploy(abi, bytecode, parameters) {
		await createAccount()
		const contract = new web3.eth.Contract(abi);
		return await contract.deploy({data: bytecode, arguments: parameters}).send(sendOptions);
	}

	await init()
}

startAutomation().catch(console.error);

module.exports = startAutomation;
