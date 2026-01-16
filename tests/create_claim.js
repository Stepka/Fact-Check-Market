
const { ethers } = require("hardhat")

const address = "0xee705A2A47821dd5Ec58f32D437f5512E08B180c";
const FactMarket = await ethers.getContractFactory("FactMarket");
const market = await FactMarket.attach(address);

await market.claimCount();


const now = Math.floor(Date.now() / 1000);
const tx = await market.createClaim(
  "Факт на 5 минут",
  now + 60 * 5
);
await tx.wait();

await market.claimCount();
console.log("Claim created");