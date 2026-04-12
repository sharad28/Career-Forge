import { prisma } from "./lib/db.js";
import { decrypt } from "./lib/crypto.js";

async function main() {
  const s = await prisma.settings.findFirst();
  const decryptedKey = decrypt(s!.llmApiKey);
  
  const res = await fetch("https://api.anthropic.com/v1/models", {
    headers: {
      "x-api-key": decryptedKey,
      "anthropic-version": "2023-06-01",
    }
  });

  const body = await res.json();
  console.log(JSON.stringify(body, null, 2));
}

main().catch(console.error);
