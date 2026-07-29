import { GET } from "@/app/api/health/route";
import { createRequest } from "node-mocks-http";
import prisma from "@/lib/db";
import fs from "fs/promises";
import { constants } from "fs";

jest.mock("@/lib/db", () => ({
  $queryRaw: jest.fn(),
  generatedReport: {
    count: jest.fn().mockResolvedValue(0)
  }
}));

jest.mock("fs/promises", () => ({
  access: jest.fn(),
  constants: {
    R_OK: 4,
    W_OK: 2
  }
}));

describe("Health Check API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 when all systems are healthy", async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ "?column?": 1 }]);
    (fs.access as jest.Mock).mockResolvedValue(undefined);

    const req = createRequest({ method: "GET", url: "/api/health" });
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.healthy).toBe(true);
    expect(json.services.database).toBe("ok");
    expect(json.services.storage).toBe("ok");
  });

  it("should return 503 when the database is down", async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error("Connection refused"));
    (fs.access as jest.Mock).mockResolvedValue(undefined);

    const req = createRequest({ method: "GET", url: "/api/health" });
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.healthy).toBe(false);
    expect(json.services.database).toBe("error");
    expect(json.services.storage).toBe("ok");
  });
});
