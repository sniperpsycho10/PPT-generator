import { NextResponse } from 'next/server';
import os from 'os';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const port = url.port || process.env.PORT || '3000';
  
  const interfaces = os.networkInterfaces();
  let networkIp = "localhost";
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        networkIp = iface.address;
        break;
      }
    }
    if (networkIp !== "localhost") break;
  }
  
  const origin = `http://${networkIp}:${port}`;
  return NextResponse.json({ origin });
}
