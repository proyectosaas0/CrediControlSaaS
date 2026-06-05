import { describe, it, expect } from "vitest";
import { withTransaction } from "@/lib/database/transactions";

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
