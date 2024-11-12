// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ImageCertificateSBT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    struct Certificate {
        string holderName;
        string issuingEntity;
        uint256 date;
        string purpose;
        string uniqueId;
    }

    mapping(uint256 => Certificate) private _certificates;

    constructor(
        address initialOwner
    ) ERC721("ImageCertificateSBT", "ICERT") Ownable(initialOwner) {}

    function safeMint(
        address to,
        string memory holderName,
        string memory issuingEntity,
        uint256 date,
        string memory purpose,
        string memory uniqueId,
        string memory uri
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _certificates[tokenId] = Certificate(
            holderName,
            issuingEntity,
            date,
            purpose,
            uniqueId
        );
        return tokenId;
    }

    function getCertificate(
        uint256 tokenId
    ) public view returns (Certificate memory) {
        require(_isValidToken(tokenId), "Certificate does not exist");
        return _certificates[tokenId];
    }

    function _isValidToken(uint256 tokenId) internal view returns (bool) {
        return tokenId < _nextTokenId && _ownerOf(tokenId) != address(0);
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Soulbound token implementation
    // token transfer is not allowed
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(
            from == address(0) || to == from,
            "SBT: token transfer is not allowed"
        );
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override {
        if (value > 0) {
            require(
                balanceOf(account) == 0,
                "SBT: account already has a token"
            );
        }
        super._increaseBalance(account, value);
    }
}
