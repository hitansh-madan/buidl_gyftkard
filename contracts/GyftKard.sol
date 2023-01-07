// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@opengsn/contracts/src/ERC2771Recipient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

enum AssetType {
    ETH,
    ERC20,
    ERC721,
    ERC1155
}

enum GiftCardState {
    NOT_ISSUED,
    ISSUED,
    CLAIMED
}

struct Asset {
    AssetType assetType;
    address tokenAddress;
    uint256 tokenId;
    uint256 amount;
}

struct GiftCard {
    address issuer;
    Asset asset;
    GiftCardState state;
}

contract GyftKard is ERC2771Recipient {
    event GiftCardIssued(address cardId, address issuer, Asset asset);
    event GiftCardClaimed(address cardId, address claimedBy);
    event GiftCardRemoved(address cardId);

    constructor(address _forwarder) {
        _setTrustedForwarder(_forwarder);
    }

    mapping(address => GiftCard) cardIdToGiftCard;

    function addCard(
        address cardId,
        AssetType assetType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount
    ) external payable {
        if (cardIdToGiftCard[cardId].state != GiftCardState.NOT_ISSUED) {
            revert("Card Id Already Exists");
        }
        if (assetType == AssetType.ETH) {
            if (msg.value < amount || amount == 0) {
                revert("Zero or insufficient funds recieved");
            }
        } else {
            if (tokenAddress == address(0)) {
                revert("zero address");
            }
            if (assetType != AssetType.ERC721 && amount == 0) {
                revert("amount cannot be 0");
            }
        }

        cardIdToGiftCard[cardId].issuer = _msgSender();
        cardIdToGiftCard[cardId].state = GiftCardState.ISSUED;

        cardIdToGiftCard[cardId].asset = Asset(
            assetType,
            tokenAddress,
            tokenId,
            amount
        );

        emit GiftCardIssued(
            cardId,
            _msgSender(),
            cardIdToGiftCard[cardId].asset
        );
    }

    function claimCard(address payable claimedBy) external {
        GiftCard memory card = cardIdToGiftCard[_msgSender()];
        if (card.state != GiftCardState.ISSUED) {
            revert("Card does not exist or already claimed");
        }
        if (card.asset.assetType == AssetType.ETH) {
            claimedBy.transfer(card.asset.amount);
        } else if (card.asset.assetType == AssetType.ERC20) {
            IERC20(card.asset.tokenAddress).transferFrom(
                card.issuer,
                claimedBy,
                card.asset.amount
            );
        } else if (card.asset.assetType == AssetType.ERC721) {
            IERC721(card.asset.tokenAddress).safeTransferFrom(
                card.issuer,
                claimedBy,
                card.asset.tokenId
            );
        } else if (card.asset.assetType == AssetType.ERC1155) {
            IERC1155(card.asset.tokenAddress).safeTransferFrom(
                card.issuer,
                claimedBy,
                card.asset.tokenId,
                card.asset.amount,
                bytes("0")
            );
        }
        cardIdToGiftCard[_msgSender()].state = GiftCardState.CLAIMED;
        emit GiftCardClaimed(_msgSender(), claimedBy);
    }

    function removeCard(address cardId) external {
        GiftCard memory card = cardIdToGiftCard[cardId];
        if (card.state != GiftCardState.ISSUED) {
            revert("Card does not exist or already claimed");
        }
        if (_msgSender() != card.issuer) {
            revert("You can olny remove cards issued by you");
        }
        if (card.asset.assetType == AssetType.ETH) {
            payable(card.issuer).transfer(card.asset.amount);
        }
        cardIdToGiftCard[cardId] = GiftCard(
            address(0),
            Asset(AssetType.ETH, address(0), 0, 0),
            GiftCardState.NOT_ISSUED
        );
        emit GiftCardRemoved(cardId);
    }
}
