import { NextResponse } from 'next/server';
import os from 'os';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const port = url.port || process.env.PORT || '4000';
  
  const interfaces = os.networkInterfaces();
  let allIps: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal && !iface.address.startsWith("169.254.")) {
        allIps.push(iface.address);
      }
    }
  }
  const networkIp = allIps.find(ip => ip.startsWith("192.168.")) || 
                    allIps.find(ip => ip.startsWith("10.")) || 
                    allIps.find(ip => ip.startsWith("172.") && !ip.startsWith("172.17.") && !ip.startsWith("172.18.")) || // exclude typical docker, allow hotspot
                    allIps[0] || "localhost";
  
  let origin = `http://${networkIp}:${port}`;

  try {
    const tunnelPath = path.join(process.cwd(), '.tunnel-url');
    if (fs.existsSync(tunnelPath)) {
      const tunnelUrl = fs.readFileSync(tunnelPath, 'utf8').trim();
      if (tunnelUrl) {
        origin = tunnelUrl;
      }
    }
  } catch (err) {
    // ignore
  }
  
  return NextResponse.json({ origin });
}
