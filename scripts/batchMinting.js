const hre = require("hardhat");
const fs = require('fs');
const fastcsv = require('fast-csv');

const CONTRACT_ADDRESS = "0xd5DaB0947cd4c874f7ad94f786DcA3dE38EBB591";
const CSV_FILE = "./certificates.csv";
const OUTPUT_DIR = "./output";

async function validateRow(row, rowIndex) {
    const errors = [];
    
    // Check required fields
    const requiredFields = ['recipient_address', 'holder_name', 'issuer', 'purpose', 'metadata_uri'];
    requiredFields.forEach(field => {
        if (!row[field]) {
            errors.push(`Missing ${field}`);
        }
    });

    // Validate ethereum addresses
    if (row.recipient_address && !hre.ethers.isAddress(row.recipient_address)) {
        errors.push(`Invalid recipient address: ${row.recipient_address}`);
    }

    if (errors.length > 0) {
        throw new Error(`Row ${rowIndex + 1}: ${errors.join(', ')}`);
    }
}

async function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const records = [];
        fastcsv.parseFile(filePath, {
            headers: true,
            ignoreEmpty: true,
            trim: true
        })
        .on('error', error => reject(error))
        .on('data', row => records.push(row))
        .on('end', () => resolve(records));
    });
}

async function processCertificates(contract, certificates) {
    console.log(`\nProcessing ${certificates.length} certificates...`);
    const results = {
        successful: [],
        failed: []
    };

    for (let i = 0; i < certificates.length; i++) {
        const cert = certificates[i];
        try {
            console.log(`\nMinting certificate ${i + 1}/${certificates.length}`);
            console.log(`Recipient: ${cert.recipient_address}`);
            console.log(`Holder: ${cert.holder_name}`);

            const timestamp = BigInt(Math.floor(Date.now() / 1000));
            const uniqueId = cert.unique_id || `CERT-${Date.now()}-${i}`;

            const mintTx = await contract.safeMint(
                cert.recipient_address,
                cert.holder_name,
                cert.issuer,
                timestamp,
                cert.purpose,
                uniqueId,
                cert.metadata_uri
            );

            const receipt = await mintTx.wait();
            
            // Get token ID from event
            const transferEvent = receipt.logs.find(
                log => contract.interface.parseLog(log)?.name === 'Transfer'
            );
            
            const tokenId = transferEvent 
                ? contract.interface.parseLog(transferEvent).args.tokenId 
                : 'unknown';

            results.successful.push({
                holder: cert.holder_name,
                tokenId: tokenId.toString(),
                txHash: receipt.hash
            });

            // Log success for each certificate
            console.log(`✓ Successfully minted certificate for ${cert.holder_name}`);
            console.log(`  Token ID: ${tokenId.toString()}`);
            console.log(`  Transaction Hash: ${receipt.hash}`);

        } catch (error) {
            console.error(`\n✗ Error minting certificate for ${cert.holder_name}:`, error.message);
            results.failed.push({
                holder: cert.holder_name,
                error: error.message
            });
        }
    }

    return results;
}

async function writeSummaryToFile(results, outputPath) {
    try {
        // Create CSV streams for successful and failed mints
        const successStream = fs.createWriteStream(`${outputPath}/successful_mints.csv`);
        const failureStream = fs.createWriteStream(`${outputPath}/failed_mints.csv`);

        // Write successful mints
        await new Promise((resolve, reject) => {
            fastcsv
                .write(results.successful, { headers: true })
                .pipe(successStream)
                .on('finish', resolve)
                .on('error', reject);
        });

        // Write failed mints
        await new Promise((resolve, reject) => {
            fastcsv
                .write(results.failed, { headers: true })
                .pipe(failureStream)
                .on('finish', resolve)
                .on('error', reject);
        });

        console.log(`\nResults written to:`);
        console.log(`- ${outputPath}/successful_mints.csv`);
        console.log(`- ${outputPath}/failed_mints.csv`);
    } catch (error) {
        console.error('Error writing summary files:', error);
    }
}

async function main() {
    try {
        // Create output directory if it doesn't exist
        if (!fs.existsSync(OUTPUT_DIR)){
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        // Validate contract address
        if (!hre.ethers.isAddress(CONTRACT_ADDRESS)) {
            throw new Error(`Invalid contract address: ${CONTRACT_ADDRESS}`);
        }

        // Read and parse CSV file
        console.log(`\nReading CSV file: ${CSV_FILE}`);
        const certificates = await parseCSV(CSV_FILE);
        
        console.log(`Found ${certificates.length} certificates to process`);

        // Validate all rows before processing
        console.log('\nValidating CSV data...');
        for (let i = 0; i < certificates.length; i++) {
            await validateRow(certificates[i], i);
        }
        console.log('✓ Validation successful!');

        // Get contract instance
        const ImageCertificateSBT = await hre.ethers.getContractFactory("ImageCertificateSBT");
        const contract = ImageCertificateSBT.attach(CONTRACT_ADDRESS);

        // Process certificates
        const results = await processCertificates(contract, certificates);

        // Write results to files
        await writeSummaryToFile(results, OUTPUT_DIR);

        // Print summary
        console.log('\n=== Minting Summary ===');
        console.log(`Total Processed: ${certificates.length}`);
        console.log(`Successful: ${results.successful.length}`);
        console.log(`Failed: ${results.failed.length}`);

        if (results.failed.length > 0) {
            console.log('\nFailed Certificates:');
            results.failed.forEach(cert => {
                console.log(`- ${cert.holder}: ${cert.error}`);
            });
        }

    } catch (error) {
        console.error("\nError:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });