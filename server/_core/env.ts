export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  manusApi: process.env.MANUS_API ?? "",
  perplexityApi: process.env.PERPLEXITY_API ?? "",
  // Google OAuth configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // Cloudinary for artifact storage
  cloudinaryUrl: process.env.CLOUDINARY_URL ?? "",
  // Voice assistant integrations
  twilioSid: process.env.TWILIO_SID ?? "",
  twilioSecret: process.env.TWILIO_SECRET ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
  elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID ?? "",
  elevenLabsAgentWebhookSecret:
    process.env.ELEVENLABS_AGENT_WEBHOOK_SECRET ?? "",
  elevenLabsVoiceIds: (process.env.ELEVENLABS_VOICE_IDS ?? "")
    .split(",")
    .map((voiceId) => voiceId.trim())
    .filter(Boolean),
  elevenLabsDefaultEmotions:
    (process.env.ELEVENLABS_DEFAULT_EMOTIONS ?? "true").toLowerCase() !==
    "false",
  zoomAccountId: process.env.ZOOM_ACCOUNT_ID ?? "",
  zoomClientId: process.env.ZOOM_CLIENT_ID ?? "",
  zoomClientSecret: process.env.ZOOM_CLIENT_SECRET ?? "",
  zoomSecretToken: process.env.ZOOM_SECRET_TOKEN ?? "",
  zoomEventWebhook: process.env.ZOOM_EVENT_WEBHOOK ?? "",
  pikaApiKey: process.env.PIKA_API_KEY ?? "",
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
