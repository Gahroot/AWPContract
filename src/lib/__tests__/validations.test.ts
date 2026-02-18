import {
  lineItemSchema,
  salesContractDraftSchema,
  salesContractSubmitSchema,
  addendumSchema,
  changeOrderSchema,
} from "@/lib/validations";

// ---------------------------------------------------------------------------
// lineItemSchema
// ---------------------------------------------------------------------------
describe("lineItemSchema", () => {
  it("accepts a valid complete line item", () => {
    const input = {
      id: "item-1",
      location: "Kitchen",
      type: "Window",
      qty: 3,
      width: 36,
      height: 48,
      color: "Bronze",
      series: "Commander",
      frame: "Block",
      function: "Single Hung",
      temperedGlass: true,
      obscuredGlass: false,
      customShape: false,
      wrap: true,
      coated: false,
      awpShutterRnr: false,
      price: 250.5,
      sortOrder: 2,
    };

    const result = lineItemSchema.parse(input);

    expect(result).toMatchObject(input);
  });

  it("applies default values when fields are omitted", () => {
    const result = lineItemSchema.parse({});

    expect(result.qty).toBe(1);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
    expect(result.color).toBe("White");
    expect(result.series).toBe("");
    expect(result.frame).toBe("Nail Fin");
    expect(result.function).toBe("");
    expect(result.temperedGlass).toBe(false);
    expect(result.obscuredGlass).toBe(false);
    expect(result.customShape).toBe(false);
    expect(result.wrap).toBe(false);
    expect(result.coated).toBe(false);
    expect(result.awpShutterRnr).toBe(false);
    expect(result.price).toBe(0);
    expect(result.sortOrder).toBe(0);
    expect(result.type).toBe("Window");
  });

  it("coerces string values to numbers for qty, width, height, price, sortOrder", () => {
    const result = lineItemSchema.parse({
      qty: "5",
      width: "36.5",
      height: "48.25",
      price: "199.99",
      sortOrder: "3",
    });

    expect(result.qty).toBe(5);
    expect(result.width).toBe(36.5);
    expect(result.height).toBe(48.25);
    expect(result.price).toBe(199.99);
    expect(result.sortOrder).toBe(3);
  });

  it("rejects qty of 0 (minimum is 1)", () => {
    const result = lineItemSchema.safeParse({ qty: 0 });

    expect(result.success).toBe(false);
  });

  it("rejects negative qty", () => {
    const result = lineItemSchema.safeParse({ qty: -1 });

    expect(result.success).toBe(false);
  });

  it("accepts qty of exactly 1", () => {
    const result = lineItemSchema.parse({ qty: 1 });

    expect(result.qty).toBe(1);
  });

  it("rejects negative width", () => {
    const result = lineItemSchema.safeParse({ width: -1 });

    expect(result.success).toBe(false);
  });

  it("rejects negative height", () => {
    const result = lineItemSchema.safeParse({ height: -5 });

    expect(result.success).toBe(false);
  });

  it("accepts width of 0", () => {
    const result = lineItemSchema.parse({ width: 0 });

    expect(result.width).toBe(0);
  });

  it("accepts height of 0", () => {
    const result = lineItemSchema.parse({ height: 0 });

    expect(result.height).toBe(0);
  });

  it("allows id to be optional (undefined)", () => {
    const result = lineItemSchema.parse({});

    expect(result.id).toBeUndefined();
  });

  it("accepts a valid id string", () => {
    const result = lineItemSchema.parse({ id: "abc-123" });

    expect(result.id).toBe("abc-123");
  });

  it("allows location to be optional (undefined)", () => {
    const result = lineItemSchema.parse({});

    expect(result.location).toBeUndefined();
  });

  it("accepts a valid location string", () => {
    const result = lineItemSchema.parse({ location: "Master Bedroom" });

    expect(result.location).toBe("Master Bedroom");
  });
});

