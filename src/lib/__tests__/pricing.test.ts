import {
  calculateSquareInches,
  calculateLineItem,
  calculateLineItemBreakdown,
  calculateTotal,
  calculateContractTotal,
  calculateBalanceDue,
  formatCurrency,
  type LineItemInput,
} from "@/lib/pricing";
import { PRICING } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Helper: build a default LineItemInput with zero-cost options
// ---------------------------------------------------------------------------
function makeItem(overrides: Partial<LineItemInput> = {}): LineItemInput {
  return {
    width: 3,
    height: 4,
    qty: 1,
    color: "White",          // rate 0
    series: "Patriot",       // rate 0
    frame: "Nail Fin",       // rate 0
    function: "Slider",      // rate 0
    temperedGlass: false,
    obscuredGlass: false,
    customShape: false,
    wrap: false,
    coated: false,
    awpShutterRnr: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// calculateSquareInches
// ---------------------------------------------------------------------------
describe("calculateSquareInches", () => {
  it("converts basic feet to square inches (3ft x 4ft = 1728)", () => {
    // 3 * 4 * 144 = 1728
    expect(calculateSquareInches(3, 4)).toBe(1728);
  });

  it("returns 0 when width is 0", () => {
    expect(calculateSquareInches(0, 5)).toBe(0);
  });

  it("returns 0 when height is 0", () => {
    expect(calculateSquareInches(5, 0)).toBe(0);
  });

  it("returns 0 when both dimensions are 0", () => {
    expect(calculateSquareInches(0, 0)).toBe(0);
  });

  it("handles fractional dimensions", () => {
    // 2.5 * 3.5 * 144 = 1260
    expect(calculateSquareInches(2.5, 3.5)).toBe(1260);
  });

  it("handles small fractional dimensions", () => {
    // 0.5 * 0.5 * 144 = 36
    expect(calculateSquareInches(0.5, 0.5)).toBe(36);
  });

  it("handles large dimensions", () => {
    // 100 * 200 * 144 = 2,880,000
    expect(calculateSquareInches(100, 200)).toBe(2_880_000);
  });

  it("handles 1ft x 1ft = 144 sqIn", () => {
    expect(calculateSquareInches(1, 1)).toBe(144);
  });
});

// ---------------------------------------------------------------------------
// calculateLineItem
// ---------------------------------------------------------------------------
describe("calculateLineItem", () => {
  // --- Base calculation ---
  it("calculates base price with zero-cost options (3x4, qty=1)", () => {
    // sqIn = 1728, base = 1728 * 0.55 = 950.40, addons = 0, total = 950.40
    const result = calculateLineItem(makeItem());
    expect(result).toBe(950.4);
  });

  it("returns 0 when dimensions are zero", () => {
    expect(calculateLineItem(makeItem({ width: 0, height: 0 }))).toBe(0);
  });

  it("returns 0 when width is zero", () => {
    expect(calculateLineItem(makeItem({ width: 0 }))).toBe(0);
  });

  it("returns 0 when height is zero", () => {
    expect(calculateLineItem(makeItem({ height: 0 }))).toBe(0);
  });

  // --- Color options ---
  describe("color options", () => {
    it("White has rate 0 (no cost change)", () => {
      expect(PRICING.color["White"]).toBe(0);
      expect(calculateLineItem(makeItem({ color: "White" }))).toBe(950.4);
    });

    it("Light Tan has rate 0 (no cost change)", () => {
      expect(PRICING.color["Light Tan"]).toBe(0);
      expect(calculateLineItem(makeItem({ color: "Light Tan" }))).toBe(950.4);
    });

    it("Dark Tan has rate 0 (no cost change)", () => {
      expect(PRICING.color["Dark Tan"]).toBe(0);
      expect(calculateLineItem(makeItem({ color: "Dark Tan" }))).toBe(950.4);
    });

    it("Eclipse adds $0.01/sqIn", () => {
      expect(PRICING.color["Eclipse"]).toBe(0.01);
      // sqIn=1728, base=950.40, addon=1728*0.01=17.28, unit=967.68, line=967.68
      expect(calculateLineItem(makeItem({ color: "Eclipse" }))).toBe(967.68);
    });

    it("Black Out White has rate 0 (no cost change)", () => {
      expect(PRICING.color["Black Out White"]).toBe(0);
      expect(calculateLineItem(makeItem({ color: "Black Out White" }))).toBe(950.4);
    });
  });

  // --- Series options ---
  describe("series options", () => {
    it("Patriot has rate 0 (no cost change)", () => {
      expect(PRICING.series["Patriot"]).toBe(0);
      expect(calculateLineItem(makeItem({ series: "Patriot" }))).toBe(950.4);
    });

    it("High Performance adds $0.01/sqIn", () => {
      expect(PRICING.series["High Performance"]).toBe(0.01);
      // addon = 1728 * 0.01 = 17.28, total = 950.40 + 17.28 = 967.68
      expect(calculateLineItem(makeItem({ series: "High Performance" }))).toBe(967.68);
    });

    it("Autograph has rate 0 (no cost change)", () => {
      expect(PRICING.series["Autograph"]).toBe(0);
      expect(calculateLineItem(makeItem({ series: "Autograph" }))).toBe(950.4);
    });

    it("Signature adds $0.01/sqIn", () => {
      expect(PRICING.series["Signature"]).toBe(0.01);
      expect(calculateLineItem(makeItem({ series: "Signature" }))).toBe(967.68);
    });
  });

  // --- Frame options ---
  describe("frame options", () => {
    it("Nail Fin has rate 0 (no cost change)", () => {
      expect(PRICING.frame["Nail Fin"]).toBe(0);
      expect(calculateLineItem(makeItem({ frame: "Nail Fin" }))).toBe(950.4);
    });

    it("Flush Fin has rate 0 (no cost change)", () => {
      expect(PRICING.frame["Flush Fin"]).toBe(0);
      expect(calculateLineItem(makeItem({ frame: "Flush Fin" }))).toBe(950.4);
    });

    it("Frame Over subtracts $0.01/sqIn (discount)", () => {
      expect(PRICING.frame["Frame Over"]).toBe(-0.01);
      // addon = 1728 * (-0.01) = -17.28, total = 950.40 - 17.28 = 933.12
      expect(calculateLineItem(makeItem({ frame: "Frame Over" }))).toBe(933.12);
    });
  });

  // --- Function options ---
  describe("function options", () => {
    it("Slider has rate 0 (no cost change)", () => {
      expect(PRICING.function["Slider"]).toBe(0);
      expect(calculateLineItem(makeItem({ function: "Slider" }))).toBe(950.4);
    });

    it("Picture has rate 0 (no cost change)", () => {
      expect(PRICING.function["Picture"]).toBe(0);
      expect(calculateLineItem(makeItem({ function: "Picture" }))).toBe(950.4);
    });

    it("Eyebrow adds $0.02/sqIn", () => {
      expect(PRICING.function["Eyebrow"]).toBe(0.02);
      // addon = 1728 * 0.02 = 34.56, total = 950.40 + 34.56 = 984.96
      expect(calculateLineItem(makeItem({ function: "Eyebrow" }))).toBe(984.96);
    });

    it("Vent adds $0.02/sqIn", () => {
      expect(PRICING.function["Vent"]).toBe(0.02);
      expect(calculateLineItem(makeItem({ function: "Vent" }))).toBe(984.96);
    });

    it("Double Vent adds $0.02/sqIn", () => {
      expect(PRICING.function["Double Vent"]).toBe(0.02);
      expect(calculateLineItem(makeItem({ function: "Double Vent" }))).toBe(984.96);
    });
  });

  // --- Boolean addons individually ---
  describe("boolean addons (individually)", () => {
    it("temperedGlass adds $0.01/sqIn", () => {
      expect(PRICING.booleanAddons.temperedGlass).toBe(0.01);
      // addon = 1728 * 0.01 = 17.28, total = 950.40 + 17.28 = 967.68
      expect(calculateLineItem(makeItem({ temperedGlass: true }))).toBe(967.68);
    });

    it("obscuredGlass adds $0.01/sqIn", () => {
      expect(PRICING.booleanAddons.obscuredGlass).toBe(0.01);
      expect(calculateLineItem(makeItem({ obscuredGlass: true }))).toBe(967.68);
    });

    it("customShape adds $0.02/sqIn", () => {
      expect(PRICING.booleanAddons.customShape).toBe(0.02);
      // addon = 1728 * 0.02 = 34.56, total = 950.40 + 34.56 = 984.96
      expect(calculateLineItem(makeItem({ customShape: true }))).toBe(984.96);
    });

    it("wrap adds $0.01/sqIn", () => {
      expect(PRICING.booleanAddons.wrap).toBe(0.01);
      expect(calculateLineItem(makeItem({ wrap: true }))).toBe(967.68);
    });

    it("coated adds $0.01/sqIn", () => {
      expect(PRICING.booleanAddons.coated).toBe(0.01);
      expect(calculateLineItem(makeItem({ coated: true }))).toBe(967.68);
    });

    it("awpShutterRnr adds $0.02/sqIn", () => {
      expect(PRICING.booleanAddons.awpShutterRnr).toBe(0.02);
      // addon = 1728 * 0.02 = 34.56, total = 950.40 + 34.56 = 984.96
      expect(calculateLineItem(makeItem({ awpShutterRnr: true }))).toBe(984.96);
    });
  });

  // --- Multiple boolean addons combined ---
  describe("multiple boolean addons combined", () => {
    it("temperedGlass + obscuredGlass (0.01 + 0.01 = 0.02/sqIn)", () => {
      // addon = 1728 * 0.02 = 34.56, total = 950.40 + 34.56 = 984.96
      const result = calculateLineItem(
        makeItem({ temperedGlass: true, obscuredGlass: true })
      );
      expect(result).toBe(984.96);
    });

    it("customShape + awpShutterRnr (0.02 + 0.02 = 0.04/sqIn)", () => {
      // addon = 1728 * 0.04 = 69.12, total = 950.40 + 69.12 = 1019.52
      const result = calculateLineItem(
        makeItem({ customShape: true, awpShutterRnr: true })
      );
      expect(result).toBe(1019.52);
    });

    it("wrap + coated + temperedGlass (0.01 + 0.01 + 0.01 = 0.03/sqIn)", () => {
      // addon = 1728 * 0.03 = 51.84, total = 950.40 + 51.84 = 1002.24
      const result = calculateLineItem(
        makeItem({ wrap: true, coated: true, temperedGlass: true })
      );
      expect(result).toBe(1002.24);
    });
  });

  // --- All addons combined at once ---
  it("all boolean addons enabled at once", () => {
    // total boolean rate = 0.01 + 0.01 + 0.02 + 0.01 + 0.01 + 0.02 = 0.08
    // sqIn = 1728, addon = 1728 * 0.08 = 138.24
    // base = 950.40, unit = 950.40 + 138.24 = 1088.64
    const result = calculateLineItem(
      makeItem({
        temperedGlass: true,
        obscuredGlass: true,
        customShape: true,
        wrap: true,
        coated: true,
        awpShutterRnr: true,
      })
    );
    expect(result).toBe(1088.64);
  });

  it("all addons combined: Eclipse + Signature + Frame Over + Eyebrow + all booleans", () => {
    // dropdown rates: 0.01 + 0.01 + (-0.01) + 0.02 = 0.03
    // boolean rates: 0.01 + 0.01 + 0.02 + 0.01 + 0.01 + 0.02 = 0.08
    // total addon rate = 0.03 + 0.08 = 0.11
    // sqIn = 1728, addonTotal = 1728 * 0.11 = 190.08
    // base = 950.40, unit = 950.40 + 190.08 = 1140.48
    const result = calculateLineItem(
      makeItem({
        color: "Eclipse",
        series: "Signature",
        frame: "Frame Over",
        function: "Eyebrow",
        temperedGlass: true,
        obscuredGlass: true,
        customShape: true,
        wrap: true,
        coated: true,
        awpShutterRnr: true,
      })
    );
    expect(result).toBe(1140.48);
  });

  // --- Quantity multiplier ---
  describe("quantity multiplier", () => {
    it("qty=2 doubles the line total", () => {
      // unit = 950.40, line = 950.40 * 2 = 1900.80
      expect(calculateLineItem(makeItem({ qty: 2 }))).toBe(1900.8);
    });

    it("qty=5 multiplies correctly", () => {
      // unit = 950.40, line = 950.40 * 5 = 4752.00
      expect(calculateLineItem(makeItem({ qty: 5 }))).toBe(4752);
    });

    it("qty=10 with Eclipse color", () => {
      // unit = 967.68, line = 967.68 * 10 = 9676.80
      expect(
        calculateLineItem(makeItem({ color: "Eclipse", qty: 10 }))
      ).toBe(9676.8);
    });
  });

  // --- Unknown addon keys ---
  describe("unknown option keys use ?? 0 fallback", () => {
    it("unknown color defaults to 0", () => {
      // Should behave like rate 0 => same as base
      expect(calculateLineItem(makeItem({ color: "Unicorn" }))).toBe(950.4);
    });

    it("unknown series defaults to 0", () => {
      expect(calculateLineItem(makeItem({ series: "Imaginary" }))).toBe(950.4);
    });

    it("unknown frame defaults to 0", () => {
      expect(calculateLineItem(makeItem({ frame: "Invisible" }))).toBe(950.4);
    });

    it("unknown function defaults to 0", () => {
      expect(calculateLineItem(makeItem({ function: "Teleporter" }))).toBe(950.4);
    });
  });

  // --- Rounding ---
  describe("rounding to 2 decimal places", () => {
    it("rounds correctly for fractional dimensions", () => {
      // 2.7 * 3.3 * 144 = 1283.04 sqIn (floating-point)
      // base = 1283.04 * 0.55 = 705.672
      // Math.round(705.672 * 100) / 100 = 705.67
      const result = calculateLineItem(makeItem({ width: 2.7, height: 3.3 }));
      expect(result).toBe(705.67);
    });

    it("rounds to exactly 2 decimals with addons on fractional dims", () => {
      // 2.7 * 3.3 * 144 = 1283.04 (floating-point)
      // base = 1283.04 * 0.55 = 705.672
      // addon = 1283.04 * 0.01 = 12.8304
      // unit = 705.672 + 12.8304 = 718.5024
      // Math.round(718.5024 * 100) / 100 = 718.50
      const result = calculateLineItem(
        makeItem({ width: 2.7, height: 3.3, color: "Eclipse" })
      );
      expect(result).toBe(718.5);
    });
  });
});

// ---------------------------------------------------------------------------
// calculateLineItemBreakdown
// ---------------------------------------------------------------------------
describe("calculateLineItemBreakdown", () => {
  it("returns correct PricingBreakdown shape", () => {
    const breakdown = calculateLineItemBreakdown(makeItem());
    expect(breakdown).toHaveProperty("sqIn");
    expect(breakdown).toHaveProperty("basePrice");
    expect(breakdown).toHaveProperty("addonTotal");
    expect(breakdown).toHaveProperty("unitPrice");
    expect(breakdown).toHaveProperty("lineTotal");
    expect(Object.keys(breakdown)).toHaveLength(5);
  });

  it("calculates sqIn correctly", () => {
    const breakdown = calculateLineItemBreakdown(makeItem());
    expect(breakdown.sqIn).toBe(1728);
  });

  it("calculates basePrice correctly (sqIn * 0.55)", () => {
    const breakdown = calculateLineItemBreakdown(makeItem());
    // 1728 * 0.55 = 950.40
    expect(breakdown.basePrice).toBe(950.4);
  });

  it("reports addonTotal = 0 with zero-cost options", () => {
    const breakdown = calculateLineItemBreakdown(makeItem());
    expect(breakdown.addonTotal).toBe(0);
  });

  it("calculates unitPrice = basePrice + addonTotal", () => {
    const breakdown = calculateLineItemBreakdown(makeItem());
    expect(breakdown.unitPrice).toBe(breakdown.basePrice + breakdown.addonTotal);
  });

  it("calculates lineTotal = unitPrice * qty", () => {
    const breakdown = calculateLineItemBreakdown(makeItem({ qty: 3 }));
    // unitPrice = 950.40, lineTotal = 950.40 * 3 = 2851.20
    expect(breakdown.lineTotal).toBe(2851.2);
  });

  it("all fields rounded to 2 decimals", () => {
    // Use fractional dims to trigger rounding
    // 2.7 * 3.3 * 144 = 1283.04 (floating-point)
    const breakdown = calculateLineItemBreakdown(
      makeItem({ width: 2.7, height: 3.3, color: "Eclipse" })
    );
    // sqIn = 1283.04
    expect(breakdown.sqIn).toBe(1283.04);
    // basePrice = 1283.04 * 0.55 = 705.672 => 705.67
    expect(breakdown.basePrice).toBe(705.67);
    // addonTotal = 1283.04 * 0.01 = 12.8304 => 12.83
    expect(breakdown.addonTotal).toBe(12.83);
    // unitPrice = 705.672 + 12.8304 = 718.5024 => 718.50
    expect(breakdown.unitPrice).toBe(718.5);
    // lineTotal = 718.5024 * 1 => 718.50
    expect(breakdown.lineTotal).toBe(718.5);
  });

  it("breakdown with qty > 1 multiplies only lineTotal", () => {
    const breakdown = calculateLineItemBreakdown(makeItem({ qty: 4 }));
    // sqIn = 1728, basePrice = 950.40, addonTotal = 0, unitPrice = 950.40
    expect(breakdown.sqIn).toBe(1728);
    expect(breakdown.basePrice).toBe(950.4);
    expect(breakdown.addonTotal).toBe(0);
    expect(breakdown.unitPrice).toBe(950.4);
    // lineTotal = 950.40 * 4 = 3801.60
    expect(breakdown.lineTotal).toBe(3801.6);
  });

  it("breakdown with multiple addons", () => {
    const breakdown = calculateLineItemBreakdown(
      makeItem({
        color: "Eclipse",       // 0.01
        series: "High Performance", // 0.01
        frame: "Frame Over",    // -0.01
        function: "Eyebrow",    // 0.02
        temperedGlass: true,    // 0.01
        wrap: true,             // 0.01
      })
    );
    // dropdown rates: 0.01 + 0.01 + (-0.01) + 0.02 = 0.03
    // boolean rates: 0.01 + 0.01 = 0.02
    // total addon rate = 0.05
    // sqIn = 1728
    // basePrice = 1728 * 0.55 = 950.40
    // addonTotal = 1728 * 0.05 = 86.40
    // unitPrice = 950.40 + 86.40 = 1036.80
    // lineTotal = 1036.80 * 1 = 1036.80
    expect(breakdown.sqIn).toBe(1728);
    expect(breakdown.basePrice).toBe(950.4);
    expect(breakdown.addonTotal).toBe(86.4);
    expect(breakdown.unitPrice).toBe(1036.8);
    expect(breakdown.lineTotal).toBe(1036.8);
  });

  it("breakdown with zero dimensions returns all zeros", () => {
    const breakdown = calculateLineItemBreakdown(
      makeItem({ width: 0, height: 0 })
    );
    expect(breakdown.sqIn).toBe(0);
    expect(breakdown.basePrice).toBe(0);
    expect(breakdown.addonTotal).toBe(0);
    expect(breakdown.unitPrice).toBe(0);
    expect(breakdown.lineTotal).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateTotal
// ---------------------------------------------------------------------------
describe("calculateTotal", () => {
  it("sums multiple items", () => {
    const items = [
      makeItem(),                            // 950.40
      makeItem({ color: "Eclipse" }),        // 967.68
      makeItem({ function: "Eyebrow" }),     // 984.96
    ];
    // 950.40 + 967.68 + 984.96 = 2903.04
    expect(calculateTotal(items)).toBe(2903.04);
  });

  it("returns 0 for empty array", () => {
    expect(calculateTotal([])).toBe(0);
  });

  it("returns correct value for single item", () => {
    const items = [makeItem()];
    expect(calculateTotal(items)).toBe(950.4);
  });

  it("sums items with different quantities", () => {
    const items = [
      makeItem({ qty: 2 }),                 // 950.40 * 2 = 1900.80
      makeItem({ qty: 3 }),                 // 950.40 * 3 = 2851.20
    ];
    // 1900.80 + 2851.20 = 4752.00
    expect(calculateTotal(items)).toBe(4752);
  });
});

// ---------------------------------------------------------------------------
// calculateContractTotal
// ---------------------------------------------------------------------------
describe("calculateContractTotal", () => {
  it("subtracts discount from subtotal", () => {
    // 5000 - 500 = 4500
    expect(calculateContractTotal(5000, 500)).toBe(4500);
  });

  it("handles zero discount", () => {
    expect(calculateContractTotal(5000, 0)).toBe(5000);
  });

  it("handles falsy discount (defaults to 0)", () => {
    // The implementation uses (discount || 0)
    expect(calculateContractTotal(5000, 0)).toBe(5000);
  });

  it("rounds result to 2 decimal places", () => {
    // 1000.555 - 0.001 = 1000.554 => round => 1000.55
    expect(calculateContractTotal(1000.555, 0.001)).toBe(1000.55);
  });

  it("handles discount equal to subtotal", () => {
    expect(calculateContractTotal(5000, 5000)).toBe(0);
  });

  it("handles discount greater than subtotal (negative result)", () => {
    expect(calculateContractTotal(500, 1000)).toBe(-500);
  });
});

// ---------------------------------------------------------------------------
// calculateBalanceDue
// ---------------------------------------------------------------------------
describe("calculateBalanceDue", () => {
  it("subtracts down payment from contract total", () => {
    // 4500 - 1000 = 3500
    expect(calculateBalanceDue(4500, 1000)).toBe(3500);
  });

  it("handles zero down payment", () => {
    expect(calculateBalanceDue(4500, 0)).toBe(4500);
  });

  it("handles falsy down payment (defaults to 0)", () => {
    expect(calculateBalanceDue(4500, 0)).toBe(4500);
  });

  it("rounds result to 2 decimal places", () => {
    // 1234.567 - 100.111 = 1134.456 => round => 1134.46
    expect(calculateBalanceDue(1234.567, 100.111)).toBe(1134.46);
  });

  it("handles full payment (balance = 0)", () => {
    expect(calculateBalanceDue(5000, 5000)).toBe(0);
  });

  it("handles overpayment (negative balance)", () => {
    expect(calculateBalanceDue(5000, 6000)).toBe(-1000);
  });
});

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------
describe("formatCurrency", () => {
  it("formats standard amount with dollar sign and commas", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1234567.89)).toBe("$1,234,567.89");
  });

  it("formats negative numbers", () => {
    // Intl.NumberFormat uses the minus sign for negative
    const result = formatCurrency(-500.5);
    // Different environments may format as "-$500.50" or "($500.50)"
    // Node/V8 typically uses "-$500.50"
    expect(result).toContain("500.50");
    expect(result).toMatch(/[-\u2212(]/); // contains minus or parens
  });

  it("pads to 2 decimal places for whole numbers", () => {
    expect(formatCurrency(100)).toBe("$100.00");
  });

  it("rounds to 2 decimal places when more decimals given", () => {
    // Intl.NumberFormat rounds
    expect(formatCurrency(99.999)).toBe("$100.00");
  });

  it("formats small amounts correctly", () => {
    expect(formatCurrency(0.01)).toBe("$0.01");
  });

  it("formats very large numbers", () => {
    expect(formatCurrency(999999999.99)).toBe("$999,999,999.99");
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: PRICING constants sanity checks
// ---------------------------------------------------------------------------
describe("PRICING constants integrity", () => {
  it("baseRate is $0.55/sqIn", () => {
    expect(PRICING.baseRate).toBe(0.55);
  });

  it("has all expected color keys", () => {
    expect(Object.keys(PRICING.color)).toEqual(
      expect.arrayContaining(["White", "Light Tan", "Dark Tan", "Eclipse", "Black Out White"])
    );
  });

  it("has all expected series keys", () => {
    expect(Object.keys(PRICING.series)).toEqual(
      expect.arrayContaining(["Patriot", "High Performance", "Autograph", "Signature"])
    );
  });

  it("has all expected frame keys", () => {
    expect(Object.keys(PRICING.frame)).toEqual(
      expect.arrayContaining(["Nail Fin", "Flush Fin", "Frame Over"])
    );
  });

  it("has all expected function keys", () => {
    expect(Object.keys(PRICING.function)).toEqual(
      expect.arrayContaining(["Slider", "Picture", "Eyebrow", "Vent", "Double Vent"])
    );
  });

  it("has all expected boolean addon keys", () => {
    expect(Object.keys(PRICING.booleanAddons)).toEqual(
      expect.arrayContaining([
        "temperedGlass",
        "obscuredGlass",
        "customShape",
        "wrap",
        "coated",
        "awpShutterRnr",
      ])
    );
  });
});
