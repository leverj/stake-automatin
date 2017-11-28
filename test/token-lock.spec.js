const expect = require('expect.js');
// const testrpc = require('./testrpc');
let lib = require('./lib');
let Token = artifacts.require("./HumanStandardToken.sol");
let Disbursement = artifacts.require("./Disbursement.sol");
let TokenLock = artifacts.require("./TokenLock.sol");

contract('token-lock', function (accounts) {
  let owner, token, tokenLock, disbursement;
  let current;
	let oneYear = 365*24*60*60

  before(async function () {
    // await testrpc.start();
  });

  beforeEach(async function(){
    owner = accounts[0];
    token = await Token.new(1e12, 'LEV', 9, 'LEV', owner);
    tokenLock = await TokenLock.new(owner, oneYear, 10*oneYear, 50);
		current = await lib.getCurrentTime();
		disbursement = await Disbursement.new(tokenLock.address, oneYear, current);

		await token.removeTransferLock({ from: owner });
		await disbursement.setup(token.address, { from: owner });
		await tokenLock.setup(disbursement.address, token.address, { from: owner });
  });

  afterEach(async function(){
    // await testrpc.reset();
  });

  after(async function () {
    try {
      // testrpc.stop();
    } catch (e) {
      console.error(e);
    }
  });

  it('should not be able to disburse before 1 year', async function () {
		const ownerBalance = await token.balanceOf(owner);
		await token.transfer(disbursement.address, ownerBalance, { from: owner });
		await lib.forceTime(oneYear / 2);

		try {
			// Execute transferShortTermTokens(owner)
			await tokenLock.transferShortTermTokens(owner, { from: owner });
			expect.fail();
		} catch (e) {
			// Check owner balance, it returns a big number so we have to convert it to float
			finalOwnerBalance = await token.balanceOf(owner);
			expect(parseFloat(finalOwnerBalance)).to.eql(0);
		}
  });
  it.only('should be able to disburse 50% of tokens after 1 year', async function () {
		ownerBalance = await token.balanceOf(owner);

		await token.transfer(disbursement.address, ownerBalance, { from: owner });
		console.log('current time', await lib.getCurrentTime())
		console.log('one year', oneYear)
		await lib.forceTime(oneYear + 1);
		console.log('current time', await lib.getCurrentTime())
		await tokenLock.transferShortTermTokens(owner, { from: owner });
		finalOwnerBalance = await token.balanceOf(owner);
		await lib.delay(1e3)

		expect(finalOwnerBalance).to.eql(ownerBalance / 2);
  });
  it('should not be able to disburse more than 50% of tokens before 10 years', async function () {
		ownerBalance = await token.methods.balanceOf(owner).call();

		// Send the token to disbursement
		await token.methods.transfer(disbursement.address, await token.methods.balanceOf(owner).call()).send({
			from: owner
		});

		// Advance in time to be able to withdraw from Disbursement to TokenLock after 5 years
		await lib.forceTime(await lib.getCurrentTime() + oneYear * 5);
		await tokenLock.methods.withdraw().send({ from: owner });
		await tokenLock.methods.transferShortTermTokens(owner).send({ from: owner });

		// Shouldn't transfer the long term tokens before the 10 years
		try {
			await tokenLock.methods.transferLongTermTokens(owner).send({
				from: owner
			});
			expect.fail();
		} catch(e) {
			// Check owner balance
			finalOwnerBalance = await token.methods.balanceOf(owner).call();
			expect(finalOwnerBalance).toEqual(ownerBalance / 2);
		}
  });
  it('should not be able to disburse rest of the tokens after 10 years', async function () {
		ownerBalance = await token.methods.balanceOf(owner).call();

		// Send the token to disbursement
		await token.methods.transfer(disbursement.address, await token.methods.balanceOf(owner).call()).send({
			from: owner
		});

		// Advance in time to be able to withdraw from Disbursement to TokenLock after 10 years + 1 second
		await lib.forceTime(await lib.getCurrentTime() + oneYear * 10 + 1);
		await tokenLock.methods.withdraw().send({
			from: owner
		});
		await tokenLock.methods.transferShortTermTokens(owner).send({
			from: owner
		});
		await tokenLock.methods.transferLongTermTokens(owner).send({
			from: owner
		});

		// Check owner balance
		finalOwnerBalance = await token.methods.balanceOf(owner).call();
		expect(finalOwnerBalance).toEqual(ownerBalance);
  });
});
