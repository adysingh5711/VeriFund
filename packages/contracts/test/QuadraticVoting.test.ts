import { expect } from "chai";
import { ethers } from "hardhat";
import { QuadraticVoting } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("QuadraticVoting", function () {
  let quadraticVoting: QuadraticVoting;
  let admin: SignerWithAddress;
  let voter1: SignerWithAddress;
  let voter2: SignerWithAddress;
  let voter3: SignerWithAddress;

  beforeEach(async function () {
    [admin, voter1, voter2, voter3] = await ethers.getSigners();
    
    const QuadraticVotingFactory = await ethers.getContractFactory("QuadraticVoting");
    quadraticVoting = await QuadraticVotingFactory.deploy();
    await quadraticVoting.initialize(admin.address);
  });

  describe("Voting Round Management", function () {
    it("Should start a new voting round", async function () {
      const duration = 86400; // 1 day
      const commitDuration = 43200; // 12 hours
      const merkleRoot = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-root"));
      
      await expect(
        quadraticVoting.connect(admin).startVotingRound(duration, commitDuration, merkleRoot)
      ).to.emit(quadraticVoting, "RoundStarted");
      
      const currentRound = await quadraticVoting.currentRoundId();
      expect(currentRound).to.equal(1);
    });

    it("Should prevent non-admin from starting rounds", async function () {
      const duration = 86400;
      const commitDuration = 43200;
      const merkleRoot = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-root"));
      
      await expect(
        quadraticVoting.connect(voter1).startVotingRound(duration, commitDuration, merkleRoot)
      ).to.be.revertedWith("AccessControl");
    });
  });

  describe("Vote Commitment and Revelation", function () {
    let merkleRoot: string;
    
    beforeEach(async function () {
      // Create merkle tree with voter addresses
      const leaves = [voter1.address, voter2.address, voter3.address].map(addr => 
        ethers.utils.keccak256(ethers.utils.solidityPack(['address'], [addr]))
      );
      merkleRoot = ethers.utils.keccak256(ethers.utils.concat(leaves));
      
      // Start voting round
      await quadraticVoting.connect(admin).startVotingRound(86400, 43200, merkleRoot);
    });

    it("Should commit votes correctly", async function () {
      const proposalId = 1;
      const votes = 5;
      const nonce = 12345;
      
      const commitment = ethers.utils.keccak256(
        ethers.utils.solidityPack(['uint256', 'uint256', 'uint256'], [proposalId, votes, nonce])
      );
      
      // For testing, we'll use empty merkle proof (would need proper implementation)
      const merkleProof: string[] = [];
      
      await expect(
        quadraticVoting.connect(voter1).commitVote(commitment, merkleProof)
      ).to.emit(quadraticVoting, "VoteCommitted");
    });

    it("Should validate quadratic cost constraints", async function () {
      const proposalId = 1;
      const votes = 11; // Over maximum
      const nonce = 12345;
      
      const commitment = ethers.utils.keccak256(
        ethers.utils.solidityPack(['uint256', 'uint256', 'uint256'], [proposalId, votes, nonce])
      );
      
      // First commit (this should work)
      await quadraticVoting.connect(voter1).commitVote(commitment, []);
      
      // Move past commit phase
      await time.increase(43201);
      
      // Reveal should fail due to invalid vote count
      await expect(
        quadraticVoting.connect(voter1).revealVote(proposalId, votes, nonce)
      ).to.be.revertedWithCustomError(quadraticVoting, "InvalidVoteCount");
    });

    it("Should prevent double voting", async function () {
      const commitment = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-commitment"));
      
      await quadraticVoting.connect(voter1).commitVote(commitment, []);
      
      await expect(
        quadraticVoting.connect(voter1).commitVote(commitment, [])
      ).to.be.revertedWithCustomError(quadraticVoting, "AlreadyVoted");
    });
  });

  describe("Security Tests", function () {
    it("Should pause and unpause correctly", async function () {
      await quadraticVoting.connect(admin).pause();
      
      const commitment = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
      await expect(
        quadraticVoting.connect(voter1).commitVote(commitment, [])
      ).to.be.revertedWith("Pausable: paused");
      
      await quadraticVoting.connect(admin).unpause();
      // Should work after unpause (with proper setup)
    });

    it("Should handle reentrancy protection", async function () {
      // Test would involve malicious contract attempting reentrancy
      // This is a placeholder for comprehensive reentrancy testing
    });
  });
});