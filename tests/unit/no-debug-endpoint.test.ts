import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

describe("debug endpoint", () => {
  it("no existe en el árbol de rutas", () => {
    expect(existsSync(resolve(process.cwd(), "app/api/debug/me/route.ts"))).toBe(false);
  });
});