// ---------------------------------------------------------------------------
// salesContractDraftSchema
// ---------------------------------------------------------------------------
describe("salesContractDraftSchema", () => {
  it("accepts an empty object (everything optional for drafts)", () => {
    const result = salesContractDraftSchema.parse({});

    expect(result).toBeDefined();
    expect(result.lineItems).toEqual([]);
    expect(result.discount).toBe(0);
    expect(result.downPayment).toBe(0);
    expect(result.financeBalance).toBe(0);
  });

  it("accepts a valid complete draft", () => {
    const input = {
      customerName: "John Doe",
      customerPhone: "555-1234",
      customerPhoneAlt: "555-5678",
      customerEmail: "john@example.com",
      jobAddress: "123 Main St",
      billingAddress: "456 Oak Ave",
      customerCity: "Springfield",
      customerZip: "12345",
      salesman: "Jane Smith",
      measurementDate: "2026-01-15",
      leadTest: "Negative",
      yearBuilt: "1990",
      houseType: "Single Family",
      lineItems: [{ qty: 2, width: 36, height: 48 }],
      discount: 100,
      downPayment: 500,
      financeBalance: 2000,
      wfebAccount: "WF-123",
      planNumber: "PLAN-A",
      authNumber: "AUTH-001",
      marketingSource: ["Website", "Referral"],
      paymentMethod: "Credit Card",
      measurementNotes: "Access from back yard",
      contractorSignature: "data:image/png;base64,abc",
      contractorSignatureDate: "2026-01-15",
      customerSignature: "data:image/png;base64,xyz",
      customerSignatureDate: "2026-01-15",
      authorizedSignature: "data:image/png;base64,def",
      authorizedSignatureDate: "2026-01-15",
      status: "draft",
    };

    const result = salesContractDraftSchema.parse(input);

    expect(result.customerName).toBe("John Doe");
    expect(result.customerEmail).toBe("john@example.com");
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0].qty).toBe(2);
    expect(result.discount).toBe(100);
    expect(result.marketingSource).toEqual(["Website", "Referral"]);
    expect(result.status).toBe("draft");
  });

  it("accepts a valid email address", () => {
    const result = salesContractDraftSchema.parse({
      customerEmail: "user@example.com",
    });

    expect(result.customerEmail).toBe("user@example.com");
  });

  it("rejects an invalid email address", () => {
    const result = salesContractDraftSchema.safeParse({
      customerEmail: "not-an-email",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an empty string for email (allows clearing the field)", () => {
    const result = salesContractDraftSchema.parse({
      customerEmail: "",
    });

    expect(result.customerEmail).toBe("");
  });

  it("defaults lineItems to an empty array when omitted", () => {
    const result = salesContractDraftSchema.parse({});

    expect(result.lineItems).toEqual([]);
    expect(Array.isArray(result.lineItems)).toBe(true);
  });

  it("coerces string values to numbers for discount, downPayment, financeBalance", () => {
    const result = salesContractDraftSchema.parse({
      discount: "50.5",
      downPayment: "1000",
      financeBalance: "3500.75",
    });

    expect(result.discount).toBe(50.5);
    expect(result.downPayment).toBe(1000);
    expect(result.financeBalance).toBe(3500.75);
  });

  it("rejects negative discount", () => {
    const result = salesContractDraftSchema.safeParse({ discount: -10 });

    expect(result.success).toBe(false);
  });

  it("rejects negative downPayment", () => {
    const result = salesContractDraftSchema.safeParse({ downPayment: -1 });

    expect(result.success).toBe(false);
  });

  it("rejects negative financeBalance", () => {
    const result = salesContractDraftSchema.safeParse({ financeBalance: -100 });

    expect(result.success).toBe(false);
  });

  it("accepts undefined for all optional fields", () => {
    const result = salesContractDraftSchema.parse({
      customerName: undefined,
      customerPhone: undefined,
      customerPhoneAlt: undefined,
      customerEmail: undefined,
      jobAddress: undefined,
      billingAddress: undefined,
      customerCity: undefined,
      customerZip: undefined,
      salesman: undefined,
      measurementDate: undefined,
      leadTest: undefined,
      yearBuilt: undefined,
      houseType: undefined,
      wfebAccount: undefined,
      planNumber: undefined,
      authNumber: undefined,
      marketingSource: undefined,
      paymentMethod: undefined,
      measurementNotes: undefined,
      contractorSignature: undefined,
      contractorSignatureDate: undefined,
      customerSignature: undefined,
      customerSignatureDate: undefined,
      authorizedSignature: undefined,
      authorizedSignatureDate: undefined,
      status: undefined,
    });

    expect(result.customerName).toBeUndefined();
    expect(result.customerPhone).toBeUndefined();
    expect(result.customerEmail).toBeUndefined();
    expect(result.jobAddress).toBeUndefined();
    expect(result.salesman).toBeUndefined();
    expect(result.status).toBeUndefined();
  });

  it("applies line item defaults within nested lineItems", () => {
    const result = salesContractDraftSchema.parse({
      lineItems: [{}],
    });

    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0].qty).toBe(1);
    expect(result.lineItems[0].width).toBe(0);
    expect(result.lineItems[0].height).toBe(0);
    expect(result.lineItems[0].color).toBe("White");
    expect(result.lineItems[0].series).toBe("");
  });
});

