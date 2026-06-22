import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { createConnection, getRpcEndpoint, withRetry } from "./rpc.ts";

interface BalanceResult {
  ata: string;
  raw: string;
  decimals: number;
  formatted: number;
}

async function readBalance(
  walletAddress: string,
  mintAddress: string,
  label: string
): Promise<BalanceResult | null> {
  const connection = createConnection();
  const wallet = new PublicKey(walletAddress);
  const mint = new PublicKey(mintAddress);

  console.log(`\n📍 ${label}`);
  console.log(`   Wallet: ${walletAddress}`);

  const ata = await getAssociatedTokenAddress(mint, wallet);
  console.log(`   ATA esperada: ${ata.toBase58()}`);

  const accounts = await withRetry(
    () => connection.getParsedTokenAccountsByOwner(wallet, { mint }),
    `getParsedTokenAccountsByOwner (${label})`
  );

  if (!accounts || accounts.value.length === 0) {
    console.log(`   ⚠️  No existe ATA (o RPC no respondió) para este wallet + mint`);
    console.log(`   → Crealá con: spl-token create-account ${mintAddress}`);
    return null;
  }

  const rawAmount = accounts.value[0].account.data.parsed.info.tokenAmount;
  const raw = rawAmount.amount;
  const decimals = rawAmount.decimals;
  const balance = Number(raw) / Math.pow(10, decimals);

  console.log(`   ATA real: ${accounts.value[0].pubkey.toBase58()}`);
  console.log(`   Raw amount: ${raw}`);
  console.log(`   Decimals: ${decimals}`);
  console.log(`   ✅ Balance: ${balance.toFixed(decimals)}`);

  return { ata: ata.toBase58(), raw, decimals, formatted: balance };
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   SPL TOKEN — Lector de Balances (Devnet)    ║");
  console.log("╚══════════════════════════════════════════════╝");

  const MINT = "DXtKUJdcKevBKRyiGQG2v3a9u3ZPAj9RVwMhXL5Df9G3";
  const WALLET1 = "5P2mxoA2tcv8GHddG1WBxqcXqjvK7XxRjGDJ4o9qMRL7";
  const WALLET2 = "2aD2zZYqCZpssoXys72TvEH293gw8As9jpBhuSQAXdFQ";

  console.log(`\n🪙 Mint: ${MINT}`);
  console.log(`🌐 RPC: ${getRpcEndpoint()}\n`);

  await readBalance(WALLET1, MINT, "Wallet Principal");
  await readBalance(WALLET2, MINT, "Wallet 2");

  console.log("\n✅ Lectura completada\n");
}

main().catch(console.error);
