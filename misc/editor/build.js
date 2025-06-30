// Depends on emcc and wasm-opt being installed and available in PATH
// This script compiles main.c to WebAssembly and optimizes it using wasm-opt	
// Usage: bun misc/editor/build.js
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const buildDir = path.resolve("build")
const srcFile = path.resolve("main.c");
const outFile = path.resolve(buildDir, "editor-layout.wasm");
const tempFile = outFile + ".tmp.wasm";

fs.mkdirSync(path.dirname(outFile), { recursive: true });

const emccFlags = [
	"-sSTANDALONE_WASM",
	"-sENVIRONMENT=web",
	"--no-entry",
	`-o ${tempFile}`
];


console.log("[build-wasm] Compiling", srcFile);
execSync(`emcc ${srcFile} ${emccFlags.join(" ")}`, { stdio: "inherit" });

// TODO: Make sure wasm-opt actually knows what to remove
//console.log("[build-wasm] Optimising with wasm-opt...");
//execSync(`wasm-opt -Oz ${tempFile} -o ${outFile}`, { stdio: "inherit" });
fs.copyFileSync(tempFile, outFile);
fs.rmSync(tempFile, { force: true });

console.log("[build-wasm] ✅ Build complete:", outFile);
