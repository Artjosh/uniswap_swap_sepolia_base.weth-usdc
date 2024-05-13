import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-ethers";
import "dotenv/config";

const { BASE_RPC_URL, PRIVATE_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
      },
      {
        version: "0.8.20",
      },
      {
        version: "0.8.17",
      }
    ]
  },
  networks: {
    base_main: {
      url: BASE_RPC_URL || "",
      accounts: [PRIVATE_KEY || ""],
    },
  },
};

export default config;
