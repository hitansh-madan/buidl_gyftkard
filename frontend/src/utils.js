import { ethers } from "ethers";
import { init } from "@web3-onboard/react";
import { RelayProvider } from "@opengsn/provider";
import uauthModule from "@web3-onboard/uauth";
import coinbaseWalletModule from "@web3-onboard/coinbase";
import abi from "./abi/gyftKard.json";
import Erc20Abi from "./abi/Erc20Approve.json";
import Erc721Abi from "./abi/Erc721Approve.json";
import Erc1155Abi from "./abi/Erc1155Approve.json";

const coinbaseWalletSdk = coinbaseWalletModule();
const uauth = uauthModule({
  clientID: process.env.REACT_APP_UAUTH_CLIENT_ID,
  redirectUri: process.env.REACT_APP_UAUTH_REDIRECT_URI,
  scope: "openid wallet email profile:optional social:optional",
});

const goerliRpcUrl = `https://${process.env.REACT_APP_COINBASE_API_USERNAME}:${process.env.REACT_APP_COINBASE_API_PASSWORD}@goerli.ethereum.coinbasecloud.net`;
const mumbaiRpcUrl = "https://rpc-mumbai.maticvigil.com/";
const mumbaiGyftKard = process.env.REACT_APP_CONTRACT_MUMBAI;
const goerliGyftKard = process.env.REACT_APP_CONTRACT_GOERLI;
const goerliPaymaster = process.env.REACT_APP_GOERLI_PAYMASTER;
const mumbaiPaymaster = process.env.REACT_APP_MUMBAI_PAYMASTER;

const chains = [
  {
    id: 5,
    token: "ETH",
    label: "Goerli Testnet",
    rpcUrl: goerliRpcUrl,
  },
  {
    id: 80001,
    token: "MATIC",
    label: "Mumbai Testnet",
    rpcUrl: mumbaiRpcUrl,
  },
];

const generateKeyPair = () => {
  const wallet = ethers.Wallet.createRandom();
  console.log("address:", wallet.address);
  console.log("privateKey:", wallet.privateKey);
  return {
    cardId: wallet.address,
    code: wallet.privateKey,
  };
};

const showSnackbar = (message, success) => {
  var snackbar = document.getElementById("snackbar");
  const successStyles = ["border-green-400", "bg-green-200", "text-green-900"];
  const errorStyles = ["border-red-400", "bg-red-200", "text-red-900"];
  snackbar.innerHTML = message;
  (success ? successStyles : errorStyles).forEach((el) => {
    snackbar.classList.add(el);
  });
  snackbar.classList.remove("hidden");
  setTimeout(function () {
    (success ? successStyles : errorStyles).forEach((el) => {
      snackbar.classList.remove(el);
    });
    snackbar.classList.add("hidden");
  }, 10000);
};

