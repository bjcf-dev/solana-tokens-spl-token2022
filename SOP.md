# Solana Tokens — Standard Operating Procedure (SOP)

> Guia completa para crear y manipular tokens SPL y Token-2022 con extensiones
> en Solana Devnet, usando CLI y TypeScript.

---

## Tabla de Contenidos

- [Descripcion General](#descripcion-general)
- [Requerimientos del Sistema](#requerimientos-del-sistema)
- [Instalacion del Entorno](#instalacion-del-entorno)
- [Configuracion Inicial](#configuracion-inicial)
- [Ejercicio 1: SPL Token Workflow](#ejercicio-1-spl-token-workflow)
- [Ejercicio 2: Token-2022 con Extensiones](#ejercicio-2-token-2022-con-extensiones)
- [Scripts TypeScript](#scripts-typescript)
- [Verificacion en Explorer](#verificacion-en-explorer)
- [Solucion de Problemas](#solucion-de-problemas)
- [Referencias](#referencias)

---

## Descripcion General

Este proyecto demuestra la creacion y manipulacion de tokens en la blockchain de Solana
usando dos estandares distintos:

| Estandar | Programa ID | Caracteristicas |
|----------|-------------|-----------------|
| SPL Token | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` | Estandar basico, sin extensiones nativas |
| Token-2022 | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` | Extensiones nativas: metadata, transfer fee, non-transferable, etc. |

### Que vas a lograr

- Crear un token SPL desde cero (mint, ATAs, minteo, transferencias)
- Crear un token Token-2022 con metadata y transfer fee configurado
- Leer balances desde TypeScript usando `@solana/web3.js`
- Verificar que el transfer fee se aplica automaticamente (99 recibido de 100 enviados)
- Inspeccionar extensiones TLV via CLI y script personalizado

### Stack tecnologico

```
CLI Layer:     solana-cli v4.0.0, spl-token
Client Layer:  TypeScript + @solana/web3.js + @solana/spl-token
Storage:       JSON (config.json)
RPC:           https://api.devnet.solana.com (publico, con soporte Helius/QuickNode via env vars)
```

**Nota**: Este proyecto NO utiliza Rust ni Anchor. No hay programas on-chain que compilar;
solo se interactua con programas existentes de Solana mediante CLI y scripts cliente.

---

## Requerimientos del Sistema

### Hardware
- Sistema Linux, macOS, o WSL2 en Windows
- Conexion a Internet estable
- ~2 GB de espacio en disco

### Software

| Software | Version Minima | Proposito |
|----------|---------------|-----------|
| `solana-cli` | v1.18.0 (v4.0.0+ recomendado) | Interaccion con Solana blockchain |
| `spl-token` | incluido con solana-cli | Gestion de tokens |
| `Node.js` | v18.0+ | Ejecucion de scripts TypeScript |
| `npm` | v9.0+ | Gestor de paquetes |
| `ts-node` | v10.9+ | Ejecucion directa de TypeScript |

### Dependencias npm

```json
{
  "@solana/web3.js": "^1.98.4",
  "@solana/spl-token": "^0.4.14",
  "@solana/spl-token-metadata": "^0.1.6"
}
```

---

## Instalacion del Entorno

### Instalar Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Agregar al PATH (~/.zshrc o ~/.bashrc):
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

source ~/.zshrc
solana --version
```

> **ATENCION**: Token-2022 requiere `solana-cli >= v4.0.0`. Verifica con `solana --version`.
> Si tienes v3.x, actualiza con: `agave-install init 4.0.0`

### Instalar Node.js y npm

```bash
# Opcion recomendada: nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install --lts

node --version  # Debe ser v18+
npm --version   # Debe ser v9+
```

### Clonar e instalar dependencias

```bash
git clone <REPO_URL>
cd TOKEN_SPL_&_2022
npm install
```

### Instalar ts-node (opcional)

```bash
npm install -g ts-node
# O usar npx ts-node directamente
```

---

## Configuracion Inicial

### Configurar Solana CLI para Devnet

```bash
solana config set --url devnet

# Crear wallet principal
solana-keygen new --outfile ~/.config/solana/id.json
# GUARDA LA FRASE SEMILLA en un lugar seguro

# Verificar configuracion
solana config get
# Debe mostrar:
#   RPC URL: https://api.devnet.solana.com
#   Keypair Path: ~/.config/solana/id.json
```

### Obtener direccion y airdrop

```bash
solana address
# Anota esta direccion

solana airdrop 2 $(solana address)
solana balance
```

Si el airdrop falla por congestion de Devnet:
- Espera 30 segundos y reintenta
- Usa https://solfaucet.com como alternativa

### Estructura del proyecto

```
TOKEN_SPL_&_2022/
├── package.json              # Dependencias npm
├── config.json               # Mints, wallets, ATAs persistidos
├── README.md                 # Symlink a SOP.md
├── scripts/
│   ├── rpc.ts                # Helper compartido (retry, conexion RPC)
│   ├── read-balance.ts       # Lector de balances SPL Token
│   ├── decode-token2022.ts   # Decodificador de extensiones Token-2022
│   ├── explorer-urls.ts      # Generador de URLs de Explorer
│   └── token2022-guide.ts    # Guia comparativa SPL vs Token-2022
└── SOP.md                    # Esta guia (lo que estas leyendo)
```

---

## Ejercicio 1: SPL Token Workflow

**Tiempo estimado**: 5-10 minutos
**Objetivo**: Crear un token SPL estandar, generar ATAs, mintear, transferir y leer balances.

### Paso 1: Crear Mint SPL

```bash
spl-token create-token --fee-payer ~/.config/solana/id.json
```

**Output esperado**:
```
Creating token <MINT_ADDRESS>
Signature: <TX_SIGNATURE>
```

Guarda `<MINT_ADDRESS>`. En este proyecto:
```
MINT_ADDRESS = DXtKUJdcKevBKRyiGQG2v3a9u3ZPAj9RVwMhXL5Df9G3
```

El mint define: supply=0, decimals=9, mint authority=tu wallet.

### Paso 2: Crear ATA del Wallet Principal

```bash
spl-token create-account <MINT_ADDRESS> --fee-payer ~/.config/solana/id.json
```

**Output**:
```
Creating account <ATA_ADDRESS>
Signature: <TX_SIGNATURE>
```

Guarda el ATA. En este proyecto: `763qyT1kpERB7RxVkJKNY5xopddPH5nUA1VUH96CFyjF`

**Que es un ATA**: Es una cuenta de token asociada a tu wallet para un mint especifico.
Los wallets en Solana NO contienen tokens directamente. El ATA se deriva deterministicamente:
`ATA = findProgramAddress([wallet_pubkey, token_program_id, mint_pubkey], ...)`

### Paso 3: Mintear Supply Inicial

```bash
spl-token mint <MINT_ADDRESS> 1000 --fee-payer ~/.config/solana/id.json
```

Verificar:
```bash
spl-token balance <MINT_ADDRESS>
# OUTPUT: 1000

spl-token accounts <MINT_ADDRESS>
# Balance
# -------
# 1000
```

Detalle tecnico: La cantidad raw es `1000000000000` (1000 * 10^9 decimals).
El CLI muestra el valor formateado.

### Paso 4: Crear Segundo Wallet

```bash
solana-keygen new --outfile wallet2.json
WALLET2=$(solana address -k wallet2.json)
echo $WALLET2
# En este proyecto: 2aD2zZYqCZpssoXys72TvEH293gw8As9jpBhuSQAXdFQ
```

> **IMPORTANTE**: `wallet2.json` contiene la clave privada. Haz backup:
> `cp wallet2.json /ruta/segura/wallet2-backup.json`
> Este archivo esta en `.gitignore` para no subirse a GitHub.

### Paso 5: Airdrop a Segundo Wallet

```bash
solana airdrop 1 $(solana address -k wallet2.json)
solana balance $(solana address -k wallet2.json)
# OUTPUT: 1 SOL
```

### Paso 6: Crear ATA para Segundo Wallet

```bash
spl-token create-account <MINT_ADDRESS> \
  --owner $(solana address -k wallet2.json) \
  --fee-payer ~/.config/solana/id.json
```

Guarda el ATA de wallet2. En este proyecto: `HMZkNeNjWhYgrzfZhDnRMi2R4D6H6JWtF9Tm3pCHVjTr`

### Paso 7: Transferir Tokens

```bash
spl-token transfer <MINT_ADDRESS> 100 <ATA_WALLET2> \
  --fee-payer ~/.config/solana/id.json
```

**Output esperado**:
```
Transfer 100 tokens
  Sender: <ATA_PRINCIPAL>
  Recipient: <ATA_WALLET2>
```

Verificar balances:
```bash
spl-token balance <MINT_ADDRESS>
# OUTPUT: 900

spl-token balance <MINT_ADDRESS> --owner $(solana address -k wallet2.json)
# OUTPUT: 100
```

### Resumen de Direcciones SPL

| Elemento | Direccion | Proposito |
|----------|-----------|-----------|
| Mint | `DXtKUJdcKevBKRyiGQG2v3a9u3ZPAj9RVwMhXL5Df9G3` | Define el token |
| Wallet Principal | `5P2mxoA2tcv8GHddG1WBxqcXqjvK7XxRjGDJ4o9qMRL7` | Dueno del mint |
| ATA Principal | `763qyT1kpERB7RxVkJKNY5xopddPH5nUA1VUH96CFyjF` | Balance: 900 |
| Wallet 2 | `2aD2zZYqCZpssoXys72TvEH293gw8As9jpBhuSQAXdFQ` | Wallet secundario |
| ATA Wallet 2 | `HMZkNeNjWhYgrzfZhDnRMi2R4D6H6JWtF9Tm3pCHVjTr` | Balance: 100 |

---

## Ejercicio 2: Token-2022 con Extensiones

**Tiempo estimado**: 5-10 minutos
**Objetivo**: Crear un mint Token-2022 con 2 extensiones (Metadata + Transfer Fee) y probar el fee automatico.

### Paso 1: Verificar Version de Solana CLI

Token-2022 SOLO funciona con `solana-cli >= v4.0.0`:

```bash
solana --version
# DEBE mostrar: solana-cli 4.0.0 o superior
```

Si necesitas actualizar:
```bash
agave-install list
agave-install init 4.0.0
solana --version
```

### Paso 2: Crear Mint Token-2022 con Extensiones

```bash
spl-token create-token \
  --program-2022 \
  --enable-metadata \
  --transfer-fee-bps 100 \
  --transfer-fee-max 1000000000000 \
  --fee-payer ~/.config/solana/id.json
```

Guarda el mint. En este proyecto: `6zjPLqkcBvGp4QZ8Axq8EqJxfeTQ8SUJSQF6QxNGGi5R`

**Explicacion de flags**:
| Flag | Valor | Significado |
|------|-------|-------------|
| `--program-2022` | - | Usa Token-2022 program en vez de SPL Token |
| `--enable-metadata` | - | Habilita metadata nativa en el mint |
| `--transfer-fee-bps` | 100 | 1% de fee (100 basis points = 1%) |
| `--transfer-fee-max` | 1000000000000 | Fee maximo: 1000 tokens (con 9 decimals) |

> Las extensiones NO se pueden agregar despues de crear el mint. Si cambian los requisitos,
> hay que crear un nuevo mint desde cero.

### Paso 3: Inicializar Metadata

```bash
spl-token initialize-metadata <MINT_T2022> \
  "MyToken2022" \
  "MYT22" \
  "https://example.com/metadata.json" \
  --fee-payer ~/.config/solana/id.json
```

### Paso 4: Verificar Extensiones

```bash
spl-token display <MINT_T2022>
```

**Output esperado** (seccion relevante):
```
Extensions
  Transfer fees:
    Current fee: 100bps
    Current maximum: 1000000000000
  Metadata:
    Name: MyToken2022
    Symbol: MYT22
    URI: https://example.com/metadata.json
```

La seccion **Extensions** solo aparece en Token-2022. En un mint SPL comun,
`spl-token display` solo mostraria Address, Program, Supply, Decimals, y Authorities.

### Paso 5: Crear ATA y Mintear

```bash
spl-token create-account <MINT_T2022> --fee-payer ~/.config/solana/id.json
# ATA_T2022 = FVzb5V68KBanNs7E99E6iHNo23TF1Hvr2w1q3vUePgLq

spl-token mint <MINT_T2022> 500 --fee-payer ~/.config/solana/id.json

spl-token balance <MINT_T2022>
# OUTPUT: 500
```

### Paso 6: Probar Transfer Fee

Crear ATA para wallet2 y transferir:

```bash
spl-token create-account <MINT_T2022> \
  --owner $(solana address -k wallet2.json) \
  --fee-payer ~/.config/solana/id.json
# ATA_T2022_WALLET2 = 3qvaGwwfV2KrtgCjmdvp9JZzTWgy9zF5RHPVU94PcTgz

spl-token transfer <MINT_T2022> 100 <ATA_T2022_WALLET2> \
  --fee-payer ~/.config/solana/id.json
```

Verificar el fee:
```bash
spl-token balance <MINT_T2022>
# OUTPUT: 400  (wallet1 perdio 100)

spl-token balance <MINT_T2022> --owner $(solana address -k wallet2.json)
# OUTPUT: 99   (recibio 99 - 1% de fee retenido)
```

**Explicacion**: El 1% de fee (1 token) se retiene automaticamente por el programa
Token-2022. No hay forma de evitarlo ni desactivarlo post-creacion. El fee queda en
una cuenta interna que la autoridad puede retirar despues.

### Resumen de Direcciones Token-2022

| Elemento | Direccion | Proposito |
|----------|-----------|-----------|
| Mint | `6zjPLqkcBvGp4QZ8Axq8EqJxfeTQ8SUJSQF6QxNGGi5R` | Token con extensiones |
| Program | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` | Token-2022 Program ID |
| ATA Principal | `FVzb5V68KBanNs7E99E6iHNo23TF1Hvr2w1q3vUePgLq` | Balance: 400 |
| ATA Wallet 2 | `3qvaGwwfV2KrtgCjmdvp9JZzTWgy9zF5RHPVU94PcTgz` | Balance: 99 |
| Metadata | Nativa en el mint | Name: MyToken2022, Symbol: MYT22 |
| Transfer Fee | 100 bps (1%), max 1000 tokens | Fee automatico configurado |

---

## Scripts TypeScript

Los scripts cliente leen datos de Devnet y los formatean para verificacion.

### scripts/rpc.ts — Helper Compartido

Centraliza la configuracion RPC con:
- Timeout configurable (30s)
- Retry con backoff exponencial (3 intentos: 1s, 2s, 4s)
- Soporte para RPC alternativo via variables de entorno

```bash
# RPC publico (default)
npx ts-node scripts/read-balance.ts

# Helius (si tienes API key)
RPC_HELIUS="https://devnet.helius-rpc.com/?api-key=TU_KEY" npx ts-node scripts/read-balance.ts

# QuickNode
RPC_QUICKNODE="https://api.quicknode.com/..." npx ts-node scripts/read-balance.ts
```

### scripts/read-balance.ts — Lector de Balances

Lee balances del mint SPL para ambos wallets:

```bash
npx ts-node scripts/read-balance.ts
```

**Output**:
```
SPL TOKEN - Lector de Balances (Devnet)

Mint: DXtKUJdcKevBKRyiGQG2v3a9u3ZPAj9RVwMhXL5Df9G3
RPC: https://api.devnet.solana.com

Wallet Principal
   Wallet: 5P2mxoA2tcv8GHddG1WBxqcXqjvK7XxRjGDJ4o9qMRL7
   ATA: 763qyT1kpERB7RxVkJKNY5xopddPH5nUA1VUH96CFyjF
   Balance: 900.000000000

Wallet 2
   Wallet: 2aD2zZYqCZpssoXys72TvEH293gw8As9jpBhuSQAXdFQ
   ATA: HMZkNeNjWhYgrzfZhDnRMi2R4D6H6JWtF9Tm3pCHVjTr
   Balance: 100.000000000
```

Si un ATA no existe, muestra un mensaje claro sin crashear:
```
No existe ATA para este wallet + mint
Crealo con: spl-token create-account <MINT>
```

### scripts/decode-token2022.ts — Decodificador de Extensiones

Inspecciona el mint Token-2022 y muestra datos de extensiones:

```bash
npx ts-node scripts/decode-token2022.ts
```

**Output**:
```
Token-2022 - Inspector de Extensiones

Mint: 6zjPLqkcBvGp4QZ8Axq8EqJxfeTQ8SUJSQF6QxNGGi5R
Owner: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
Programa: Token-2022 (Extensions)
Tamano: 479 bytes (vs ~82 de SPL)

Extensiones Conocidas:
   1. Metadata: Name=MyToken2022, Symbol=MYT22
   2. Transfer Fee: 100 bps (1%), Max=1000000000000

Transfer Fee verificada:
   Enviado: 100 tokens
   Recibido: 99 tokens
   Fee retenido: 1 token (1%)
```

### scripts/explorer-urls.ts — URLs de Exploracion

```bash
npx ts-node scripts/explorer-urls.ts
```

Genera URLs del Solana Explorer para verificacion visual de mint, wallets y ATAs.

### scripts/token2022-guide.ts — Guia Comparativa

```bash
npx ts-node scripts/token2022-guide.ts
```

Muestra tabla comparativa SPL vs Token-2022 y lista las extensiones disponibles.

---

## Verificacion en Explorer

### URLs Directas (Devnet)

```
Mint SPL:        https://explorer.solana.com/address/DXtKUJdcKevBKRyiGQG2v3a9u3ZPAj9RVwMhXL5Df9G3?cluster=devnet
Mint Token-2022: https://explorer.solana.com/address/6zjPLqkcBvGp4QZ8Axq8EqJxfeTQ8SUJSQF6QxNGGi5R?cluster=devnet
Wallet Principal: https://explorer.solana.com/address/5P2mxoA2tcv8GHddG1WBxqcXqjvK7XxRjGDJ4o9qMRL7?cluster=devnet
ATA Principal:    https://explorer.solana.com/address/763qyT1kpERB7RxVkJKNY5xopddPH5nUA1VUH96CFyjF?cluster=devnet
```

### Que verificar

**Mint SPL**: Supply debe mostrar 1,000, Token Program ID = `TokenkegQfe...`, Decimals = 9.

**Mint Token-2022**: Supply = 500, Program ID = `TokenzQdBN...`, Metadata (Name=MyToken2022, Symbol=MYT22),
Transfer Fee (100 bps, Max=1,000,000,000,000).

**ATAs**: ATA Principal balance = 900 (SPL) / 400 (T-2022).
ATA Wallet 2 balance = 100 (SPL) / 99 (T-2022).

---

## Solucion de Problemas

### "Error: fee payer is required"

El CLI no encuentra la configuracion del wallet:
```bash
solana config set --keypair ~/.config/solana/id.json
# O pasar --fee-payer en cada comando
```

### "Upstream idle timeout exceeded" o "fetch failed"

El RPC publico de Devnet tiene rate limits en horas pico:
```bash
# Reintentar tras 5-10s, o usar RPC alternativo:
RPC_HELIUS="https://devnet.helius-rpc.com/?api-key=TU_KEY" npx ts-node scripts/read-balance.ts
```

Para obtener API key gratuita: registrarse en https://helius.dev o https://quicknode.com.

### "ATA not found" / "Account does not exist"

El ATA no esta creado para ese wallet + mint:
```bash
spl-token create-account <MINT> --owner <WALLET_ADDRESS>
spl-token accounts <MINT> --owner <WALLET_ADDRESS>
```

### "Error: insufficient lamports"

El wallet no tiene suficiente SOL para tarifas:
```bash
solana balance
solana airdrop 1 $(solana address)
```

### Devnet Lag

Despues de una transaccion, los balances pueden tardar 3-5 segundos en
ser consultables. Esperar y reintentar:
```bash
sleep 5 && spl-token balance <MINT>
```

### Error de compilacion TypeScript

Verificar que `package.json` tenga `"type": "module"`:
```bash
grep '"type"' package.json
# Si no esta: npm pkg set type=module
```

---

## Referencias

### Documentacion Oficial
- [Solana CLI Docs](https://docs.solana.com/cli)
- [spl-token CLI](https://github.com/solana-labs/solana-program-library/tree/master/token/cli)
- [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Token-2022](https://spl.solana.com/token-2022)
- [SPL Token Program](https://spl.solana.com/token)

### Program IDs
- SPL Token: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
- Token-2022: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`
- ATA Program: `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL`

### Herramientas Utiles
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [SolFaucet](https://solfaucet.com)
- [Helius RPC](https://helius.dev)
- [QuickNode RPC](https://quicknode.com)

---

## Apendice: Plantilla config.json

Si empiezas desde cero, usa este template en `config.json`:

```json
{
  "exercise_3_spl": {
    "status": "in_progress",
    "mint": "REEMPLAZAR_CON_TU_MINT",
    "decimals": 9,
    "mint_authority": "REEMPLAZAR_CON_TU_WALLET",
    "ata_principal": "REEMPLAZAR",
    "balance": 0,
    "wallets": []
  },
  "exercise_4_token2022": {
    "status": "in_progress",
    "extensions": [],
    "mint": "REEMPLAZAR",
    "program": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
    "ata_principal": "",
    "balance": 0,
    "metadata": null,
    "transfer_fee": null,
    "tlv_decoded": null
  }
}
```

---

*Ultima actualizacion: Junio 2026*
