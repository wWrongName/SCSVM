contract ModifierEntrancy {

   mapping (address => uint) public tokenBalance;
   string constant name = "Nu Token";
   Bank bank;

   constructor() public{
      bank = new Bank();
   }


   function supportasdToken() internal returns(uint) {
      return 1;
   }

   //If a contract has a zero balance and supports the token give them some token
   function airDrop() hasNoBalance supportsToken  public{
      supportasdToken();
      if (tokenBalance[msg.sender] == 0) {
         require(tokenBalance[msg.sender] == 90);
         tokenBalance[msg.sender] += 10;
      } else {
         tokenBalance[msg.sender] += 80;
      }
      tokenBalance[msg.sender] += 20;
   }

   //Checks that the contract responds the way we want
   modifier supportsToken() {
      require(keccak256(abi.encodePacked("Nu Token")) == bank.supportsToken());
      _;
   }

   //Checks that the caller has a zero balance
   modifier hasNoBalance {
      require(tokenBalance[msg.sender] == 0);
      _;
   }
}

contract Bank{

   function supportsToken() external returns(bytes32) {
      return keccak256(abi.encodePacked("Nu Token"));
   }

}