// ---------------------------------------------------------------------------
// salesContractSubmitSchema
// ---------------------------------------------------------------------------
describe("salesContractSubmitSchema", () => {
  const validSubmission = {
    customerName: "John Doe",
    customerSignature: "data:image/png;base64,signaturedata",
    customerSignatureDate: "2026-01-15",
    contractorSignature: "data:image/png;base64,contractorsig",
    lineItems: [{ qty: 2, width: 36, height: 48 }],
  };

  it("accepts a valid complete submission", () => {
    const result = salesContractSubmitSchema.parse(validSubmission);

    expect(result.customerName).toBe("John Doe");
    expect(result.customerSignature).toBe(
      "data:image/png;base64,signaturedata"
    );
    expect(result.customerSignatureDate).toBe("2026-01-15");
    expect(result.contractorSignature).toBe(
      "data:image/png;base64,contractorsig"
    );
    expect(result.lineItems).toHaveLength(1);
  });

  it("extends draft schema - optional fields remain optional", () => {
    const result = salesContractSubmitSchema.parse(validSubmission);

    // These should still be optional / have defaults
    expect(result.customerPhone).toBeUndefined();
    expect(result.jobAddress).toBeUndefined();
    expect(result.discount).toBe(0);
    expect(result.downPayment).toBe(0);
    expect(result.status).toBeUndefined();
  });

  it("requires customerName (empty string fails)", () => {
    const result = salesContractSubmitSchema.safeParse({
      ...validSubmission,
      customerName: "",
    });

    expect(result.success).toBe(false);
  });

  it("requires customerName (undefined fails)", () => {
    const { customerName: _customerName, ...rest } = validSubmission;
    const result = salesContractSubmitSchema.safeParse(rest);

    expect(result.success).toBe(false);
  });

  it("requires customerSignature (empty string fails)", () => {
    const result = salesContractSubmitSchema.safeParse({
      ...validSubmission,
      customerSignature: "",
    });

    expect(result.success).toBe(false);
  });

  it("requires customerSignature (undefined fails)", () => {
    const { customerSignature: _customerSignature, ...rest } = validSubmission;
    const result = salesContractSubmitSchema.safeParse(rest);

    expect(result.success).toBe(false);
  });

  it("requires customerSignatureDate (empty string fails)", () => {
    const result = salesContractSubmitSchema.safeParse({
      ...validSubmission,
      customerSignatureDate: "",
    });

    expect(result.success).toBe(false);
  });

  it("requires customerSignatureDate (undefined fails)", () => {
    const { customerSignatureDate: _customerSignatureDate, ...rest } = validSubmission;
    const result = salesContractSubmitSchema.safeParse(rest);

    expect(result.success).toBe(false);
  });

  it("requires contractorSignature (empty string fails)", () => {
    const result = salesContractSubmitSchema.safeParse({
      ...validSubmission,
      contractorSignature: "",
    });

    expect(result.success).toBe(false);
  });

  it("requires contractorSignature (undefined fails)", () => {
    const { contractorSignature: _contractorSignature, ...rest } = validSubmission;
    const result = salesContractSubmitSchema.safeParse(rest);

    expect(result.success).toBe(false);
  });

  it("requires at least 1 line item", () => {
    const result = salesContractSubmitSchema.parse({
      ...validSubmission,
      lineItems: [{ qty: 1, width: 24, height: 36 }],
    });

    expect(result.lineItems).toHaveLength(1);
  });

  it("rejects empty lineItems array", () => {
    const result = salesContractSubmitSchema.safeParse({
      ...validSubmission,
      lineItems: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing lineItems entirely", () => {
    const { lineItems: _lineItems, ...rest } = validSubmission;
    const result = salesContractSubmitSchema.safeParse(rest);

    // Without lineItems the default from draft is [] which is < min(1)
    expect(result.success).toBe(false);
  });

  it("accepts multiple line items", () => {
    const result = salesContractSubmitSchema.parse({
      ...validSubmission,
      lineItems: [
        { qty: 1, width: 24, height: 36 },
        { qty: 3, width: 48, height: 60 },
        { qty: 2, width: 30, height: 42 },
      ],
    });

    expect(result.lineItems).toHaveLength(3);
  });

  it("still validates line item contents (rejects invalid line items)", () => {
    const result = salesContractSubmitSchema.safeParse({
      ...validSubmission,
      lineItems: [{ qty: 0, width: -1 }],
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// addendumSchema
// ---------------------------------------------------------------------------
describe("addendumSchema", () => {
  it("accepts a valid addendum with required contractId", () => {
    const result = addendumSchema.parse({
      contractId: "contract-123",
    });

    expect(result.contractId).toBe("contract-123");
  });

  it("requires contractId (empty string fails min length 1)", () => {
    const result = addendumSchema.safeParse({
      contractId: "",
    });

    expect(result.success).toBe(false);
  });

  it("requires contractId (missing field fails)", () => {
    const result = addendumSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("accepts products array with valid nested objects", () => {
    const result = addendumSchema.parse({
      contractId: "c-1",
      products: [
        { type: "Window", qty: 2, width: 36, height: 48, notes: "East wall" },
        { type: "Door", qty: 1, width: 72, height: 80 },
      ],
    });

    expect(result.products).toHaveLength(2);
    expect(result.products![0].type).toBe("Window");
    expect(result.products![0].qty).toBe(2);
    expect(result.products![0].width).toBe(36);
    expect(result.products![0].height).toBe(48);
    expect(result.products![0].notes).toBe("East wall");
    expect(result.products![1].notes).toBeUndefined();
  });

  it("allows products to be optional", () => {
    const result = addendumSchema.parse({
      contractId: "c-1",
    });

    expect(result.products).toBeUndefined();
  });

  it("validates nested product objects - type is required", () => {
    const result = addendumSchema.safeParse({
      contractId: "c-1",
      products: [{ qty: 1 }], // missing type
    });

    expect(result.success).toBe(false);
  });

  it("applies defaults for product qty, width, height", () => {
    const result = addendumSchema.parse({
      contractId: "c-1",
      products: [{ type: "Window" }],
    });

    expect(result.products![0].qty).toBe(0);
    expect(result.products![0].width).toBe(0);
    expect(result.products![0].height).toBe(0);
  });

  it("coerces string values in nested product objects", () => {
    const result = addendumSchema.parse({
      contractId: "c-1",
      products: [{ type: "Window", qty: "3", width: "24.5", height: "36" }],
    });

    expect(result.products![0].qty).toBe(3);
    expect(result.products![0].width).toBe(24.5);
    expect(result.products![0].height).toBe(36);
  });

  it("rejects negative qty in product objects", () => {
    const result = addendumSchema.safeParse({
      contractId: "c-1",
      products: [{ type: "Window", qty: -1 }],
    });

    expect(result.success).toBe(false);
  });

  it("defaults all boolean install flags to false", () => {
    const result = addendumSchema.parse({
      contractId: "c-1",
    });

    expect(result.installRemoveOld).toBe(false);
    expect(result.installHaulAway).toBe(false);
    expect(result.installInteriorTrim).toBe(false);
    expect(result.installExteriorTrim).toBe(false);
    expect(result.installCaulkSeal).toBe(false);
    expect(result.installScreens).toBe(false);
    expect(result.installHardware).toBe(false);
    expect(result.installWeatherstrip).toBe(false);
    expect(result.installCleanup).toBe(false);
    expect(result.installOther).toBe(false);
  });

  it("defaults all acknowledgment booleans to false", () => {
    const result = addendumSchema.parse({
      contractId: "c-1",
    });

    expect(result.ackMeasurements).toBe(false);
    expect(result.ackSpecifications).toBe(false);
    expect(result.ackPricing).toBe(false);
    expect(result.ackTerms).toBe(false);
  });

  it("accepts install flags set to true", () => {
    const result = addendumSchema.parse({
      contractId: "c-1",
      installRemoveOld: true,
      installHaulAway: true,
      installInteriorTrim: true,
      installExteriorTrim: true,
      installCaulkSeal: true,
      installScreens: true,
      installHardware: true,
      installWeatherstrip: true,
      installCleanup: true,
      installOther: true,
    });

    expect(result.installRemoveOld).toBe(true);
    expect(result.installHaulAway).toBe(true);
    expect(result.installInteriorTrim).toBe(true);
    expect(result.installExteriorTrim).toBe(true);
    expect(result.installCaulkSeal).toBe(true);
    expect(result.installScreens).toBe(true);
    expect(result.installHardware).toBe(true);
    expect(result.installWeatherstrip).toBe(true);
    expect(result.installCleanup).toBe(true);
    expect(result.installOther).toBe(true);
  });

  it("allows optional signatures", () => {
    const result = addendumSchema.parse({
      contractId: "c-1",
    });

    expect(result.customerSignature).toBeUndefined();
    expect(result.customerSignatureDate).toBeUndefined();
    expect(result.contractorSignature).toBeUndefined();
    expect(result.contractorSignatureDate).toBeUndefined();
  });

  it("accepts provided signatures", () => {
    const result = addendumSchema.parse({
      contractId: "c-1",
      customerSignature: "data:image/png;base64,custsig",
      customerSignatureDate: "2026-02-01",
      contractorSignature: "data:image/png;base64,contsig",
      contractorSignatureDate: "2026-02-01",
    });

    expect(result.customerSignature).toBe("data:image/png;base64,custsig");
    expect(result.contractorSignature).toBe("data:image/png;base64,contsig");
  });

  it("allows optional string fields (colors, notes, etc.)", () => {
    const result = addendumSchema.parse({
      contractId: "c-1",
    });

    expect(result.interiorColor).toBeUndefined();
    expect(result.exteriorColor).toBeUndefined();
    expect(result.colorDescription).toBeUndefined();
    expect(result.installNotes).toBeUndefined();
    expect(result.ackInitials).toBeUndefined();
    expect(result.referralName).toBeUndefined();
    expect(result.referralPhone).toBeUndefined();
    expect(result.notes).toBeUndefined();
  });

  it("accepts a fully populated addendum", () => {
    const input = {
      contractId: "c-full",
      products: [{ type: "Slider", qty: 1, width: 48, height: 36, notes: "Replace existing" }],
      interiorColor: "White",
      exteriorColor: "Bronze",
      colorDescription: "Two-tone",
      installRemoveOld: true,
      installHaulAway: true,
      installInteriorTrim: false,
      installExteriorTrim: false,
      installCaulkSeal: true,
      installScreens: true,
      installHardware: false,
      installWeatherstrip: false,
      installCleanup: true,
      installOther: false,
      installNotes: "Special instructions",
      ackMeasurements: true,
      ackSpecifications: true,
      ackPricing: true,
      ackTerms: true,
      ackInitials: "JD",
      referralName: "Bob Smith",
      referralPhone: "555-9999",
      notes: "Priority install",
      customerSignature: "sig1",
      customerSignatureDate: "2026-02-01",
      contractorSignature: "sig2",
      contractorSignatureDate: "2026-02-01",
    };

    const result = addendumSchema.parse(input);

    expect(result.contractId).toBe("c-full");
    expect(result.products).toHaveLength(1);
    expect(result.interiorColor).toBe("White");
    expect(result.installRemoveOld).toBe(true);
    expect(result.ackMeasurements).toBe(true);
    expect(result.referralName).toBe("Bob Smith");
  });
});

// ---------------------------------------------------------------------------
// changeOrderSchema
// ---------------------------------------------------------------------------
describe("changeOrderSchema", () => {
  const validChangeOrder = {
    contractId: "contract-456",
    changesDescription: "Replace 2 windows with larger size",
  };

  it("accepts a valid change order with required fields only", () => {
    const result = changeOrderSchema.parse(validChangeOrder);

    expect(result.contractId).toBe("contract-456");
    expect(result.changesDescription).toBe(
      "Replace 2 windows with larger size"
    );
    expect(result.priceChangeType).toBe("no_change");
    expect(result.priceChangeAmount).toBe(0);
  });

  it("requires contractId (missing fails)", () => {
    const result = changeOrderSchema.safeParse({
      changesDescription: "Some change",
    });

    expect(result.success).toBe(false);
  });

  it("requires contractId (empty string fails min length 1)", () => {
    const result = changeOrderSchema.safeParse({
      contractId: "",
      changesDescription: "Some change",
    });

    expect(result.success).toBe(false);
  });

  it("requires changesDescription (missing fails)", () => {
    const result = changeOrderSchema.safeParse({
      contractId: "c-1",
    });

    expect(result.success).toBe(false);
  });

  it("requires changesDescription (empty string fails min length 1)", () => {
    const result = changeOrderSchema.safeParse({
      contractId: "c-1",
      changesDescription: "",
    });

    expect(result.success).toBe(false);
  });

  it('accepts priceChangeType "no_change"', () => {
    const result = changeOrderSchema.parse({
      ...validChangeOrder,
      priceChangeType: "no_change",
    });

    expect(result.priceChangeType).toBe("no_change");
  });

  it('accepts priceChangeType "increase"', () => {
    const result = changeOrderSchema.parse({
      ...validChangeOrder,
      priceChangeType: "increase",
    });

    expect(result.priceChangeType).toBe("increase");
  });

  it('accepts priceChangeType "decrease"', () => {
    const result = changeOrderSchema.parse({
      ...validChangeOrder,
      priceChangeType: "decrease",
    });

    expect(result.priceChangeType).toBe("decrease");
  });

  it("rejects invalid priceChangeType value", () => {
    const result = changeOrderSchema.safeParse({
      ...validChangeOrder,
      priceChangeType: "refund",
    });

    expect(result.success).toBe(false);
  });

  it("rejects another invalid priceChangeType value", () => {
    const result = changeOrderSchema.safeParse({
      ...validChangeOrder,
      priceChangeType: "adjustment",
    });

    expect(result.success).toBe(false);
  });

  it('defaults priceChangeType to "no_change" when omitted', () => {
    const result = changeOrderSchema.parse(validChangeOrder);

    expect(result.priceChangeType).toBe("no_change");
  });

  it("defaults priceChangeAmount to 0 when omitted", () => {
    const result = changeOrderSchema.parse(validChangeOrder);

    expect(result.priceChangeAmount).toBe(0);
  });

  it("accepts priceChangeAmount of 0", () => {
    const result = changeOrderSchema.parse({
      ...validChangeOrder,
      priceChangeAmount: 0,
    });

    expect(result.priceChangeAmount).toBe(0);
  });

  it("accepts positive priceChangeAmount", () => {
    const result = changeOrderSchema.parse({
      ...validChangeOrder,
      priceChangeAmount: 250.75,
    });

    expect(result.priceChangeAmount).toBe(250.75);
  });

  it("rejects negative priceChangeAmount (minimum is 0)", () => {
    const result = changeOrderSchema.safeParse({
      ...validChangeOrder,
      priceChangeAmount: -50,
    });

    expect(result.success).toBe(false);
  });

  it("coerces string priceChangeAmount to number", () => {
    const result = changeOrderSchema.parse({
      ...validChangeOrder,
      priceChangeAmount: "150.50",
    });

    expect(result.priceChangeAmount).toBe(150.5);
  });

  it("allows optional signatures", () => {
    const result = changeOrderSchema.parse(validChangeOrder);

    expect(result.customerSignature).toBeUndefined();
    expect(result.customerSignatureDate).toBeUndefined();
    expect(result.awpSignature).toBeUndefined();
    expect(result.awpSignatureDate).toBeUndefined();
  });

  it("accepts provided signatures", () => {
    const result = changeOrderSchema.parse({
      ...validChangeOrder,
      customerSignature: "data:image/png;base64,custsig",
      customerSignatureDate: "2026-02-01",
      awpSignature: "data:image/png;base64,awpsig",
      awpSignatureDate: "2026-02-01",
    });

    expect(result.customerSignature).toBe("data:image/png;base64,custsig");
    expect(result.customerSignatureDate).toBe("2026-02-01");
    expect(result.awpSignature).toBe("data:image/png;base64,awpsig");
    expect(result.awpSignatureDate).toBe("2026-02-01");
  });

  it("accepts a fully populated change order", () => {
    const input = {
      contractId: "c-full",
      changesDescription: "Upgrade all windows to Commander series",
      priceChangeType: "increase" as const,
      priceChangeAmount: 1500,
      customerSignature: "sig-cust",
      customerSignatureDate: "2026-02-05",
      awpSignature: "sig-awp",
      awpSignatureDate: "2026-02-05",
    };

    const result = changeOrderSchema.parse(input);

    expect(result).toMatchObject(input);
  });
});
