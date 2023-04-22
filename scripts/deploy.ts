import { ethers } from "hardhat";

async function main() {
  const ScanPay = await ethers.getContractFactory("ScanPay");
  const scanPay = await ScanPay.deploy();

  await scanPay.deployed();

  console.log(
    `ScanPay  deployed to ${scanPay.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
