const expect = require('expect.js');
let lib = require('./lib');
let Token = artifacts.require("./HumanStandardToken.sol");
let Disbursement = artifacts.require("./Disbursement.sol");
let TokenLock = artifacts.require("./TokenLock.sol");
const exec = require('child_process').exec;

contract('token-lock', function (accounts) {
  let owner, token, tokenLock, disbursement;
  let current, totalTokens = 1e12;
  let oneYear = 365 * 24 * 60 * 60;

  beforeEach(async function () {
    await lib.snapshot();
    owner = accounts[0];
    token = await Token.new(totalTokens, 'LEV', 9, 'LEV', owner);
    tokenLock = await TokenLock.new([owner], oneYear, 10 * oneYear, 40);
    current = await lib.getCurrentTime();
    disbursement = await Disbursement.new(tokenLock.address, oneYear, current);
    await token.removeTransferLock({from: owner});
    await disbursement.setup(token.address, {from: owner});
    const ownerBalance = await token.balanceOf(owner);
    await token.transfer(disbursement.address, ownerBalance, {from: owner});
    await tokenLock.setup(disbursement.address, token.address, {from: owner});
  });

  afterEach(async function () {
    await lib.reset()
  });

  it('should not be able to disburse before 1 year', async function () {
    await lib.forceTime(oneYear - 1);
    try {
      // Execute transferShortTermTokens(owner)
      await tokenLock.transferShortTermTokens(owner, {from: owner});
      expect().fail();
    } catch (e) {
      // Check owner balance, it returns a big number so we have to convert it to float
      expect(await balance(token, owner)).to.eql(0);
    }
  });

  it('should be able to disburse 40% of tokens after 1 year', async function () {
    await lib.forceTime(oneYear + 1);
    await tokenLock.transferShortTermTokens(owner, {from: owner});
    expect(await balance(token, owner)).to.eql(totalTokens * 0.4);
  });

  it('should not be able to disburse more than 40% of tokens after 1 year', async function () {
    await lib.forceTime(oneYear + 1);
    await tokenLock.transferShortTermTokens(owner, {from: owner});
    expect(await balance(token, owner)).to.eql(totalTokens * 0.4);
    try {
      await tokenLock.transferShortTermTokens(owner, {from: owner});
      expect().fail();
    } catch (e) {
      expect(await balance(token, owner)).to.eql(totalTokens * 0.4);
    }
  });

  it('should not be able to disburse more than 40% of tokens before 10 years', async function () {
    await lib.forceTime(oneYear * 5);
    // Shouldn't transfer the long term tokens before the 10 years
    try {
      await tokenLock.transferLongTermTokens(owner);
      expect().fail();
    } catch (e) {
      // Check owner balance
      expect(await balance(token, owner)).to.eql(0);
    }
  });

  it('should be able to disburse rest of the tokens after 10 years', async function () {
    // Advance in time to be able to withdraw from Disbursement to TokenLock after 10 years + 1 second
    await lib.forceTime(oneYear * 10 + 1);
    await tokenLock.transferLongTermTokens(owner);
    // Check owner balance
    expect(await balance(token, owner)).to.eql(totalTokens);
  });

  it('should be able to disburse tokens in 1 year and 10 year', async function () {
    await lib.forceTime(oneYear + 1);
    await tokenLock.transferShortTermTokens(owner, {from: owner});
    expect(await balance(token, owner)).to.eql(totalTokens * 0.4);
    await lib.forceTime(oneYear * 11);
    await tokenLock.transferLongTermTokens(owner);
    // Check owner balance
    expect(await balance(token, owner)).to.eql(totalTokens);
  })

	it('should not execute the deploy functions without the private key file', async function () {
		exec('node ./deployment/deploy.js tokenlock', (err, sout, serr) => {
			expect(serr).to.eql('You must provide the location of the private key file\n');
		});
	});

	it('should not execute the deploy functions without the function to call', async function () {
		exec('node ./deployment/deploy.js C:\\Users\\merunas\\Desktop\\privatekeys\\admin.json', (err, sout, serr) => {
			expect(serr).to.eql('You must provide the location of the private key file\n');
		});
	});

	it('should not execute the deploy functions without the function to call and the private key file', async function () {
		exec('node ./deployment/deploy.js', (err, sout, serr) => {
			expect(serr).to.eql('You must provide the location of the private key file\n');
		});
	});

	// TODO not working: "replacement transaction underpriced"
	it('should execute the deploy tokenlock function without errors', async function () {
		console.log('Processing tokenlock deployment...');
		exec('node ./deployment/deploy.js tokenlock C:\\Users\\merunas\\Desktop\\privatekeys\\admin.json', (err, sout, serr) => {
			expect(serr.length).to.eql(0);
			expect(err.length).to.be(0);
			expect(sout).to.not.be(undefined);
		});
	});

	it('should execute the deploy of disbursement without errors', async function () {
		console.log('Processing disbursement deployment...');
		exec('node ./deployment/deploy.js disbursement C:\\Users\\merunas\\Desktop\\privatekeys\\admin.json', (err, sout, serr) => {
			expect(serr.length).to.eql(0);
			expect(err.length).to.be(0);
			expect(sout).to.not.be(undefined);
		});
	});

	it('should execute the deploy of setup without errors', async function () {
		console.log('Processing setup deployment...');
		exec('node ./deployment/deploy.js setup C:\\Users\\merunas\\Desktop\\privatekeys\\admin.json', (err, sout, serr) => {
			expect(serr.length).to.eql(0);
			expect(err.length).to.be(0);
			expect(sout).to.not.be(undefined);
		});
	});
});

async function balance(_token, _address){
  return (await _token.balanceOf(_address)).toNumber()
}
