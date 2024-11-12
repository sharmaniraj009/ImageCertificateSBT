// scripts/mint-certificate.js
const hre = require("hardhat");
require('dotenv').config();

// Task parameters are passed through environment variables to avoid command line parsing issues
async function main() {
    // Get parameters from environment variables
    const {
        CONTRACT_ADDRESS,
        RECIPIENT_ADDRESS,
        HOLDER_NAME,
        ISSUER,
        PURPOSE,
        UNIQUE_ID = `CERT-${Date.now()}`,
        METADATA_URI
    } = process.env;

    // Check if required parameters are provided
    if (!CONTRACT_ADDRESS || !RECIPIENT_ADDRESS || !HOLDER_NAME || !ISSUER || !PURPOSE || !METADATA_URI) {
        console.log("\nMissing required parameters. Please set the following environment variables:");
        console.log("CONTRACT_ADDRESS: Deployed contract address");
        console.log("RECIPIENT_ADDRESS: Address to receive the certificate");
        console.log("HOLDER_NAME: Name of the certificate holder");
        console.log("ISSUER: Name of the issuing institution");
        console.log("PURPOSE: Purpose of the certificate");
        console.log("METADATA_URI: IPFS URI for the certificate metadata");
        console.log("UNIQUE_ID: (Optional) Unique identifier for the certificate");
        console.log("\nExample usage:");
        console.log('CONTRACT_ADDRESS=0x123... RECIPIENT_ADDRESS=0x456... HOLDER_NAME="John Doe" ISSUER="University" PURPOSE="Degree" METADATA_URI="ipfs://..." npx hardhat run scripts/mint-certificate.js --network sepolia');
        process.exit(1);
    }

    try {
        // Validate addresses
        if (!hre.ethers.isAddress(CONTRACT_ADDRESS)) {
            throw new Error(`Invalid contract address: ${CONTRACT_ADDRESS}`);
        }
        if (!hre.ethers.isAddress(RECIPIENT_ADDRESS)) {
            throw new Error(`Invalid recipient address: ${RECIPIENT_ADDRESS}`);
        }

        // Get contract instance
        const ImageCertificateSBT = await hre.ethers.getContractFactory("ImageCertificateSBT");
        const certificate = ImageCertificateSBT.attach(CONTRACT_ADDRESS);

        // Get signer
        const [signer] = await hre.ethers.getSigners();
        
        // Log minting details
        console.log("\n=== Minting New Certificate ===");
        console.log("Contract Address:", CONTRACT_ADDRESS);
        console.log("Minting as:", signer.address);
        console.log("\nCertificate Details:");
        console.log("Recipient:", RECIPIENT_ADDRESS);
        console.log("Holder Name:", HOLDER_NAME);
        console.log("Issuer:", ISSUER);
        console.log("Purpose:", PURPOSE);
        console.log("Unique ID:", UNIQUE_ID);
        console.log("Metadata URI:", METADATA_URI);

        // Current timestamp
        const timestamp = BigInt(Math.floor(Date.now() / 1000));

        console.log("\nInitiating transaction...");

        // Mint certificate
        const mintTx = await certificate.safeMint(
            RECIPIENT_ADDRESS,
            HOLDER_NAME,
            ISSUER,
            timestamp,
            PURPOSE,
            UNIQUE_ID,
            METADATA_URI
        );

        console.log("Transaction sent! Waiting for confirmation...");
        const receipt = await mintTx.wait();

        // Get token ID from event
        const transferEvent = receipt.logs.find(
            log => certificate.interface.parseLog(log)?.name === 'Transfer'
        );
        
        const tokenId = transferEvent 
            ? certificate.interface.parseLog(transferEvent).args.tokenId 
            : 'unknown';

        // Log success details
        console.log("\n=== Certificate Minted Successfully! ===");
        console.log("Transaction Hash:", receipt.hash);
        console.log("Token ID:", tokenId.toString());
        console.log("Block Number:", receipt.blockNumber);
        console.log("Gas Used:", receipt.gasUsed.toString());

        // Verify minted certificate
        console.log("\nVerifying Certificate Details:");
        const certificateDetails = await certificate.getCertificate(tokenId);
        
        console.log({
            holderName: certificateDetails.holderName,
            issuingEntity: certificateDetails.issuingEntity,
            date: new Date(certificateDetails.date * 1000).toLocaleString(),
            purpose: certificateDetails.purpose,
            uniqueId: certificateDetails.uniqueId
        });

    } catch (error) {
        console.error("\nError:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });