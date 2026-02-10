#!/usr/bin/env bun
/**
 * Comprehensive Integration Test Suite
 * Tests contract CRUD, addendums, change orders, pricing, and data consistency
 * against the running dev server + database.
 *
 * Usage: bun run scripts/integration-test.ts
 */

const BASE = "http://localhost:3000";

// ── Helpers ──────────────────────────────────────────────────────────────────

let cookies = "";
let passCount = 0;
let failCount = 0;
const failures: string[] = [];

function assert(condition: boolean, msg: string) {
  if (condition) {
    passCount++;
    console.log(`  ✓ ${msg}`);
  } else {
    failCount++;
    failures.push(msg);
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

function assertClose(a: number, b: number, msg: string, tolerance = 0.01) {
  assert(Math.abs(a - b) <= tolerance, `${msg} (got ${a}, expected ${b})`);
}

async function api(
  path: string,
  opts: RequestInit = {}
): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies,
      ...(opts.headers || {}),
    },
    redirect: "manual",
  });
  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

// Authenticate via NextAuth credentials CSRF flow
async function login(email: string, password: string): Promise<boolean> {
  // 1. Get CSRF token from the signin page
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { redirect: "manual" });
  const csrfCookies = csrfRes.headers.getSetCookie?.() || [];
  let csrfCookie = csrfCookies.map((c: string) => c.split(";")[0]).join("; ");
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;

  // 2. POST credentials
  const signInRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookie,
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      json: "true",
    }),
    redirect: "manual",
  });

  const setCookies = signInRes.headers.getSetCookie?.() || [];
  if (setCookies.length > 0) {
    const allCookies = [...csrfCookies, ...setCookies];
    cookies = allCookies.map((c: string) => c.split(";")[0]).join("; ");
  }

  // Verify session
  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookies },
  });
  const session = await sessionRes.json();
  return !!session?.user?.email;
}

// Pricing formula (mirrors src/lib/pricing.ts)
const PRICING_MATRIX = {
  color: { White: 0, "Light Tan": 0, "Dark Tan": 0, Eclipse: 0.01, "Black Out White": 0 },
  series: { Patriot: 0, "High Performance": 0.01, Autograph: 0, Signature: 0.01 },
  frame: { "Nail Fin": 0, "Flush Fin": 0, "Frame Over": -0.01 },
  function: { Slider: 0, Picture: 0, Eyebrow: 0.02, Vent: 0.02, "Double Vent": 0.02 },
  addon: { temperedGlass: 0.01, obscuredGlass: 0.01, customShape: 0.02, wrap: 0.01, coated: 0.01, awpShutterRnr: 0.02 },
} as const;

function expectedPrice(item: any): number {
  const sqIn = (item.width || 0) * (item.height || 0) * 144;
  const base = sqIn * 0.55;
  let addonRate = 0;
  addonRate += (PRICING_MATRIX.color as any)[item.color || "White"] ?? 0;
  addonRate += (PRICING_MATRIX.series as any)[item.series || "Patriot"] ?? 0;
  addonRate += (PRICING_MATRIX.frame as any)[item.frame || "Nail Fin"] ?? 0;
  addonRate += (PRICING_MATRIX.function as any)[item.function || "Slider"] ?? 0;
  for (const [key, rate] of Object.entries(PRICING_MATRIX.addon)) {
    if (item[key]) addonRate += rate;
  }
  const unitPrice = base + addonRate * sqIn;
  return Math.round(unitPrice * (item.qty || 1) * 100) / 100;
}

// Fake base64 signature (small valid PNG data URI)
const FAKE_SIG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// ── Test Data ────────────────────────────────────────────────────────────────

