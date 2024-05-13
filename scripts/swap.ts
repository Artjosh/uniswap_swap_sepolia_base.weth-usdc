import { ethers } from "hardhat";
import dotenv from "dotenv";
import { checkLiquidity } from "./checkLiquidity";
import { addLiquidity } from "./addLiquidity";

interface EnvVars {
  PRIVATE_KEY: string;
  BASE_RPC_URL: string;
  UNISWAP_ROUTER_ADDRESS: string;
  UNISWAP_FACTORY_ADDRESS: string;
  NONFUNGIBLE_POSITION_MANAGER_ADDRESS: string;
  TOKEN_IN_ADDRESS: string; // WETH
  TOKEN_OUT_ADDRESS: string; // USDC
}

dotenv.config();

const envVars: EnvVars = process.env as unknown as EnvVars;

if (
  !envVars.PRIVATE_KEY ||
  !envVars.BASE_RPC_URL ||
  !envVars.UNISWAP_ROUTER_ADDRESS ||
  !envVars.UNISWAP_FACTORY_ADDRESS ||
  !envVars.NONFUNGIBLE_POSITION_MANAGER_ADDRESS ||
  !envVars.TOKEN_IN_ADDRESS ||
  !envVars.TOKEN_OUT_ADDRESS
) {
  throw new Error("Please set all environment variables in the .env file");
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(envVars.BASE_RPC_URL);
  const wallet = new ethers.Wallet(envVars.PRIVATE_KEY, provider);

  const uniswapRouterABI = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json').abi;
  const erc20ABI = require('@openzeppelin/contracts/build/contracts/ERC20.json').abi;

  const uniswapRouter = new ethers.Contract(envVars.UNISWAP_ROUTER_ADDRESS, uniswapRouterABI, wallet);
  const tokenIn = new ethers.Contract(envVars.TOKEN_IN_ADDRESS, erc20ABI, wallet); // WETH

  const amountIn = ethers.utils.parseUnits('0.05', 18); // 0.05 WETH

  try {
    // Check WETH balance before approving
    const wethBalance = await tokenIn.balanceOf(wallet.address);
    console.log('Saldo de WETH:', ethers.utils.formatUnits(wethBalance, 18));

    if (wethBalance.lt(amountIn)) {
      throw new Error('Insufficient WETH balance');
    }

    // Check approval allowance
    const allowance = await tokenIn.allowance(wallet.address, envVars.UNISWAP_ROUTER_ADDRESS);
    if (allowance.lt(amountIn)) {
      const approveTx = await tokenIn.approve(envVars.UNISWAP_ROUTER_ADDRESS, amountIn);
      await approveTx.wait();
      console.log('Approval Transaction:', approveTx.hash);
    } else {
      console.log('Approval already granted.');
    }

    // Check and add liquidity if needed
    const liquidity = await checkLiquidity();
    if (liquidity.eq(0)) {
      console.log('The pool has no liquidity. Adding liquidity...');
      await addLiquidity();
    }

    // Set the parameters for the swap function
    const params = {
      tokenIn: envVars.TOKEN_IN_ADDRESS, // WETH
      tokenOut: envVars.TOKEN_OUT_ADDRESS, // USDC
      fee: 3000, 
      recipient: wallet.address,
      deadline: Math.floor(Date.now() / 1000) + (60 * 10), 
      amountIn: amountIn,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0, 
    };

    console.log('Swap Parameters:', params);

    // Perform the swap
    const swapTx = await uniswapRouter.exactInputSingle(params, {
      gasLimit: 200000
    });
    const receipt = await swapTx.wait();
    console.log('Swap Transaction:', swapTx.hash);
    console.log('Receipt:', receipt);

    const usdcContract = new ethers.Contract(envVars.TOKEN_OUT_ADDRESS, erc20ABI, wallet);
    const usdcBalance = await usdcContract.balanceOf(wallet.address);
    console.log('USDC Balance:', ethers.utils.formatUnits(usdcBalance, 6));
  } catch (error) {
    console.error("Error performing the swap:", error);
  }
}

main();