const addCard = async (provider, chainId, assetType, tokenAddress, tokenId, amount) => {
  try {
    amount = ethers.BigNumber.from(amount);
    if (chainId !== "0x5" && chainId !== "0x13881") throw new Error(`Invalid Chain ${chainId}`);
    const contract = new ethers.Contract(chainId === "0x5" ? goerliGyftKard : mumbaiGyftKard, abi, provider);
    const giftCardKeyPair = generateKeyPair();

    const addCardTxUnsigned = await contract.populateTransaction.addCard(
      giftCardKeyPair.cardId,
      assetType,
      tokenAddress,
      tokenId,
      amount
    );
    if (assetType === 0) addCardTxUnsigned.value = amount;

    const submittedTx = await provider.getUncheckedSigner().sendTransaction(addCardTxUnsigned);
    const addCardReceipt = await submittedTx.wait();

    console.log(addCardReceipt);
    if (addCardReceipt.status === 0) {
      showSnackbar(`Error: Transaction could not be completed`, 0);
      throw new Error("addCard transaction failed");
    } else {
      showSnackbar(
        `<a href="https://${chainId === "0x5" ? "goerli.etherscan.io" : "mumbai.polygonscan.com"}/tx/${
          addCardReceipt.transactionHash
        }"> View transaction ↗ </a>`,
        1
      );
    }

    if (assetType !== 0) {
      try {
        showSnackbar("Please give token approval to contract", 1);
        const tokenContract = new ethers.Contract(
          tokenAddress,
          assetType === 1 ? Erc20Abi : assetType === 2 ? Erc721Abi : Erc1155Abi,
          provider.getUncheckedSigner()
        );
        let approveTx;
        if (assetType === 1)
          approveTx = await tokenContract.approve(chainId === "0x5" ? goerliGyftKard : mumbaiGyftKard, amount);
        else if (assetType === 2)
          approveTx = await tokenContract.approve(chainId === "0x5" ? goerliGyftKard : mumbaiGyftKard, tokenId);
        else if (assetType === 3)
          approveTx = await tokenContract.setApprovalForAll(chainId === "0x5" ? goerliGyftKard : mumbaiGyftKard, 1);
        const approvReceipt = await approveTx.wait();
        console.log(approvReceipt);
        if (approvReceipt.status === 1) {
          showSnackbar("Token Approval successful", 1);
        }
      } catch (e) {
        console.log(e);
        showSnackbar(
          `Tone Approval failed ! Make sure contract has token approval. \n Error: ${
            e.message.split('reason="')[1]?.split('"')[0] || e.message.split("(")[0].split("[")[0].split(";")[0]
          }`
        );
      }
    }

    return giftCardKeyPair.code;
  } catch (e) {
    console.log(e);
    showSnackbar(
      `Error: ${e.message.split('reason="')[1]?.split('"')[0] || e.message.split("(")[0].split("[")[0].split(";")[0]}`,
      0
    );
  }
};

export const generateNative = async (provider, chainId, amount) => {
  return await addCard(provider, chainId, 0, ethers.constants.AddressZero, 0, amount);
};
export const generateERC20 = async (provider, chainId, tokenAddress, amount) => {
  return await addCard(provider, chainId, 1, tokenAddress, 0, amount);
};
export const generateERC721 = async (provider, chainId, tokenAddress, tokenId) => {
  return await addCard(provider, chainId, 2, tokenAddress, tokenId, 0);
};
export const generateERC1155 = async (provider, chainId, tokenAddress, tokenId, amount) => {
  return await addCard(provider, chainId, 3, tokenAddress, tokenId, amount);
};

export const claim = async (code, chainId, provider) => {
  try {
    const gsnProvider = await RelayProvider.newProvider({
      provider: provider,
      config: {
        // loggerConfiguration: { logLevel: "debug" },
        paymasterAddress: chainId === "0x5" ? goerliPaymaster : mumbaiPaymaster,
      },
    }).init();
    gsnProvider.addAccount(code);
    provider = new ethers.providers.Web3Provider(gsnProvider);
    const cardId = ethers.utils.computeAddress(code);
    const account = (await provider.listAccounts())[0];

    const contract = new ethers.Contract(
      chainId === "0x5" ? goerliGyftKard : mumbaiGyftKard,
      abi,
      provider.getSigner(cardId)
    );

    const receipt = await contract.claimCard(account);
    console.log(receipt);

    if (receipt) showSnackbar(`Successfully claimed at ${account}`, 1);
  } catch (e) {
    console.log(e);
    showSnackbar(
      `Error: ${e.message.split('reason="')[1]?.split('"')[0] || e.message.split("(")[0].split("[")[0].split(";")[0]}`,
      0
    );
  }
};

export const web3Onboard = init({
  wallets: [uauth, coinbaseWalletSdk], // created in previous step
  chains: chains,
  appMetadata: {
    name: "GyftKard",
    description: "GyftKard",
    icon: "https://upload.wikimedia.org/wikipedia/commons/6/69/GK_logo_GREEN.png",
  },
});
