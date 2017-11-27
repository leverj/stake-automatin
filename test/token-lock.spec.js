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
  before(async function () {
    await testrpc.start();
  });

  beforeEach(async function(){
    owner = testrpc.account(0).address;
    token = await lib.deploy(Token.abi, Token.bytecode, owner, [1e12, 'LEV', 9, 'LEV', owner]);
    tokenLock = await lib.deploy(TokenLock.abi, TokenLock.bytecode, owner, [owner, 365*24*60*60, 10*365*24*60*60, 50]);
    current = await lib.getCurrentTime();
    disbursement = await lib.deploy(Disbursement.abi, Disbursement.bytecode, owner, [tokenLock._address, 365 * 24 * 60 * 60, current]);
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

  });
  it('should be able to disburse 50% of tokens after 1 year', async function () {

  });
  it('should not be able to disburse more than 50% of tokens before 10 years', async function () {

  });
  it('should not be able to disburse rest of the tokens after 10 years', async function () {

  });
});