const CONTRACT_SCENARIOS = [
  {
    name: "Basic residential - slider windows",
    contract: {
      customerName: "John Smith",
      customerPhone: "801-555-0101",
      customerEmail: "john.smith@test.com",
      jobAddress: "123 Main St, Salt Lake City",
      billingAddress: "123 Main St, Salt Lake City",
      customerCity: "Salt Lake City",
      customerZip: "84101",
      salesman: "Test Salesman",
      houseType: "Brick",
      yearBuilt: "1990",
      leadTest: "Negative",
      paymentMethod: "cash",
      marketingSource: ["TV", "Digital"],
      discount: 0,
      downPayment: 500,
    },
    lineItems: [
      { location: "Living Room", type: "Window", qty: 2, width: 3, height: 4, color: "White", series: "Patriot", frame: "Nail Fin", function: "Slider" },
      { location: "Bedroom", type: "Window", qty: 1, width: 2.5, height: 3, color: "White", series: "Patriot", frame: "Nail Fin", function: "Picture" },
    ],
  },
  {
    name: "High-end with addons - all upgrades",
    contract: {
      customerName: "Jane Doe",
      customerPhone: "801-555-0202",
      customerEmail: "jane.doe@test.com",
      jobAddress: "456 Oak Ave, Provo",
      billingAddress: "456 Oak Ave, Provo",
      customerCity: "Provo",
      customerZip: "84601",
      salesman: "Test Salesman",
      houseType: "Stucco",
      yearBuilt: "2005",
      leadTest: "Not Required",
      paymentMethod: "finance",
      marketingSource: ["Referral"],
      discount: 100,
      downPayment: 1000,
      financeBalance: 5000,
    },
    lineItems: [
      { location: "Master Bed", type: "Window", qty: 1, width: 4, height: 5, color: "Eclipse", series: "Signature", frame: "Frame Over", function: "Eyebrow", temperedGlass: true, obscuredGlass: true, customShape: true, wrap: true, coated: true, awpShutterRnr: true },
      { location: "Kitchen", type: "Window", qty: 3, width: 3, height: 3.5, color: "Dark Tan", series: "High Performance", frame: "Flush Fin", function: "Vent", temperedGlass: true },
      { location: "Front Entry", type: "Door", qty: 1, width: 3, height: 7, color: "Black Out White", series: "Autograph", frame: "Nail Fin", function: "Slider" },
    ],
  },
  {
    name: "Minimal contract - single item",
    contract: {
      customerName: "Bob Wilson",
      customerPhone: "801-555-0303",
      jobAddress: "789 Pine Rd, Ogden",
      customerCity: "Ogden",
      customerZip: "84401",
      paymentMethod: "check",
      discount: 0,
      downPayment: 0,
    },
    lineItems: [
      { location: "Bathroom", type: "Window", qty: 1, width: 2, height: 2, color: "White", series: "Patriot", frame: "Nail Fin", function: "Slider", obscuredGlass: true },
    ],
  },
  {
    name: "Large commercial job - many items",
    contract: {
      customerName: "Acme Corp",
      customerPhone: "801-555-0404",
      customerEmail: "purchasing@acme.test",
      jobAddress: "100 Business Park, Sandy",
      billingAddress: "PO Box 999, Sandy UT 84070",
      customerCity: "Sandy",
      customerZip: "84070",
      salesman: "Senior Rep",
      houseType: "Siding",
      yearBuilt: "2015",
      paymentMethod: "ach",
      marketingSource: ["PC", "Magazine"],
      discount: 500,
      downPayment: 2000,
    },
    lineItems: [
      { location: "Office 1", type: "Window", qty: 4, width: 4, height: 5, color: "White", series: "High Performance", frame: "Nail Fin", function: "Picture", temperedGlass: true, coated: true },
      { location: "Office 2", type: "Window", qty: 4, width: 4, height: 5, color: "White", series: "High Performance", frame: "Nail Fin", function: "Picture", temperedGlass: true, coated: true },
      { location: "Conference", type: "Window", qty: 2, width: 6, height: 6, color: "Eclipse", series: "Signature", frame: "Flush Fin", function: "Slider", temperedGlass: true, wrap: true },
      { location: "Lobby", type: "Door", qty: 2, width: 3.5, height: 7, color: "Dark Tan", series: "Autograph", frame: "Frame Over", function: "Double Vent" },
      { location: "Break Room", type: "Window", qty: 2, width: 3, height: 4, color: "Light Tan", series: "Patriot", frame: "Nail Fin", function: "Vent", awpShutterRnr: true },
    ],
  },
  {
    name: "Credit card with discount",
    contract: {
      customerName: "Sarah Johnson",
      customerPhone: "801-555-0505",
      customerEmail: "sarah@test.com",
      jobAddress: "222 Elm St, Draper",
      customerCity: "Draper",
      customerZip: "84020",
      salesman: "Test Salesman",
      houseType: "Wood",
      paymentMethod: "credit_card",
      marketingSource: ["Radio", "Other"],
      discount: 250,
      downPayment: 800,
    },
    lineItems: [
      { location: "Den", type: "Window", qty: 2, width: 3.5, height: 4.5, color: "Light Tan", series: "Autograph", frame: "Nail Fin", function: "Slider", wrap: true },
      { location: "Garage", type: "Window", qty: 1, width: 4, height: 3, color: "White", series: "Patriot", frame: "Flush Fin", function: "Picture" },
    ],
  },
];

