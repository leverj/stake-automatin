const expect = require('expect.js');
const testrpc = require('./testrpc');
let lib = require('./lib');
let Token = require("../build/contracts/HumanStandardToken.json");
let Disbursement = require("../build/contracts/Disbursement.json");
let TokenLock = require("../build/contracts/TokenLock.json");
describe('token-lock', function () {
  before(async function () {
    testrpc.start();

  });

  after(async function () {
    testrpc.stop();
  });

  it('should pass', async function () {
    let owner = testrpc.account(0).address;
    let token = await lib.deploy(Token.abi, Token.bytecode, owner, [1e12, 'LEV', 9, 'LEV', owner]);
    let tokenLock = await lib.deploy(TokenLock.abi, TokenLock.bytecode, owner, []);
    console.log(token._address, tokenLock._address);
    let disbursement = await lib.deploy(Disbursement.abi, Disbursement.bytecode, tokenLock, [])
  });
});