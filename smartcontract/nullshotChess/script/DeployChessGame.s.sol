// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "../src/ChessGame.sol";

contract DeployChessGame is Script {
    function run() external returns (ChessGame) {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy ChessGame contract
        ChessGame chessGame = new ChessGame();
        
        console.log("ChessGame deployed to:", address(chessGame));
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        
        vm.stopBroadcast();
        
        return chessGame;
    }
}

