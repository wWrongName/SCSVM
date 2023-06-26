pragma solidity 0.8.15;

contract SimpleDAO {
  mapping (address => uint) public credit;
  bool lock = false;
  function donate(address to) payable public{
    credit[to] += msg.value;
  }
    
  function withdraw(uint amount) public{
    require(!lock);
    lock = true;
    if (credit[msg.sender]>= amount) {
      (bool sent, ) = msg.sender.call{value: amount }("");
      if (sent)
        credit[msg.sender]-=amount;
    }
    lock = false;
  }  

  function queryCredit(address to) view public returns(uint){
    return credit[to];
  }
}
