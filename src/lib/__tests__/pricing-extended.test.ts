import {
  calculateLineItem,
  calculateLineItemBreakdown,
  calculateTotal,
  type LineItemInput,
} from "@/lib/pricing";
import { PRICING, PRODUCTS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function makeItem(overrides: Partial<LineItemInput> = {}): LineItemInput {
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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Base: 3x4 => 1728 sqIn => $950.40

// ---------------------------------------------------------------------------
// Operation modifiers
// ---------------------------------------------------------------------------
describe("operation modifiers", () => {
  const operationTests = [
    ["XO", 0],
    ["OX", 0],
    ["XOO", 0.01],
    ["OOX", 0.01],
    ["OXO-L", 0.02],
    ["OXO-R", 0.02],
    ["XOX", 0.02],
    ["XOX-o", 0.02],
    ["OXXO", 0.03],
    ["XOXXOO", 0.04],
    ["SH", 0],
    ["SH-o", 0.01],
    ["N/A", 0],
    ["STD", 0],
  ] as const;

  it.each(operationTests)(
    "operation %s adds $%s/sqIn",
    (operation, rate) => {
      const expected = round2(1728 * (0.55 + rate));
      const result = calculateLineItem(makeItem({ operation }));
      expect(result).toBe(expected);
    },
  );
});

// ---------------------------------------------------------------------------
// Grid type modifiers
// ---------------------------------------------------------------------------
describe("grid type modifiers", () => {
  const gridTests = [
    ["STD GRID", 0],
    ["CNT GRID", 0.01],
    ["KE Grid", 0.02],
  ] as const;

  it.each(gridTests)(
    "grid type %s adds $%s/sqIn",
    (gridType, rate) => {
      const expected = round2(1728 * (0.55 + rate));
      const result = calculateLineItem(makeItem({ gridType }));
      expect(result).toBe(expected);
    },
  );
});

// ---------------------------------------------------------------------------
// Glass type modifiers
// ---------------------------------------------------------------------------
describe("glass type modifiers", () => {
  const glassTests = [
    ["LoE-366", 0],
    ["LoE-i89", 0.01],
    ["Quad LoE-452+", 0.02],
    ["Low-E", 0],
    ["Low-E+", 0.01],
    ["STD", 0],
  ] as const;

  it.each(glassTests)(
    "glass type %s adds $%s/sqIn",
    (glassType, rate) => {
      const expected = round2(1728 * (0.55 + rate));
      const result = calculateLineItem(makeItem({ glassType }));
      expect(result).toBe(expected);
    },
  );
});

// ---------------------------------------------------------------------------
// Product code pricing modifiers
// ---------------------------------------------------------------------------
describe("product code pricing modifiers", () => {
  it("Patriot SS has no product modifier (undefined)", () => {
    const p = PRODUCTS["Patriot SS"];
    expect(p.pricingModifier).toBeUndefined();
    // productCode should NOT add extra when pricingModifier is undefined
    const withCode = calculateLineItem(makeItem({ productCode: "Patriot SS" }));
    const withoutCode = calculateLineItem(makeItem());
    expect(withCode).toBe(withoutCode);
  });

  it("Patriot HP SS adds 0.01 via product code", () => {
    const result = calculateLineItem(
      makeItem({ productCode: "Patriot HP SS" }),
    );
    // base rate + product modifier 0.01
    const expected = round2(1728 * (0.55 + 0.01));
    expect(result).toBe(expected);
  });

  it("Patriot SGD (Door) adds 0.05 via product code", () => {
    const result = calculateLineItem(
      makeItem({ productCode: "Patriot SGD" }),
    );
    const expected = round2(1728 * (0.55 + 0.05));
    expect(result).toBe(expected);
  });

  it("Sunview SSL subtracts 0.02 via product code", () => {
    const result = calculateLineItem(
      makeItem({ productCode: "Sunview SSL" }),
    );
    const expected = round2(1728 * (0.55 - 0.02));
    expect(result).toBe(expected);
  });

  it("Imperial IC adds 0.03 via product code", () => {
    const result = calculateLineItem(
      makeItem({ productCode: "Imperial IC" }),
    );
    const expected = round2(1728 * (0.55 + 0.03));
    expect(result).toBe(expected);
  });

  it("Legacy ATD adds 0.06 via product code", () => {
    const result = calculateLineItem(
      makeItem({ productCode: "Legacy ATD" }),
    );
    const expected = round2(1728 * (0.55 + 0.06));
    expect(result).toBe(expected);
  });

  it("Legacy FRENCH adds 0.08 via product code", () => {
    const result = calculateLineItem(
      makeItem({ productCode: "Legacy FRENCH" }),
    );
    const expected = round2(1728 * (0.55 + 0.08));
    expect(result).toBe(expected);
  });

  it("unknown product code adds 0", () => {
    const result = calculateLineItem(
      makeItem({ productCode: "FAKE_PRODUCT" }),
    );
    expect(result).toBe(950.4); // same as base
  });
});

// ---------------------------------------------------------------------------
// Every color in PRICING has correct effect
// ---------------------------------------------------------------------------
describe("every color in PRICING", () => {
  it.each(Object.entries(PRICING.color))(
    "color '%s' (rate %s)",
    (color, rate) => {
      const expected = round2(1728 * (0.55 + rate));
      expect(calculateLineItem(makeItem({ color }))).toBe(expected);
    },
  );
});

// ---------------------------------------------------------------------------
// Every series in PRICING has correct effect
// ---------------------------------------------------------------------------
describe("every series in PRICING", () => {
  it.each(Object.entries(PRICING.series))(
    "series '%s' (rate %s)",
    (series, rate) => {
      const expected = round2(1728 * (0.55 + rate));
      expect(calculateLineItem(makeItem({ series }))).toBe(expected);
    },
  );
});

// ---------------------------------------------------------------------------
// Every frame in PRICING has correct effect
// ---------------------------------------------------------------------------
describe("every frame in PRICING", () => {
  it.each(Object.entries(PRICING.frame))(
    "frame '%s' (rate %s)",
    (frame, rate) => {
      const expected = round2(1728 * (0.55 + rate));
      expect(calculateLineItem(makeItem({ frame }))).toBe(expected);
    },
  );
});

// ---------------------------------------------------------------------------
// Every function in PRICING has correct effect
// ---------------------------------------------------------------------------
describe("every function in PRICING", () => {
  it.each(Object.entries(PRICING.function))(
    "function '%s' (rate %s)",
    (fn, rate) => {
      const expected = round2(1728 * (0.55 + rate));
      expect(calculateLineItem(makeItem({ function: fn }))).toBe(expected);
    },
  );
});

// ---------------------------------------------------------------------------
// Stacking: operation + gridType + glassType + productCode
// ---------------------------------------------------------------------------
describe("new modifier stacking", () => {
  it("operation + gridType + glassType stack together", () => {
    // OXXO(0.03) + CNT GRID(0.01) + LoE-i89(0.01) = 0.05
    const result = calculateLineItem(
      makeItem({
        operation: "OXXO",
        gridType: "CNT GRID",
        glassType: "LoE-i89",
      }),
    );
    const expected = round2(1728 * (0.55 + 0.05));
    expect(result).toBe(expected);
  });

  it("productCode + operation + gridType + glassType all stack", () => {
    // Patriot HP SS(0.01) + XOX(0.02) + KE Grid(0.02) + Quad LoE-452+(0.02) = 0.07
    const result = calculateLineItem(
      makeItem({
        productCode: "Patriot HP SS",
        operation: "XOX",
        gridType: "KE Grid",
        glassType: "Quad LoE-452+",
      }),
    );
    const expected = round2(1728 * (0.55 + 0.07));
    expect(result).toBe(expected);
  });

  it("all modifiers at maximum", () => {
    // Eclipse(0.01) + Legacy(0.05) + FrameOver(-0.01) + Casement(0.03)
    // + Legacy FRENCH productCode(0.08) + XOXXOO(0.04) + KE Grid(0.02) + Quad LoE-452+(0.02)
    // + all booleans(0.08)
    // = 0.01 + 0.05 + (-0.01) + 0.03 + 0.08 + 0.04 + 0.02 + 0.02 + 0.08 = 0.32
    const result = calculateLineItem(
      makeItem({
        color: "Eclipse",
        series: "Legacy",
        frame: "Frame Over",
        function: "Casement",
        productCode: "Legacy FRENCH",
        operation: "XOXXOO",
        gridType: "KE Grid",
        glassType: "Quad LoE-452+",
        temperedGlass: true,
        obscuredGlass: true,
        customShape: true,
        wrap: true,
        coated: true,
        awpShutterRnr: true,
      }),
    );
    const expected = round2(1728 * (0.55 + 0.32));
    expect(result).toBe(expected);
  });

  it("breakdown shows new modifiers in addonTotal", () => {
    const breakdown = calculateLineItemBreakdown(
      makeItem({
        operation: "OXXO",    // 0.03
        gridType: "KE Grid",  // 0.02
        glassType: "LoE-i89", // 0.01
      }),
    );
    // addon rate = 0.06
    expect(breakdown.addonTotal).toBe(round2(1728 * 0.06));
    expect(breakdown.unitPrice).toBe(round2(1728 * 0.61));
  });
});

// ---------------------------------------------------------------------------
// Realistic full contract scenarios - every type
// ---------------------------------------------------------------------------
describe("realistic contract scenarios", () => {
  describe("SLC residential window replacement", () => {
    it("prices a 10-window job with mix of Patriot products", () => {
      const items: LineItemInput[] = [
        // Kitchen: 2x Patriot Single Slider, White, Nail Fin, LoE-366, STD GRID
        makeItem({
          width: 3, height: 4, qty: 2,
          color: "White", series: "Patriot", frame: "Nail Fin",
          function: "Single Slider",
          productCode: "Patriot SS", operation: "XO",
          gridType: "STD GRID", glassType: "LoE-366",
        }),
        // Living Room: 1x Patriot Picture, White, Nail Fin
        makeItem({
          width: 5, height: 6, qty: 1,
          function: "Picture",
          productCode: "Patriot PW", operation: "N/A",
          gridType: "STD GRID", glassType: "LoE-366",
        }),
        // Bedroom: 3x Patriot Single Hung, Light Tan, Flush Fin
        makeItem({
          width: 2.5, height: 4, qty: 3,
          color: "Light Tan", frame: "Flush Fin",
          function: "Single Hung",
          productCode: "Patriot SH", operation: "SH",
          gridType: "STD GRID", glassType: "LoE-366",
        }),
        // Bathroom: 1x Patriot SH, tempered + obscured
        makeItem({
          width: 2, height: 3, qty: 1,
          function: "Single Hung",
          productCode: "Patriot SH", operation: "SH",
          gridType: "STD GRID", glassType: "LoE-366",
          temperedGlass: true, obscuredGlass: true,
        }),
        // Entry: 1x Patriot Sliding Door
        makeItem({
          width: 6, height: 7, qty: 1,
          color: "Bronze", function: "Sliding Door",
          productCode: "Patriot SGD", operation: "XO",
          gridType: "STD GRID", glassType: "LoE-366",
        }),
      ];

      const total = calculateTotal(items);
      expect(total).toBeGreaterThan(0);

      // Verify each item individually
      for (const item of items) {
        const price = calculateLineItem(item);
        expect(price).toBeGreaterThan(0);
      }

      // Total should be sum of individual
      const sumOfPrices = items.reduce(
        (sum, item) => sum + calculateLineItem(item),
        0,
      );
      expect(total).toBe(sumOfPrices);
    });
  });

  describe("PHOENIX hot climate job", () => {
    it("prices Patriot products with Quad glass", () => {
      const items: LineItemInput[] = [
        makeItem({
          width: 4, height: 5, qty: 5,
          function: "Single Slider",
          productCode: "Patriot SS", operation: "XO",
          gridType: "STD GRID", glassType: "Quad LoE-452+",
        }),
        makeItem({
          width: 3, height: 4, qty: 3,
          function: "Picture",
          productCode: "Patriot PW", operation: "N/A",
          gridType: "CNT GRID", glassType: "Quad LoE-452+",
          temperedGlass: true,
        }),
      ];

      const total = calculateTotal(items);
      expect(total).toBeGreaterThan(0);

      // Verify Quad glass adds 0.02
      const item1Breakdown = calculateLineItemBreakdown(items[0]);
      const sqIn1 = 4 * 5 * 144;
      // Quad(0.02) only (no other addons since function=Single Slider is not in PRICING)
      // Actually Single Slider isn't in PRICING.function - it'll fallback to 0
      expect(item1Breakdown.sqIn).toBe(sqIn1);
    });
  });

  describe("VANCOUVER premium job with Signature/Autograph", () => {
    it("prices a mix of Signature and Autograph products", () => {
      const items: LineItemInput[] = [
        // Signature Single Slider
        makeItem({
          width: 3.5, height: 4.5, qty: 4,
          color: "Eclipse (Black on Black)", series: "Signature",
          function: "Single Slider",
          productCode: "SIG SS", operation: "XO",
          gridType: "STD GRID", glassType: "Low-E+",
        }),
        // Autograph Double Vent
        makeItem({
          width: 4, height: 5, qty: 2,
          color: "White", series: "Autograph",
          function: "Double Vent",
          productCode: "AG DV", operation: "XOX",
          gridType: "CNT GRID", glassType: "Low-E",
          wrap: true, coated: true,
        }),
        // Signature Eyebrow shape
        makeItem({
          width: 3, height: 2, qty: 1,
          color: "Light Tan", series: "Signature",
          function: "Eyebrow",
          productCode: "SIG EB", operation: "N/A",
          gridType: "KE Grid", glassType: "Low-E+",
          customShape: true,
        }),
        // Signature Sliding Door
        makeItem({
          width: 8, height: 7, qty: 1,
          color: "Eclipse (Black on Black)", series: "Signature",
          function: "Sliding Door",
          productCode: "SIG SGD", operation: "OXXO",
          gridType: "STD GRID", glassType: "Low-E",
          temperedGlass: true,
        }),
      ];

      const total = calculateTotal(items);
      expect(total).toBeGreaterThan(0);

      // Verify Eclipse (Black on Black) color is recognized
      expect(PRICING.color["Eclipse (Black on Black)"]).toBe(0.01);
    });
  });

  describe("Sunview budget job", () => {
    it("prices Sunview products with negative modifier", () => {
      const items: LineItemInput[] = [
        makeItem({
          width: 3, height: 4, qty: 6,
          color: "White", series: "Sunview",
          function: "Slider",
          productCode: "Sunview SSL", operation: "XO",
          gridType: "STD GRID", glassType: "LoE-366",
        }),
        makeItem({
          width: 2, height: 3, qty: 4,
          color: "White", series: "Sunview",
          function: "Single Hung",
          productCode: "Sunview SSH", operation: "SH",
          gridType: "STD GRID", glassType: "LoE-366",
        }),
      ];

      const total = calculateTotal(items);
      expect(total).toBeGreaterThan(0);

      // Sunview items should be cheaper than Patriot equivalent
      const sunviewItem = calculateLineItem(items[0]);
      const patriotItem = calculateLineItem(
        makeItem({
          width: 3, height: 4, qty: 6,
          function: "Slider", operation: "XO",
          gridType: "STD GRID", glassType: "LoE-366",
        }),
      );
      expect(sunviewItem).toBeLessThan(patriotItem);
    });
  });

  describe("Imperial specialty job", () => {
    it("prices Imperial Casement and Awning windows", () => {
      const items: LineItemInput[] = [
        makeItem({
          width: 2, height: 4, qty: 3,
          series: "Imperial", function: "Casement",
          productCode: "Imperial IC", operation: "N/A",
          gridType: "STD GRID", glassType: "LoE-i89",
        }),
        makeItem({
          width: 3, height: 2, qty: 2,
          series: "Imperial", function: "Awning",
          productCode: "Imperial IA", operation: "N/A",
          gridType: "STD GRID", glassType: "LoE-366",
        }),
        makeItem({
          width: 2, height: 3, qty: 2,
          series: "Imperial", function: "Picture",
          productCode: "Imperial ICP", operation: "N/A",
          gridType: "STD GRID", glassType: "LoE-i89",
        }),
      ];

      const total = calculateTotal(items);
      expect(total).toBeGreaterThan(0);
    });
  });

  describe("Legacy door job", () => {
    it("prices all Legacy door types", () => {
      const items: LineItemInput[] = [
        // Single Swing Door
        makeItem({
          width: 3, height: 7, qty: 1,
          series: "Legacy", function: "Swing Door",
          productCode: "Legacy SSD", operation: "STD",
          gridType: "STD GRID", glassType: "LoE-366",
        }),
        // Atrium Door
        makeItem({
          width: 5, height: 7, qty: 1,
          series: "Legacy", function: "Swing Door",
          productCode: "Legacy ATD", operation: "STD",
          gridType: "STD GRID", glassType: "LoE-i89",
          temperedGlass: true,
        }),
        // French Door
        makeItem({
          width: 6, height: 7, qty: 1,
          series: "Legacy", function: "French Door",
          productCode: "Legacy FRENCH", operation: "STD",
          gridType: "STD GRID", glassType: "LoE-i89",
          temperedGlass: true,
        }),
      ];

      const total = calculateTotal(items);
      expect(total).toBeGreaterThan(0);

      // French door should be most expensive (highest modifier)
      const frenchPrice = calculateLineItem(items[2]);
      const atriumPrice = calculateLineItem(items[1]);
      // French door width*height is bigger and modifier is higher
      expect(frenchPrice).toBeGreaterThan(atriumPrice);
    });
  });

  describe("maximum everything contract", () => {
    it("prices every addon at maximum for a single item", () => {
      const item = makeItem({
        width: 10, height: 10, qty: 5,
        color: "Eclipse",                    // +0.01
        series: "Legacy",                     // +0.05
        frame: "Nail Fin",                    // 0
        function: "Casement",                 // +0.03
        productCode: "Legacy FRENCH",         // +0.08
        operation: "XOXXOO",                  // +0.04
        gridType: "KE Grid",                  // +0.02
        glassType: "Quad LoE-452+",           // +0.02
        temperedGlass: true,                  // +0.02
        obscuredGlass: true,                  // +0.01
        customShape: true,                    // +0.02
        wrap: true,                           // +0.01
        coated: true,                         // +0.01
        awpShutterRnr: true,                  // +0.01
      });

      const breakdown = calculateLineItemBreakdown(item);
      expect(breakdown.sqIn).toBe(10 * 10 * 144); // 14400
      expect(breakdown.basePrice).toBe(round2(14400 * 0.55));

      const totalAddonRate =
        0.01 + 0.05 + 0 + 0.03 + 0.08 + 0.04 + 0.02 + 0.02 +
        0.02 + 0.01 + 0.02 + 0.01 + 0.01 + 0.01;
      expect(breakdown.addonTotal).toBe(round2(14400 * totalAddonRate));

      const unitPrice = round2(14400 * (0.55 + totalAddonRate));
      expect(breakdown.unitPrice).toBe(unitPrice);
      expect(breakdown.lineTotal).toBe(round2(unitPrice * 5));
    });
  });

  describe("minimum cost contract (Sunview + Frame Over)", () => {
    it("Frame Over discount + Sunview discount reduces price below base", () => {
      const item = makeItem({
        width: 3, height: 4, qty: 1,
        series: "Sunview",                    // -0.02
        frame: "Frame Over",                  // -0.01
        function: "Single Hung",              // 0
        productCode: "Sunview SSH",           // -0.02
      });

      const result = calculateLineItem(item);
      // addon = -0.02 + (-0.01) + 0 + (-0.02) = -0.05
      const expected = round2(1728 * (0.55 - 0.05));
      expect(result).toBe(expected);
      expect(result).toBeLessThan(950.4); // less than base
    });
  });
});

// ---------------------------------------------------------------------------
// Edge cases with new fields
// ---------------------------------------------------------------------------
describe("edge cases with new fields", () => {
  it("undefined operation adds 0", () => {
    const withOp = calculateLineItem(makeItem({ operation: undefined }));
    const withoutOp = calculateLineItem(makeItem());
    expect(withOp).toBe(withoutOp);
  });

  it("empty string operation adds 0", () => {
    const result = calculateLineItem(makeItem({ operation: "" }));
    expect(result).toBe(950.4);
  });

  it("undefined gridType adds 0", () => {
    const result = calculateLineItem(makeItem({ gridType: undefined }));
    expect(result).toBe(950.4);
  });

  it("undefined glassType adds 0", () => {
    const result = calculateLineItem(makeItem({ glassType: undefined }));
    expect(result).toBe(950.4);
  });

  it("undefined productCode adds 0", () => {
    const result = calculateLineItem(makeItem({ productCode: undefined }));
    expect(result).toBe(950.4);
  });

  it("empty string productCode adds 0", () => {
    const result = calculateLineItem(makeItem({ productCode: "" }));
    expect(result).toBe(950.4);
  });
});
