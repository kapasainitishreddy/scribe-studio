import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("workspace UI feedback integration", () => {
  it("routes Perform take and sides feedback through Sonner", () => {
    const perform = source("src/components/desk/PerformWorkspace.tsx");
    expect(perform).toContain('import { toast } from "sonner";');
    expect(perform).toContain("toast.success(`Take ${takeNumber} captured`)");
    expect(perform).toContain('toast.success("Actor sides PDF exported")');
    expect(perform).not.toContain("downloadSuccess");
  });

  it("uses toast.promise for Parallel ground-truth research", () => {
    const produce = source("src/components/desk/ProduceWorkspace.tsx");
    expect(produce).toContain('import { toast } from "sonner";');
    expect(produce).toContain("toast.promise(researchPromise");
    expect(produce).toContain("Ground-truth research verified and added to the production desk.");
  });

  it("confirms screenplay quick-format insertions through Sonner", () => {
    const write = source("src/components/desk/WriteWorkspace.tsx");
    expect(write).toContain('import { toast } from "sonner";');
    expect(write).toContain("format inserted");
  });

  it("keeps the global Sonner host mounted", () => {
    const app = source("src/App.tsx");
    expect(app).toContain('import { Toaster } from "sonner";');
    expect(app).toContain("<Toaster");
  });
});
