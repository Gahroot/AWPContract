import {
  PRODUCTS,
  PRICING,
  FORM_OPTIONS,
  OPERATIONS,
  BOOLEAN_ADDON_LABELS,
  CONTRACT_STATUSES,
  STYLE_CATEGORIES,
  CUSTOM_SHAPE_STYLES,
  getProductsByMarket,
  getProductByCode,
  getProductDisplayStyle,
  getAvailableStyles,
  getAvailableSeries,
  findProduct,
  getColorsForMarket,
  initFromProductCode,
  type Market,
  type ProductDef,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Product catalog completeness
// ---------------------------------------------------------------------------
describe("Product catalog completeness", () => {
  const allProducts = Object.values(PRODUCTS);

  it("has 75+ products total", () => {
    expect(allProducts.length).toBeGreaterThanOrEqual(75);
  });

  describe("Patriot series", () => {
    const patriotProducts = allProducts.filter((p) => p.series === "Patriot");

    it("has Patriot products", () => {
      expect(patriotProducts.length).toBeGreaterThan(0);
    });

    it("includes standard windows: SS, SH, DV, PW", () => {
      expect(getProductByCode("Patriot SS")).toBeDefined();
      expect(getProductByCode("Patriot SH")).toBeDefined();
      expect(getProductByCode("Patriot DV")).toBeDefined();
      expect(getProductByCode("Patriot PW")).toBeDefined();
    });

    it("includes shapes: RT, ET, IT, CIR, PENT, GP, OCT, TRAP", () => {
      for (const code of ["RT", "ET", "IT", "CIR", "PENT", "GP", "OCT", "TRAP"]) {
        expect(getProductByCode(`Patriot ${code}`)).toBeDefined();
      }
    });

    it("includes arch shapes: EB, ELEB, HEB, ELHEB, HR, ELHR, QR, ELQR, ATSH", () => {
      for (const code of ["EB", "ELEB", "HEB", "ELHEB", "HR", "ELHR", "QR", "ELQR", "ATSH"]) {
        expect(getProductByCode(`Patriot ${code}`)).toBeDefined();
      }
    });

    it("includes sliding glass door", () => {
      const sgd = getProductByCode("Patriot SGD");
      expect(sgd).toBeDefined();
      expect(sgd!.type).toBe("Door");
      expect(sgd!.pricingModifier).toBe(0.05);
    });
  });

  describe("High Performance series", () => {
    const hpProducts = allProducts.filter((p) => p.series === "High Performance");

    it("has HP variants of standard windows", () => {
      expect(getProductByCode("Patriot HP SS")).toBeDefined();
      expect(getProductByCode("Patriot HP SH")).toBeDefined();
      expect(getProductByCode("Patriot HP DV")).toBeDefined();
      expect(getProductByCode("Patriot HP PW")).toBeDefined();
    });

    it("all HP products have pricingModifier >= 0.01", () => {
      for (const p of hpProducts) {
        expect(p.pricingModifier).toBeGreaterThanOrEqual(0.01);
      }
    });

    it("HP shapes have pricingModifier of 0.03", () => {
      for (const code of ["Patriot HP RT", "Patriot HP ET", "Patriot HP IT", "Patriot HP CIR"]) {
        const p = getProductByCode(code);
        expect(p).toBeDefined();
        expect(p!.pricingModifier).toBe(0.03);
      }
    });
  });

  describe("Signature/Autograph series (Vancouver)", () => {
    it("has Signature standard windows", () => {
      expect(getProductByCode("SIG SS")).toBeDefined();
      expect(getProductByCode("SIG SH")).toBeDefined();
      expect(getProductByCode("SIG DV")).toBeDefined();
      expect(getProductByCode("SIG PW")).toBeDefined();
    });

    it("has Autograph standard windows", () => {
      expect(getProductByCode("AG SS")).toBeDefined();
      expect(getProductByCode("AG SH")).toBeDefined();
      expect(getProductByCode("AG DV")).toBeDefined();
      expect(getProductByCode("AG PW")).toBeDefined();
    });

    it("all Signature products have VANCOUVER market", () => {
      const sigProducts = allProducts.filter((p) => p.series === "Signature");
      for (const p of sigProducts) {
        expect(p.markets).toContain("VANCOUVER");
      }
    });

    it("all Autograph products have VANCOUVER market", () => {
      const agProducts = allProducts.filter((p) => p.series === "Autograph");
      for (const p of agProducts) {
        expect(p.markets).toContain("VANCOUVER");
      }
    });

    it("Signature SGD exists as Door", () => {
      const sgd = getProductByCode("SIG SGD");
      expect(sgd).toBeDefined();
      expect(sgd!.type).toBe("Door");
      expect(sgd!.pricingModifier).toBe(0.05);
    });
  });

  describe("Sunview series", () => {
    it("has all Sunview products", () => {
      expect(getProductByCode("Sunview SSL")).toBeDefined();
      expect(getProductByCode("Sunview SSH")).toBeDefined();
      expect(getProductByCode("Sunview SPW")).toBeDefined();
      expect(getProductByCode("Sunview SDV")).toBeDefined();
    });

    it("all Sunview products have negative pricing modifier (-0.02)", () => {
      const svProducts = allProducts.filter((p) => p.series === "Sunview");
      for (const p of svProducts) {
        expect(p.pricingModifier).toBe(-0.02);
      }
    });

    it("Sunview only in SLC and OREM markets", () => {
      const svProducts = allProducts.filter((p) => p.series === "Sunview");
      for (const p of svProducts) {
        expect(p.markets).toEqual(expect.arrayContaining(["SLC", "OREM"]));
        expect(p.markets).not.toContain("PHOENIX");
        expect(p.markets).not.toContain("VANCOUVER");
      }
    });
  });

  describe("Imperial series", () => {
    it("has Imperial Casement, Casement Picture, and Awning", () => {
      expect(getProductByCode("Imperial IC")).toBeDefined();
      expect(getProductByCode("Imperial ICP")).toBeDefined();
      expect(getProductByCode("Imperial IA")).toBeDefined();
    });

    it("all Imperial products have pricingModifier 0.03", () => {
      const impProducts = allProducts.filter((p) => p.series === "Imperial");
      for (const p of impProducts) {
        expect(p.pricingModifier).toBe(0.03);
      }
    });
  });

  describe("Legacy doors", () => {
    it("has Single Swing Door, Atrium Door, French Door", () => {
      expect(getProductByCode("Legacy SSD")).toBeDefined();
      expect(getProductByCode("Legacy ATD")).toBeDefined();
      expect(getProductByCode("Legacy FRENCH")).toBeDefined();
    });

    it("all Legacy doors are Door type", () => {
      const legacyProducts = allProducts.filter((p) => p.series === "Legacy");
      for (const p of legacyProducts) {
        expect(p.type).toBe("Door");
      }
    });

    it("Legacy doors have correct pricing modifiers", () => {
      expect(getProductByCode("Legacy SSD")!.pricingModifier).toBe(0.05);
      expect(getProductByCode("Legacy ATD")!.pricingModifier).toBe(0.06);
      expect(getProductByCode("Legacy FRENCH")!.pricingModifier).toBe(0.08);
    });
  });

  describe("Additional Patriot products", () => {
    it("has Double Hung, Double Slider, Variable Sash products", () => {
      expect(getProductByCode("Patriot DH")).toBeDefined();
      expect(getProductByCode("Patriot DS")).toBeDefined();
      expect(getProductByCode("Patriot V-P SL")).toBeDefined();
      expect(getProductByCode("Patriot O-P SH")).toBeDefined();
      expect(getProductByCode("Patriot V-P SH")).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// Every product has required fields
// ---------------------------------------------------------------------------
describe("Every product has required fields", () => {
  const allProducts = Object.values(PRODUCTS);

  it.each(allProducts.map((p) => [p.code, p]))(
    "%s has all required fields",
    (_code: string, product: ProductDef) => {
      expect(product.code).toBeTruthy();
      expect(product.name).toBeTruthy();
      expect(product.series).toBeTruthy();
      expect(product.function).toBeTruthy();
      expect(["Window", "Door"]).toContain(product.type);
      expect(product.markets.length).toBeGreaterThan(0);
      expect(product.operations.length).toBeGreaterThan(0);
      expect(product.grids.length).toBeGreaterThan(0);
      expect(product.glassTypes.length).toBeGreaterThan(0);
    },
  );
});

// ---------------------------------------------------------------------------
// getProductsByMarket
// ---------------------------------------------------------------------------
describe("getProductsByMarket", () => {
  const markets: Market[] = ["SLC", "OREM", "PHOENIX", "VANCOUVER"];

  it.each(markets)("%s returns non-empty product list", (market) => {
    const products = getProductsByMarket(market);
    expect(products.length).toBeGreaterThan(0);
  });

  it("SLC has the most products (Patriot + Sunview + Imperial + Legacy + Additional)", () => {
    const slc = getProductsByMarket("SLC");
    const phoenix = getProductsByMarket("PHOENIX");
    expect(slc.length).toBeGreaterThan(phoenix.length);
  });

  it("VANCOUVER only has Signature and Autograph products", () => {
    const vancouver = getProductsByMarket("VANCOUVER");
    const seriesSet = new Set(vancouver.map((p) => p.series));
    expect(seriesSet.size).toBe(2);
    expect(seriesSet.has("Signature")).toBe(true);
    expect(seriesSet.has("Autograph")).toBe(true);
  });

  it("PHOENIX has Patriot products but not HP shapes", () => {
    const phoenix = getProductsByMarket("PHOENIX");
    expect(phoenix.some((p) => p.code === "Patriot SS")).toBe(true);
    expect(phoenix.some((p) => p.code === "Patriot HP SS")).toBe(false);
  });

  it("all returned products actually contain the queried market", () => {
    for (const market of markets) {
      const products = getProductsByMarket(market);
      for (const p of products) {
        expect(p.markets).toContain(market);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getProductByCode
// ---------------------------------------------------------------------------
describe("getProductByCode", () => {
  it("finds existing product", () => {
    const p = getProductByCode("Patriot SS");
    expect(p).toBeDefined();
    expect(p!.name).toBe("Patriot Single Slider");
  });

  it("returns undefined for unknown code", () => {
    expect(getProductByCode("NONEXISTENT")).toBeUndefined();
  });

  it("every code in PRODUCTS is findable", () => {
    for (const code of Object.keys(PRODUCTS)) {
      expect(getProductByCode(code)).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// getProductDisplayStyle
// ---------------------------------------------------------------------------
describe("getProductDisplayStyle", () => {
  it("strips Patriot prefix and normalizes", () => {
    expect(getProductDisplayStyle(PRODUCTS["Patriot SS"])).toBe("Single Slider");
  });

  it("strips High Performance prefix", () => {
    expect(getProductDisplayStyle(PRODUCTS["Patriot HP SS"])).toBe("Single Slider");
  });

  it("normalizes Picture Window to Picture", () => {
    expect(getProductDisplayStyle(PRODUCTS["Patriot PW"])).toBe("Picture");
  });

  it("normalizes Sliding Glass Door to Sliding Door", () => {
    expect(getProductDisplayStyle(PRODUCTS["Patriot SGD"])).toBe("Sliding Door");
  });

  it("normalizes Right Triangle (L/R) to Right Triangle", () => {
    expect(getProductDisplayStyle(PRODUCTS["Patriot RT"])).toBe("Right Triangle");
  });

  it("normalizes Signature prefix products", () => {
    expect(getProductDisplayStyle(PRODUCTS["SIG SS"])).toBe("Single Slider");
    expect(getProductDisplayStyle(PRODUCTS["SIG PW"])).toBe("Picture");
  });

  it("normalizes Autograph prefix products", () => {
    expect(getProductDisplayStyle(PRODUCTS["AG SS"])).toBe("Single Slider");
    expect(getProductDisplayStyle(PRODUCTS["AG PW"])).toBe("Picture");
  });

  it("normalizes Sunview prefix products", () => {
    expect(getProductDisplayStyle(PRODUCTS["Sunview SSL"])).toBe("Single Slider");
    expect(getProductDisplayStyle(PRODUCTS["Sunview SSH"])).toBe("Single Hung");
    expect(getProductDisplayStyle(PRODUCTS["Sunview SPW"])).toBe("Picture");
  });
});

// ---------------------------------------------------------------------------
// getAvailableStyles
// ---------------------------------------------------------------------------
describe("getAvailableStyles", () => {
  it("returns grouped styles for SLC Windows", () => {
    const styles = getAvailableStyles("SLC", "Window");
    expect(styles.length).toBeGreaterThan(0);
    const allStyleNames = styles.flatMap((g) => g.styles);
    expect(allStyleNames).toContain("Single Slider");
    expect(allStyleNames).toContain("Single Hung");
    expect(allStyleNames).toContain("Picture");
    expect(allStyleNames).toContain("Double Vent");
  });

  it("returns grouped styles for SLC Doors", () => {
    const styles = getAvailableStyles("SLC", "Door");
    expect(styles.length).toBeGreaterThan(0);
    const allStyleNames = styles.flatMap((g) => g.styles);
    expect(allStyleNames).toContain("Sliding Door");
  });

  it("VANCOUVER has Signature/Autograph product styles", () => {
    const styles = getAvailableStyles("VANCOUVER", "Window");
    const allStyleNames = styles.flatMap((g) => g.styles);
    expect(allStyleNames).toContain("Single Slider");
    expect(allStyleNames).toContain("Single Hung");
  });

  it("returns correct categories", () => {
    const styles = getAvailableStyles("SLC", "Window");
    const categories = styles.map((g) => g.category);
    expect(categories).toContain("Standard");
  });

  it("SLC Windows has Additional category with specialty products", () => {
    const styles = getAvailableStyles("SLC", "Window");
    const additional = styles.find((g) => g.category === "Additional");
    expect(additional).toBeDefined();
    expect(additional!.styles).toContain("Double Hung");
    expect(additional!.styles).toContain("Double Slider");
  });

  it("SLC Windows has Arch Shapes", () => {
    const styles = getAvailableStyles("SLC", "Window");
    const arches = styles.find((g) => g.category === "Arch Shapes");
    expect(arches).toBeDefined();
    expect(arches!.styles.length).toBeGreaterThan(0);
  });

  it("SLC Windows has Other Shapes", () => {
    const styles = getAvailableStyles("SLC", "Window");
    const shapes = styles.find((g) => g.category === "Other Shapes");
    expect(shapes).toBeDefined();
    expect(shapes!.styles).toContain("Right Triangle");
  });
});

// ---------------------------------------------------------------------------
// getAvailableSeries
// ---------------------------------------------------------------------------
describe("getAvailableSeries", () => {
  it("SLC Single Slider has Patriot and High Performance", () => {
    const series = getAvailableSeries("SLC", "Window", "Single Slider");
    const values = series.map((s) => s.value);
    expect(values).toContain("Patriot");
    expect(values).toContain("High Performance");
  });

  it("VANCOUVER Single Slider has Signature and Autograph", () => {
    const series = getAvailableSeries("VANCOUVER", "Window", "Single Slider");
    const values = series.map((s) => s.value);
    expect(values).toContain("Signature");
    expect(values).toContain("Autograph");
  });

  it("SLC Casement has Imperial only", () => {
    const series = getAvailableSeries("SLC", "Window", "Casement");
    const values = series.map((s) => s.value);
    expect(values).toContain("Imperial");
    expect(values).not.toContain("Patriot");
  });

  it("returns empty for nonexistent style", () => {
    const series = getAvailableSeries("SLC", "Window", "Nonexistent Style");
    expect(series).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// findProduct
// ---------------------------------------------------------------------------
describe("findProduct", () => {
  it("finds exact product by market+type+style+series", () => {
    const p = findProduct("SLC", "Window", "Single Slider", "Patriot");
    expect(p).toBeDefined();
    expect(p!.code).toBe("Patriot SS");
  });

  it("finds HP variant", () => {
    const p = findProduct("SLC", "Window", "Single Slider", "High Performance");
    expect(p).toBeDefined();
    expect(p!.code).toBe("Patriot HP SS");
  });

  it("finds Vancouver Signature product", () => {
    const p = findProduct("VANCOUVER", "Window", "Single Slider", "Signature");
    expect(p).toBeDefined();
    expect(p!.code).toBe("SIG SS");
  });

  it("finds Vancouver Autograph product", () => {
    const p = findProduct("VANCOUVER", "Window", "Single Slider", "Autograph");
    expect(p).toBeDefined();
    expect(p!.code).toBe("AG SS");
  });

  it("returns undefined for wrong market+series combo", () => {
    const p = findProduct("PHOENIX", "Window", "Single Slider", "Signature");
    expect(p).toBeUndefined();
  });

  it("returns undefined for nonexistent combo", () => {
    const p = findProduct("SLC", "Door", "Single Slider", "Patriot");
    expect(p).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getColorsForMarket
// ---------------------------------------------------------------------------
describe("getColorsForMarket", () => {
  it("SLC has 5 exterior colors", () => {
    const colors = getColorsForMarket("SLC");
    expect(colors).toHaveLength(5);
    expect(colors).toContain("White");
    expect(colors).toContain("Black");
    expect(colors).toContain("Bronze");
  });

  it("PHOENIX has 3 exterior colors (no Black or Bronze)", () => {
    const colors = getColorsForMarket("PHOENIX");
    expect(colors).toHaveLength(3);
    expect(colors).not.toContain("Black");
    expect(colors).not.toContain("Bronze");
  });

  it("VANCOUVER has Eclipse (Black on Black)", () => {
    const colors = getColorsForMarket("VANCOUVER");
    expect(colors).toContain("Eclipse (Black on Black)");
  });

  it("returns a fresh copy (not the original array)", () => {
    const colors1 = getColorsForMarket("SLC");
    const colors2 = getColorsForMarket("SLC");
    expect(colors1).not.toBe(colors2);
    expect(colors1).toEqual(colors2);
  });
});

// ---------------------------------------------------------------------------
// initFromProductCode
// ---------------------------------------------------------------------------
describe("initFromProductCode", () => {
  it("returns displayStyle and series for valid code", () => {
    const result = initFromProductCode("Patriot SS");
    expect(result).not.toBeNull();
    expect(result!.displayStyle).toBe("Single Slider");
    expect(result!.series).toBe("Patriot");
  });

  it("returns null for unknown code", () => {
    expect(initFromProductCode("FAKE CODE")).toBeNull();
  });

  it("works for every product in catalog", () => {
    for (const [code, product] of Object.entries(PRODUCTS)) {
      const result = initFromProductCode(code);
      expect(result).not.toBeNull();
      expect(result!.series).toBe(product.series);
    }
  });
});

// ---------------------------------------------------------------------------
// CUSTOM_SHAPE_STYLES
// ---------------------------------------------------------------------------
describe("CUSTOM_SHAPE_STYLES", () => {
  it("includes all Arch Shapes", () => {
    for (const style of STYLE_CATEGORIES["Arch Shapes"]) {
      expect(CUSTOM_SHAPE_STYLES.has(style)).toBe(true);
    }
  });

  it("includes all Other Shapes", () => {
    for (const style of STYLE_CATEGORIES["Other Shapes"]) {
      expect(CUSTOM_SHAPE_STYLES.has(style)).toBe(true);
    }
  });

  it("does not include Standard styles", () => {
    for (const style of STYLE_CATEGORIES["Standard"]) {
      expect(CUSTOM_SHAPE_STYLES.has(style)).toBe(false);
    }
  });

  it("does not include Doors", () => {
    for (const style of STYLE_CATEGORIES["Doors"]) {
      expect(CUSTOM_SHAPE_STYLES.has(style)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// PRICING constants exhaustive checks
// ---------------------------------------------------------------------------
describe("PRICING constants exhaustive", () => {
  describe("operation pricing", () => {
    it("has all 14 operation keys", () => {
      const ops = Object.keys(OPERATIONS);
      for (const op of ops) {
        expect(PRICING.operation[op]).toBeDefined();
      }
    });

    it("XO and OX are free (0)", () => {
      expect(PRICING.operation["XO"]).toBe(0);
      expect(PRICING.operation["OX"]).toBe(0);
    });

    it("XOXXOO is most expensive (0.04)", () => {
      expect(PRICING.operation["XOXXOO"]).toBe(0.04);
    });

    it("OXXO is 0.03", () => {
      expect(PRICING.operation["OXXO"]).toBe(0.03);
    });
  });

  describe("gridType pricing", () => {
    it("STD GRID is free", () => {
      expect(PRICING.gridType["STD GRID"]).toBe(0);
    });

    it("CNT GRID adds 0.01", () => {
      expect(PRICING.gridType["CNT GRID"]).toBe(0.01);
    });

    it("KE Grid adds 0.02", () => {
      expect(PRICING.gridType["KE Grid"]).toBe(0.02);
    });
  });

  describe("glassType pricing", () => {
    it("LoE-366 is free", () => {
      expect(PRICING.glassType["LoE-366"]).toBe(0);
    });

    it("LoE-i89 adds 0.01", () => {
      expect(PRICING.glassType["LoE-i89"]).toBe(0.01);
    });

    it("Quad LoE-452+ adds 0.02", () => {
      expect(PRICING.glassType["Quad LoE-452+"]).toBe(0.02);
    });

    it("Low-E is free", () => {
      expect(PRICING.glassType["Low-E"]).toBe(0);
    });

    it("Low-E+ adds 0.01", () => {
      expect(PRICING.glassType["Low-E+"]).toBe(0.01);
    });

    it("STD is free", () => {
      expect(PRICING.glassType["STD"]).toBe(0);
    });
  });

  describe("series pricing completeness", () => {
    it("covers all FORM_OPTIONS.series", () => {
      for (const s of FORM_OPTIONS.series) {
        expect(PRICING.series[s]).toBeDefined();
      }
    });

    it("Sunview is negative (-0.02)", () => {
      expect(PRICING.series["Sunview"]).toBe(-0.02);
    });

    it("Imperial is 0.03", () => {
      expect(PRICING.series["Imperial"]).toBe(0.03);
    });

    it("Legacy is 0.05", () => {
      expect(PRICING.series["Legacy"]).toBe(0.05);
    });
  });

  describe("function pricing completeness", () => {
    it("has pricing for standard window functions", () => {
      // These are the functions that MUST have explicit pricing entries
      const expectedFunctions = [
        "Slider", "Picture", "Eyebrow", "Vent", "Double Vent",
        "Single Hung", "Double Hung", "Double Slider",
        "Casement", "Awning",
        "Triangle", "Circle", "Pentagon", "Gable Pentagon",
        "Octagon", "Trapezoid", "Half Round", "Extended Leg Half Round",
        "Quarter Round", "Extended Leg Quarter Round", "Arch Top Single Hung",
      ];
      for (const fn of expectedFunctions) {
        expect(PRICING.function[fn]).toBeDefined();
      }
    });

    it("functions not in PRICING fallback to 0 via ?? operator", () => {
      // "Single Slider", "Swing Door", "French Door", "Sliding Door"
      // are in FORM_OPTIONS but not in PRICING - they fallback to 0
      const fallbackFunctions = ["Single Slider", "Swing Door", "French Door", "Sliding Door"];
      for (const fn of fallbackFunctions) {
        expect(PRICING.function[fn]).toBeUndefined();
      }
    });
  });
});

// ---------------------------------------------------------------------------
// FORM_OPTIONS completeness
// ---------------------------------------------------------------------------
describe("FORM_OPTIONS completeness", () => {
  it("has 5 item types", () => {
    expect(FORM_OPTIONS.type).toEqual(["Window", "Door", "IG", "Pet Door", "Storm"]);
  });

  it("has 7 colors", () => {
    expect(FORM_OPTIONS.color).toHaveLength(7);
  });

  it("has 7 series", () => {
    expect(FORM_OPTIONS.series).toHaveLength(7);
  });

  it("has 3 frame options", () => {
    expect(FORM_OPTIONS.frame).toEqual(["Nail Fin", "Flush Fin", "Frame Over"]);
  });

  it("has 24+ function options including door types", () => {
    expect(FORM_OPTIONS.function.length).toBeGreaterThanOrEqual(24);
  });

  it("has all 14 operations", () => {
    expect(FORM_OPTIONS.operations).toHaveLength(14);
  });

  it("has 3 grid types", () => {
    expect(FORM_OPTIONS.gridTypes).toHaveLength(3);
  });

  it("has 6 glass types", () => {
    expect(FORM_OPTIONS.glassTypes).toHaveLength(6);
  });

  it("has 5 house types", () => {
    expect(FORM_OPTIONS.houseType).toEqual(["Brick", "Siding", "Wood", "Stucco", "Foundation"]);
  });

  it("has 5 payment methods", () => {
    expect(FORM_OPTIONS.paymentMethod).toHaveLength(5);
  });

  it("has 7 marketing sources", () => {
    expect(FORM_OPTIONS.marketingSource).toHaveLength(7);
  });

  it("has 14 addendum product types", () => {
    expect(FORM_OPTIONS.addendumProductTypes).toHaveLength(14);
  });

  it("has 5 interior colors", () => {
    expect(FORM_OPTIONS.interiorColors).toHaveLength(5);
  });

  it("has 6 exterior colors", () => {
    expect(FORM_OPTIONS.exteriorColors).toHaveLength(6);
  });

  it("has 3 preferred communication options", () => {
    expect(FORM_OPTIONS.preferredCommunication).toEqual(["Phone", "Text", "Email"]);
  });

  it("has 4 financing options", () => {
    expect(FORM_OPTIONS.financingOption).toEqual(["Wells Fargo", "EnerBank", "Synchrony", "Other"]);
  });

  it("has 5 windows being removed types", () => {
    expect(FORM_OPTIONS.windowsBeingRemoved).toHaveLength(5);
  });

  it("has 5 down payment methods", () => {
    expect(FORM_OPTIONS.downPaymentMethod).toHaveLength(5);
  });

  it("has 12 US western states", () => {
    expect(FORM_OPTIONS.states).toHaveLength(12);
    expect(FORM_OPTIONS.states).toContain("UT");
    expect(FORM_OPTIONS.states).toContain("AZ");
    expect(FORM_OPTIONS.states).toContain("CA");
  });
});

// ---------------------------------------------------------------------------
// CONTRACT_STATUSES
// ---------------------------------------------------------------------------
describe("CONTRACT_STATUSES", () => {
  it("has all 4 statuses", () => {
    expect(CONTRACT_STATUSES.DRAFT).toBeDefined();
    expect(CONTRACT_STATUSES.PENDING_SIGNATURE).toBeDefined();
    expect(CONTRACT_STATUSES.SIGNED).toBeDefined();
    expect(CONTRACT_STATUSES.COMPLETED).toBeDefined();
  });

  it("each status has label and color", () => {
    for (const status of Object.values(CONTRACT_STATUSES)) {
      expect(status.label).toBeTruthy();
      expect(status.color).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// BOOLEAN_ADDON_LABELS
// ---------------------------------------------------------------------------
describe("BOOLEAN_ADDON_LABELS", () => {
  it("has labels for all 6 boolean addons", () => {
    expect(BOOLEAN_ADDON_LABELS.temperedGlass).toBe("Tempered");
    expect(BOOLEAN_ADDON_LABELS.obscuredGlass).toBe("Obscured");
    expect(BOOLEAN_ADDON_LABELS.customShape).toBe("Custom Shape");
    expect(BOOLEAN_ADDON_LABELS.wrap).toBe("Wrap");
    expect(BOOLEAN_ADDON_LABELS.coated).toBe("Coated");
    expect(BOOLEAN_ADDON_LABELS.awpShutterRnr).toBe("Shutter RNR");
  });
});
