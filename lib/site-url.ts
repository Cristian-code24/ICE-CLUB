const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const vercelDomain =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

export const siteUrl = new URL(
  configuredUrl ??
    (vercelDomain ? `https://${vercelDomain}` : "https://iceclub.example"),
);
