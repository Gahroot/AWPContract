import { computeLineItemAggregations, buildDealProperties } from "@/lib/hubspot";

// ---------------------------------------------------------------------------
// Helper: build a default line item
// ---------------------------------------------------------------------------
function makeLineItem(overrides: Record<string, unknown> = {}) {
  return {
    location: "Kitchen",
    type: "Window",
    qty: 1,
    width: 3,
    height: 4,
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
    price: 100,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// computeLineItemAggregations
// ---------------------------------------------------------------------------
describe("computeLineItemAggregations", () => {
  it("counts windows and doors separately", () => {
    const items = [
      makeLineItem({ type: "Window", qty: 3, price: 300 }),
      makeLineItem({ type: "Door", qty: 2, price: 500 }),
      makeLineItem({ type: "Window", qty: 1, price: 100 }),
    ];
    const agg = computeLineItemAggregations(items);
    expect(agg.numberOfWindows).toBe(4);
    expect(agg.numberOfDoors).toBe(2);
    expect(agg.costOfWindows).toBe(400);
    expect(agg.costOfDoors).toBe(500);
  });

  it("counts boolean addon quantities", () => {
    const items = [
      makeLineItem({ qty: 2, temperedGlass: true }),
      makeLineItem({ qty: 3, obscuredGlass: true }),
      makeLineItem({ qty: 1, coated: true }),
      makeLineItem({ qty: 4, customShape: true }),
      makeLineItem({ qty: 2, wrap: true }),
    ];
    const agg = computeLineItemAggregations(items);
    expect(agg.temperedGlassQty).toBe(2);
    expect(agg.obscuredGlassQty).toBe(3);
    expect(agg.coatedQty).toBe(1);
    expect(agg.customShapesQty).toBe(4);
    expect(agg.wrapQty).toBe(2);
  });

  it("sets windowType to Yes when any item is coated", () => {
    const items = [
      makeLineItem({ coated: false }),
      makeLineItem({ coated: true }),
    ];
    const agg = computeLineItemAggregations(items);
    expect(agg.windowType).toBe("Yes");
  });

  it("sets windowType to No when no items are coated", () => {
    const items = [makeLineItem({ coated: false })];
    const agg = computeLineItemAggregations(items);
    expect(agg.windowType).toBe("No");
  });

  it("counts series quantities", () => {
    const items = [
      makeLineItem({ series: "Patriot", qty: 3 }),
      makeLineItem({ series: "High Performance", qty: 2 }),
      makeLineItem({ series: "Autograph", qty: 1 }),
      makeLineItem({ series: "Signature", qty: 4 }),
      makeLineItem({ series: "Imperial", qty: 1 }),
    ];
    const agg = computeLineItemAggregations(items);
    expect(agg.patriotQty).toBe(3);
    expect(agg.highPerformanceQty).toBe(2);
    expect(agg.autographQty).toBe(1);
    expect(agg.signatureQty).toBe(4);
    expect(agg.imperialQty).toBe(1);
  });

  it("counts frame quantities", () => {
    const items = [
      makeLineItem({ frame: "Nail Fin", qty: 5 }),
      makeLineItem({ frame: "Flush Fin", qty: 3 }),
      makeLineItem({ frame: "Frame Over", qty: 2 }),
    ];
    const agg = computeLineItemAggregations(items);
    expect(agg.nailFinQty).toBe(5);
    expect(agg.flushFinQty).toBe(3);
    expect(agg.frameOverQty).toBe(2);
  });

  it("counts function quantities including Slider variants", () => {
    const items = [
      makeLineItem({ function: "Slider", qty: 2 }),
      makeLineItem({ function: "Single Slider", qty: 3 }),
      makeLineItem({ function: "Double Slider", qty: 1 }),
      makeLineItem({ function: "Picture", qty: 4 }),
      makeLineItem({ function: "Double Vent", qty: 2 }),
      makeLineItem({ function: "Eyebrow", qty: 1 }),
    ];
    const agg = computeLineItemAggregations(items);
    expect(agg.sliderQty).toBe(6); // Slider + Single Slider + Double Slider
    expect(agg.pictureQty).toBe(4);
    expect(agg.doubleVentQty).toBe(2);
    expect(agg.eyebrowQty).toBe(1);
  });

  it("determines the most frequent window color", () => {
    const items = [
      makeLineItem({ color: "White", qty: 2 }),
      makeLineItem({ color: "Bronze", qty: 5 }),
      makeLineItem({ color: "White", qty: 1 }),
    ];
    const agg = computeLineItemAggregations(items);
    expect(agg.windowColor).toBe("Bronze");
  });

  it("returns empty values for empty items array", () => {
    const agg = computeLineItemAggregations([]);
    expect(agg.numberOfWindows).toBe(0);
    expect(agg.numberOfDoors).toBe(0);
    expect(agg.windowType).toBe("No");
    expect(agg.windowColor).toBe("");
  });
});

// ---------------------------------------------------------------------------
// buildDealProperties
// ---------------------------------------------------------------------------
describe("buildDealProperties", () => {
  function makeContractData(overrides: Record<string, unknown> = {}) {
    return {
      id: "test-id",
      contractNumber: "CN-001",
      status: "COMPLETED" as const,
      customerName: "John Doe",
      customerEmail: "john@test.com",
      customerPhone: "(801) 555-0001",
      customerPhoneAlt: "(801) 555-0002",
      jobAddress: "123 Main St",
      billingAddress: "456 Billing Ave",
      customerCity: "Salt Lake City",
      customerZip: "84101",
      customerState: "UT",
      salesman: "Jane Sales",
      measuredBy: "Jane Sales",
      leadTest: "Yes",
      yearBuilt: "1995",
      houseType: "Brick",
      measurementNotes: "Test notes",
      preferredCommunication: "Phone",
      total: 5000,
      discount: 500,
      contractTotal: 4500,
      downPayment: 1000,
      balanceDue: 3500,
      financeBalance: 3500,
      wfebAccount: "WF-123",
      paymentMethod: "finance",
      downPaymentMethod: "check",
      financingOption: "Wells Fargo",
      financingLoanId: "LOAN-456",
      financingPlan: "12-month",
      planNumber: "P-100",
      authNumber: "A-200",
      marketingSource: ["TV", "Digital"],
      paymentNotes: "Payment note",
      contractNotes: "Contract note",
      customerNotes: "Customer note",
      windowsBeingRemoved: "Aluminum",
      brickApplicationQty: 5,
      stuccoApplicationQty: 3,
      sidingApplicationQty: 0,
      foundationApplicationQty: 2,
      woodApplicationQty: 1,
      customerSignatureDate: new Date("2026-01-20"),
      commissionAmount: 450,
      hubspotContactId: null,
      hubspotDealId: null,
      pdfUrl: "/api/contracts/test-id/pdf",
      lineItems: [
        makeLineItem({ series: "Patriot", frame: "Nail Fin", function: "Slider", qty: 3, price: 300, coated: true }),
        makeLineItem({ type: "Door", series: "Patriot", frame: "Flush Fin", function: "Sliding Door", qty: 1, price: 800 }),
        makeLineItem({ series: "High Performance", frame: "Nail Fin", function: "Picture", qty: 2, price: 200 }),
      ],
      ...overrides,
    };
  }

  it("maps all required HubSpot property names", () => {
    const props = buildDealProperties(makeContractData());

    // Core deal fields
    expect(props.dealname).toContain("John Doe");
    expect(props.amount).toBe("4500");
    expect(props.dealstage).toBe("closedwon");
    expect(props.pipeline).toBe("Active");

    // Contact info
    expect(props.first_name).toBe("John");
    expect(props.last_name).toBe("Doe");
    expect(props.email).toBe("john@test.com");
    expect(props.main_phone_number).toBe("(801) 555-0001");
    expect(props.secondary_phone_number).toBe("(801) 555-0002");

    // Property
    expect(props.property_street).toBe("123 Main St");
    expect(props.property_city).toBe("Salt Lake City");
    expect(props.property_state).toBe("UT");
    expect(props.property_postal_code).toBe("84101");

    // Sales
    expect(props.sales_rep).toBe("Jane Sales");
    expect(props.measured_by).toBe("Jane Sales");
    expect(props.preferred_communication_method).toBe("Phone");

    // Home
    expect(props.year_home_was_built).toBe("1995");

    // Contract
    expect(props.temporary_contract_amount).toBe("5000");
    expect(props.original_contract_signed_date).toBe("2026-01-20");

    // Payment
    expect(props.payment_method).toBe("Financing");
    expect(props.commission).toBe("450");
    expect(props["down_payment___method"]).toBe("check");
    expect(props.down_payment_amount).toBe("1000");

    // Financing
    expect(props.financing_option).toBe("Wells Fargo");
    expect(props.financed_amount).toBe("3500");
    expect(props.financing_account_number).toBe("WF-123");
    expect(props.financing_loan_id).toBe("LOAN-456");
    expect(props.financing_plan).toBe("12-month");

    // Notes
    expect(props.payment_notes).toBe("Payment note");
    expect(props.contract_notes).toBe("Contract note");
    expect(props.customer_notes_preferences).toBe("Customer note");

    // Window details
    expect(props.window_type).toBe("Yes"); // has coated item
    expect(props.windows_being_removed).toBe("Aluminum");

    // Application surfaces
    expect(props.brick_applications).toBe("5");
    expect(props["stucco_application__"]).toBe("3");
    expect(props["siding_application__"]).toBe("0");
    expect(props["foundation_application__"]).toBe("2");
    expect(props["wood_application__"]).toBe("1");

    // Aggregated counts
    expect(props.number_of_windows).toBe("5"); // 3 + 2
    expect(props.number_of_doors).toBe("1");
    expect(props.cost_of_windows).toBe("500"); // 300 + 200
    expect(props.cost_of_doors).toBe("800");

    // Series
    expect(props.awp_patriot_qty).toBe("4"); // 3 windows + 1 door
    expect(props.high_performance_qty).toBe("2");

    // Frame
    expect(props.nail_fin_qty).toBe("5"); // 3 + 2
    expect(props.flush_fin_qty).toBe("1");

    // Function
    expect(props.slider_qty).toBe("3"); // 3 Slider (Sliding Door doesn't match "Slider")
    expect(props.picture_qty).toBe("2");

    // Coated
    expect(props.coated_qty).toBe("3");
  });

  it("translates payment methods correctly", () => {
    const testCases = [
      { input: "cash", expected: "Cash" },
      { input: "check", expected: "Check" },
      { input: "finance", expected: "Financing" },
      { input: "credit_card", expected: "Credit Card" },
      { input: "ach", expected: "ACH" },
    ];

    for (const { input, expected } of testCases) {
      const props = buildDealProperties(makeContractData({ paymentMethod: input }));
      expect(props.payment_method).toBe(expected);
    }
  });

  it("handles null/empty values gracefully", () => {
    const props = buildDealProperties(
      makeContractData({
        customerName: null,
        customerEmail: null,
        customerPhone: null,
        paymentMethod: null,
        commissionAmount: null,
        customerSignatureDate: null,
        lineItems: [],
      })
    );

    expect(props.first_name).toBe("");
    expect(props.last_name).toBe("");
    expect(props.email).toBe("");
    expect(props.payment_method).toBe("");
    expect(props.commission).toBe("");
    expect(props.original_contract_signed_date).toBe("");
    expect(props.number_of_windows).toBe("0");
  });
});
