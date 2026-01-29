const hre = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Starting MultiSigWallet deployment...");

  // Get deployment parameters from environment variables
  const ownersString = process.env.MULTISIG_OWNERS;
  const required = parseInt(process.env.MULTISIG_REQUIRED || "2");
  const dailyLimit = process.env.MULTISIG_DAILY_LIMIT || hre.ethers.parseEther("1").toString();

  // Validate parameters
  if (!ownersString) {
    throw new Error("MULTISIG_OWNERS environment variable is required");
  }

  const owners = ownersString.split(",").map((addr) => addr.trim());

  // Validate owners
  for (const owner of owners) {
    if (!hre.ethers.isAddress(owner)) {
      throw new Error(`Invalid owner address: ${owner}`);
    }
  }

  // Validate required
  if (required < 1 || required > owners.length) {
    throw new Error(
      `Invalid required confirmations: ${required}. Must be between 1 and ${owners.length}`
    );
  }

  // Validate daily limit
  if (dailyLimit < 0) {
    throw new Error(`Invalid daily limit: ${dailyLimit}`);
  }

  console.log("Deployment parameters:");
  console.log("- Owners:", owners);
  console.log("- Required confirmations:", required);
  console.log("- Daily limit:", hre.ethers.formatEther(dailyLimit), "ETH");

  // Deploy the contract
  const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
  console.log("\nDeploying MultiSigWallet...");

  const multiSig = await MultiSigWallet.deploy(owners, required, dailyLimit);
  await multiSig.waitForDeployment();

  const address = await multiSig.getAddress();
  console.log("MultiSigWallet deployed to:", address);

  // Verify deployment
  console.log("\nVerifying deployment...");
  const numOwners = await multiSig.m_numOwners();
  const requiredConfirms = await multiSig.m_required();
  const limit = await multiSig.m_dailyLimit();

  console.log("- Number of owners:", numOwners.toString());
  console.log("- Required confirmations:", requiredConfirms.toString());
  console.log("- Daily limit:", hre.ethers.formatEther(limit), "ETH");

  // Save deployment info
  const deploymentInfo = {
    address: address,
    network: hre.network.name,
    owners: owners,
    required: required,
    dailyLimit: dailyLimit,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  console.log("\nDeployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Wait for a few blocks before verification on public networks
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await multiSig.deploymentTransaction().wait(5);

    console.log("\nVerifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [owners, required, dailyLimit],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error.message);
      console.log("You can manually verify with these parameters:");
      console.log("Address:", address);
      console.log("Constructor arguments:", [owners, required, dailyLimit]);
    }
  }

  console.log("\n✅ Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Fund the wallet by sending ETH to:", address);
  console.log("2. Test the wallet with a small transaction");
  console.log("3. Configure frontend with the contract address");

  return deploymentInfo;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
