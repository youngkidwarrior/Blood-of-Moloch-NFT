// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
pragma abicoder v2; // required to accept structs as function parameters

import "hardhat/console.sol";

import "./ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "./IBurnable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BloodOfMolochClaimNFT is
    ERC721URIStorage,
    AccessControl,
    IBurnable
{
    address private PBT_ADDRESS;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public supply;
    uint256 public constant MAX_SUPPLY = 350;

    /// @dev Event to emit on signature mint with the `tokenId`.
    event MintedUsingSignature(uint256 tokenId);

    mapping(address => uint256) pendingWithdrawals;

    /**
     * @dev Mapping to hold the state if token is minted. This is used to verify if a voucher
     * has been used or not.
     */
    mapping(uint256 => bool) private minted;

    constructor(address payable minter, address pbtAddress)
        ERC721("Blood of Moloch Claim", "BLMC")
    {
        require(pbtAddress != address(0), "BloodOfMolochClaimNFT: null address");
        _setupRole(MINTER_ROLE, minter);
        PBT_ADDRESS = pbtAddress;
    }

    function mint() public {
        uint tokenId = supply + 1;
        supply++;
        _mint(_msgSender(), tokenId);
    }

    function batchMint(uint256 _quantity) external {
        for(uint i=0; i<_quantity; i++) {
            mint();
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControl, ERC721)
        returns (bool)
    {
        return
            ERC721.supportsInterface(interfaceId) ||
            AccessControl.supportsInterface(interfaceId);
    }

    /// @notice Transfers all pending withdrawal balance to the caller. Reverts if the caller is not an authorized minter.
    function withdraw() public {
        require(
            hasRole(MINTER_ROLE, msg.sender),
            "Only authorized minters can withdraw"
        );

        // IMPORTANT: casting msg.sender to a payable address is only safe if ALL members of the minter role are payable addresses.
        address payable receiver = payable(msg.sender);

        uint256 amount = pendingWithdrawals[receiver];
        // zero account before transfer to prevent re-entrancy attack
        pendingWithdrawals[receiver] = 0;
        receiver.transfer(amount);
    }

    function withdrawTokens(address _token) external {
        require(
            hasRole(MINTER_ROLE, msg.sender),
            "Only authorized minters can withdraw"
        );

        address receiver = _msgSender();
        uint balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(receiver, balance);
    }

    /// @notice Retuns the amount of Ether available to the caller to withdraw.
    function availableToWithdraw() public view returns (uint256) {
        return pendingWithdrawals[msg.sender];
    }

    /**
     * @dev Burns `tokenId`. See {ERC721-_burn}.
     *
     * Requirements:
     *
     * - The caller must own `tokenId` or be an approved operator.
     */
    function burn(uint256 tokenId) public virtual override {
        //solhint-disable-next-line max-line-length
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: caller is not token owner or approved"
        );
        _burn(tokenId);
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     */
    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        if (operator == PBT_ADDRESS) {
            return true;
        }
        return _operatorApprovals[owner][operator];
    }
}
