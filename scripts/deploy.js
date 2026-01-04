async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const FactMarket = await ethers.getContractFactory("FactMarket");
  const contract = await FactMarket.deploy(deployer.address);

  await contract.waitForDeployment();

  console.log("FactMarket deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
