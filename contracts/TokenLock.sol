pragma solidity ^0.4.11;


import "./Disbursement.sol";
import "./SafeMath.sol";
import "./Token.sol";
import "./Owned.sol";

/**
this contract should be the address for disbursement contract.
It should not allow to disburse any token for a given time "initialLockTime"
lock "50%" of tokens for 10 years.
transfer 50% of tokens to a given address.
*/
contract TokenLock is Owned {
  using SafeMath for uint;

  uint public shortLock;

  uint public longLock;

  uint public shortShare;

  address public levAddress;

  address public disbursement;

  uint public longTermTokens;

  modifier validAddress(address _address){
    require(_address != 0);
    _;
  }

  function TokenLock(address[] _owners, uint _shortLock, uint _longLock, uint _shortShare) public {
    require(_longLock > _shortLock);
    require(_shortLock > 0);
    require(_shortShare <= 100);
    setOwners(_owners);
    shortLock = block.timestamp.add(_shortLock);
    longLock = block.timestamp.add(_longLock);
    shortShare = _shortShare;
  }

  function setup(address _disbursement, address _levToken) public onlyOwner {
    require(_disbursement != address(0));
    require(_levToken != address(0));
    disbursement = _disbursement;
    levAddress = _levToken;
  }

  function transferShortTermTokens(address _wallet) public validAddress(_wallet) onlyOwner {
    require(now > shortLock);
    uint256 tokenBalance = Token(levAddress).balanceOf(disbursement);
    // long term tokens can be set only once.
    if (longTermTokens == 0) {
      longTermTokens = tokenBalance.mul(100 - shortShare).div(100);
    }
    require(tokenBalance > longTermTokens);
    uint256 amountToSend = tokenBalance.sub(longTermTokens);
    Disbursement(disbursement).withdraw(_wallet, amountToSend);
  }

  function transferLongTermTokens(address _wallet) public validAddress(_wallet) onlyOwner {
    require(now > longLock);
    // 1. Get how many tokens this contract has with a token instance and check this token balance
    uint256 tokenBalance = Token(levAddress).balanceOf(disbursement);

    // 2. Transfer those tokens with the _shortShare percentage
    Disbursement(disbursement).withdraw(_wallet, tokenBalance);
  }
}
