import { Connection } from "@solana/web3.js";

const DEFAULT_RPC = "https://api.devnet.solana.com";

const RPC_ENDPOINTS: Record<string, string> = {
  public: DEFAULT_RPC,
  helius: "", // Set RPC_HELIUS env var
  quicknode: "", // Set RPC_QUICKNODE env var
};

function resolveEndpoint(): string {
  const fromEnv =
    process.env.RPC_HELIUS ||
    process.env.RPC_QUICKNODE ||
    process.env.RPC_CUSTOM;

  if (fromEnv) return fromEnv;

  const choice = process.env.RPC_PROVIDER || "public";
  return RPC_ENDPOINTS[choice] || DEFAULT_RPC;
}

export function createConnection(): Connection {
  const endpoint = resolveEndpoint();
  return new Connection(endpoint, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 30000,
  });
}

export function getRpcEndpoint(): string {
  return resolveEndpoint();
}

export const MAX_RETRIES = 3;
export const BASE_DELAY_MS = 1000;

export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  retries = MAX_RETRIES
): Promise<T | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isTimeout =
        !err.message ||
        err.message.toLowerCase().includes("timeout") ||
        err.message.toLowerCase().includes("fetch") ||
        err.message.toLowerCase().includes("upstream") ||
        err.message.toLowerCase().includes("econnrefused");

      if (attempt < retries && isTimeout) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(
          `   ⏳ ${label} — intento ${attempt}/${retries} falló (timeout), reintentando en ${delay}ms...`
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (isTimeout) {
        console.warn(
          `   ⚠️  ${label} — no disponible tras ${retries} intentos (RPC timeout)`
        );
        return null;
      }

      throw err;
    }
  }
  return null;
}
