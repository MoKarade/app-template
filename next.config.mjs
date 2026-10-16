/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Sans cela Next empaquette le SDK Sentry côté serveur et son chargeur de crochets échoue avec
  // « Cannot find package '@sentry/server-runtime-injection' » (constaté au démarrage).
  serverExternalPackages: ["@sentry/server-runtime-injection"],
  // Un seul réglage pour Sentry : `SENTRY_DSN` (serveur) est aussi donné au navigateur, car un DSN
  // n'est pas un secret. Vide = Sentry éteint (voir lib/sentryConfig.ts).
  env: {
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? "",
  },
};

export default nextConfig;
