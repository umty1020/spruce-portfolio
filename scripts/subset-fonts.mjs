// 폰트 서브셋: src/ 안에서 실제로 쓰는 글자만 남겨 woff2로 만든다.
// 원본(media-src/fonts, git 제외) → 결과(src/app/fonts, git 포함)
// 콘텐츠를 고친 뒤 `npm run fonts`로 다시 실행한다.
// 필요: pyftsubset (pip install fonttools brotli)
import { readdir, readFile, writeFile, mkdir, stat, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(ROOT, "media-src/fonts");
const OUT_DIR = path.join(ROOT, "src/app/fonts");
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".md", ".mdx", ".json"]);

const FONTS = [
  ["Pretendard-Regular.otf", "Pretendard-Regular.woff2"],
  ["Pretendard-Medium.otf", "Pretendard-Medium.woff2"],
  ["Pretendard-Bold.otf", "Pretendard-Bold.woff2"],
  ["LINESeedSans_Bd.otf", "LINESeedSans-Bold.woff2"],
  ["LINESeedSans_XBd.otf", "LINESeedSans-ExtraBold.woff2"],
];

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === "fonts" ? [] : collectFiles(p);
      return TEXT_EXT.has(path.extname(e.name)) ? [p] : [];
    }),
  );
  return files.flat();
}

// 영문·숫자·기본 기호는 항상 포함하고, 나머지는 src/에서 쓰는 글자만 추가
const chars = new Set();
for (let c = 0x20; c <= 0x7e; c++) chars.add(String.fromCharCode(c));
for (const file of await collectFiles(path.join(ROOT, "src"))) {
  for (const ch of await readFile(file, "utf8")) {
    if (ch.codePointAt(0) >= 0x80) chars.add(ch);
  }
}
const text = [...chars].join("");

await mkdir(OUT_DIR, { recursive: true });
const textFile = path.join(OUT_DIR, ".subset-text.txt");
await writeFile(textFile, text);
for (const [input, output] of FONTS) {
  const src = path.join(SRC_DIR, input);
  const out = path.join(OUT_DIR, output);
  execFileSync(process.env.PYFTSUBSET ?? "pyftsubset", [
    src,
    `--text-file=${textFile}`,
    "--flavor=woff2",
    "--layout-features=*",
    `--output-file=${out}`,
  ]);
  const [before, after] = await Promise.all([stat(src), stat(out)]);
  console.log(`${output}  ${(before.size / 1024).toFixed(0)}KB → ${(after.size / 1024).toFixed(1)}KB`);
}
await rm(textFile);
console.log(`글자 ${chars.size}개 (한글 ${[...chars].filter((c) => /[가-힣]/.test(c)).length}개)`);
