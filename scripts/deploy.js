const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const ImageCertificateSBT = await hre.ethers.getContractFactory("ImageCertificateSBT");
  const imageCertificateSBT = await ImageCertificateSBT.deploy(deployer.address);

  await imageCertificateSBT.waitForDeployment();

  console.log("ImageCertificateSBT deployed to:", await imageCertificateSBT.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });