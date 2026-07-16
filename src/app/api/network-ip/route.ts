import { NextResponse } from 'next/server';
import os from 'os';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const port = url.port || process.env.PORT || '3000';
  
  const interfaces = os.networkInterfaces();
  let allIps: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        allIps.push(iface.address);
      }
    }
  }
  const networkIp = allIps.find(ip => ip.startsWith("192.168.")) || allIps.find(ip => !ip.startsWith("10.")) || allIps[0] || "localhost";
  
  const origin = `http://${networkIp}:${port}`;
  return NextResponse.json({ origin });
}
