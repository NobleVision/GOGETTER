import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";

const repoRoot = process.cwd();
const envPath = path.join(repoRoot, ".env");
const outputPath = path.join(repoRoot, "stripe-sandbox-catalog.json");

function parseEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const result = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }

  return result;
}

function sameRecurring(price, recurringInterval) {
  if (!recurringInterval) return !price.recurring;
  return price.recurring?.interval === recurringInterval;
}

function productMatches(product, item) {
  if (!product || product.deleted) return false;
  return (
    product.name === item.productName &&
    product.metadata?.app === "gogetteros" &&
    product.metadata?.plan === item.plan
  );
}

function priceMatches(price, item) {
  if (!price || !price.active) return false;
  return (
    price.currency === item.currency &&
    price.unit_amount === item.amount &&
    sameRecurring(price, item.recurringInterval) &&
    price.metadata?.app === "gogetteros" &&
    price.metadata?.plan === item.plan
  );
}

async function findMatchingProduct(stripe, item) {
  for await (const product of stripe.products.list({ active: true, limit: 100 })) {
    if (productMatches(product, item)) {
      return product;
    }
  }

  return null;
}

async function findMatchingPrice(stripe, productId, item) {
  for await (const price of stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  })) {
    if (priceMatches(price, item)) {
      return price;
    }
  }

  return null;
}

async function retrieveExistingPrice(stripe, existingPriceId, item) {
  if (!existingPriceId) return null;

  try {
    const price = await stripe.prices.retrieve(existingPriceId, { expand: ["product"] });
    const product = typeof price.product === "string" ? null : price.product;

    if (product && productMatches(product, item) && priceMatches(price, item)) {
      return {
        product,
        price,
        source: "existing_env_price",
      };
    }
  } catch (error) {
    console.warn(`[stripe-catalog] Unable to reuse ${item.envVar}:`, error.message);
  }

  return null;
}

async function ensureCatalogItem(stripe, env, item) {
  const existing = await retrieveExistingPrice(stripe, env[item.envVar], item);
  if (existing) return existing;

  let product = await findMatchingProduct(stripe, item);

  if (!product) {
    product = await stripe.products.create({
      name: item.productName,
      description: item.description,
      metadata: {
        app: "gogetteros",
        env: "sandbox",
        plan: item.plan,
      },
    });
  }

  let price = await findMatchingPrice(stripe, product.id, item);

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: item.currency,
      unit_amount: item.amount,
      recurring: item.recurringInterval ? { interval: item.recurringInterval } : undefined,
      metadata: {
        app: "gogetteros",
        env: "sandbox",
        plan: item.plan,
        envVar: item.envVar,
      },
      nickname: item.nickname,
    });
  }

  return {
    product,
    price,
    source: product ? "catalog_lookup_or_create" : "created",
  };
}

async function main() {
  const env = parseEnvFile(envPath);
  const secretKey = env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is missing from .env");
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2025-08-27.basil" });

  const catalog = [
    {
      envVar: "STRIPE_PRICE_LAUNCH_PASS",
      plan: "launch_pass",
      productName: "GoGetterOS Launch Pass",
      nickname: "GoGetterOS Launch Pass (Sandbox)",
      description: "One-time access for one business through Genesis to Prototype.",
      amount: 14900,
      currency: "usd",
      recurringInterval: null,
    },
    {
      envVar: "STRIPE_PRICE_STARTER_MONTHLY",
      plan: "starter",
      productName: "GoGetterOS Starter",
      nickname: "GoGetterOS Starter Monthly (Sandbox)",
      description: "Monthly access for one active business with 100 credits.",
      amount: 9900,
      currency: "usd",
      recurringInterval: "month",
    },
    {
      envVar: "STRIPE_PRICE_PRO_MONTHLY",
      plan: "pro",
      productName: "GoGetterOS Pro",
      nickname: "GoGetterOS Pro Monthly (Sandbox)",
      description: "Scale up to five active businesses with advanced product features.",
      amount: 49900,
      currency: "usd",
      recurringInterval: "month",
    },
    {
      envVar: "STRIPE_PRICE_CREDIT_TOPUP",
      plan: "credit_topup",
      productName: "GoGetterOS Credit Top-Up",
      nickname: "GoGetterOS Credit Top-Up 100 Credits (Sandbox)",
      description: "One-time purchase for a 100-credit top-up unit used by GoGetterOS quantity scaling.",
      amount: 10000,
      currency: "usd",
      recurringInterval: null,
    },
  ];

  const results = [];

  for (const item of catalog) {
    const ensured = await ensureCatalogItem(stripe, env, item);
    results.push({
      envVar: item.envVar,
      plan: item.plan,
      productId: ensured.product.id,
      productName: ensured.product.name,
      priceId: ensured.price.id,
      amount: ensured.price.unit_amount,
      currency: ensured.price.currency,
      recurringInterval: ensured.price.recurring?.interval ?? null,
      source: ensured.source,
    });
  }

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        mode: secretKey.startsWith("sk_test_") ? "test" : "live_or_unknown",
        results,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(`Wrote ${outputPath}`);
  for (const row of results) {
    console.log(`${row.envVar}=${row.priceId}`);
  }
}

main().catch((error) => {
  console.error("[stripe-catalog] failed", error);
  process.exitCode = 1;
});
