const GyftKard = artifacts.require("GyftKard");
const forwarder = "0x7A95fA73250dc53556d264522150A940d4C50238";
// const paymaster = "0x327BBd6BAc3236BCAcDE0D0f4FCD08b3eDfFbc06";
// const { RelayProvider } = require("@opengsn/provider");

module.exports = function (deployer) {
  deployer.deploy(GyftKard, forwarder);
};
