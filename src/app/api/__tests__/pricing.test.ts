import { POST } from "@/app/api/pricing/calculate/route";
import { PRICING } from "@/lib/constants";

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/** Build a minimal valid line-item payload, merging any overrides. */
function makeLineItem(overrides: Record<string, unknown> = {}) {
  return {
    width: 3,
    height: 4,
    qty: 1,
    color: "White",
    series: "Patriot",
    frame: "Nail Fin",
    function: "Slider",
    temperedGlass: false,
    obscuredGlass: false,
    customShape: false,
    wrap: false,
    coated: false,
    awpShutterRnr: false,
    ...overrides,
  };
}

/** Create a Request with a JSON body and POST it to the handler. */
function postPricing(body: Record<string, unknown>) {
  const req = new Request("http://localhost/api/pricing/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return POST(req as any);
}

/** Round to 2 decimal places the same way the pricing code does. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ----------------------------------------------------------------
// Tests
// ----------------------------------------------------------------

describe("POST /api/pricing/calculate", () => {
  // ==============================================================
  // Response structure
  // ==============================================================
  describe("response structure", () => {
    it("returns JSON with itemPrices, total, contractTotal, balanceDue", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem()],
        discount: 0,
        downPayment: 0,
      });

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("itemPrices");
      expect(data).toHaveProperty("total");
      expect(data).toHaveProperty("contractTotal");
      expect(data).toHaveProperty("balanceDue");
    });

    it("itemPrices is an array with one entry per line item", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem(), makeLineItem({ width: 5 })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(Array.isArray(data.itemPrices)).toBe(true);
      expect(data.itemPrices).toHaveLength(2);
    });
  });

  // ==============================================================
  // Empty / missing line items
  // ==============================================================
  describe("empty line items", () => {
    it("returns zeros when lineItems is an empty array", async () => {
      const res = await postPricing({
        lineItems: [],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices).toEqual([]);
      expect(data.total).toBe(0);
      expect(data.contractTotal).toBe(0);
      expect(data.balanceDue).toBe(0);
    });

    it("treats missing lineItems as empty array", async () => {
      const res = await postPricing({ discount: 0, downPayment: 0 });

      const data = await res.json();
      expect(data.itemPrices).toEqual([]);
      expect(data.total).toBe(0);
    });
  });

  // ==============================================================
  // Basic single-item pricing (all-zero addons)
  // ==============================================================
  describe("single item, no addons", () => {
    it("calculates base price for a 3x4 window at base rate", async () => {
      // SqIn = 3 * 4 * 144 = 1728
      // BasePrice = 1728 * 0.55 = 950.40
      // No addons, qty=1 => lineTotal = 950.40
      const res = await postPricing({
        lineItems: [makeLineItem()],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(950.4);
      expect(data.total).toBe(950.4);
      expect(data.contractTotal).toBe(950.4);
      expect(data.balanceDue).toBe(950.4);
    });

    it("calculates base price for a 1x1 window", async () => {
      // SqIn = 1 * 1 * 144 = 144
      // BasePrice = 144 * 0.55 = 79.20
      const res = await postPricing({
        lineItems: [makeLineItem({ width: 1, height: 1 })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(79.2);
    });

    it("returns 0 for a 0x0 window (zero area)", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ width: 0, height: 0 })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(0);
      expect(data.total).toBe(0);
    });

    it("returns 0 when width is 0", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ width: 0, height: 5 })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(0);
    });

    it("returns 0 when height is 0", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ width: 5, height: 0 })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(0);
    });
  });

  // ==============================================================
  // Quantity multiplier
  // ==============================================================
  describe("quantity multiplier", () => {
    it("multiplies unit price by qty", async () => {
      // SqIn = 3 * 4 * 144 = 1728, BasePrice = 950.40
      // qty=3 => lineTotal = 950.40 * 3 = 2851.20
      const res = await postPricing({
        lineItems: [makeLineItem({ qty: 3 })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(2851.2);
      expect(data.total).toBe(2851.2);
    });

    it("treats qty=0 as qty=1 (fallback in pricing code)", async () => {
      // The pricing code uses `item.qty || 1`, so qty=0 -> 1
      const res = await postPricing({
        lineItems: [makeLineItem({ qty: 0 })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      // Same as qty=1 => 950.40
      expect(data.itemPrices[0]).toBe(950.4);
    });
  });

  // ==============================================================
  // Color addons
  // ==============================================================
  describe("color addons", () => {
    it("White adds 0 per sqIn", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ color: "White" })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      // Pure base: 3*4*144 * 0.55 = 950.40
      expect(data.itemPrices[0]).toBe(950.4);
    });

    it("Eclipse adds $0.01/sqIn", async () => {
      // SqIn=1728, base=950.40, colorAddon=1728*0.01=17.28
      // total = 950.40 + 17.28 = 967.68
      const res = await postPricing({
        lineItems: [makeLineItem({ color: "Eclipse" })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(967.68);
    });
  });

  // ==============================================================
  // Series addons
  // ==============================================================
  describe("series addons", () => {
    it("Patriot adds 0", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ series: "Patriot" })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(950.4);
    });

    it("High Performance adds $0.01/sqIn", async () => {
      // SqIn=1728, addon=17.28 => 950.40+17.28=967.68
      const res = await postPricing({
        lineItems: [makeLineItem({ series: "High Performance" })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(967.68);
    });

    it("Signature adds $0.01/sqIn", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ series: "Signature" })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(967.68);
    });
  });

  // ==============================================================
  // Frame addons
  // ==============================================================
  describe("frame addons", () => {
    it("Nail Fin adds 0", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ frame: "Nail Fin" })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(950.4);
    });

    it("Frame Over subtracts $0.01/sqIn (negative addon)", async () => {
      // SqIn=1728, addon=-17.28 => 950.40-17.28=933.12
      const res = await postPricing({
        lineItems: [makeLineItem({ frame: "Frame Over" })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(933.12);
    });
  });

  // ==============================================================
  // Function addons
  // ==============================================================
  describe("function addons", () => {
    it("Slider adds 0", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ function: "Slider" })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(950.4);
    });

    it("Eyebrow adds $0.02/sqIn", async () => {
      // SqIn=1728, addon=1728*0.02=34.56 => 950.40+34.56=984.96
      const res = await postPricing({
        lineItems: [makeLineItem({ function: "Eyebrow" })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(984.96);
    });
  });

  // ==============================================================
  // Boolean addons
  // ==============================================================
  describe("boolean addons", () => {
    it("temperedGlass adds $0.01/sqIn", async () => {
      // SqIn=1728, addon=17.28 => 950.40+17.28=967.68
      const res = await postPricing({
        lineItems: [makeLineItem({ temperedGlass: true })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(967.68);
    });

    it("obscuredGlass adds $0.01/sqIn", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ obscuredGlass: true })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(967.68);
    });

    it("customShape adds $0.02/sqIn", async () => {
      // SqIn=1728, addon=34.56 => 950.40+34.56=984.96
      const res = await postPricing({
        lineItems: [makeLineItem({ customShape: true })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(984.96);
    });

    it("wrap adds $0.01/sqIn", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ wrap: true })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(967.68);
    });

    it("coated adds $0.01/sqIn", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ coated: true })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(967.68);
    });

    it("awpShutterRnr adds $0.02/sqIn", async () => {
      // SqIn=1728, addon=34.56 => 950.40+34.56=984.96
      const res = await postPricing({
        lineItems: [makeLineItem({ awpShutterRnr: true })],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(984.96);
    });
  });

  // ==============================================================
  // Combined / stacked addons
  // ==============================================================
  describe("stacked addons", () => {
    it("combines multiple addon rates correctly", async () => {
      // Eclipse(+0.01) + High Performance(+0.01) + Eyebrow(+0.02) + temperedGlass(+0.01) + wrap(+0.01)
      // Total addon rate = 0.06
      // SqIn = 3*4*144 = 1728
      // base = 1728 * 0.55 = 950.40
      // addons = 1728 * 0.06 = 103.68
      // unitPrice = 950.40 + 103.68 = 1054.08
      const res = await postPricing({
        lineItems: [
          makeLineItem({
            color: "Eclipse",
            series: "High Performance",
            function: "Eyebrow",
            temperedGlass: true,
            wrap: true,
          }),
        ],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(1054.08);
    });

    it("all boolean addons enabled at once", async () => {
      // Boolean addon rates: 0.01+0.01+0.02+0.01+0.01+0.02 = 0.08
      // SqIn=1728, base=950.40, addons=1728*0.08=138.24
      // unitPrice = 950.40+138.24 = 1088.64
      const res = await postPricing({
        lineItems: [
          makeLineItem({
            temperedGlass: true,
            obscuredGlass: true,
            customShape: true,
            wrap: true,
            coated: true,
            awpShutterRnr: true,
          }),
        ],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(1088.64);
    });

    it("all maximum addons with qty > 1", async () => {
      // Eclipse(0.01) + Signature(0.01) + NailFin(0) + DoubleVent(0.02)
      // + all booleans(0.08) = 0.12
      // SqIn=1728, base=950.40, addons=1728*0.12=207.36
      // unitPrice=1157.76, qty=2 => lineTotal=2315.52
      const res = await postPricing({
        lineItems: [
          makeLineItem({
            color: "Eclipse",
            series: "Signature",
            frame: "Nail Fin",
            function: "Double Vent",
            temperedGlass: true,
            obscuredGlass: true,
            customShape: true,
            wrap: true,
            coated: true,
            awpShutterRnr: true,
            qty: 2,
          }),
        ],
        discount: 0,
        downPayment: 0,
      });
      const data = await res.json();
      expect(data.itemPrices[0]).toBe(2315.52);
    });
  });

  // ==============================================================
  // Multiple line items
  // ==============================================================
  describe("multiple line items", () => {
    it("sums prices from two different items", async () => {
      // Item 1: 3x4, base only => 950.40
      // Item 2: 2x3, base only => 2*3*144*0.55 = 475.20
      // total = 1425.60
      const res = await postPricing({
        lineItems: [
          makeLineItem(),
          makeLineItem({ width: 2, height: 3 }),
        ],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(950.4);
      expect(data.itemPrices[1]).toBe(475.2);
      expect(data.total).toBe(1425.6);
      expect(data.contractTotal).toBe(1425.6);
      expect(data.balanceDue).toBe(1425.6);
    });

    it("handles three items with different addons", async () => {
      // Item 1: 3x4 base => 950.40
      // Item 2: 2x2 + Eclipse(+0.01) => 2*2*144 = 576 sqIn
      //         base = 576 * 0.55 = 316.80
      //         addons = 576 * 0.01 = 5.76
      //         lineTotal = 322.56
      // Item 3: 5x5, qty=2, + temperedGlass(+0.01) => 5*5*144 = 3600 sqIn
      //         base = 3600 * 0.55 = 1980.00
      //         addons = 3600 * 0.01 = 36.00
      //         unitPrice = 2016.00, qty=2 => 4032.00
      // total = 950.40 + 322.56 + 4032.00 = 5304.96
      const res = await postPricing({
        lineItems: [
          makeLineItem(),
          makeLineItem({ width: 2, height: 2, color: "Eclipse" }),
          makeLineItem({ width: 5, height: 5, qty: 2, temperedGlass: true }),
        ],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(950.4);
      expect(data.itemPrices[1]).toBe(322.56);
      expect(data.itemPrices[2]).toBe(4032);
      expect(data.total).toBe(round2(950.4 + 322.56 + 4032));
    });
  });

  // ==============================================================
  // Discount
  // ==============================================================
  describe("discount", () => {
    it("subtracts discount from total to get contractTotal", async () => {
      // total = 950.40, discount = 100 => contractTotal = 850.40
      const res = await postPricing({
        lineItems: [makeLineItem()],
        discount: 100,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.total).toBe(950.4);
      expect(data.contractTotal).toBe(850.4);
      expect(data.balanceDue).toBe(850.4);
    });

    it("discount larger than total results in negative contractTotal", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem()],
        discount: 2000,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.total).toBe(950.4);
      expect(data.contractTotal).toBe(-1049.6);
    });

    it("missing discount defaults to 0", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem()],
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.contractTotal).toBe(data.total);
    });
  });

  // ==============================================================
  // Down payment
  // ==============================================================
  describe("downPayment", () => {
    it("subtracts downPayment from contractTotal to get balanceDue", async () => {
      // total = 950.40, discount=0, contractTotal=950.40
      // downPayment=200 => balanceDue=750.40
      const res = await postPricing({
        lineItems: [makeLineItem()],
        discount: 0,
        downPayment: 200,
      });

      const data = await res.json();
      expect(data.total).toBe(950.4);
      expect(data.contractTotal).toBe(950.4);
      expect(data.balanceDue).toBe(750.4);
    });

    it("downPayment larger than contractTotal results in negative balanceDue", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem()],
        discount: 0,
        downPayment: 2000,
      });

      const data = await res.json();
      expect(data.balanceDue).toBe(950.4 - 2000);
    });

    it("missing downPayment defaults to 0", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem()],
        discount: 0,
      });

      const data = await res.json();
      expect(data.balanceDue).toBe(data.contractTotal);
    });
  });

  // ==============================================================
  // Discount AND down payment combined
  // ==============================================================
  describe("discount + downPayment combined", () => {
    it("applies discount then downPayment in sequence", async () => {
      // total = 950.40
      // discount = 50 => contractTotal = 900.40
      // downPayment = 300 => balanceDue = 600.40
      const res = await postPricing({
        lineItems: [makeLineItem()],
        discount: 50,
        downPayment: 300,
      });

      const data = await res.json();
      expect(data.total).toBe(950.4);
      expect(data.contractTotal).toBe(900.4);
      expect(data.balanceDue).toBe(600.4);
    });
  });

  // ==============================================================
  // Rounding precision
  // ==============================================================
  describe("rounding", () => {
    it("rounds line item prices to 2 decimal places", async () => {
      // Use fractional dimensions to test rounding
      // SqIn = 2.5 * 3.7 * 144 = 1332
      // base = 1332 * 0.55 = 732.60
      const res = await postPricing({
        lineItems: [makeLineItem({ width: 2.5, height: 3.7 })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      const expected = round2(2.5 * 3.7 * 144 * PRICING.baseRate);
      expect(data.itemPrices[0]).toBe(expected);
      // Verify it has at most 2 decimal places
      const decimals = data.itemPrices[0].toString().split(".")[1];
      expect(!decimals || decimals.length <= 2).toBe(true);
    });

    it("handles dimensions that produce repeating decimals", async () => {
      // 1.3 * 2.7 * 144 = 505.44
      // 505.44 * 0.55 = 277.992 => rounded to 277.99
      const sqIn = 1.3 * 2.7 * 144;
      const expectedBase = round2(sqIn * PRICING.baseRate);

      const res = await postPricing({
        lineItems: [makeLineItem({ width: 1.3, height: 2.7 })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(expectedBase);
    });
  });

  // ==============================================================
  // Comprehensive formula verification
  // ==============================================================
  describe("formula verification against constants", () => {
    it("matches manual calculation for a fully-loaded item", async () => {
      const width = 4;
      const height = 6;
      const qty = 3;

      const sqIn = width * height * 144; // 3456
      const basePrice = sqIn * PRICING.baseRate; // 3456 * 0.55 = 1900.80

      // Eclipse = 0.01, Signature = 0.01, Flush Fin = 0, Vent = 0.02
      // temperedGlass = 0.01, customShape = 0.02, coated = 0.01
      const addonRate =
        PRICING.color["Eclipse"] +
        PRICING.series["Signature"] +
        PRICING.frame["Flush Fin"] +
        PRICING.function["Vent"] +
        PRICING.booleanAddons.temperedGlass +
        PRICING.booleanAddons.customShape +
        PRICING.booleanAddons.coated;
      // 0.01 + 0.01 + 0 + 0.02 + 0.01 + 0.02 + 0.01 = 0.08

      const addonTotal = addonRate * sqIn; // 0.08 * 3456 = 276.48
      const unitPrice = basePrice + addonTotal; // 1900.80 + 276.48 = 2177.28
      const lineTotal = round2(unitPrice * qty); // 2177.28 * 3 = 6531.84

      const discount = 500;
      const downPayment = 1000;
      const contractTotal = round2(lineTotal - discount); // 6031.84
      const balanceDue = round2(contractTotal - downPayment); // 5031.84

      const res = await postPricing({
        lineItems: [
          makeLineItem({
            width,
            height,
            qty,
            color: "Eclipse",
            series: "Signature",
            frame: "Flush Fin",
            function: "Vent",
            temperedGlass: true,
            customShape: true,
            coated: true,
          }),
        ],
        discount,
        downPayment,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(lineTotal);
      expect(data.total).toBe(lineTotal);
      expect(data.contractTotal).toBe(contractTotal);
      expect(data.balanceDue).toBe(balanceDue);
    });

    it("handles Frame Over negative addon correctly", async () => {
      // Frame Over = -0.01/sqIn, effectively reduces price below pure base
      const width = 3;
      const height = 4;
      const sqIn = width * height * 144; // 1728
      const basePrice = sqIn * PRICING.baseRate; // 950.40
      const addonTotal = PRICING.frame["Frame Over"] * sqIn; // -0.01 * 1728 = -17.28
      const expected = round2(basePrice + addonTotal); // 933.12

      const res = await postPricing({
        lineItems: [makeLineItem({ frame: "Frame Over" })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(expected);
    });
  });

  // ==============================================================
  // Edge cases / unknown option values
  // ==============================================================
  describe("edge cases", () => {
    it("unknown color falls back to 0 addon (nullish coalescing)", async () => {
      // PRICING.color["UnknownColor"] is undefined, ?? 0 => 0
      const res = await postPricing({
        lineItems: [makeLineItem({ color: "UnknownColor" })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      // Same as base-only: 950.40
      expect(data.itemPrices[0]).toBe(950.4);
    });

    it("unknown series falls back to 0 addon", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ series: "UnknownSeries" })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(950.4);
    });

    it("unknown frame falls back to 0 addon", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ frame: "UnknownFrame" })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(950.4);
    });

    it("unknown function falls back to 0 addon", async () => {
      const res = await postPricing({
        lineItems: [makeLineItem({ function: "UnknownFunction" })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(950.4);
    });

    it("very large dimensions produce correct result", async () => {
      // 100ft x 100ft = huge window
      const sqIn = 100 * 100 * 144; // 1,440,000
      const expected = round2(sqIn * PRICING.baseRate); // 792,000.00

      const res = await postPricing({
        lineItems: [makeLineItem({ width: 100, height: 100 })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(expected);
    });

    it("fractional qty produces correct multiplication", async () => {
      // qty=1.5, SqIn=1728, base=950.40, lineTotal = 950.40 * 1.5 = 1425.60
      const res = await postPricing({
        lineItems: [makeLineItem({ qty: 1.5 })],
        discount: 0,
        downPayment: 0,
      });

      const data = await res.json();
      expect(data.itemPrices[0]).toBe(1425.6);
    });
  });

  // ==============================================================
  // Realistic multi-item contract scenario
  // ==============================================================
  describe("realistic contract scenario", () => {
    it("prices a full contract with multiple windows, discount, and down payment", async () => {
      // Window 1: 3x4, White/Patriot/NailFin/Slider, qty=5, temperedGlass
      //   SqIn = 1728, base = 950.40, addon = 1728*0.01 = 17.28
      //   unitPrice = 967.68, lineTotal = 967.68 * 5 = 4838.40

      // Window 2: 2x3, Eclipse/HighPerf/FlushFin/Picture, qty=3
      //   SqIn = 864, base = 864*0.55 = 475.20
      //   addon = 864 * (0.01+0.01+0+0) = 864 * 0.02 = 17.28
      //   unitPrice = 492.48, lineTotal = 492.48 * 3 = 1477.44

      // Window 3: 4x5, DarkTan/Autograph/FrameOver/DoubleVent, qty=1, customShape+wrap
      //   SqIn = 2880, base = 2880*0.55 = 1584.00
      //   addon = 2880 * (0 + 0 + (-0.01) + 0.02 + 0.02 + 0.01) = 2880 * 0.04 = 115.20
      //   unitPrice = 1699.20, lineTotal = 1699.20

      const item1Total = round2(
        (3 * 4 * 144 * (PRICING.baseRate + PRICING.booleanAddons.temperedGlass)) * 5
      );
      const item2Total = round2(
        (2 * 3 * 144 * (PRICING.baseRate + PRICING.color["Eclipse"] + PRICING.series["High Performance"])) * 3
      );
      const item3AddonRate =
        PRICING.color["Dark Tan"] +
        PRICING.series["Autograph"] +
        PRICING.frame["Frame Over"] +
        PRICING.function["Double Vent"] +
        PRICING.booleanAddons.customShape +
        PRICING.booleanAddons.wrap;
      const item3Total = round2(4 * 5 * 144 * (PRICING.baseRate + item3AddonRate) * 1);

      const total = round2(item1Total + item2Total + item3Total);
      const discount = 250;
      const downPayment = 1500;
      const contractTotal = round2(total - discount);
      const balanceDue = round2(contractTotal - downPayment);

      const res = await postPricing({
        lineItems: [
          makeLineItem({ width: 3, height: 4, qty: 5, temperedGlass: true }),
          makeLineItem({
            width: 2,
            height: 3,
            qty: 3,
            color: "Eclipse",
            series: "High Performance",
            frame: "Flush Fin",
            function: "Picture",
          }),
          makeLineItem({
            width: 4,
            height: 5,
            qty: 1,
            color: "Dark Tan",
            series: "Autograph",
            frame: "Frame Over",
            function: "Double Vent",
            customShape: true,
            wrap: true,
          }),
        ],
        discount,
        downPayment,
      });

      const data = await res.json();
      expect(data.itemPrices).toHaveLength(3);
      expect(data.itemPrices[0]).toBe(item1Total);
      expect(data.itemPrices[1]).toBe(item2Total);
      expect(data.itemPrices[2]).toBe(item3Total);
      expect(data.total).toBe(total);
      expect(data.contractTotal).toBe(contractTotal);
      expect(data.balanceDue).toBe(balanceDue);
    });
  });
});
