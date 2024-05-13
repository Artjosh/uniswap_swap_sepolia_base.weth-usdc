import { ethers } from "hardhat";
import dotenv from "dotenv";

interface EnvVars {
  PRIVATE_KEY: string;
  BASE_RPC_URL: string;
  UNISWAP_FACTORY_ADDRESS: string;
  TOKEN_IN_ADDRESS: string; // WETH
  TOKEN_OUT_ADDRESS: string; // USDC
}

dotenv.config();

const envVars: EnvVars = process.env as unknown as EnvVars;

if (
  !envVars.PRIVATE_KEY ||
  !envVars.BASE_RPC_URL ||
  !envVars.UNISWAP_FACTORY_ADDRESS ||
  !envVars.TOKEN_IN_ADDRESS ||
  !envVars.TOKEN_OUT_ADDRESS
) {
  throw new Error("Por favor, defina todas as variáveis de ambiente no arquivo .env");
}

export async function checkLiquidity() {
  const provider = new ethers.providers.JsonRpcProvider(envVars.BASE_RPC_URL);
  const wallet = new ethers.Wallet(envVars.PRIVATE_KEY, provider);

  const factoryABI = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json').abi;
  const poolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json').abi;

  const factory = new ethers.Contract(envVars.UNISWAP_FACTORY_ADDRESS, factoryABI, wallet);
  const poolAddress = await factory.getPool(envVars.TOKEN_IN_ADDRESS, envVars.TOKEN_OUT_ADDRESS, 3000); // Fee tier 3000

  if (poolAddress === ethers.constants.AddressZero) {
    throw new Error('Pool não encontrada.');
  }

  const pool = new ethers.Contract(poolAddress, poolABI, wallet);
  const slot0 = await pool.slot0();
  const liquidity = await pool.liquidity();

  console.log('Endereço da Pool:', poolAddress);
  console.log('Liquidez da Pool:', liquidity.toString());
  console.log('Preço Atual da Pool (sqrtPriceX96):', slot0.sqrtPriceX96.toString());

  // Verifique as reservas de cada token na pool
  const token0Address = await pool.token0();
  const token1Address = await pool.token1();
  const token0Contract = new ethers.Contract(token0Address, require('@openzeppelin/contracts/build/contracts/ERC20.json').abi, wallet);
  const token1Contract = new ethers.Contract(token1Address, require('@openzeppelin/contracts/build/contracts/ERC20.json').abi, wallet);

  const reservesToken0 = await token0Contract.balanceOf(poolAddress);
  const reservesToken1 = await token1Contract.balanceOf(poolAddress);

  console.log('Reservas de Token 0 (USDC):', ethers.utils.formatUnits(reservesToken0, 6));
  console.log('Reservas de Token 1 (WETH):', ethers.utils.formatUnits(reservesToken1, 18));

  return liquidity;
}