const ADDENDUM_SCENARIOS = [
  {
    name: "Full addendum with products and installation",
    data: {
      products: [
        { type: "Double Hung Windows", qty: 2, width: 3, height: 4, notes: "With grids" },
        { type: "Slider Windows", qty: 1, width: 4, height: 3, notes: "" },
      ],
      interiorColor: "White",
      exteriorColor: "Bronze",
      colorDescription: "White interior, bronze exterior",
      installRemoveOld: true,
      installHaulAway: true,
      installInteriorTrim: true,
      installExteriorTrim: true,
      installCaulkSeal: true,
      installScreens: true,
      installHardware: true,
      installWeatherstrip: true,
      installCleanup: true,
      installOther: false,
      installNotes: "Customer will move furniture",
      ackMeasurements: true,
      ackSpecifications: true,
      ackPricing: true,
      ackTerms: true,
      ackInitials: "JS",
      referralName: "Mike Neighbor",
      referralPhone: "801-555-9999",
      notes: "Scheduled for spring installation",
      customerSignature: FAKE_SIG,
      customerSignatureDate: new Date().toISOString(),
      contractorSignature: FAKE_SIG,
      contractorSignatureDate: new Date().toISOString(),
    },
  },
  {
    name: "Minimal addendum - colors only",
    data: {
      interiorColor: "Woodgrain",
      exteriorColor: "Black",
      colorDescription: "Custom woodgrain interior",
    },
  },
  {
    name: "Addendum with specialty products",
    data: {
      products: [
        { type: "Bay Windows", qty: 1, width: 6, height: 5, notes: "Custom angle" },
        { type: "Skylights", qty: 2, width: 2, height: 2, notes: "Vented" },
        { type: "Patio Doors", qty: 1, width: 6, height: 7, notes: "French style" },
      ],
      interiorColor: "Custom",
      exteriorColor: "Custom",
      colorDescription: "RAL 7016 Anthracite Grey",
      installRemoveOld: true,
      installHaulAway: true,
      installCleanup: true,
      ackMeasurements: true,
      ackSpecifications: true,
      ackPricing: true,
      ackTerms: true,
      ackInitials: "AC",
      notes: "Specialty order - 8 week lead time",
    },
  },
];

const CHANGE_ORDER_SCENARIOS = [
  {
    name: "Price increase - additional work",
    data: {
      changesDescription: "Customer requested tempered glass upgrade on all windows and additional trim work around living room window",
      priceChangeType: "increase",
      priceChangeAmount: 450,
      customerSignature: FAKE_SIG,
      customerSignatureDate: new Date().toISOString(),
      awpSignature: FAKE_SIG,
      awpSignatureDate: new Date().toISOString(),
    },
  },
  {
    name: "Price decrease - removed items",
    data: {
      changesDescription: "Removed garage window from scope per customer request",
      priceChangeType: "decrease",
      priceChangeAmount: 200,
      customerSignature: FAKE_SIG,
      customerSignatureDate: new Date().toISOString(),
      awpSignature: FAKE_SIG,
      awpSignatureDate: new Date().toISOString(),
    },
  },
  {
    name: "No price change - specification update",
    data: {
      changesDescription: "Changed kitchen window color from White to Light Tan per customer preference",
      priceChangeType: "no_change",
      priceChangeAmount: 0,
    },
  },
];

