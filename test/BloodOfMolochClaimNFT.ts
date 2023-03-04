import { expect } from "chai";
import { ethers } from 'hardhat';
import { LazyMinter } from'../lib/lazyMinter';
import { BloodOfMolochClaimNFT } from '../types';

describe("Claim NFT", function() {
  async function deploy() {
    const [minter, mockPBT, rando] = await ethers.getSigners();
  
    let factory = await ethers.getContractFactory("BloodOfMolochClaimNFT", minter)
    const contract = await factory.deploy(minter.address, mockPBT.address) as BloodOfMolochClaimNFT;
  
    return {
      minter,
      mockPBT,
      rando,
      contract,
    }
  }
  let minPrice = ethers.utils.parseEther(".001");
  const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

  it("Should deploy", async function() {
    const signers = await ethers.getSigners();
    const minter = signers[0];

    const LazyNFT = await ethers.getContractFactory("BloodOfMolochClaimNFT");
    const lazynft = await LazyNFT.deploy(minter.address, signers[1].address);
    await lazynft.deployed();
  });

  it("Should mint an NFT from minter role", async function() {
    const { contract, mockPBT, minter } = await deploy()

    const receipt = contract.connect(minter).mint()

    const tokenId = 1
    await expect(receipt)
      .to.emit(contract, "Minted").withArgs(tokenId)
      .and.to.emit(contract, "Transfer").withArgs(NULL_ADDRESS, minter.address, tokenId)
  });

  it("Should revert mint if not minter role", async function () {
    const { contract, mockPBT, minter, rando } = await deploy()

    const receipt = contract.connect(rando).mint()

    await expect(receipt)
      .to.be.reverted
  })

  it("Should batchMint quantity of NFTs as minter role", async function () {
    const { contract, mockPBT, minter } = await deploy()

    const quantity = 10
    const receipt = contract.connect(minter).batchMint(quantity)

    for(let i=0; i < quantity; i++) {
      await expect(receipt)
        .to.emit(contract, "Minted").withArgs(i + 1)
        .and.to.emit(contract, "Transfer").withArgs(NULL_ADDRESS, minter.address, i + 1)
    }
  })

  it("Should revert batchMint if not minter role", async function () {
    const { contract, mockPBT, minter, rando } = await deploy()

    const receipt = contract.connect(rando).batchMint(10)

    await expect(receipt)
      .to.be.reverted
  })

	it("Should revert mint/batchMint if supply is 350", async function () {
		const { contract, mockPBT, minter } = await deploy()

    const quantity = 350
    await contract.connect(minter).batchMint(quantity)

		let revertedTx = contract.connect(minter).mint()
		await expect(revertedTx).to.be.revertedWith("BloodOfMolochClaimNFT: cannot exceed max supply")

		revertedTx = contract.connect(minter).batchMint(5)
		await expect(revertedTx).to.be.revertedWith("BloodOfMolochClaimNFT: cannot exceed max supply")
	})

	it("Should burn if operator is PBT", async function () {
		const { contract, mockPBT, minter } = await deploy()
		await contract.connect(minter).mint()

		const tokenId = 1
		const receipt = contract.connect(mockPBT).burn(tokenId)

		await expect(receipt).to.not.be.reverted
	})

	it("Should revert burn if not PBT or token owner", async function () {
		const { contract, mockPBT, minter, rando } = await deploy()
		await contract.connect(minter).mint()

		const tokenId = 1
		const receipt = contract.connect(rando).burn(tokenId)

		await expect(receipt).to.be.reverted
	})

  it("Should make payments available to minter for withdrawal", async function() {
    const { contract, rando, minter } = await deploy()
		
		await rando.sendTransaction({
			to: contract.address,
			value: minPrice,
		})

    // minter should have funds available to withdraw
    expect(await contract.availableToWithdraw()).to.equal(minPrice)

    // withdrawal should increase minter's balance
    await expect(await contract.withdraw())
      .to.changeEtherBalance(minter, minPrice)

    // minter should now have zero available
    expect(await contract.availableToWithdraw()).to.equal(0)
  });

	it("Should revert withdraw if not minter", async function () {
		const { contract, rando, minter } = await deploy()
		
		await rando.sendTransaction({
			to: contract.address,
			value: minPrice,
		})

    // minter should have funds available to withdraw
    expect(await contract.availableToWithdraw()).to.equal(minPrice)
		const receipt = contract.connect(rando).withdraw()

    // withdrawal should increase minter's balance
    await expect(receipt).to.be.revertedWith("Only authorized minters can withdraw")

    // minter should now have zero available
    expect(await contract.availableToWithdraw()).to.equal(minPrice)
	})
});
