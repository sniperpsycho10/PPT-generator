import os from 'os';
let origin = "http://172.18.0.1:4000"; // Fake what the user sends
if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes("172.")) {
  const interfaces = os.networkInterfaces();
  let allIps: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal && !iface.address.startsWith("172.") && !iface.address.startsWith("169.254.")) {
        allIps.push(iface.address);
      }
    }
  }
  const networkIp = allIps.find(ip => ip.startsWith("192.168.")) || allIps.find(ip => ip.startsWith("10.")) || allIps.find(ip => !ip.startsWith("10.")) || allIps[0] || "localhost";
  const port = process.env.PORT || 4000;
  origin = `http://${networkIp}:${port}`;
}
console.log("GENERATED ORIGIN:", origin);
