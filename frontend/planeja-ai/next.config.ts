import type { NextConfig } from "next";

const remotePatterns = (() => {
  const fallback = {
    protocol: "http" as const,
    hostname: "localhost",
    port: "3001",
    pathname: "/api/v1/attachments/**",
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return [fallback];
  }

  try {
    const parsed = new URL(apiUrl);
    return [
      {
        protocol: (parsed.protocol.replace(":", "") || "http") as
          | "http"
          | "https",
        hostname: parsed.hostname,
        port: parsed.port || "",
        pathname: "/api/v1/attachments/**",
      },
    ];
  } catch (error) {
    console.warn(
      "Não foi possível analisar NEXT_PUBLIC_API_URL para imagens remotas:",
      error
    );
    return [fallback];
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
