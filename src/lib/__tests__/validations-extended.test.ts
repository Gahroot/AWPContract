import {
  lineItemSchema,
  salesContractDraftSchema,
  salesContractSubmitSchema,
  addendumSchema,
  changeOrderSchema,
  commissionSettingsSchema,
} from "@/lib/validations";
import { FORM_OPTIONS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// lineItemSchema - new product fields
// ---------------------------------------------------------------------------
describe("lineItemSchema - new product fields", () => {
  it("accepts productCode", () => {
    const result = lineItemSchema.parse({ productCode: "Patriot SS" });
    expect(result.productCode).toBe("Patriot SS");
  });

  it("productCode is optional", () => {
    const result = lineItemSchema.parse({});
    expect(result.productCode).toBeUndefined();
  });

  it("accepts operation", () => {
    const result = lineItemSchema.parse({ operation: "XO" });
    expect(result.operation).toBe("XO");
  });

  it("operation is optional", () => {
    const result = lineItemSchema.parse({});
    expect(result.operation).toBeUndefined();
  });

  it("accepts gridType", () => {
    const result = lineItemSchema.parse({ gridType: "STD GRID" });
    expect(result.gridType).toBe("STD GRID");
  });

  it("gridType is optional", () => {
    const result = lineItemSchema.parse({});
    expect(result.gridType).toBeUndefined();
  });

  it("accepts glassType", () => {
    const result = lineItemSchema.parse({ glassType: "LoE-366" });
    expect(result.glassType).toBe("LoE-366");
  });

  it("glassType is optional", () => {
    const result = lineItemSchema.parse({});
    expect(result.glassType).toBeUndefined();
  });

  it("accepts all new fields together", () => {
    const result = lineItemSchema.parse({
      productCode: "Patriot HP SS",
      operation: "XO",
      gridType: "CNT GRID",
      glassType: "LoE-i89",
    });
    expect(result.productCode).toBe("Patriot HP SS");
    expect(result.operation).toBe("XO");
    expect(result.gridType).toBe("CNT GRID");
    expect(result.glassType).toBe("LoE-i89");
  });
});

// ---------------------------------------------------------------------------
// lineItemSchema - every item type
// ---------------------------------------------------------------------------
describe("lineItemSchema - every item type", () => {
  it.each(FORM_OPTIONS.type)("accepts type '%s'", (type) => {
    const result = lineItemSchema.parse({ type });
    expect(result.type).toBe(type);
  });
});

// ---------------------------------------------------------------------------
// lineItemSchema - every color
// ---------------------------------------------------------------------------
describe("lineItemSchema - every color", () => {
  it.each(FORM_OPTIONS.color)("accepts color '%s'", (color) => {
    const result = lineItemSchema.parse({ color });
    expect(result.color).toBe(color);
  });
});

// ---------------------------------------------------------------------------
// lineItemSchema - every series
// ---------------------------------------------------------------------------
describe("lineItemSchema - every series", () => {
  it.each(FORM_OPTIONS.series)("accepts series '%s'", (series) => {
    const result = lineItemSchema.parse({ series });
    expect(result.series).toBe(series);
  });
});

// ---------------------------------------------------------------------------
// lineItemSchema - every frame
// ---------------------------------------------------------------------------
describe("lineItemSchema - every frame", () => {
  it.each(FORM_OPTIONS.frame)("accepts frame '%s'", (frame) => {
    const result = lineItemSchema.parse({ frame });
    expect(result.frame).toBe(frame);
  });
});

// ---------------------------------------------------------------------------
// lineItemSchema - every function
// ---------------------------------------------------------------------------
describe("lineItemSchema - every function", () => {
  it.each(FORM_OPTIONS.function)("accepts function '%s'", (fn) => {
    const result = lineItemSchema.parse({ function: fn });
    expect(result.function).toBe(fn);
  });
});

// ---------------------------------------------------------------------------
// lineItemSchema - every operation
// ---------------------------------------------------------------------------
describe("lineItemSchema - every operation", () => {
  it.each(FORM_OPTIONS.operations)("accepts operation '%s'", (op) => {
    const result = lineItemSchema.parse({ operation: op });
    expect(result.operation).toBe(op);
  });
});

// ---------------------------------------------------------------------------
// lineItemSchema - every grid type
// ---------------------------------------------------------------------------
describe("lineItemSchema - every grid type", () => {
  it.each(FORM_OPTIONS.gridTypes)("accepts gridType '%s'", (gt) => {
    const result = lineItemSchema.parse({ gridType: gt });
    expect(result.gridType).toBe(gt);
  });
});

// ---------------------------------------------------------------------------
// lineItemSchema - every glass type
// ---------------------------------------------------------------------------
describe("lineItemSchema - every glass type", () => {
  it.each(FORM_OPTIONS.glassTypes)("accepts glassType '%s'", (g) => {
    const result = lineItemSchema.parse({ glassType: g });
    expect(result.glassType).toBe(g);
  });
});

// ---------------------------------------------------------------------------
// lineItemSchema - all boolean addon combinations
// ---------------------------------------------------------------------------
describe("lineItemSchema - boolean addon combinations", () => {
  const booleanFields = [
    "temperedGlass",
    "obscuredGlass",
    "customShape",
    "wrap",
    "coated",
    "awpShutterRnr",
  ] as const;

  it("all false (default)", () => {
    const result = lineItemSchema.parse({});
    for (const field of booleanFields) {
      expect(result[field]).toBe(false);
    }
  });

  it("all true", () => {
    const input: Record<string, boolean> = {};
    for (const field of booleanFields) {
      input[field] = true;
    }
    const result = lineItemSchema.parse(input);
    for (const field of booleanFields) {
      expect(result[field]).toBe(true);
    }
  });

  it.each(booleanFields)("only %s = true, rest false", (field) => {
    const result = lineItemSchema.parse({ [field]: true });
    expect(result[field]).toBe(true);
    for (const other of booleanFields) {
      if (other !== field) {
        expect(result[other]).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Fully populated line item with every field
// ---------------------------------------------------------------------------
describe("lineItemSchema - fully populated", () => {
  it("accepts a line item with every possible field", () => {
    const input = {
      id: "li-001",
      location: "Master Bedroom - South Wall",
      type: "Window",
      qty: 5,
      width: 36.5,
      height: 48.75,
      color: "Eclipse",
      series: "High Performance",
      frame: "Flush Fin",
      function: "Double Vent",
      productCode: "Patriot HP DV",
      operation: "XOX",
      gridType: "CNT GRID",
      glassType: "LoE-i89",
      temperedGlass: true,
      obscuredGlass: true,
      customShape: false,
      wrap: true,
      coated: true,
      awpShutterRnr: false,
      price: 2547.89,
      sortOrder: 3,
    };

    const result = lineItemSchema.parse(input);
    expect(result).toMatchObject(input);
  });
});

// ---------------------------------------------------------------------------
// salesContractDraftSchema - every payment method
// ---------------------------------------------------------------------------
describe("salesContractDraftSchema - every payment option", () => {
  it.each(FORM_OPTIONS.paymentMethod.map((pm) => [pm.value, pm.label]))(
    "accepts paymentMethod '%s' (%s)",
    (value) => {
      const result = salesContractDraftSchema.parse({ paymentMethod: value });
      expect(result.paymentMethod).toBe(value);
    },
  );

  it.each(FORM_OPTIONS.downPaymentMethod.map((pm) => [pm.value, pm.label]))(
    "accepts downPaymentMethod '%s' (%s)",
    (value) => {
      const result = salesContractDraftSchema.parse({ downPaymentMethod: value });
      expect(result.downPaymentMethod).toBe(value);
    },
  );
});

// ---------------------------------------------------------------------------
// salesContractDraftSchema - every state
// ---------------------------------------------------------------------------
describe("salesContractDraftSchema - every state", () => {
  it.each(FORM_OPTIONS.states)("accepts customerState '%s'", (state) => {
    const result = salesContractDraftSchema.parse({ customerState: state });
    expect(result.customerState).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// salesContractDraftSchema - every house type
// ---------------------------------------------------------------------------
describe("salesContractDraftSchema - every house type", () => {
  it.each(FORM_OPTIONS.houseType)("accepts houseType '%s'", (ht) => {
    const result = salesContractDraftSchema.parse({ houseType: ht });
    expect(result.houseType).toBe(ht);
  });
});

// ---------------------------------------------------------------------------
// salesContractDraftSchema - marketing sources
// ---------------------------------------------------------------------------
describe("salesContractDraftSchema - marketing sources", () => {
  it("accepts all marketing sources together", () => {
    const result = salesContractDraftSchema.parse({
      marketingSource: [...FORM_OPTIONS.marketingSource],
    });
    expect(result.marketingSource).toEqual(FORM_OPTIONS.marketingSource);
  });

  it.each(FORM_OPTIONS.marketingSource)(
    "accepts single marketing source '%s'",
    (source) => {
      const result = salesContractDraftSchema.parse({
        marketingSource: [source],
      });
      expect(result.marketingSource).toEqual([source]);
    },
  );

  it("accepts empty marketing source array", () => {
    const result = salesContractDraftSchema.parse({ marketingSource: [] });
    expect(result.marketingSource).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// salesContractDraftSchema - preferred communication
// ---------------------------------------------------------------------------
describe("salesContractDraftSchema - preferred communication", () => {
  it.each(FORM_OPTIONS.preferredCommunication)(
    "accepts preferredCommunication '%s'",
    (comm) => {
      const result = salesContractDraftSchema.parse({
        preferredCommunication: comm,
      });
      expect(result.preferredCommunication).toBe(comm);
    },
  );
});

// ---------------------------------------------------------------------------
// salesContractDraftSchema - financing options
// ---------------------------------------------------------------------------
describe("salesContractDraftSchema - financing options", () => {
  it.each(FORM_OPTIONS.financingOption)(
    "accepts financingOption '%s'",
    (opt) => {
      const result = salesContractDraftSchema.parse({ financingOption: opt });
      expect(result.financingOption).toBe(opt);
    },
  );
});

// ---------------------------------------------------------------------------
// salesContractDraftSchema - windows being removed
// ---------------------------------------------------------------------------
describe("salesContractDraftSchema - windows being removed", () => {
  it.each(FORM_OPTIONS.windowsBeingRemoved)(
    "accepts windowsBeingRemoved '%s'",
    (type) => {
      const result = salesContractDraftSchema.parse({
        windowsBeingRemoved: type,
      });
      expect(result.windowsBeingRemoved).toBe(type);
    },
  );
});

// ---------------------------------------------------------------------------
// salesContractDraftSchema - application quantities
// ---------------------------------------------------------------------------
describe("salesContractDraftSchema - application quantities", () => {
  it("accepts all application quantities", () => {
    const result = salesContractDraftSchema.parse({
      brickApplicationQty: 5,
      stuccoApplicationQty: 3,
      sidingApplicationQty: 7,
      foundationApplicationQty: 2,
      woodApplicationQty: 4,
    });
    expect(result.brickApplicationQty).toBe(5);
    expect(result.stuccoApplicationQty).toBe(3);
    expect(result.sidingApplicationQty).toBe(7);
    expect(result.foundationApplicationQty).toBe(2);
    expect(result.woodApplicationQty).toBe(4);
  });

  it("defaults all application quantities to 0", () => {
    const result = salesContractDraftSchema.parse({});
    expect(result.brickApplicationQty).toBe(0);
    expect(result.stuccoApplicationQty).toBe(0);
    expect(result.sidingApplicationQty).toBe(0);
    expect(result.foundationApplicationQty).toBe(0);
    expect(result.woodApplicationQty).toBe(0);
  });

  it("coerces string application quantities", () => {
    const result = salesContractDraftSchema.parse({
      brickApplicationQty: "10",
      stuccoApplicationQty: "5",
    });
    expect(result.brickApplicationQty).toBe(10);
    expect(result.stuccoApplicationQty).toBe(5);
  });

  it("rejects negative application quantities", () => {
    expect(
      salesContractDraftSchema.safeParse({ brickApplicationQty: -1 }).success,
    ).toBe(false);
    expect(
      salesContractDraftSchema.safeParse({ stuccoApplicationQty: -1 }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// salesContractDraftSchema - customerAcceptedTerms
// ---------------------------------------------------------------------------
describe("salesContractDraftSchema - customerAcceptedTerms", () => {
  it("defaults to false", () => {
    const result = salesContractDraftSchema.parse({});
    expect(result.customerAcceptedTerms).toBe(false);
  });

  it("accepts true", () => {
    const result = salesContractDraftSchema.parse({
      customerAcceptedTerms: true,
    });
    expect(result.customerAcceptedTerms).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// salesContractSubmitSchema - customerAcceptedTerms required true
// ---------------------------------------------------------------------------
describe("salesContractSubmitSchema - customerAcceptedTerms", () => {
  const validSubmission = {
    customerName: "John Doe",
    customerSignature: "sig",
    customerSignatureDate: "2026-01-15",
    contractorSignature: "sig",
    customerAcceptedTerms: true,
    lineItems: [{ qty: 1, width: 24, height: 36 }],
  };

  it("fails when customerAcceptedTerms is false", () => {
    const result = salesContractSubmitSchema.safeParse({
      ...validSubmission,
      customerAcceptedTerms: false,
    });
    expect(result.success).toBe(false);
  });

  it("passes when customerAcceptedTerms is true", () => {
    const result = salesContractSubmitSchema.parse(validSubmission);
    expect(result.customerAcceptedTerms).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Fully populated sales contract draft
// ---------------------------------------------------------------------------
describe("salesContractDraftSchema - fully populated", () => {
  it("accepts a draft with every field populated", () => {
    const input = {
      customerName: "John A. Doe",
      customerPhone: "(801) 555-1234",
      customerPhoneAlt: "(801) 555-5678",
      customerEmail: "john.doe@example.com",
      jobAddress: "123 Main Street",
      billingAddress: "456 Oak Avenue",
      customerCity: "Salt Lake City",
      customerZip: "84101",
      customerState: "UT",
      salesman: "Jane Smith",
      measuredBy: "Bob Wilson",
      leadTest: "Negative",
      yearBuilt: "1995",
      houseType: "Brick",
      preferredCommunication: "Phone",
      lineItems: [
        {
          id: "li-001",
          location: "Kitchen",
          type: "Window",
          qty: 3,
          width: 36,
          height: 48,
          color: "White",
          series: "Patriot",
          frame: "Nail Fin",
          function: "Single Slider",
          productCode: "Patriot SS",
          operation: "XO",
          gridType: "STD GRID",
          glassType: "LoE-366",
          temperedGlass: false,
          obscuredGlass: false,
          customShape: false,
          wrap: false,
          coated: false,
          awpShutterRnr: false,
          price: 950.40,
          sortOrder: 0,
        },
        {
          location: "Living Room",
          type: "Window",
          qty: 1,
          width: 60,
          height: 72,
          color: "Bronze",
          series: "High Performance",
          frame: "Flush Fin",
          function: "Picture",
          productCode: "Patriot HP PW",
          operation: "N/A",
          gridType: "CNT GRID",
          glassType: "LoE-i89",
          temperedGlass: true,
          obscuredGlass: false,
          customShape: false,
          wrap: true,
          coated: true,
          awpShutterRnr: false,
          price: 2500.00,
          sortOrder: 1,
        },
        {
          location: "Bathroom",
          type: "Window",
          qty: 1,
          width: 24,
          height: 36,
          color: "White",
          series: "Patriot",
          frame: "Nail Fin",
          function: "Single Hung",
          productCode: "Patriot SH",
          operation: "SH",
          gridType: "STD GRID",
          glassType: "LoE-366",
          temperedGlass: true,
          obscuredGlass: true,
          customShape: false,
          wrap: false,
          coated: false,
          awpShutterRnr: false,
          price: 450.00,
          sortOrder: 2,
        },
        {
          location: "Patio",
          type: "Door",
          qty: 1,
          width: 72,
          height: 84,
          color: "Bronze",
          series: "Patriot",
          frame: "Nail Fin",
          function: "Sliding Door",
          productCode: "Patriot SGD",
          operation: "XO",
          gridType: "STD GRID",
          glassType: "LoE-366",
          temperedGlass: true,
          obscuredGlass: false,
          customShape: false,
          wrap: false,
          coated: false,
          awpShutterRnr: false,
          price: 3800.00,
          sortOrder: 3,
        },
      ],
      discount: 500,
      downPayment: 2000,
      financeBalance: 5250,
      wfebAccount: "WF-12345",
      planNumber: "PLAN-A100",
      authNumber: "AUTH-2026-001",
      marketingSource: ["TV", "Referral"],
      paymentMethod: "finance",
      downPaymentMethod: "check",
      financingOption: "Wells Fargo",
      financingLoanId: "LOAN-WF-789",
      financingPlan: "12-month 0% APR",
      windowsBeingRemoved: "Aluminum",
      paymentNotes: "Customer pays $2000 deposit by check",
      contractNotes: "Install after kitchen remodel is done",
      customerNotes: "Customer prefers morning appointments",
      measurementNotes: "Access from back yard, dog must be inside",
      brickApplicationQty: 5,
      stuccoApplicationQty: 3,
      sidingApplicationQty: 0,
      foundationApplicationQty: 2,
      woodApplicationQty: 1,
      contractorSignature: "data:image/png;base64,contractorsigdata",
      contractorSignatureDate: "2026-01-15",
      customerSignature: "data:image/png;base64,customersigdata",
      customerSignatureDate: "2026-01-15",
      authorizedSignature: "data:image/png;base64,authsigdata",
      authorizedSignatureDate: "2026-01-16",
      customerAcceptedTerms: true,
      status: "DRAFT",
    };

    const result = salesContractDraftSchema.parse(input);
    expect(result.customerName).toBe("John A. Doe");
    expect(result.lineItems).toHaveLength(4);
    expect(result.lineItems[0].productCode).toBe("Patriot SS");
    expect(result.lineItems[0].operation).toBe("XO");
    expect(result.lineItems[1].gridType).toBe("CNT GRID");
    expect(result.lineItems[1].glassType).toBe("LoE-i89");
    expect(result.lineItems[3].type).toBe("Door");
    expect(result.brickApplicationQty).toBe(5);
    expect(result.marketingSource).toEqual(["TV", "Referral"]);
    expect(result.customerAcceptedTerms).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Fully populated sales contract submit
// ---------------------------------------------------------------------------
describe("salesContractSubmitSchema - fully populated submission", () => {
  it("accepts a fully populated submission with mixed line items", () => {
    const result = salesContractSubmitSchema.parse({
      customerName: "Jane Doe",
      customerPhone: "555-1234",
      customerEmail: "jane@example.com",
      jobAddress: "789 Elm St",
      customerSignature: "data:image/png;base64,sig",
      customerSignatureDate: "2026-02-01",
      contractorSignature: "data:image/png;base64,csig",
      customerAcceptedTerms: true,
      lineItems: [
        // Window with all addons
        {
          type: "Window", qty: 2, width: 36, height: 48,
          color: "Eclipse", series: "High Performance", frame: "Nail Fin",
          function: "Double Vent",
          productCode: "Patriot HP DV", operation: "XOX",
          gridType: "CNT GRID", glassType: "LoE-i89",
          temperedGlass: true, obscuredGlass: true, customShape: false,
          wrap: true, coated: true, awpShutterRnr: true,
        },
        // Door
        {
          type: "Door", qty: 1, width: 72, height: 84,
          color: "Bronze", series: "Patriot", frame: "Nail Fin",
          function: "Sliding Door",
          productCode: "Patriot SGD", operation: "OXXO",
          gridType: "STD GRID", glassType: "LoE-366",
          temperedGlass: true, obscuredGlass: false, customShape: false,
          wrap: false, coated: false, awpShutterRnr: false,
        },
        // Shape window
        {
          type: "Window", qty: 1, width: 24, height: 24,
          color: "White", series: "Patriot", frame: "Nail Fin",
          function: "Circle",
          productCode: "Patriot CIR", operation: "N/A",
          gridType: "KE Grid", glassType: "LoE-366",
          temperedGlass: false, obscuredGlass: false, customShape: true,
          wrap: false, coated: false, awpShutterRnr: false,
        },
      ],
      discount: 300,
      downPayment: 1500,
      paymentMethod: "finance",
      financingOption: "Wells Fargo",
    });

    expect(result.lineItems).toHaveLength(3);
    expect(result.lineItems[0].productCode).toBe("Patriot HP DV");
    expect(result.lineItems[1].type).toBe("Door");
    expect(result.lineItems[2].customShape).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// addendumSchema - every interior/exterior color
// ---------------------------------------------------------------------------
describe("addendumSchema - every color combo", () => {
  it.each(FORM_OPTIONS.interiorColors)(
    "accepts interiorColor '%s'",
    (color) => {
      const result = addendumSchema.parse({ contractId: "c1", interiorColor: color });
      expect(result.interiorColor).toBe(color);
    },
  );

  it.each(FORM_OPTIONS.exteriorColors)(
    "accepts exteriorColor '%s'",
    (color) => {
      const result = addendumSchema.parse({ contractId: "c1", exteriorColor: color });
      expect(result.exteriorColor).toBe(color);
    },
  );
});

// ---------------------------------------------------------------------------
// addendumSchema - every product type
// ---------------------------------------------------------------------------
describe("addendumSchema - every addendum product type", () => {
  it.each(FORM_OPTIONS.addendumProductTypes)(
    "accepts addendum product type '%s'",
    (type) => {
      const result = addendumSchema.parse({
        contractId: "c1",
        products: [{ type, qty: 1, width: 36, height: 48 }],
      });
      expect(result.products![0].type).toBe(type);
    },
  );
});

// ---------------------------------------------------------------------------
// addendumSchema - fully populated with all products
// ---------------------------------------------------------------------------
describe("addendumSchema - fully populated", () => {
  it("accepts addendum with all 14 product types", () => {
    const products = FORM_OPTIONS.addendumProductTypes.map((type, i) => ({
      type,
      qty: i + 1,
      width: 24 + i * 6,
      height: 36 + i * 4,
      notes: `${type} notes for location ${i + 1}`,
    }));

    const result = addendumSchema.parse({
      contractId: "contract-full-addendum",
      products,
      interiorColor: "Woodgrain",
      exteriorColor: "Custom",
      colorDescription: "Custom RAL 7016 Anthracite Grey",
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
      installNotes: "Full install with complete trim and haul-away",
      ackMeasurements: true,
      ackSpecifications: true,
      ackPricing: true,
      ackTerms: true,
      ackInitials: "JD",
      referralName: "Bob Smith",
      referralPhone: "(801) 555-9999",
      notes: "Priority install - customer moving in March 1",
      customerSignature: "data:image/png;base64,custsig",
      customerSignatureDate: "2026-02-15",
      contractorSignature: "data:image/png;base64,contsig",
      contractorSignatureDate: "2026-02-15",
    });

    expect(result.products).toHaveLength(14);
    expect(result.installRemoveOld).toBe(true);
    expect(result.ackMeasurements).toBe(true);
    expect(result.interiorColor).toBe("Woodgrain");
    expect(result.exteriorColor).toBe("Custom");
  });
});

// ---------------------------------------------------------------------------
// addendumSchema - install flag combinations
// ---------------------------------------------------------------------------
describe("addendumSchema - install flag combinations", () => {
  const installFlags = [
    "installRemoveOld",
    "installHaulAway",
    "installInteriorTrim",
    "installExteriorTrim",
    "installCaulkSeal",
    "installScreens",
    "installHardware",
    "installWeatherstrip",
    "installCleanup",
    "installOther",
  ] as const;

  it.each(installFlags)("only %s = true, rest default false", (flag) => {
    const result = addendumSchema.parse({
      contractId: "c1",
      [flag]: true,
    });
    expect(result[flag]).toBe(true);
    for (const other of installFlags) {
      if (other !== flag) {
        expect(result[other]).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// addendumSchema - acknowledgment combinations
// ---------------------------------------------------------------------------
describe("addendumSchema - acknowledgment combinations", () => {
  const ackFlags = [
    "ackMeasurements",
    "ackSpecifications",
    "ackPricing",
    "ackTerms",
  ] as const;

  it.each(ackFlags)("only %s = true, rest default false", (flag) => {
    const result = addendumSchema.parse({
      contractId: "c1",
      [flag]: true,
    });
    expect(result[flag]).toBe(true);
    for (const other of ackFlags) {
      if (other !== flag) {
        expect(result[other]).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// changeOrderSchema - every price change type
// ---------------------------------------------------------------------------
describe("changeOrderSchema - every price change type", () => {
  const priceChangeTypes = ["no_change", "increase", "decrease"] as const;

  it.each(priceChangeTypes)("priceChangeType '%s'", (type) => {
    const result = changeOrderSchema.parse({
      contractId: "c1",
      changesDescription: "Test change",
      priceChangeType: type,
    });
    expect(result.priceChangeType).toBe(type);
  });
});

// ---------------------------------------------------------------------------
// changeOrderSchema - fully populated
// ---------------------------------------------------------------------------
describe("changeOrderSchema - fully populated", () => {
  it("accepts change order with increase", () => {
    const result = changeOrderSchema.parse({
      contractId: "contract-co-001",
      changesDescription:
        "Upgrade 3 windows from Patriot to High Performance series. " +
        "Change glass to LoE-i89 on all windows. Add tempered glass to bathroom window.",
      priceChangeType: "increase",
      priceChangeAmount: 1250.50,
      customerSignature: "data:image/png;base64,customer_change_sig",
      customerSignatureDate: "2026-02-20",
      awpSignature: "data:image/png;base64,awp_change_sig",
      awpSignatureDate: "2026-02-20",
    });

    expect(result.contractId).toBe("contract-co-001");
    expect(result.priceChangeType).toBe("increase");
    expect(result.priceChangeAmount).toBe(1250.50);
  });

  it("accepts change order with decrease", () => {
    const result = changeOrderSchema.parse({
      contractId: "contract-co-002",
      changesDescription: "Remove 2 windows from scope. Downgrade series on remaining.",
      priceChangeType: "decrease",
      priceChangeAmount: 800,
      customerSignature: "sig",
      customerSignatureDate: "2026-02-20",
      awpSignature: "sig",
      awpSignatureDate: "2026-02-20",
    });

    expect(result.priceChangeType).toBe("decrease");
    expect(result.priceChangeAmount).toBe(800);
  });
});

// ---------------------------------------------------------------------------
// commissionSettingsSchema - 7-section settings
// ---------------------------------------------------------------------------
describe("commissionSettingsSchema", () => {
  const validSettings = {
    salesRepRate: 0.10,
    salesRepRateBelowFair: 0.05,
    salesRepFloor: 0.85,
    salesRepCeiling: 1.15,
    setterRate: 0.03,
    setterFloor: 0.85,
    setterManagerRate: 0.02,
    setterManagerRateBelowFair: 0.01,
    territoryOwnerRateTier1: 0.01,
    territoryOwnerRateTier2: 0.015,
    territoryOwnerRateTier3: 0.02,
    territoryOwnerTier2Threshold: 500000,
    territoryOwnerTier3Threshold: 1000000,
    vpRate: 0.01,
    vpRateBelowFair: 0.005,
    nsmRate: 0.005,
    nsmRateBelowFair: 0.0025,
    traditionalSalesRepRate: 0.12,
    traditionalSalesRepRateBelowFair: 0.07,
    traditionalFloorRate: 0.85,
    traditionalPriceCeiling: 1.15,
    traditionalNsmOverrideRate: 0.005,
    traditionalNsmOverrideRateBelowFair: 0.0025,
  };

  it("accepts valid settings", () => {
    const result = commissionSettingsSchema.parse(validSettings);
    expect(result.salesRepRate).toBe(0.10);
    expect(result.territoryOwnerTier2Threshold).toBe(500000);
  });

  it("rejects rate > 1", () => {
    expect(
      commissionSettingsSchema.safeParse({ ...validSettings, salesRepRate: 1.5 }).success,
    ).toBe(false);
  });

  it("rejects negative rate", () => {
    expect(
      commissionSettingsSchema.safeParse({ ...validSettings, salesRepRate: -0.1 }).success,
    ).toBe(false);
  });

  it("accepts rate of 0", () => {
    const result = commissionSettingsSchema.parse({ ...validSettings, salesRepRate: 0 });
    expect(result.salesRepRate).toBe(0);
  });

  it("coerces string values", () => {
    const result = commissionSettingsSchema.parse({
      ...validSettings,
      salesRepRate: "0.15",
      territoryOwnerTier2Threshold: "750000",
    });
    expect(result.salesRepRate).toBe(0.15);
    expect(result.territoryOwnerTier2Threshold).toBe(750000);
  });

  it("rejects floor below 0.5", () => {
    expect(
      commissionSettingsSchema.safeParse({ ...validSettings, salesRepFloor: 0.3 }).success,
    ).toBe(false);
  });

  it("rejects ceiling above 2", () => {
    expect(
      commissionSettingsSchema.safeParse({ ...validSettings, salesRepCeiling: 2.5 }).success,
    ).toBe(false);
  });
});
