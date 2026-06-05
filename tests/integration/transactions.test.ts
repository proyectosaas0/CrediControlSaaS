import { describe, it, expect, vi } from "vitest";
import { withTransaction } from "@/lib/database/transactions";

// Mock the supabase client since withTransaction requires request context
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: vi.fn(),
      rpc: vi.fn(),
      auth: { getClaims: vi.fn() },
    })
  ),
}));

describe("Transactions", () => {
  it("executes callback with client", async () => {
    let executed = false;
    await withTransaction(async (client) => {
      executed = true;
      expect(client).toBeDefined();
    });
    expect(executed).toBe(true);
  });

  it("handles errors gracefully", async () => {
    await expect(
      withTransaction(async () => {
        throw new Error("Test error");
      })
    ).rejects.toThrow("Test error");
  });
});
