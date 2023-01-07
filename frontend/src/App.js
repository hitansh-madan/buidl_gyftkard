import { useConnectWallet } from "@web3-onboard/react";
import Home from "./Home";

const App = () => {
  const [{ wallet }, connect] = useConnectWallet();

  return (
    <div>
      <div className="h-screen flex flex-col">
        {wallet ? (
          <Home />
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
