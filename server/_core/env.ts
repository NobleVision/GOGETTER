export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Google OAuth configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // Cloudinary for artifact storage
  cloudinaryUrl: process.env.CLOUDINARY_URL ?? "",
  // Z.ai GLM-5.1 API key
  zaiApiKey: process.env.ZAI_API_KEY ?? "",
  // SMTP email configuration
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: parseInt(process.env.SMTP_PORT_OUTGOING ?? "465", 10),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "info@gogetteros.com",
  // Master admin email (can manage other admins)
  masterAdminEmail: process.env.MASTER_ADMIN_EMAIL ?? "nobviz@gmail.com",
};
