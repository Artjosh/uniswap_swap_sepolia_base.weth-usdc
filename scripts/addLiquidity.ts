import { ethers } from "hardhat";
import dotenv from "dotenv";

interface EnvVars {
  PRIVATE_KEY: string;
  BASE_RPC_URL: string;
  NONFUNGIBLE_POSITION_MANAGER_ADDRESS: string;
  TOKEN_IN_ADDRESS: string; // WETH
  TOKEN_OUT_ADDRESS: string; // USDC
}

dotenv.config();

const envVars: EnvVars = process.env as unknown as EnvVars;

if (
  !envVars.PRIVATE_KEY ||
  !envVars.BASE_RPC_URL ||
  !envVars.NONFUNGIBLE_POSITION_MANAGER_ADDRESS ||
  !envVars.TOKEN_IN_ADDRESS ||
  !envVars.TOKEN_OUT_ADDRESS
) {
  throw new Error("Por favor, defina todas as variáveis de ambiente no arquivo .env");
}

export async function addLiquidity() {
  const provider = new ethers.providers.JsonRpcProvider(envVars.BASE_RPC_URL);
  const wallet = new ethers.Wallet(envVars.PRIVATE_KEY, provider);

  const positionManagerABI = require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json').abi;
  const erc20ABI = require('@openzeppelin/contracts/build/contracts/ERC20.json').abi;

  const positionManager = new ethers.Contract(envVars.NONFUNGIBLE_POSITION_MANAGER_ADDRESS, positionManagerABI, wallet);
  const tokenIn = new ethers.Contract(envVars.TOKEN_IN_ADDRESS, erc20ABI, wallet);
  const tokenOut = new ethers.Contract(envVars.TOKEN_OUT_ADDRESS, erc20ABI, wallet);

  const amountIn = ethers.utils.parseUnits('0.05', 18); // 0.05 WETH
  const amountOut = ethers.utils.parseUnits('100', 6); // 100 USDC (ajuste conforme necessário)

  // Aprovar tokens para o NonfungiblePositionManager
  const approveTx1 = await tokenIn.approve(envVars.NONFUNGIBLE_POSITION_MANAGER_ADDRESS, amountIn);
  await approveTx1.wait();
  console.log('Aprovação de WETH:', approveTx1.hash);

  const approveTx2 = await tokenOut.approve(envVars.NONFUNGIBLE_POSITION_MANAGER_ADDRESS, amountOut);
  await approveTx2.wait();
  console.log('Aprovação de USDC:', approveTx2.hash);

  const params = {
    token0: envVars.TOKEN_IN_ADDRESS,
    token1: envVars.TOKEN_OUT_ADDRESS,
    fee: 3000,
    tickLower: -887220, // Ajuste conforme necessário
    tickUpper: 887220, // Ajuste conforme necessário
    amount0Desired: amountIn,
    amount1Desired: amountOut,
    amount0Min: 0,
    amount1Min: 0,
    recipient: wallet.address,
    deadline: Math.floor(Date.now() / 1000) + (60 * 10),
  };

  const mintTx = await positionManager.mint(params, {
    gasLimit: 200000
  });
  const receipt = await mintTx.wait();
  console.log('Transação de Adição de Liquidez:', mintTx.hash);
  console.log('Recibo:', receipt);
}