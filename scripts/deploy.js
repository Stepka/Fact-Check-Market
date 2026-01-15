import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const FactMarket = await ethers.getContractFactory("FactMarket");
  const market = await FactMarket.deploy(deployer.address);

  await market.waitForDeployment();

  console.log("FactMarket deployed to:", await market.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
