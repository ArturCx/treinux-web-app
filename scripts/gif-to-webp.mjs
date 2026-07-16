import { execFile } from "node:child_process";
import { readdir, mkdir, stat } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { promisify } from "node:util";
import { cpus } from "node:os";
import ffmpeg from "ffmpeg-static";

/**
 * Converte os GIFs do catálogo para WebP animado.
 *
 * Por quê: os GIFs originais do dataset somam ~126MB — pesado demais para
 * versionar. O WebP animado corta ~55% mantendo os mesmos quadros e os
 * mesmos 180x180 exigidos pelos termos da Gym visual (nunca há upscale).
 *
 * Uso: node scripts/gif-to-webp.mjs
 * Fonte: public/exercicios-gif/*.gif → destino: public/exercicios-anim/*.webp
 */

const run = promisify(execFile);
const SRC = "public/exercicios-gif";
const OUT = "public/exercicios-anim";
const QUALITY = 75;
const CONCURRENCY = Math.max(2, cpus().length - 1);

async function convert(file) {
  const input = join(SRC, file);
  const output = join(OUT, `${basename(file, extname(file))}.webp`);
  await run(ffmpeg, [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", input,
    "-c:v", "libwebp_anim",
    "-lossless", "0",
    "-q:v", String(QUALITY),
    "-compression_level", "6",
    "-loop", "0",
    "-an",
    output,
  ]);
  return output;
}

async function dirSize(dir) {
  const files = await readdir(dir);
  const sizes = await Promise.all(
    files.map(async (f) => (await stat(join(dir, f))).size),
  );
  return sizes.reduce((a, b) => a + b, 0);
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

async function main() {
  await mkdir(OUT, { recursive: true });
  const files = (await readdir(SRC)).filter((f) => f.endsWith(".gif"));
  console.log(`Convertendo ${files.length} GIFs (${CONCURRENCY} em paralelo)...`);

  const before = await dirSize(SRC);
  let done = 0;
  const queue = [...files];

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const file = queue.pop();
        await convert(file);
        if (++done % 200 === 0) console.log(`  ${done}/${files.length}`);
      }
    }),
  );

  const after = await dirSize(OUT);
  const saved = Math.round((1 - after / before) * 100);
  console.log(
    `Pronto: ${mb(before)} → ${mb(after)} (${saved}% menor, ${done} arquivos).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