// ── Test Runner ──────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║        AWP Contract Integration Test Suite                  ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // ── Auth ────────────────────────────────────────────────────────────────
  console.log("━━━ 1. Authentication ━━━");

  const adminLoggedIn = await login("admin@awp.com", "admin123");
  assert(adminLoggedIn, "Admin login successful");

  // Verify session has correct role
  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookies },
  });
  const session = await sessionRes.json();
  assert(session.user?.role === "ADMIN", "Admin session has ADMIN role");

  // ── Create Contracts ────────────────────────────────────────────────────
  console.log("\n━━━ 2. Create Contracts ━━━");

  const createdContracts: any[] = [];

  for (const scenario of CONTRACT_SCENARIOS) {
    console.log(`\n  [${scenario.name}]`);

    const body = {
      ...scenario.contract,
      lineItems: scenario.lineItems,
    };

    const { status, data } = await api("/api/contracts", {
      method: "POST",
      body: JSON.stringify(body),
    });

    assert(status === 201, `Create contract: HTTP 201 (got ${status})`);
    assert(!!data.id, "Contract has ID");
    assert(!!data.contractNumber, "Contract has contractNumber");
    assert(!!data.accessToken, "Contract has accessToken for public sharing");
    assert(data.status === "DRAFT", "Contract status is DRAFT");
    assert(data.lineItems?.length === scenario.lineItems.length, `Has ${scenario.lineItems.length} line items`);

    // Verify pricing calculation
    let expectedTotal = 0;
    for (let i = 0; i < scenario.lineItems.length; i++) {
      const ep = expectedPrice(scenario.lineItems[i]);
      expectedTotal += ep;
      assertClose(data.lineItems[i].price, ep, `Line item ${i} price matches expected`);
    }
    expectedTotal = Math.round(expectedTotal * 100) / 100;
    assertClose(data.total, expectedTotal, "Contract total matches sum of items");

    const expDiscount = scenario.contract.discount || 0;
    const expContractTotal = Math.round((expectedTotal - expDiscount) * 100) / 100;
    assertClose(data.contractTotal, expContractTotal, "contractTotal = total - discount");

    const expDownPayment = scenario.contract.downPayment || 0;
    const expBalanceDue = Math.round((expContractTotal - expDownPayment) * 100) / 100;
    assertClose(data.balanceDue, expBalanceDue, "balanceDue = contractTotal - downPayment");

    createdContracts.push(data);
  }

  // ── Read back & verify persistence ──────────────────────────────────────
  console.log("\n━━━ 3. Verify Persistence (GET /api/contracts/[id]) ━━━");

  for (let i = 0; i < createdContracts.length; i++) {
    const c = createdContracts[i];
    const { status, data } = await api(`/api/contracts/${c.id}`);
    assert(status === 200, `Read contract ${i}: HTTP 200`);
    assert(data.customerName === CONTRACT_SCENARIOS[i].contract.customerName, `Contract ${i} customerName persisted`);
    assert(data.lineItems.length === CONTRACT_SCENARIOS[i].lineItems.length, `Contract ${i} lineItems count persisted`);
    assertClose(data.contractTotal, c.contractTotal, `Contract ${i} contractTotal persisted`);
    assert(data.accessToken === c.accessToken, `Contract ${i} accessToken persisted`);

    // Verify line item sort order
    for (let j = 0; j < data.lineItems.length; j++) {
      assert(data.lineItems[j].sortOrder === j, `Contract ${i} line item ${j} sortOrder = ${j}`);
    }
  }

  // ── List & Filter ───────────────────────────────────────────────────────
  console.log("\n━━━ 4. List & Filter Contracts ━━━");

  const { data: listAll } = await api("/api/contracts?limit=50");
  assert(listAll.contracts.length >= createdContracts.length, `List returns >= ${createdContracts.length} contracts`);
  assert(typeof listAll.stats.total === "number", "Stats include total count");
  assert(typeof listAll.stats.draft === "number", "Stats include draft count");
  assert(listAll.stats.draft >= createdContracts.length, `Draft count >= ${createdContracts.length}`);

  // Search by customer name
  const { data: searchResult } = await api("/api/contracts?search=Acme");
  assert(searchResult.contracts.some((c: any) => c.customerName === "Acme Corp"), "Search by name finds Acme Corp");

  // Filter by status
  const { data: draftFilter } = await api("/api/contracts?status=DRAFT&limit=50");
  assert(draftFilter.contracts.every((c: any) => c.status === "DRAFT"), "Status filter returns only DRAFT");

  // ── Update Draft Contract ───────────────────────────────────────────────
  console.log("\n━━━ 5. Update Draft Contracts (PATCH) ━━━");

  // Update contract 0 - change customer info and add a line item
  const contract0 = createdContracts[0];
  const updatedLineItems = [
    ...CONTRACT_SCENARIOS[0].lineItems,
    { location: "Kitchen", type: "Window", qty: 1, width: 3.5, height: 4, color: "Eclipse", series: "High Performance", frame: "Nail Fin", function: "Vent", temperedGlass: true },
  ];

  const { status: patchStatus, data: patchData } = await api(`/api/contracts/${contract0.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...CONTRACT_SCENARIOS[0].contract,
      customerName: "John Smith Jr.",
      measurementNotes: "Access through back gate",
      lineItems: updatedLineItems,
    }),
  });

  assert(patchStatus === 200, "PATCH returns 200");
  assert(patchData.customerName === "John Smith Jr.", "Customer name updated");
  assert(patchData.measurementNotes === "Access through back gate", "Notes updated");
  assert(patchData.lineItems.length === 3, "Line items updated to 3");

  // Verify new pricing after update
  let updatedExpectedTotal = 0;
  for (const item of updatedLineItems) {
    updatedExpectedTotal += expectedPrice(item);
  }
  updatedExpectedTotal = Math.round(updatedExpectedTotal * 100) / 100;
  assertClose(patchData.total, updatedExpectedTotal, "Updated total recalculated correctly");

  // Re-read to confirm persistence
  const { data: reRead } = await api(`/api/contracts/${contract0.id}`);
  assert(reRead.customerName === "John Smith Jr.", "Updated name persisted on re-read");
  assert(reRead.lineItems.length === 3, "Updated lineItems persisted on re-read");

  // Update contract 2 - change discount and down payment
  const contract2 = createdContracts[2];
  const { status: patch2Status, data: patch2Data } = await api(`/api/contracts/${contract2.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...CONTRACT_SCENARIOS[2].contract,
      discount: 50,
      downPayment: 100,
      lineItems: CONTRACT_SCENARIOS[2].lineItems,
    }),
  });

  assert(patch2Status === 200, "PATCH contract 2 returns 200");
  const exp2Total = expectedPrice(CONTRACT_SCENARIOS[2].lineItems[0]);
  assertClose(patch2Data.contractTotal, Math.round((exp2Total - 50) * 100) / 100, "Contract 2 contractTotal updated with new discount");
  assertClose(patch2Data.balanceDue, Math.round((exp2Total - 50 - 100) * 100) / 100, "Contract 2 balanceDue updated with new downPayment");

  // ── Submit Contracts ────────────────────────────────────────────────────
  console.log("\n━━━ 6. Submit Contracts ━━━");

  // Submit contract 1 (high-end with addons)
  const contract1 = createdContracts[1];
  const submitBody1 = {
    ...CONTRACT_SCENARIOS[1].contract,
    customerSignature: FAKE_SIG,
    customerSignatureDate: new Date().toISOString(),
    contractorSignature: FAKE_SIG,
    contractorSignatureDate: new Date().toISOString(),
    lineItems: CONTRACT_SCENARIOS[1].lineItems,
  };

  const { status: submitStatus1, data: submitData1 } = await api(`/api/contracts/${contract1.id}/submit`, {
    method: "POST",
    body: JSON.stringify(submitBody1),
  });

  assert(submitStatus1 === 200, `Submit contract 1: HTTP 200 (got ${submitStatus1})`);
  assert(submitData1.contract?.status === "COMPLETED", "Submitted contract status is COMPLETED");
  assert(!!submitData1.shareUrl, "Submit returns shareUrl");
  assert(submitData1.shareUrl.includes("/contracts/view/"), "ShareUrl is valid format");

  // Verify submitted contract persists with COMPLETED status
  const { data: submitted1 } = await api(`/api/contracts/${contract1.id}`);
  assert(submitted1.status === "COMPLETED", "Contract 1 persisted as COMPLETED");
  assert(!!submitted1.customerSignature, "Customer signature saved");
  assert(!!submitted1.contractorSignature, "Contractor signature saved");
  assert(!!submitted1.customerSignatureDate, "Customer signature date saved");
  assert(!!submitted1.contractorSignatureDate, "Contractor signature date saved");

  // Submit contract 3 (large commercial)
  const contract3 = createdContracts[3];
  const submitBody3 = {
    ...CONTRACT_SCENARIOS[3].contract,
    customerSignature: FAKE_SIG,
    contractorSignature: FAKE_SIG,
    lineItems: CONTRACT_SCENARIOS[3].lineItems,
  };

  const { status: submitStatus3, data: submitData3 } = await api(`/api/contracts/${contract3.id}/submit`, {
    method: "POST",
    body: JSON.stringify(submitBody3),
  });

  assert(submitStatus3 === 200, `Submit contract 3: HTTP 200 (got ${submitStatus3})`);
  assert(submitData3.contract?.status === "COMPLETED", "Contract 3 submitted as COMPLETED");

  // ── Submit Validation Errors ────────────────────────────────────────────
  console.log("\n━━━ 7. Submit Validation ━━━");

  const contract4 = createdContracts[4];

  // Missing customer name
  const { status: noName } = await api(`/api/contracts/${contract4.id}/submit`, {
    method: "POST",
    body: JSON.stringify({
      customerSignature: FAKE_SIG,
      contractorSignature: FAKE_SIG,
      lineItems: CONTRACT_SCENARIOS[4].lineItems,
    }),
  });
  assert(noName === 400, "Submit without customerName returns 400");

  // Missing customer signature
  const { status: noSig } = await api(`/api/contracts/${contract4.id}/submit`, {
    method: "POST",
    body: JSON.stringify({
      customerName: "Sarah Johnson",
      contractorSignature: FAKE_SIG,
      lineItems: CONTRACT_SCENARIOS[4].lineItems,
    }),
  });
  assert(noSig === 400, "Submit without customerSignature returns 400");

  // Missing contractor signature
  const { status: noCtrSig } = await api(`/api/contracts/${contract4.id}/submit`, {
    method: "POST",
    body: JSON.stringify({
      customerName: "Sarah Johnson",
      customerSignature: FAKE_SIG,
      lineItems: CONTRACT_SCENARIOS[4].lineItems,
    }),
  });
  assert(noCtrSig === 400, "Submit without contractorSignature returns 400");

  // No line items
  const { status: noItems } = await api(`/api/contracts/${contract4.id}/submit`, {
    method: "POST",
    body: JSON.stringify({
      customerName: "Sarah Johnson",
      customerSignature: FAKE_SIG,
      contractorSignature: FAKE_SIG,
      lineItems: [],
    }),
  });
  assert(noItems === 400, "Submit with empty lineItems returns 400");

  // ── Addendums ───────────────────────────────────────────────────────────
  console.log("\n━━━ 8. Create Addendums ━━━");

  const addendumContractId = contract1.id; // Use the completed contract
  const createdAddendums: any[] = [];

  for (const scenario of ADDENDUM_SCENARIOS) {
    console.log(`\n  [${scenario.name}]`);

    const { status, data } = await api(`/api/contracts/${addendumContractId}/addendum`, {
      method: "POST",
      body: JSON.stringify(scenario.data),
    });

    assert(status === 201, `Create addendum: HTTP 201 (got ${status})`);
    assert(!!data.id, "Addendum has ID");
    assert(data.contractId === addendumContractId, "Addendum linked to correct contract");

    // Verify data fields persisted
    if (scenario.data.products) {
      assert(Array.isArray(data.products), "Products stored as array");
      assert(data.products.length === scenario.data.products.length, `Products count = ${scenario.data.products.length}`);
    }
    if (scenario.data.interiorColor) {
      assert(data.interiorColor === scenario.data.interiorColor, `Interior color = ${scenario.data.interiorColor}`);
    }
    if (scenario.data.exteriorColor) {
      assert(data.exteriorColor === scenario.data.exteriorColor, `Exterior color = ${scenario.data.exteriorColor}`);
    }
    if (scenario.data.installRemoveOld) {
      assert(data.installRemoveOld === true, "Install checkbox persisted");
    }
    if (scenario.data.ackInitials) {
      assert(data.ackInitials === scenario.data.ackInitials, `Ack initials = ${scenario.data.ackInitials}`);
    }
    if (scenario.data.customerSignature) {
      assert(!!data.customerSignature, "Addendum customer signature saved");
    }

    createdAddendums.push(data);
  }

  // List addendums and verify
  console.log("\n  [List addendums]");
  const { status: addListStatus, data: addListData } = await api(`/api/contracts/${addendumContractId}/addendum`);
  assert(addListStatus === 200, "List addendums: HTTP 200");
  assert(addListData.length === ADDENDUM_SCENARIOS.length, `Listed ${ADDENDUM_SCENARIOS.length} addendums`);

  // Verify addendums appear in contract detail
  const { data: contractWithAddendums } = await api(`/api/contracts/${addendumContractId}`);
  assert(contractWithAddendums.addendums.length === ADDENDUM_SCENARIOS.length, "Addendums included in contract detail");

  // ── Change Orders ───────────────────────────────────────────────────────
  console.log("\n━━━ 9. Create Change Orders ━━━");

  const changeOrderContractId = contract1.id;
  const createdChangeOrders: any[] = [];

  // Snapshot the contract total before change orders
  const { data: preCO } = await api(`/api/contracts/${changeOrderContractId}`);
  let runningContractTotal = preCO.contractTotal;
  let runningBalanceDue = preCO.balanceDue;
  const contractDownPayment = preCO.downPayment;

  for (const scenario of CHANGE_ORDER_SCENARIOS) {
    console.log(`\n  [${scenario.name}]`);

    const { status, data } = await api(`/api/contracts/${changeOrderContractId}/change-order`, {
      method: "POST",
      body: JSON.stringify(scenario.data),
    });

    assert(status === 201, `Create change order: HTTP 201 (got ${status})`);
    assert(!!data.id, "Change order has ID");
    assert(!!data.changeOrderNumber, "Has change order number");
    assert(data.changeOrderNumber.startsWith("CO-"), "CO number starts with CO-");
    assert(data.contractId === changeOrderContractId, "CO linked to correct contract");
    assertClose(data.originalPrice, runningContractTotal, "Original price matches contract total before CO");

    // Verify price calculations
    const amount = scenario.data.priceChangeAmount || 0;
    if (scenario.data.priceChangeType === "increase") {
      assertClose(data.newPrice, runningContractTotal + amount, "New price = original + increase");
      runningContractTotal = runningContractTotal + amount;
    } else if (scenario.data.priceChangeType === "decrease") {
      assertClose(data.newPrice, runningContractTotal - amount, "New price = original - decrease");
      runningContractTotal = runningContractTotal - amount;
    } else {
      assertClose(data.newPrice, runningContractTotal, "New price unchanged for no_change type");
    }

    const expectedBalanceDue = Math.max(0, data.newPrice - contractDownPayment);
    assertClose(data.newBalanceDue, expectedBalanceDue, "CO newBalanceDue = newPrice - downPayment");
    runningBalanceDue = expectedBalanceDue;

    if (scenario.data.customerSignature) {
      assert(!!data.customerSignature, "CO customer signature saved");
    }

    createdChangeOrders.push(data);
  }

  // Verify sequential numbering
  console.log("\n  [Verify sequential numbering]");
  assert(createdChangeOrders[0].changeOrderNumber.endsWith("-1"), "First CO number ends with -1");
  assert(createdChangeOrders[1].changeOrderNumber.endsWith("-2"), "Second CO number ends with -2");
  assert(createdChangeOrders[2].changeOrderNumber.endsWith("-3"), "Third CO number ends with -3");

  // Verify parent contract was updated by price-changing COs
  console.log("\n  [Verify parent contract updated by COs]");
  const { data: postCO } = await api(`/api/contracts/${changeOrderContractId}`);
  assertClose(postCO.contractTotal, runningContractTotal, "Parent contract total reflects all COs");
  assertClose(postCO.balanceDue, runningBalanceDue, "Parent contract balanceDue reflects all COs");

  // List change orders
  const { data: coList } = await api(`/api/contracts/${changeOrderContractId}/change-order`);
  assert(coList.length === CHANGE_ORDER_SCENARIOS.length, `Listed ${CHANGE_ORDER_SCENARIOS.length} change orders`);

  // Verify change orders in contract detail
  assert(postCO.changeOrders.length === CHANGE_ORDER_SCENARIOS.length, "Change orders included in contract detail");

  // ── Multiple COs on same contract - cumulative pricing ──────────────────
  console.log("\n━━━ 10. Cumulative Change Order Pricing ━━━");

  // The contract total should now be: original + 450 (increase) - 200 (decrease) = original + 250
  const originalContractTotal = preCO.contractTotal;
  const expectedFinal = originalContractTotal + 450 - 200; // no_change doesn't affect it
  assertClose(postCO.contractTotal, expectedFinal, `Final total = original(${originalContractTotal}) + 450 - 200 = ${expectedFinal}`);

  // ── Public Access Token ────────────────────────────────────────────────
  console.log("\n━━━ 11. Public Access Token ━━━");

  // Get the access token for a completed contract
  const accessToken = submitted1.accessToken;
  assert(!!accessToken, "Contract has access token");

  // Fetch via public endpoint (no auth cookies)
  const publicRes = await fetch(`${BASE}/api/contracts/public/${accessToken}`);
  const publicData = await publicRes.json();
  assert(publicRes.status === 200, "Public endpoint returns 200");
  assert(publicData.customerName === CONTRACT_SCENARIOS[1].contract.customerName, "Public endpoint returns customer name");
  assert(publicData.lineItems.length === CONTRACT_SCENARIOS[1].lineItems.length, "Public endpoint returns line items");
  assert(!publicData.userId, "Public endpoint strips userId (privacy)");

  // ── Auth Guard ──────────────────────────────────────────────────────────
  console.log("\n━━━ 12. Auth Guards ━━━");

  // Try API calls without auth (middleware redirects before API handler runs)
  const noAuthRes = await fetch(`${BASE}/api/contracts`, {
    headers: { "Content-Type": "application/json" },
    redirect: "manual",
  });
  assert(noAuthRes.status === 307 || noAuthRes.status === 401, "GET /api/contracts without auth is blocked (307 redirect or 401)");

  const noAuthCreate = await fetch(`${BASE}/api/contracts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerName: "Hacker" }),
    redirect: "manual",
  });
  assert(noAuthCreate.status === 307 || noAuthCreate.status === 401, "POST /api/contracts without auth is blocked (307 redirect or 401)");

  // ── Sales User Scope ───────────────────────────────────────────────────
  console.log("\n━━━ 13. Sales User Scope ━━━");

  // Login as sales user
  const salesLoggedIn = await login("sales@awp.com", "sales123");
  assert(salesLoggedIn, "Sales user login successful");

  // Sales user should see only their own contracts (none, since we created as admin)
  const { data: salesList } = await api("/api/contracts?limit=50");
  const salesContractIds = salesList.contracts.map((c: any) => c.id);
  const adminContractIds = createdContracts.map((c: any) => c.id);
  const overlap = adminContractIds.filter((id: string) => salesContractIds.includes(id));
  assert(overlap.length === 0, "Sales user cannot see admin-created contracts");

  // Sales user creates their own contract
  const salesContract = {
    customerName: "Sales Test Customer",
    customerPhone: "801-555-7777",
    jobAddress: "999 Sales Way",
    lineItems: [
      { location: "Room 1", type: "Window", qty: 1, width: 3, height: 4, color: "White", series: "Patriot", frame: "Nail Fin", function: "Slider" },
    ],
    discount: 0,
    downPayment: 0,
  };

  const { status: salesCreateStatus, data: salesCreateData } = await api("/api/contracts", {
    method: "POST",
    body: JSON.stringify(salesContract),
  });
  assert(salesCreateStatus === 201, "Sales user can create contracts");

  // Sales user can see their own contract
  const { data: salesList2 } = await api("/api/contracts?limit=50");
  assert(salesList2.contracts.some((c: any) => c.id === salesCreateData.id), "Sales user sees their own contract");

  // Switch back to admin
  await login("admin@awp.com", "admin123");

  // Admin can see the sales user's contract
  const { data: adminList } = await api("/api/contracts?limit=50");
  assert(adminList.contracts.some((c: any) => c.id === salesCreateData.id), "Admin can see sales user's contract");

  // ── Pricing API ─────────────────────────────────────────────────────────
  console.log("\n━━━ 14. Pricing API ━━━");

  const pricingBody = {
    lineItems: [
      { qty: 2, width: 3, height: 4, color: "White", series: "Patriot", frame: "Nail Fin", function: "Slider" },
      { qty: 1, width: 4, height: 5, color: "Eclipse", series: "Signature", frame: "Flush Fin", function: "Eyebrow", temperedGlass: true, wrap: true },
    ],
    discount: 100,
    downPayment: 500,
  };

  const { status: priceStatus, data: priceData } = await api("/api/pricing/calculate", {
    method: "POST",
    body: JSON.stringify(pricingBody),
  });

  assert(priceStatus === 200, "Pricing API returns 200");

  // Verify each item price
  const ep0 = expectedPrice(pricingBody.lineItems[0]);
  const ep1 = expectedPrice(pricingBody.lineItems[1]);
  assertClose(priceData.itemPrices[0], ep0, `Pricing API item 0 = ${ep0}`);
  assertClose(priceData.itemPrices[1], ep1, `Pricing API item 1 = ${ep1}`);
  assertClose(priceData.total, ep0 + ep1, "Pricing API total matches");
  assertClose(priceData.contractTotal, ep0 + ep1 - 100, "Pricing API contractTotal with discount");
  assertClose(priceData.balanceDue, ep0 + ep1 - 100 - 500, "Pricing API balanceDue with downPayment");

  // ── Cross-Contract Consistency ──────────────────────────────────────────
  console.log("\n━━━ 15. Cross-Contract Data Consistency ━━━");

  // Re-fetch all contracts and verify data integrity
  for (let i = 0; i < createdContracts.length; i++) {
    const { data: final } = await api(`/api/contracts/${createdContracts[i].id}`);

    // Total should always equal sum of line item prices
    const itemSum = final.lineItems.reduce((sum: number, li: any) => sum + li.price, 0);
    assertClose(final.total, Math.round(itemSum * 100) / 100, `Contract ${i} total = sum of line items`);

    // Balance due should never be negative (except change orders may push it)
    // For contracts without COs, verify standard formula
    if (final.changeOrders.length === 0) {
      const expectedCT = Math.round((final.total - final.discount) * 100) / 100;
      assertClose(final.contractTotal, expectedCT, `Contract ${i} contractTotal = total - discount`);
      const expectedBD = Math.round((expectedCT - final.downPayment) * 100) / 100;
      assertClose(final.balanceDue, expectedBD, `Contract ${i} balanceDue = contractTotal - downPayment`);
    }

    // Line items should have sequential sort orders
    for (let j = 0; j < final.lineItems.length; j++) {
      assert(final.lineItems[j].sortOrder === j, `Contract ${i} line item ${j} has correct sortOrder`);
    }
  }

  // ── 404 and Edge Cases ──────────────────────────────────────────────────
  console.log("\n━━━ 16. Edge Cases & Error Handling ━━━");

  // Non-existent contract
  const { status: notFound } = await api("/api/contracts/nonexistent-id-12345");
  assert(notFound === 404, "Non-existent contract returns 404");

  // Addendum on non-existent contract
  const { status: addNotFound } = await api("/api/contracts/nonexistent-id-12345/addendum", {
    method: "POST",
    body: JSON.stringify({ notes: "test" }),
  });
  assert(addNotFound === 404, "Addendum on non-existent contract returns 404");

  // Change order on non-existent contract
  const { status: coNotFound } = await api("/api/contracts/nonexistent-id-12345/change-order", {
    method: "POST",
    body: JSON.stringify({ changesDescription: "test", priceChangeType: "no_change" }),
  });
  assert(coNotFound === 404, "Change order on non-existent contract returns 404");

  // Public endpoint with bad token
  const badTokenRes = await fetch(`${BASE}/api/contracts/public/bad-token-12345`);
  assert(badTokenRes.status === 404, "Public endpoint with bad token returns 404");

  // ── Cleanup Summary ─────────────────────────────────────────────────────
  console.log("\n━━━ 17. Final Data Integrity Check ━━━");

  // Verify the database has the expected counts
  const { data: finalList } = await api("/api/contracts?limit=100");
  const testContractIds = [...createdContracts.map((c: any) => c.id), salesCreateData.id];
  const foundIds = finalList.contracts.filter((c: any) => testContractIds.includes(c.id));
  assert(foundIds.length === testContractIds.length, `All ${testContractIds.length} test contracts still exist in DB`);

  // Verify completed contracts have correct status
  const completedIds = [contract1.id, contract3.id];
  for (const cid of completedIds) {
    const found = finalList.contracts.find((c: any) => c.id === cid);
    assert(found?.status === "COMPLETED", `Contract ${cid.slice(0, 8)} remains COMPLETED`);
  }

  // Verify draft contracts have correct status
  const draftIds = [contract0.id, contract2.id, contract4.id, salesCreateData.id];
  for (const did of draftIds) {
    const found = finalList.contracts.find((c: any) => c.id === did);
    assert(found?.status === "DRAFT", `Contract ${did.slice(0, 8)} remains DRAFT`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Summary
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                     TEST RESULTS                           ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log(`║  Passed: ${String(passCount).padStart(4)}                                              ║`);
  console.log(`║  Failed: ${String(failCount).padStart(4)}                                              ║`);
  console.log(`║  Total:  ${String(passCount + failCount).padStart(4)}                                              ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");

  if (failures.length > 0) {
    console.log("\nFailed assertions:");
    for (const f of failures) {
      console.log(`  ✗ ${f}`);
    }
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
