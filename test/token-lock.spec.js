const expect = require('expect.js');
let lib = require('./lib');
let Token = artifacts.require("./HumanStandardToken.sol");
let Disbursement = artifacts.require("./Disbursement.sol");
let TokenLock = artifacts.require("./TokenLock.sol");

contract('token-lock', function (accounts) {
  let owner, token, tokenLock, disbursement;
  let current;
	let oneYear = 365*24*60*60

  beforeEach(async function(){
		await lib.snapshot();
    owner = accounts[0];
    token = await Token.new(1e12, 'LEV', 9, 'LEV', owner);
    tokenLock = await TokenLock.new(owner, oneYear, 10*oneYear, 50);
		current = await lib.getCurrentTime();
		disbursement = await Disbursement.new(tokenLock.address, oneYear, current);

		await token.removeTransferLock({ from: owner });
		await disbursement.setup(token.address, { from: owner });
		await tokenLock.setup(disbursement.address, token.address, { from: owner });
  });

	afterEach(async function() {
		await lib.reset()
	})

  it('should not be able to disburse before 1 year', async function () {
		const ownerBalance = await token.balanceOf(owner);
		await token.transfer(disbursement.address, ownerBalance, { from: owner });
		await lib.forceTime(oneYear - 1);

		try {
			// Execute transferShortTermTokens(owner)
			await tokenLock.transferShortTermTokens(owner, { from: owner });
			expect().fail();
		} catch (e) {
			// Check owner balance, it returns a big number so we have to convert it to float
			finalOwnerBalance = await token.balanceOf(owner);
			expect(parseFloat(finalOwnerBalance)).to.eql(0);
		}
  });
  it('should be able to disburse 50% of tokens after 1 year', async function () {
		let ownerBalance = await token.balanceOf(owner);

		await token.transfer(disbursement.address, ownerBalance, { from: owner });
		await lib.forceTime(oneYear + 1);
		await tokenLock.transferShortTermTokens(owner, { from: owner });
		finalOwnerBalance = await token.balanceOf(owner);
		await lib.delay(1e3)

		expect(String(finalOwnerBalance)).to.eql(ownerBalance / 2);
  });
  it('should not be able to disburse more than 50% of tokens before 10 years', async function () {
		let ownerBalance = await token.balanceOf(owner);
		let currentTime = await lib.getCurrentTime();

		await token.transfer(disbursement.address, ownerBalance);
		await lib.forceTime(oneYear * 5);

		// Shouldn't transfer the long term tokens before the 10 years
		try {
			await tokenLock.transferLongTermTokens(owner);
			expect().fail();
		} catch(e) {
			// Check owner balance
			finalOwnerBalance = await token.balanceOf(owner);
			expect(finalOwnerBalance.toNumber()).to.eql(0);
		}
  });
  it('should not be able to disburse rest of the tokens after 10 years', async function () {
		let ownerBalance = await token.balanceOf(owner);

		// Send the token to disbursement
		await token.transfer(disbursement.address, ownerBalance);

		// Advance in time to be able to withdraw from Disbursement to TokenLock after 10 years + 1 second
		await lib.forceTime(oneYear * 10 + 1);
		await tokenLock.transferLongTermTokens(owner);

		// Check owner balance
		finalOwnerBalance = await token.balanceOf(owner);
		expect(finalOwnerBalance.toNumber()).to.eql(ownerBalance.toNumber());
  });
});
