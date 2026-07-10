import type { NextConfig } from "next";
import os from "os";

const interfaces = os.networkInterfaces();
const allowedIps: string[] = ["localhost", "127.0.0.1", "jspl-workshop.local"];
for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]!) {
    if (iface.family === "IPv4") {
      allowedIps.push(iface.address);
      allowedIps.push(`${iface.address}:4000`);
    }
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore - allowedDevOrigins is sometimes undocumented in types but logged in terminal
  allowedDevOrigins: allowedIps,
};

export default nextConfig;
