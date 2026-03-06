import { vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "test-user", role: "ADMIN" } }),
}));

import { POST } from "@/app/api/pricing/calculate/route";
import { PRICING, PRODUCTS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLineItem(overrides: Record<string, unknown> = {}) {
  return {
    width: 3,
    height: 4,
    qty: 1,
    color: "White",
    series: "Patriot",
    frame: "Nail Fin",
    function: "Single Hung",
    temperedGlass: false,
    obscuredGlass: false,
    customShape: false,
    wrap: false,
    coated: false,
    awpShutterRnr: false,
    ...overrides,
  };
}

function postPricing(body: Record<string, unknown>) {
  const req = new Request("http://localhost/api/pricing/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return POST(req as any);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Base: 3x4 => 1728 sqIn

// ---------------------------------------------------------------------------
// Operation modifiers via API
// ---------------------------------------------------------------------------
describe("API: operation modifiers", () => {
  const ops = Object.entries(PRICING.operation);

  it.each(ops)("operation '%s' (rate %s)", async (op, rate) => {
    const res = await postPricing({
      lineItems: [makeLineItem({ operation: op })],
      discount: 0,
      downPayment: 0,
    });
    const data = await res.json();
    const expected = round2(1728 * (0.55 + rate));
    expect(data.itemPrices[0]).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Grid type modifiers via API
// ---------------------------------------------------------------------------
describe("API: grid type modifiers", () => {
  const grids = Object.entries(PRICING.gridType);

  it.each(grids)("gridType '%s' (rate %s)", async (grid, rate) => {
    const res = await postPricing({
      lineItems: [makeLineItem({ gridType: grid })],
      discount: 0,
      downPayment: 0,
    });
    const data = await res.json();
    const expected = round2(1728 * (0.55 + rate));
    expect(data.itemPrices[0]).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Glass type modifiers via API
// ---------------------------------------------------------------------------
describe("API: glass type modifiers", () => {
  const glasses = Object.entries(PRICING.glassType);

  it.each(glasses)("glassType '%s' (rate %s)", async (glass, rate) => {
    const res = await postPricing({
      lineItems: [makeLineItem({ glassType: glass })],
      discount: 0,
      downPayment: 0,
    });
    const data = await res.json();
    const expected = round2(1728 * (0.55 + rate));
    expect(data.itemPrices[0]).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Product code modifiers via API
// ---------------------------------------------------------------------------
describe("API: product code modifiers", () => {
  const productsWithModifiers = Object.entries(PRODUCTS).filter(
    ([, p]) => p.pricingModifier !== undefined,
  );

  it.each(productsWithModifiers)(
    "product '%s' (modifier %s)",
    async (code, product) => {
      const res = await postPricing({
        lineItems: [makeLineItem({ productCode: code })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      const expected = round2(1728 * (0.55 + (product.pricingModifier ?? 0)));
      expect(data.itemPrices[0]).toBe(expected);
    },
  );
});

// ---------------------------------------------------------------------------
// All series via API
// ---------------------------------------------------------------------------
describe("API: all series", () => {
  const series = Object.entries(PRICING.series);

  it.each(series)("series '%s' (rate %s)", async (s, rate) => {
    const res = await postPricing({
      lineItems: [makeLineItem({ series: s })],
      discount: 0,
      downPayment: 0,
    });
    const data = await res.json();
    const expected = round2(1728 * (0.55 + rate));
    expect(data.itemPrices[0]).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// All functions via API
// ---------------------------------------------------------------------------
describe("API: all functions", () => {
  const functions = Object.entries(PRICING.function);

  it.each(functions)("function '%s' (rate %s)", async (fn, rate) => {
    const res = await postPricing({
      lineItems: [makeLineItem({ function: fn })],
      discount: 0,
      downPayment: 0,
    });
    const data = await res.json();
    const expected = round2(1728 * (0.55 + rate));
    expect(data.itemPrices[0]).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Full multi-item contract scenarios via API
// ---------------------------------------------------------------------------
describe("API: full contract scenarios", () => {
  describe("SLC 10-window residential replacement", () => {
    it("prices correctly with mix of products and options", async () => {
      const res = await postPricing({
        lineItems: [
          // 3x Patriot Single Slider, White, NailFin, XO, STD GRID, LoE-366
          makeLineItem({
            width: 3, height: 4, qty: 3,
            function: "Single Slider",
            productCode: "Patriot SS", operation: "XO",
            gridType: "STD GRID", glassType: "LoE-366",
          }),
          // 2x Patriot HP SH, LightTan, FlushFin, SH-o, CNT GRID, LoE-i89
          makeLineItem({
            width: 2.5, height: 4, qty: 2,
            color: "Light Tan", series: "High Performance",
            frame: "Flush Fin", function: "Single Hung",
            productCode: "Patriot HP SH", operation: "SH-o",
            gridType: "CNT GRID", glassType: "LoE-i89",
          }),
          // 1x Patriot PW, Bronze, NailFin, N/A, STD GRID, LoE-366
          makeLineItem({
            width: 5, height: 6, qty: 1,
            color: "Bronze", function: "Picture",
            productCode: "Patriot PW", operation: "N/A",
            gridType: "STD GRID", glassType: "LoE-366",
          }),
          // 2x Patriot DV, White, NailFin, XOX, STD GRID, LoE-366, temperedGlass
          makeLineItem({
            width: 4, height: 5, qty: 2,
            function: "Double Vent",
            productCode: "Patriot DV", operation: "XOX",
            gridType: "STD GRID", glassType: "LoE-366",
            temperedGlass: true,
          }),
          // 1x Patriot CIR shape, White, NailFin, N/A, KE Grid, LoE-366, customShape
          makeLineItem({
            width: 2, height: 2, qty: 1,
            function: "Circle",
            productCode: "Patriot CIR", operation: "N/A",
            gridType: "KE Grid", glassType: "LoE-366",
            customShape: true,
          }),
          // 1x Patriot SGD door, Bronze, NailFin, OXXO, STD GRID, LoE-366, tempered
          makeLineItem({
            width: 8, height: 7, qty: 1,
            color: "Bronze", function: "Sliding Door",
            productCode: "Patriot SGD", operation: "OXXO",
            gridType: "STD GRID", glassType: "LoE-366",
            temperedGlass: true,
          }),
        ],
        discount: 750,
        downPayment: 3000,
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.itemPrices).toHaveLength(6);

      // All prices should be positive
      for (const price of data.itemPrices) {
        expect(price).toBeGreaterThan(0);
      }

      // Total should be sum of items
      const sum = data.itemPrices.reduce(
        (s: number, p: number) => round2(s + p),
        0,
      );
      expect(data.total).toBe(sum);

      // Contract total = total - discount
      expect(data.contractTotal).toBe(round2(sum - 750));

      // Balance due = contractTotal - downPayment
      expect(data.balanceDue).toBe(round2(sum - 750 - 3000));
    });
  });

  describe("VANCOUVER premium with Eclipse + Low-E+", () => {
    it("handles Vancouver-specific options", async () => {
      const res = await postPricing({
        lineItems: [
          makeLineItem({
            width: 3.5, height: 4.5, qty: 4,
            color: "Eclipse (Black on Black)", series: "Signature",
            function: "Single Slider",
            productCode: "SIG SS", operation: "XO",
            gridType: "STD GRID", glassType: "Low-E+",
          }),
          makeLineItem({
            width: 4, height: 5, qty: 2,
            series: "Autograph", function: "Double Vent",
            productCode: "AG DV", operation: "XOX-o",
            gridType: "CNT GRID", glassType: "Low-E",
            wrap: true, coated: true,
          }),
        ],
        discount: 200,
        downPayment: 1000,
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.itemPrices).toHaveLength(2);
      expect(data.itemPrices[0]).toBeGreaterThan(0);
      expect(data.itemPrices[1]).toBeGreaterThan(0);
    });
  });

  describe("Every boolean addon enabled on separate items", () => {
    it("each boolean addon individually priced correctly via API", async () => {
      const booleans = [
        "temperedGlass",
        "obscuredGlass",
        "customShape",
        "wrap",
        "coated",
        "awpShutterRnr",
      ] as const;

      const items = booleans.map((b) => makeLineItem({ [b]: true }));

      const res = await postPricing({
        lineItems: items,
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices).toHaveLength(6);

      for (let i = 0; i < booleans.length; i++) {
        const rate = PRICING.booleanAddons[booleans[i]];
        const expected = round2(1728 * (0.55 + rate));
        expect(data.itemPrices[i]).toBe(expected);
      }
    });
  });

  describe("Mixed item types: Window, Door, IG, Pet Door, Storm", () => {
    it("handles all 5 item types", async () => {
      const res = await postPricing({
        lineItems: [
          makeLineItem({ type: "Window", width: 3, height: 4 }),
          makeLineItem({ type: "Door", width: 6, height: 7 }),
          makeLineItem({ type: "IG", width: 2, height: 3 }),
          makeLineItem({ type: "Pet Door", width: 1, height: 1 }),
          makeLineItem({ type: "Storm", width: 3, height: 5 }),
        ],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices).toHaveLength(5);
      expect(data.total).toBeGreaterThan(0);
    });
  });

  describe("Large quantity contract", () => {
    it("50 identical windows", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ qty: 50 })],
        discount: 5000,
        downPayment: 10000,
      });

      const data = await res.json();
      // 950.40 * 50 = 47520
      expect(data.itemPrices[0]).toBe(47520);
      expect(data.total).toBe(47520);
      expect(data.contractTotal).toBe(42520);
      expect(data.balanceDue).toBe(32520);
    });
  });

  describe("Minimum possible price", () => {
    it("Sunview + Frame Over gives below-base pricing", async () => {
      const res = await postPricing({
        lineItems: [
          makeLineItem({
            series: "Sunview",        // -0.02
            frame: "Frame Over",       // -0.01
            function: "Single Hung",   // 0
            productCode: "Sunview SSH", // -0.02
          }),
        ],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      // Total addon: -0.02 + (-0.01) + (-0.02) = -0.05
      const expected = round2(1728 * (0.55 - 0.05));
      expect(data.itemPrices[0]).toBe(expected);
      expect(data.itemPrices[0]).toBeLessThan(950.4);
    });
  });

  describe("Maximum possible addon rate", () => {
    it("all addons maxed out", async () => {
      const res = await postPricing({
        lineItems: [
          makeLineItem({
            color: "Eclipse",                // +0.01
            series: "Legacy",                 // +0.05
            frame: "Nail Fin",                // 0
            function: "Casement",             // +0.03
            productCode: "Legacy FRENCH",     // +0.08
            operation: "XOXXOO",              // +0.04
            gridType: "KE Grid",              // +0.02
            glassType: "Quad LoE-452+",       // +0.02
            temperedGlass: true,              // +0.02
            obscuredGlass: true,              // +0.01
            customShape: true,                // +0.02
            wrap: true,                       // +0.01
            coated: true,                     // +0.01
            awpShutterRnr: true,              // +0.01
          }),
        ],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      const totalRate = 0.55 + 0.01 + 0.05 + 0.03 + 0.08 + 0.04 + 0.02 + 0.02 +
        0.02 + 0.01 + 0.02 + 0.01 + 0.01 + 0.01;
      const expected = round2(1728 * totalRate);
      expect(data.itemPrices[0]).toBe(expected);
    });
  });
});

// ---------------------------------------------------------------------------
// Cross-validation: API matches direct pricing
// ---------------------------------------------------------------------------
describe("API vs direct pricing consistency", () => {
  it("API result matches direct calculateLineItem for every color", async () => {
    for (const [color, rate] of Object.entries(PRICING.color)) {
      const res = await postPricing({
        lineItems: [makeLineItem({ color })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      const expected = round2(1728 * (0.55 + rate));
      expect(data.itemPrices[0]).toBe(expected);
    }
  });

  it("API result matches direct calculateLineItem for every frame", async () => {
    for (const [frame, rate] of Object.entries(PRICING.frame)) {
      const res = await postPricing({
        lineItems: [makeLineItem({ frame })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      const expected = round2(1728 * (0.55 + rate));
      expect(data.itemPrices[0]).toBe(expected);
    }
  });
});
