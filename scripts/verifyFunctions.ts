import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { Contract } from "@ethersproject/contracts";
import UniversalRouterABI from '@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json';

dotenv.config();

const UNIVERSAL_ROUTER_ADDRESS = process.env.UNISWAP_ROUTER_ADDRESS!;

async function verifyFunctions() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.BASE_RPC_URL);
  const universalRouterContract = new Contract(UNIVERSAL_ROUTER_ADDRESS, UniversalRouterABI.abi, provider);

  const isExactInputSingleSupported = typeof universalRouterContract.functions.exactInputSingle === 'function';
  const isExactOutputSingleSupported = typeof universalRouterContract.functions.exactOutputSingle === 'function';

  console.log('exactInputSingle supported:', isExactInputSingleSupported);
  console.log('exactOutputSingle supported:', isExactOutputSingleSupported);
}

verifyFunctions().catch(console.error);