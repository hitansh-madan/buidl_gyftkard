import { useConnectWallet } from "@web3-onboard/react";
import { useEffect } from "react";
import Home from "./Home";

const App = () => {
  const [{ wallet, connecting }, connect] = useConnectWallet();

  useEffect(() => {
    let label = localStorage.getItem("label");
    console.log(label);
    if (label) {
      connect({
        autoSelect: {
          label: label,
          disableModals: true,
        },
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("label", wallet?.label);
    console.log(wallet?.label);
  }, [wallet]);

  return (
    <div>
      <div className="h-screen flex flex-col">
        {wallet ? (
          <Home />
        ) : connecting ? (
          <button className="h-12 m-auto px-8 rounded-2xl font-extrabold" onClick={() => connect()}>
            Connecting
          </button>
        ) : (
          <button
            className="h-12 m-auto px-8 rounded-2xl bg-emerald-500 text-white font-extrabold"
            onClick={() => connect()}
          >
            Connect wallet
          </button>
        )}
      </div>
      <div
        id="snackbar"
        className="max-w-xl w-fit fixed z-10 bottom-8 left-1/2 -translate-x-1/2 px-8 py-2 border-2 rounded-md hidden"
      ></div>
    </div>
  );
};

export default App;
