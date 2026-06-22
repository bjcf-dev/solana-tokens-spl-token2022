/**
 * Script para generar URLs del Solana Explorer
 * Verifica mint, ATAs y transacciones
 */

const EXPLORER_BASE = "https://explorer.solana.com";
const DEVNET = "?cluster=devnet";

const MINT = "DXtKUJdcKevBKRyiGQG2v3a9u3ZPAj9RVwMhXL5Df9G3";
const WALLET1 = "5P2mxoA2tcv8GHddG1WBxqcXqjvK7XxRjGDJ4o9qMRL7";
const ATA1 = "763qyT1kpERB7RxVkJKNY5xopddPH5nUA1VUH96CFyjF";
const WALLET2 = "2aD2zZYqCZpssoXys72TvEH293gw8As9jpBhuSQAXdFQ";
const ATA2 = "HMZkNeNjWhYgrzfZhDnRMi2R4D6H6JWtF9Tm3pCHVjTr";

console.log("\n╔════════════════════════════════════════════════════════╗");
console.log("║      Solana Explorer — URLs de Verificación            ║");
console.log("╚════════════════════════════════════════════════════════╝\n");

console.log("🪙 MINT:");
console.log(`   ${EXPLORER_BASE}/address/${MINT}${DEVNET}\n`);

console.log("👛 WALLET 1 (Principal):");
console.log(`   ${EXPLORER_BASE}/address/${WALLET1}${DEVNET}\n`);

console.log("💳 ATA WALLET 1:");
console.log(`   ${EXPLORER_BASE}/address/${ATA1}${DEVNET}\n`);

console.log("👛 WALLET 2:");
console.log(`   ${EXPLORER_BASE}/address/${WALLET2}${DEVNET}\n`);

console.log("💳 ATA WALLET 2:");
console.log(`   ${EXPLORER_BASE}/address/${ATA2}${DEVNET}\n`);

console.log("📋 QUÉ VERIFICAR:");
console.log("   1. Mint account → Supply (debe ser 1,000)");
console.log("   2. Mint account → Token Program ID");
console.log("   3. ATA1 → Balance (debe ser 900 después de transfer)");
console.log("   4. ATA2 → Balance (debe ser 100 después de transfer)");
console.log("   5. Transacciones en ambas ATAs\n");
