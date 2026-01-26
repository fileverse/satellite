import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { encryptReadable } from '../src/sdk/file-encryption';

const INPUT_PATH = './file.png';
const OUTPUT_PATH = `${INPUT_PATH}.enc`;

async function main() {
  if (existsSync(OUTPUT_PATH)) throw new Error(`Output file already exists: ${OUTPUT_PATH}`);

  const { stream, decryptionOptions } = encryptReadable(createReadStream(INPUT_PATH));
  await pipeline(stream, createWriteStream(OUTPUT_PATH));
  const options = await decryptionOptions;

  process.stdout.write(`${JSON.stringify({ outputPath: OUTPUT_PATH, ...options })}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
