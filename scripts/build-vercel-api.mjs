/**
 * Build script for Vercel serverless functions
 * Uses Vercel Build Output API v3
 * Bundles each API endpoint with its dependencies using esbuild
 */

import * as esbuild from "esbuild";
import { readdirSync, statSync, mkdirSync, writeFileSync, cpSync, existsSync, rmSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const apiDir = join(rootDir, "api");
const distDir = join(rootDir, "dist");
const outputDir = join(rootDir, ".vercel-output");

// Find all TypeScript files in api directory recursively
function findApiFiles(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findApiFiles(fullPath, files);
    } else if (entry.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function build() {
  // Clean output directory
  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true });
  }

  // Create output structure
  const staticDir = join(outputDir, "static");
  const functionsDir = join(outputDir, "functions");
  mkdirSync(staticDir, { recursive: true });
  mkdirSync(functionsDir, { recursive: true });

  // Write config.json for Build Output API v3
  writeFileSync(
    join(outputDir, "config.json"),
    JSON.stringify({
      version: 3,
      routes: [
        { src: "/api/trpc/(.*)", dest: "/api/trpc/trpc" },
        { src: "/api/oauth/callback", dest: "/api/oauth/callback" },
        { src: "/api/oauth/google/init", dest: "/api/oauth/google/init" },
        { src: "/api/oauth/google/callback", dest: "/api/oauth/google/callback" },
        { src: "/api/oauth/google/status", dest: "/api/oauth/google/status" },
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index.html" },
      ],
    }, null, 2)
  );

  // Copy static files from dist/public
  const publicDir = join(distDir, "public");
  if (existsSync(publicDir)) {
    cpSync(publicDir, staticDir, { recursive: true });
    console.log("✓ Copied static files");
  }

  // Bundle API functions
  const apiFiles = findApiFiles(apiDir);
  console.log(`Found ${apiFiles.length} API files to bundle`);

  for (const file of apiFiles) {
    const relativePath = relative(apiDir, file);
    // Convert [trpc].ts to trpc for function name
    const funcName = relativePath
      .replace(/\[(\w+)\]\.ts$/, "$1")
      .replace(/\.ts$/, "")
      .replace(/\\/g, "/");
    
    const funcDir = join(functionsDir, "api", funcName + ".func");
    mkdirSync(funcDir, { recursive: true });

    console.log(`Bundling: api/${relativePath} -> api/${funcName}`);

    // Bundle the function
    await esbuild.build({
      entryPoints: [file],
      bundle: true,
      platform: "node",
      target: "node20",
      format: "esm",
      outfile: join(funcDir, "index.js"),
      external: ["pg-native", "better-sqlite3"],
      banner: {
        js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`.trim(),
      },
    });

    // Write .vc-config.json for the function
    writeFileSync(
      join(funcDir, ".vc-config.json"),
      JSON.stringify({
        runtime: "nodejs20.x",
        handler: "index.default",
        launcherType: "Nodejs",
      }, null, 2)
    );
  }

  console.log("✓ All API functions bundled successfully");
  console.log("✓ Build output ready at .vercel-output/");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
