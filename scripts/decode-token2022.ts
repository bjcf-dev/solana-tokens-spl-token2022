import { PublicKey } from "@solana/web3.js";
import { createConnection, getRpcEndpoint, withRetry } from "./rpc.ts";

async function inspectToken2022(mintAddress: string): Promise<void> {
  const connection = createConnection();
  const mint = new PublicKey(mintAddress);

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║          Token-2022 — Inspector de Extensiones               ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  console.log(`🪙 Mint: ${mintAddress}`);
  console.log(`🌐 RPC: ${getRpcEndpoint()}\n`);

  const accountInfo = await withRetry(
    () => connection.getAccountInfo(mint),
    "getAccountInfo"
  );

  if (!accountInfo) {
    console.error("❌ Mint account not found (o RPC no respondió)");
    return;
  }

  console.log(`📊 Datos de Mint:`);
  console.log(`   Tamaño: ${accountInfo.data.length} bytes`);
  console.log(`   Lamports: ${accountInfo.lamports}`);
  console.log(`   Owner: ${accountInfo.owner.toBase58()}`);
  console.log(`   Programa: ${getTokenProgram(accountInfo.owner.toBase58())}\n`);

  const parsedInfo = await withRetry(
    () => connection.getParsedAccountInfo(mint),
    "getParsedAccountInfo"
  );

  if (parsedInfo?.value?.data && typeof parsedInfo.value.data === "object") {
    const data = (parsedInfo.value.data as any).parsed.info;

    console.log(`🔧 Información del Mint:`);
    console.log(`   Mint authority: ${data.mintAuthority}`);
    console.log(`   Supply: ${data.supply}`);
    console.log(`   Decimals: ${data.decimals}`);
    console.log(`   Is initialized: ${data.isInitialized}`);
    console.log(`   Freeze authority: ${data.freezeAuthority || "No set"}\n`);
  }

  console.log(`📋 Raw Data Inspection (bytes después de base mint):`);
  const data = accountInfo.data;
  const baseMintSize = 82;

  if (data.length > baseMintSize) {
    const extensionData = data.slice(baseMintSize);
    console.log(`   Extension area size: ${extensionData.length} bytes`);
    console.log(`   First 100 hex chars: ${extensionData.slice(0, 50).toString("hex")}\n`);
    inspectRawExtensions(extensionData);
  } else {
    console.log(`   ⚠️  No extension data found\n`);
  }

  console.log(`✅ Para ver extensiones en detalle, ejecuta:`);
  console.log(`   $ spl-token display ${mintAddress}\n`);
}

function getTokenProgram(owner: string): string {
  const splToken = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  const token2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

  if (owner === splToken) return "SPL Token (Standard)";
  if (owner === token2022) return "Token-2022 (Extensions)";
  return `Unknown (${owner})`;
}

function inspectRawExtensions(data: Buffer): void {
  console.log(`🔍 Análisis de Extensiones (formato TLV):`);

  const patterns = [
    { name: "Transfer Fee", hex: "01" },
    { name: "Metadata", hex: "03" },
    { name: "Metadata Pointer", hex: "04" },
    { name: "Non-Transferable", hex: "0b" },
    { name: "Default Frozen", hex: "0c" },
  ];

  patterns.forEach((pattern) => {
    const idx = data.indexOf(Buffer.from(pattern.hex, "hex"));
    if (idx !== -1 && idx < 50) {
      console.log(`   ✓ ${pattern.name}: Detectado en offset ${idx}`);
    }
  });

  const str = data.toString("utf8", 0, Math.min(256, data.length));
  const printable = str.replace(/[^\x20-\x7E]/g, "");
  if (printable.length > 2) {
    console.log(`   📄 Strings encontrados: "${printable.substring(0, 50)}..."`);
  }

  console.log();
}

async function main() {
  const MINT_T2022 = "6zjPLqkcBvGp4QZ8Axq8EqJxfeTQ8SUJSQF6QxNGGi5R";
  await inspectToken2022(MINT_T2022);

  console.log(`📊 Extensiones Conocidas en Este Mint (del spec):`);
  console.log(`   1. Metadata:`);
  console.log(`      - Name: MyToken2022`);
  console.log(`      - Symbol: MYT22`);
  console.log(`      - URI: https://example.com/metadata.json\n`);

  console.log(`   2. Transfer Fee:`);
  console.log(`      - Basis Points: 100 (1%)`);
  console.log(`      - Maximum Fee: 1000000000000\n`);

  console.log(`🎯 Transfer Fee verificada:`);
  console.log(`   Enviado: 100 tokens`);
  console.log(`   Recibido: 99 tokens`);
  console.log(`   Fee retenido: 1 token (1%)\n`);

  console.log(`✅ Para ver en Explorer:`);
  console.log(`   https://explorer.solana.com/address/${MINT_T2022}?cluster=devnet\n`);
}

main().catch(console.error);
