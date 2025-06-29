// packages/contracts/deploy/01_deploy_core.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployCore: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy QuadraticVoting
  const quadraticVoting = await deploy("QuadraticVoting", {
    from: deployer,
    args: [],
    log: true,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [deployer],
        },
      },
    },
  });

  // Deploy MilestoneFunding  
  const mockToken = await deploy("MockERC20", {
    from: deployer,
    args: ["Stake Token", "STAKE", 18],
    log: true,
  });

  const milestoneFunding = await deploy("MilestoneFunding", {
    from: deployer,
    args: [],
    log: true,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy", 
      execute: {
        init: {
          methodName: "initialize",
          args: [deployer, mockToken.address, deployer],
        },
      },
    },
  });

  console.log("QuadraticVoting deployed to:", quadraticVoting.address);
  console.log("MilestoneFunding deployed to:", milestoneFunding.address);
};

export default deployCore;
deployCore.tags = ["Core"];