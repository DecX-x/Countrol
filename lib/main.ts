// src/main.ts
import { SimpleCLI } from './cli';
import * as dotenv from 'dotenv';
dotenv.config(); // Muat variabel dari .env jika ada (misal OPENAI_API_KEY, MONGO_URI)

async function main() {
  const cli = new SimpleCLI();
  await cli.start();

  // Kode demo lama (di-comment untuk referensi)
  // const loggedInUserId = "user_6831885af26f9a4e3ab53166";
  // await runAgent("Berapa pengeluaran saya bulan ini?", loggedInUserId);
}

main().catch(console.error);