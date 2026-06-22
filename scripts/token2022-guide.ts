/**
 * Token-2022 — Guía + Cálculo de Extensiones
 * Las extensiones no se crean por CLI; requieren usar el programa Token-2022 directamente
 */

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║          Token-2022 con Extensiones — Guía Educativa        ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

// Token-2022 Program ID (diferente de SPL Token)
const TOKEN_2022_PROGRAM = "TokenzQdBj5D2t8wt5JRaZeVnFF4osS5YNNEW1gCqWbc";
const SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

console.log("📊 COMPARACIÓN: SPL Token vs Token-2022\n");

const comparison = [
  {
    aspect: "Program ID",
    spl: SPL_TOKEN_PROGRAM,
    token2022: TOKEN_2022_PROGRAM,
  },
  {
    aspect: "Metadata",
    spl: "❌ Externa (Metaplex)",
    token2022: "✅ Nativa (TLV)",
  },
  {
    aspect: "Transfer Fee",
    spl: "❌ No",
    token2022: "✅ Sí (automática)",
  },
  {
    aspect: "Non-Transferable",
    spl: "❌ No",
    token2022: "✅ Sí",
  },
  {
    aspect: "Default Frozen",
    spl: "❌ No",
    token2022: "✅ Sí",
  },
  {
    aspect: "Confidential Transfer",
    spl: "❌ No",
    token2022: "✅ Sí (ZK)",
  },
];

console.table(comparison);

console.log("\n🔧 EXTENSIONES DISPONIBLES EN TOKEN-2022:\n");

const extensions = [
  {
    name: "Metadata",
    description: "Nombre, símbolo, URI en el mint",
    example: "{ name: 'MyToken', symbol: 'MYT', uri: 'https://...' }",
  },
  {
    name: "Transfer Fee",
    description: "Retención automática en transfers",
    example: "{ basisPoints: 100, maximumFee: 1000 } // 1% fee",
  },
  {
    name: "Non-Transferable",
    description: "Tokens no pueden transferirse entre cuentas",
    example: "Activo = tokens locked a la cuenta",
  },
  {
    name: "Default Frozen",
    description: "Nuevas ATAs empiezan congeladas (freeze/thaw)",
    example: "Freezer authority puede thaw/refreeze",
  },
  {
    name: "Confidential Transfer",
    description: "Transfers cifradas con zero-knowledge proofs",
    example: "Amount oculto en la blockchain",
  },
];

console.table(extensions);

console.log("\n📋 PRÓXIMOS PASOS PARA CREAR TOKEN-2022:\n");

const steps = [
  "1. Generar keypair para el nuevo mint",
  "2. Calcular espacio requerido (base 82 bytes + extensiones)",
  "3. Crear transacción con InitializeMint2 instruction",
  "4. Agregar extensiones (InitializeMetadata, InitializeTransferFee, etc)",
  "5. Firmar y enviar a Devnet",
  "6. Verificar mint creado con 'spl-token display'",
];

steps.forEach((step) => console.log(`   ${step}`));

console.log("\n⚠️  NOTA IMPORTANTE:\n");
console.log("   Las extensiones se configuran al CREAR el mint.");
console.log("   No se pueden agregar después.");
console.log("   Si cambian los requisitos → crear nuevo mint.\n");

console.log("🎯 ALTERNATIVA: Usar Solana CLI v1.18+ con token-2022 support\n");
console.log(
  "   $ spl-token create-token --enable-metadata --enable-transfer-fee\n"
);

console.log("ℹ️  Versión actual de CLI:");
console.log("   Revisar: solana --version\n");
