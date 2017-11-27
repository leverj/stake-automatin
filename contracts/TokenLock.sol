pragma solidity ^0.4.11;


import "./Disbursement.sol";
import "./SafeMath.sol";


/**
this contract should be the address for disbursement contract.
It should not allow to disburse any token for a given time "initialLockTime"
lock "50%" of tokens for 10 years.
transfer 50% of tokens to a given address.
*/

contract TokenLock {
  using SafeMath for uint;
  address public owner;

  uint public shortLock;

  uint public longLock;

  uint public shortShare;

  modifier onlyOwner{
    require(msg.sender == owner);
    _;
  }

  modifier validAddress(address _address){
    require(_address != 0);
    _;
  }

  function TokenLock(address _owner, uint _shortLock, uint _longLock, uint _shortShare){
    require(_owner != 0);
    require(_longLock > _shortLock);
    require(_shortLock > 0);
    owner = _owner;
    shortLock = block.timestamp.add(_shortLock);
    longLock = block.timestamp.add(_longLock);
    shortShare = _shortShare;
  }

  function changeOwner(address _owner) onlyOwner validAddress(_owner) {
    owner = _owner;
  }

  function transferShortTermTokens(address _wallet) onlyOwner{
    //current time > shortLock
    // withdraw shortShare% to _wallet address
  }

  function transferLongTermTokens(address _wallet) onlyOwner{
    //current time > longLock
    // withdraw all to _wallet address
  }
}
