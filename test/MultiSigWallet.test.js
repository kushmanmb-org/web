const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MultiSigWallet", function () {
  let multiSig;
  let owner1, owner2, owner3, nonOwner, recipient;
  let owners;
  const REQUIRED = 2;
  const DAILY_LIMIT = ethers.parseEther("1");

  beforeEach(async function () {
    [owner1, owner2, owner3, nonOwner, recipient] = await ethers.getSigners();
    owners = [owner1.address, owner2.address, owner3.address];

    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    multiSig = await MultiSigWallet.deploy(owners, REQUIRED, DAILY_LIMIT);
    await multiSig.waitForDeployment();

    // Fund the wallet
    await owner1.sendTransaction({
      to: await multiSig.getAddress(),
      value: ethers.parseEther("10"),
    });
  });

  describe("Deployment", function () {
    it("Should set the correct owners", async function () {
      expect(await multiSig.m_numOwners()).to.equal(3);
      const contractOwners = await multiSig.getOwners();
      expect(contractOwners).to.deep.equal(owners);
    });

    it("Should set the correct required confirmations", async function () {
      expect(await multiSig.m_required()).to.equal(REQUIRED);
    });

    it("Should set the correct daily limit", async function () {
      expect(await multiSig.m_dailyLimit()).to.equal(DAILY_LIMIT);
    });

    it("Should revert with zero owners", async function () {
      const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
      await expect(
        MultiSigWallet.deploy([], REQUIRED, DAILY_LIMIT)
      ).to.be.revertedWith("Owners required");
    });

    it("Should revert with invalid requirement (required > owners)", async function () {
      const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
      await expect(
        MultiSigWallet.deploy(owners, 4, DAILY_LIMIT)
      ).to.be.revertedWith("Invalid requirement");
    });

    it("Should revert with duplicate owners", async function () {
      const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
      const duplicateOwners = [owner1.address, owner2.address, owner1.address];
      await expect(
        MultiSigWallet.deploy(duplicateOwners, REQUIRED, DAILY_LIMIT)
      ).to.be.revertedWith("Duplicate owner");
    });

    it("Should revert with zero address as owner", async function () {
      const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
      const invalidOwners = [owner1.address, ethers.ZeroAddress, owner2.address];
      await expect(
        MultiSigWallet.deploy(invalidOwners, REQUIRED, DAILY_LIMIT)
      ).to.be.revertedWith("Invalid owner");
    });
  });

  describe("Owner Management", function () {
    it("Should allow adding a new owner with multi-sig", async function () {
      const newOwner = nonOwner.address;

      // First owner proposes
      await multiSig.connect(owner1).addOwner(newOwner);
      expect(await multiSig.m_numOwners()).to.equal(3);

      // Second owner confirms
      await multiSig.connect(owner2).addOwner(newOwner);
      expect(await multiSig.m_numOwners()).to.equal(4);
      expect(await multiSig.isOwner(newOwner)).to.be.true;
    });

    it("Should prevent non-owners from adding owners", async function () {
      await expect(
        multiSig.connect(nonOwner).addOwner(nonOwner.address)
      ).to.be.revertedWith("Not an owner");
    });

    it("Should prevent adding duplicate owners", async function () {
      await expect(
        multiSig.connect(owner1).addOwner(owner2.address)
      ).to.be.revertedWith("Owner already exists");
    });

    it("Should allow removing an owner with multi-sig", async function () {
      // First owner proposes
      await multiSig.connect(owner1).removeOwner(owner3.address);
      expect(await multiSig.m_numOwners()).to.equal(3);

      // Second owner confirms
      await multiSig.connect(owner2).removeOwner(owner3.address);
      expect(await multiSig.m_numOwners()).to.equal(2);
      expect(await multiSig.isOwner(owner3.address)).to.be.false;
    });

    it("Should prevent removing owner if it would break requirement", async function () {
      // Try to remove two owners, leaving only one
      await multiSig.connect(owner1).removeOwner(owner3.address);
      await multiSig.connect(owner2).removeOwner(owner3.address);

      // Now try to remove another, which would leave only 1 owner with requirement of 2
      await multiSig.connect(owner1).removeOwner(owner2.address);
      await expect(
        multiSig.connect(owner3).removeOwner(owner2.address)
      ).to.be.revertedWith("Would break requirement");
    });

    it("Should allow changing an owner with multi-sig", async function () {
      const newOwner = nonOwner.address;

      // First owner proposes
      await multiSig.connect(owner1).changeOwner(owner3.address, newOwner);

      // Second owner confirms
      await multiSig.connect(owner2).changeOwner(owner3.address, newOwner);

      expect(await multiSig.isOwner(owner3.address)).to.be.false;
      expect(await multiSig.isOwner(newOwner)).to.be.true;
      expect(await multiSig.m_numOwners()).to.equal(3);
    });
  });

  describe("Transaction Execution", function () {
    it("Should execute transaction within daily limit without multi-sig", async function () {
      const amount = ethers.parseEther("0.5"); // Within daily limit
      const initialBalance = await ethers.provider.getBalance(recipient.address);

      await expect(
        multiSig.connect(owner1).execute(recipient.address, amount, "0x")
      )
        .to.emit(multiSig, "SingleTransact")
        .withArgs(owner1.address, amount, recipient.address, "0x");

      const finalBalance = await ethers.provider.getBalance(recipient.address);
      expect(finalBalance - initialBalance).to.equal(amount);
    });

    it("Should require multi-sig for transaction above daily limit", async function () {
      const amount = ethers.parseEther("2"); // Above daily limit
      const initialBalance = await ethers.provider.getBalance(recipient.address);

      // First owner proposes
      const tx1 = await multiSig.connect(owner1).execute(recipient.address, amount, "0x");
      const receipt1 = await tx1.wait();

      // Get the operation hash from the event
      const event = receipt1.logs.find(log => {
        try {
          return multiSig.interface.parseLog(log).name === "ConfirmationNeeded";
        } catch {
          return false;
        }
      });
      const operationHash = multiSig.interface.parseLog(event).args.operation;

      // Balance should not have changed yet
      let currentBalance = await ethers.provider.getBalance(recipient.address);
      expect(currentBalance).to.equal(initialBalance);

      // Second owner confirms
      await expect(multiSig.connect(owner2).confirm(operationHash))
        .to.emit(multiSig, "MultiTransact");

      // Balance should have changed now
      currentBalance = await ethers.provider.getBalance(recipient.address);
      expect(currentBalance - initialBalance).to.equal(amount);
    });

    it("Should reset daily limit after 24 hours", async function () {
      const amount = ethers.parseEther("0.9");

      // Use up the daily limit
      await multiSig.connect(owner1).execute(recipient.address, amount, "0x");

      // Try to spend more within the same day (should fail)
      await expect(
        multiSig.connect(owner1).execute(recipient.address, amount, "0x")
      ).to.emit(multiSig, "ConfirmationNeeded");

      // Move time forward by 24 hours
      await time.increase(86400); // 24 hours in seconds

      // Should now be able to execute within the new daily limit
      await expect(
        multiSig.connect(owner1).execute(recipient.address, amount, "0x")
      ).to.emit(multiSig, "SingleTransact");
    });

    it("Should prevent non-owners from executing transactions", async function () {
      await expect(
        multiSig.connect(nonOwner).execute(recipient.address, ethers.parseEther("0.1"), "0x")
      ).to.be.revertedWith("Not an owner");
    });

    it("Should prevent reentrancy attacks", async function () {
      // Deploy a malicious contract that tries to reenter
      const MaliciousContract = await ethers.getContractFactory("MaliciousReentrancy");
      const malicious = await MaliciousContract.deploy(await multiSig.getAddress());
      await malicious.waitForDeployment();

      // Try to execute a transaction to the malicious contract
      const amount = ethers.parseEther("0.1");
      
      // This should fail due to reentrancy guard
      await expect(
        multiSig.connect(owner1).execute(await malicious.getAddress(), amount, "0x")
      ).to.be.revertedWith("Reentrant call");
    });
  });

  describe("Confirmation Management", function () {
    let operationHash;

    beforeEach(async function () {
      // Create a pending transaction
      const amount = ethers.parseEther("2");
      const tx = await multiSig.connect(owner1).execute(recipient.address, amount, "0x");
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return multiSig.interface.parseLog(log).name === "ConfirmationNeeded";
        } catch {
          return false;
        }
      });
      operationHash = multiSig.interface.parseLog(event).args.operation;
    });

    it("Should allow owner to confirm transaction", async function () {
      await expect(multiSig.connect(owner2).confirm(operationHash))
        .to.emit(multiSig, "Confirmation")
        .withArgs(owner2.address, operationHash);

      expect(await multiSig.hasConfirmed(operationHash, owner2.address)).to.be.true;
    });

    it("Should prevent double confirmation from same owner", async function () {
      await multiSig.connect(owner2).confirm(operationHash);
      
      // Try to confirm again
      const tx = await multiSig.connect(owner2).confirm(operationHash);
      const receipt = await tx.wait();
      
      // Should not emit Confirmation event on second attempt
      const confirmEvents = receipt.logs.filter(log => {
        try {
          return multiSig.interface.parseLog(log).name === "Confirmation";
        } catch {
          return false;
        }
      });
      expect(confirmEvents.length).to.equal(0);
    });

    it("Should allow owner to revoke confirmation", async function () {
      await multiSig.connect(owner2).confirm(operationHash);
      expect(await multiSig.hasConfirmed(operationHash, owner2.address)).to.be.true;

      await expect(multiSig.connect(owner2).revoke(operationHash))
        .to.emit(multiSig, "Revoke")
        .withArgs(owner2.address, operationHash);

      expect(await multiSig.hasConfirmed(operationHash, owner2.address)).to.be.false;
    });

    it("Should execute transaction when threshold is reached", async function () {
      const initialBalance = await ethers.provider.getBalance(recipient.address);

      await expect(multiSig.connect(owner2).confirm(operationHash))
        .to.emit(multiSig, "MultiTransact");

      const finalBalance = await ethers.provider.getBalance(recipient.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe("Configuration", function () {
    it("Should allow changing required confirmations with multi-sig", async function () {
      const newRequired = 1;

      // First owner proposes
      await multiSig.connect(owner1).changeRequirement(newRequired);

      // Second owner confirms
      await multiSig.connect(owner2).changeRequirement(newRequired);

      expect(await multiSig.m_required()).to.equal(newRequired);
    });

    it("Should prevent invalid requirement changes", async function () {
      await expect(
        multiSig.connect(owner1).changeRequirement(0)
      ).to.be.revertedWith("Invalid requirement");

      await expect(
        multiSig.connect(owner1).changeRequirement(10)
      ).to.be.revertedWith("Invalid requirement");
    });

    it("Should allow changing daily limit with multi-sig", async function () {
      const newLimit = ethers.parseEther("5");

      // First owner proposes
      await multiSig.connect(owner1).setDailyLimit(newLimit);

      // Second owner confirms
      await multiSig.connect(owner2).setDailyLimit(newLimit);

      expect(await multiSig.m_dailyLimit()).to.equal(newLimit);
    });

    it("Should allow resetting spent today with multi-sig", async function () {
      // Spend some amount
      await multiSig.connect(owner1).execute(recipient.address, ethers.parseEther("0.5"), "0x");
      expect(await multiSig.spentToday()).to.be.gt(0);

      // First owner proposes reset
      await multiSig.connect(owner1).resetSpentToday();

      // Second owner confirms
      await multiSig.connect(owner2).resetSpentToday();

      expect(await multiSig.spentToday()).to.equal(0);
    });
  });

  describe("View Functions", function () {
    it("Should return correct owner status", async function () {
      expect(await multiSig.isOwner(owner1.address)).to.be.true;
      expect(await multiSig.isOwner(nonOwner.address)).to.be.false;
    });

    it("Should return pending transactions", async function () {
      // Create multiple pending transactions
      await multiSig.connect(owner1).execute(recipient.address, ethers.parseEther("2"), "0x");
      await multiSig.connect(owner1).execute(recipient.address, ethers.parseEther("3"), "0x");

      const pending = await multiSig.getPendingTransactions();
      expect(pending.length).to.be.gte(2);
    });

    it("Should return correct confirmation status", async function () {
      const tx = await multiSig.connect(owner1).execute(recipient.address, ethers.parseEther("2"), "0x");
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return multiSig.interface.parseLog(log).name === "ConfirmationNeeded";
        } catch {
          return false;
        }
      });
      const operationHash = multiSig.interface.parseLog(event).args.operation;

      expect(await multiSig.hasConfirmed(operationHash, owner1.address)).to.be.true;
      expect(await multiSig.hasConfirmed(operationHash, owner2.address)).to.be.false;
    });
  });

  describe("Deposit Functionality", function () {
    it("Should emit Deposit event when receiving ether", async function () {
      const amount = ethers.parseEther("1");
      
      await expect(
        owner1.sendTransaction({
          to: await multiSig.getAddress(),
          value: amount,
        })
      )
        .to.emit(multiSig, "Deposit")
        .withArgs(owner1.address, amount);
    });

    it("Should accept ether deposits", async function () {
      const initialBalance = await ethers.provider.getBalance(await multiSig.getAddress());
      const amount = ethers.parseEther("5");

      await owner1.sendTransaction({
        to: await multiSig.getAddress(),
        value: amount,
      });

      const finalBalance = await ethers.provider.getBalance(await multiSig.getAddress());
      expect(finalBalance - initialBalance).to.equal(amount);
    });
  });
});

// Malicious contract for reentrancy testing
contract MaliciousReentrancy {
    address public multiSig;
    
    constructor(address _multiSig) {
        multiSig = _multiSig;
    }
    
    receive() external payable {
        // Try to reenter the multiSig wallet
        (bool success,) = multiSig.call(
            abi.encodeWithSignature("execute(address,uint256,bytes)", address(this), 0, "")
        );
        require(success, "Reentry failed");
    }
}
