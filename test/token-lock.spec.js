const expect = require('expect.js');
const testrpc = require('./testrpc');
let lib = require('./lib');
let Token = require("../build/contracts/HumanStandardToken.json");
let Disbursement = require("../build/contracts/Disbursement.json");
let TokenLock = require("../build/contracts/TokenLock.json");

describe('token-lock', function () {
  this.timeout(10000);
  let owner, token, tokenLock, disbursement;
  let current;
	let oneYear = 365*24*60*60

  before(async function () {
    await testrpc.start();
  });

  beforeEach(async function(){
    owner = testrpc.account(0).address;
    token = await lib.deploy(Token.abi, Token.bytecode, owner, [1e12, 'LEV', 9, 'LEV', owner]);
    tokenLock = await lib.deploy(TokenLock.abi, TokenLock.bytecode, owner, [owner, oneYear, 10*oneYear, 50]);
    current = await lib.getCurrentTime();
    disbursement = await lib.deploy(Disbursement.abi, Disbursement.bytecode, owner, [tokenLock._address, oneYear, current]);

		await disbursement.methods.setup(token._address).send({
			from: owner
		});
		await tokenLock.methods.setDisbursement(disbursement._address).send({
			from: owner
		});
  });

  afterEach(async function(){
    await testrpc.reset();
  });

  after(async function () {
    try {
      testrpc.stop();
    } catch (e) {
      console.error(e);
    }
  });

  it('should not be able to disburse before 1 year', async function () {
		ownerBalance = await token.methods.balanceOf(owner).call();

		// Send the token to disbursement
		await token.methods.transfer(disbursement._address, await token.methods.balanceOf(owner).call()).send({
			from: owner
		});

		// Advance in time to be able to withdraw from Disbursement to TokenLock half a year
		await lib.forceTime(await lib.getCurrentTime() + oneYear / 2);
		await tokenLock.methods.withdraw().send({
			from: owner
		});

		// The transfer short term tokens should fail
		try {
			// Execute transferShortTermTokens(owner)
			await tokenLock.methods.transferShortTermTokens(owner).send({
				from: owner
			});
			expect.fail();
		} catch (e) {
			// Check owner balance
			finalOwnerBalance = await token.methods.balanceOf(owner).call();
			expect(finalOwnerBalance).toEqual(0);
		}
  });
  it('should be able to disburse 50% of tokens after 1 year', async function () {
		ownerBalance = await token.methods.balanceOf(owner).call();

		// Send the token to disbursement
		await token.methods.transfer(disbursement._address, await token.methods.balanceOf(owner).call()).send({
			from: owner
		});

		// Advance in time to be able to withdraw from Disbursement to TokenLock after 1 year + 1 second
		await lib.forceTime(await lib.getCurrentTime() + oneYear + 1);
		await tokenLock.methods.withdraw().send({
			from: owner
		});

		// Execute transferShortTermTokens(owner)
		await tokenLock.methods.transferShortTermTokens(owner).send({
			from: owner
		});

		// Check owner balance
		finalOwnerBalance = await token.methods.balanceOf(owner).call();
		expect(finalOwnerBalance).toEqual(ownerBalance / 2);
  });
  it('should not be able to disburse more than 50% of tokens before 10 years', async function () {
		ownerBalance = await token.methods.balanceOf(owner).call();

		// Send the token to disbursement
		await token.methods.transfer(disbursement._address, await token.methods.balanceOf(owner).call()).send({
			from: owner
		});

		// Advance in time to be able to withdraw from Disbursement to TokenLock after 5 years
		await lib.forceTime(await lib.getCurrentTime() + oneYear * 5);
		await tokenLock.methods.withdraw().send({
			from: owner
		});
		await tokenLock.methods.transferShortTermTokens(owner).send({
			from: owner
		});

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
		await token.methods.transfer(disbursement._address, await token.methods.balanceOf(owner).call()).send({
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
