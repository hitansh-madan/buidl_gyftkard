import React from "react";
import ReactDOM from "react-dom/client";
import { Web3OnboardProvider } from "@web3-onboard/react";

import "./index.css";
import App from "./App";

import { web3Onboard } from "./utils";

window.Buffer = require("buffer/").Buffer;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      <App />
    </Web3OnboardProvider>
  </React.StrictMode>
);
