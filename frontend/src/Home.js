import { useState, useEffect } from "react";
import { useConnectWallet, useSetChain } from "@web3-onboard/react";
import { ethers } from "ethers";
import Modal from "react-modal";
import QRCode from "react-qr-code";
import { claim, generateERC1155, generateERC20, generateERC721, generateNative } from "./utils";

const Home = () => {
  const [{ wallet }] = useConnectWallet();
  const [{ connectedChain }] = useSetChain();
  const [provider, setProvider] = useState();

  const [giftCardCode, setGiftCardCode] = useState("");

  const [cardType, setCardType] = useState(0);
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [amount, setAmount] = useState("");

  const [generatedGiftCardCode, setGeneratedGiftCardCode] = useState("");
  const [modalIsOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (wallet?.provider) {
      setProvider(new ethers.providers.Web3Provider(wallet.provider));
    } else {
      setProvider(undefined);
    }
  }, [wallet]);

  useEffect(() => {
    setAmount("");
    setTokenAddress("");
    setTokenId("");
  }, [cardType]);

  const downloadTxtFile = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedGiftCardCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `gyftKardCode.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="flex flex-col px-12 h-screen">
      <Modal
        isOpen={modalIsOpen}
        style={{
          overlay: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
          },
        }}
        onRequestClose={() => setIsOpen(false)}
        className="h-auto w-fit top-1/2 left-1/2 fixed -translate-x-1/2 -translate-y-1/2 "
      >
        <div className="flex flex-row  bg-white p-6 border-2 border-emerald-500 rounded-2xl" id="gyftKardCoupon">
          <div className="flex flex-col">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/69/GK_logo_GREEN.png" alt="" className="w-20" />
            <div className="font-bold">GyftKard Code</div>
            <div>{generatedGiftCardCode}</div>
            <div>
              <p className="font-semibold">Claim at : </p>
              <a href={process.env.REACT_APP_UAUTH_REDIRECT_URI}> {process.env.REACT_APP_UAUTH_REDIRECT_URI}</a>
            </div>
          </div>
          <div className="pl-8">
            <QRCode value={generatedGiftCardCode} size={150} />
          </div>
        </div>
        <div className="flex flex-row-reverse justify-start">
          <button
            className="h-12 mx-2 my-4 px-8 rounded-2xl bg-emerald-500 text-white font-extrabold"
            onClick={() => {
              downloadTxtFile();
            }}
          >
            📄 Save Text
          </button>
          <button
            className="h-12 mx-2 my-4 px-8 rounded-2xl bg-emerald-500 text-white font-extrabold"
            onClick={() => {
              window.print();
            }}
          >
            🖨️ Print
          </button>
        </div>
      </Modal>

      <div className="text-3xl font-extrabold py-8 ">GyftKard</div>
      <div className="flex flex-row px-6">
        <input
          className="mx-8 rounded-2xl py-4 px-6 bg-slate-100 grow"
          type="text"
          value={giftCardCode}
          placeholder="Enter gift card code to claim!"
          onChange={(e) => {
            setGiftCardCode(e.target.value);
          }}
        />
        <button
          className="px-8 rounded-2xl bg-emerald-500 text-white font-extrabold"
          onClick={async () => {
            claim(giftCardCode, connectedChain.id, wallet.provider);
          }}
        >
          Claim
        </button>
      </div>

      <div className="bg-slate-100 rounded-2xl grow my-4 p-8 flex flex-col">
        <div className="flex flex-row my-2">
          <div className="text-2xl font-bold pr-6">Generate Gift Card</div>
          <div className="flex flex-row flex-wrap">
            <button
              className={`my-auto px-4 py-1 rounded-full ${cardType === 0 ? "bg-white border-2" : ""}  mx-2`}
              onClick={() => setCardType(0)}
            >
              Native Currency
            </button>
            <button
              className={`my-auto px-4 py-1 rounded-full ${cardType === 1 ? "bg-white border-2" : ""}  mx-2`}
              onClick={() => setCardType(1)}
            >
              ERC20
            </button>
            <button
              className={`my-auto px-4 py-1 rounded-full ${cardType === 2 ? "bg-white border-2" : ""}  mx-2`}
              onClick={() => setCardType(2)}
            >
              ERC721
            </button>
            <button
              className={`my-auto px-4 py-1 rounded-full ${cardType === 3 ? "bg-white border-2" : ""}  mx-2`}
              onClick={() => setCardType(3)}
            >
              ERC1155
            </button>
          </div>
        </div>
        <div className="grow mt-4">
          {cardType === 0 && (
            <div className="max-w-xl m-auto rounded-2xl p-8 bg-white flex flex-col">
              <div className="font-semibold py-2 px-6">Amount</div>
              <input
                className="rounded-2xl py-4 px-6 bg-slate-100 mb-2"
                type="text"
                value={amount}
                placeholder="Amount in Wei (Eg. 1800000000)"
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
              />
              <button
                className="h-12 mx-auto my-4 px-8 rounded-2xl bg-emerald-500 text-white font-extrabold"
                onClick={async () => {
                  const code = await generateNative(provider, connectedChain.id, amount);
                  setGeneratedGiftCardCode(code);
                  code && setIsOpen(true);
                }}
              >
                Generate
              </button>
            </div>
          )}
          {cardType === 1 && (
            <div className="max-w-xl m-auto rounded-2xl p-8 bg-white flex flex-col">
              <div className="font-semibold py-2 px-6">Token Address</div>
              <input
                className="rounded-2xl py-4 px-6 bg-slate-100 mb-2"
                type="text"
                value={tokenAddress}
                placeholder="0x00"
                onChange={(e) => {
                  setTokenAddress(e.target.value);
                }}
              />
              <div className="font-semibold py-2 px-6">Amount</div>
              <input
                className="rounded-2xl py-4 px-6 bg-slate-100 mb-2"
                type="text"
                value={amount}
                placeholder="Amount"
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
              />
              <button
                className="h-12 mx-auto my-4 px-8 rounded-2xl bg-emerald-500 text-white font-extrabold"
                onClick={async () => {
                  const code = await generateERC20(provider, connectedChain.id, tokenAddress, amount);
                  setGeneratedGiftCardCode(code);
                  code && setIsOpen(true);
                }}
              >
                Generate
              </button>
            </div>
          )}
          {cardType === 2 && (
            <div className="max-w-xl m-auto rounded-2xl p-8 bg-white flex flex-col">
              <div className="font-semibold py-2 px-6">Token Address</div>
              <input
                className="rounded-2xl py-4 px-6 bg-slate-100 mb-2"
                type="text"
                value={tokenAddress}
                placeholder="0x00"
                onChange={(e) => {
                  setTokenAddress(e.target.value);
                }}
              />
              <div className="font-semibold py-2 px-6">Token Id</div>
              <input
                className="rounded-2xl py-4 px-6 bg-slate-100 mb-2"
                type="text"
                value={tokenId}
                placeholder="Id"
                onChange={(e) => {
                  setTokenId(e.target.value);
                }}
              />
              <button
                className="h-12 mx-auto my-4 px-8 rounded-2xl bg-emerald-500 text-white font-extrabold"
                onClick={async () => {
                  const code = await generateERC721(provider, connectedChain.id, tokenAddress, tokenId);
                  setGeneratedGiftCardCode(code);
                  code && setIsOpen(true);
                }}
              >
                Generate
              </button>
            </div>
          )}
          {cardType === 3 && (
            <div className="max-w-xl m-auto rounded-2xl p-8 bg-white flex flex-col">
              <div className="font-semibold py-2 px-6">Token Address</div>
              <input
                className="rounded-2xl py-4 px-6 bg-slate-100 mb-2"
                type="text"
                value={tokenAddress}
                placeholder="0x00"
                onChange={(e) => {
                  setTokenAddress(e.target.value);
                }}
              />
              <div className="font-semibold py-2 px-6">Token Id</div>
              <input
                className="rounded-2xl py-4 px-6 bg-slate-100 mb-2"
                type="text"
                value={tokenId}
                placeholder="Id"
                onChange={(e) => {
                  setTokenId(e.target.value);
                }}
              />
              <div className="font-semibold py-2 px-6">Amount</div>
              <input
                className="rounded-2xl py-4 px-6 bg-slate-100 mb-2"
                type="text"
                value={amount}
                placeholder="Amount in Wei (Eg. 1800)"
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
              />
              <button
                className="h-12 mx-auto mt-4 px-8 rounded-2xl bg-emerald-500 text-white font-extrabold"
                onClick={async () => {
                  const code = await generateERC1155(provider, connectedChain.id, tokenAddress, tokenId, amount);
                  setGeneratedGiftCardCode(code);
                  code && setIsOpen(true);
                }}
              >
                Generate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
