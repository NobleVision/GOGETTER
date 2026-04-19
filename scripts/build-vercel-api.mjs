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
const apiDir = join(rootDir, "src-api");
const distDir = join(rootDir, "dist");
const outputDir = join(rootDir, ".vercel", "output");

// Path alias plugin for esbuild to resolve @shared/* and @/* aliases
const pathAliasPlugin = {
  name: "path-alias",
  setup(build) {
    // Helper to resolve path with extension
    const resolveWithExtension = (basePath) => {
      // Try common extensions
      const extensions = [".ts", ".tsx", ".js", ".jsx", ""];
      for (const ext of extensions) {
        const fullPath = basePath + ext;
        if (existsSync(fullPath)) {
          return fullPath;
        }
      }
      // Try index files
      for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
        const indexPath = join(basePath, `index${ext}`);
        if (existsSync(indexPath)) {
          return indexPath;
        }
      }
      return basePath + ".ts"; // Default to .ts
    };

    // Resolve @shared/* to ./shared/*
    build.onResolve({ filter: /^@shared\// }, (args) => {
      const subPath = args.path.replace(/^@shared\//, "");
      const resolved = resolveWithExtension(join(rootDir, "shared", subPath));
      return { path: resolved, external: false };
    });

    // Resolve @/* to ./client/src/*
    build.onResolve({ filter: /^@\// }, (args) => {
      const subPath = args.path.replace(/^@\//, "");
      const resolved = resolveWithExtension(join(rootDir, "client", "src", subPath));
      return { path: resolved, external: false };
    });
  },
};

// Find all TypeScript files in api directory recursively.
// Files or directories that start with "_" are treated as shared helpers and
// skipped — they get bundled into any function that imports them but are not
// deployed as standalone endpoints.
function findApiFiles(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry.startsWith("_")) continue;
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
        { src: "/api/webhooks/twilio", dest: "/api/webhooks/twilio" },
        { src: "/api/webhooks/elevenlabs", dest: "/api/webhooks/elevenlabs" },
        { src: "/api/webhooks/zoom", dest: "/api/webhooks/zoom" },
        { src: "/api/cron/voice-scheduler", dest: "/api/cron/voice-scheduler" },
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
      format: "cjs",
      outfile: join(funcDir, "index.js"),
      external: ["pg-native", "better-sqlite3"],
      plugins: [pathAliasPlugin],
      // Ensure all dependencies are bundled (not external)
      packages: "bundle",
      // Set working directory to root so relative imports resolve correctly
      absWorkingDir: rootDir,
      // Ensure TypeScript files are resolved
      resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      // Minify for smaller bundle size
      minify: false,
      // Source maps for debugging
      sourcemap: false,
      // Tree shaking
      treeShaking: true,
    });

    // Write .vc-config.json for the function
    writeFileSync(
      join(funcDir, ".vc-config.json"),
      JSON.stringify({
        runtime: "nodejs20.x",
        handler: "index.js",
        launcherType: "Nodejs",
      }, null, 2)
    );

    // Write a package.json to the function directory to ensure it's treated as CJS
    writeFileSync(
      join(funcDir, "package.json"),
      JSON.stringify({ type: "commonjs" }, null, 2)
    );
  }

  console.log("✓ All API functions bundled successfully");
  console.log("✓ Build output ready at .vercel/output/");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
