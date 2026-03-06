// HubSpot CRM integration
// Ported from ezcontract/includes/class-awp-hubspot.php

import { Client } from "@hubspot/api-client";
import type { Contract, Addendum, ChangeOrder, LineItem } from "@/generated/prisma/client";

export type ContractStatus = "DRAFT" | "PENDING_SIGNATURE" | "SIGNED" | "COMPLETED";

interface LineItemData {
  location: string | null;
  type: string;
  qty: number;
  width: number;
  height: number;
  color: string;
  series: string;
  frame: string;
  function: string;
  temperedGlass: boolean;
  obscuredGlass: boolean;
  customShape: boolean;
  wrap: boolean;
  coated: boolean;
  awpShutterRnr: boolean;
  price: number;
}

interface ContractData {
  id: string;
  contractNumber: string;
  status: ContractStatus;

  // Customer
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerPhoneAlt: string | null;
  jobAddress: string | null;
  billingAddress: string | null;
  customerCity: string | null;
  customerZip: string | null;
  customerState: string | null;

  // Job Details
  salesman: string | null;
  measuredBy: string | null;
  leadTest: string | null;
  yearBuilt: string | null;
  houseType: string | null;
  measurementNotes: string | null;
  preferredCommunication: string | null;

  // Pricing
  total: number;
  discount: number;
  contractTotal: number;
  downPayment: number;
  balanceDue: number;
  financeBalance: number;
  wfebAccount: string | null;

  // Payment
  paymentMethod: string | null;
  downPaymentMethod: string | null;
  financingOption: string | null;
  financingLoanId: string | null;
  financingPlan: string | null;

  // Marketing
  planNumber: string | null;
  authNumber: string | null;
  marketingSource: unknown;

  // Notes
  paymentNotes: string | null;
  contractNotes: string | null;
  customerNotes: string | null;

  // Window details
  windowsBeingRemoved: string | null;

  // Application surfaces
  brickApplicationQty: number;
  stuccoApplicationQty: number;
  sidingApplicationQty: number;
  foundationApplicationQty: number;
  woodApplicationQty: number;

  // Signatures
  customerSignatureDate: Date | null;

  // Commission
  commissionAmount: number | null;

  // HubSpot
  hubspotContactId?: string | null;
  hubspotDealId?: string | null;

  // PDF
  pdfUrl: string | null;

  // Relations
  lineItems: Array<LineItemData>;
}

interface AddendumData {
  id: string;
  products: unknown;
  interiorColor: string | null;
  exteriorColor: string | null;
  colorDescription: string | null;
  installRemoveOld: boolean;
  installHaulAway: boolean;
  installInteriorTrim: boolean;
  installExteriorTrim: boolean;
  installCaulkSeal: boolean;
  installScreens: boolean;
  installHardware: boolean;
  installWeatherstrip: boolean;
  installCleanup: boolean;
  installOther: boolean;
  installNotes: string | null;
  ackMeasurements: boolean;
  ackSpecifications: boolean;
  ackPricing: boolean;
  ackTerms: boolean;
  ackInitials: string | null;
  referralName: string | null;
  referralPhone: string | null;
  notes: string | null;
  customerSignature: string | null;
  customerSignatureDate: Date | null;
  contractorSignature: string | null;
  contractorSignatureDate: Date | null;
  pdfUrl: string | null;
  createdAt: Date;
}

interface ChangeOrderData {
  id: string;
  changeOrderNumber: string;
  changesDescription: string | null;
  priceChangeType: string;
  priceChangeAmount: number;
  originalPrice: number;
  newPrice: number;
  newBalanceDue: number;
  customerSignature: string | null;
  customerSignatureDate: Date | null;
  awpSignature: string | null;
  awpSignatureDate: Date | null;
  pdfUrl: string | null;
  createdAt: Date;
}

// ─── Helpers ────────────────────────────────────────────────

function parseCustomerName(fullName: string | null): {
  firstName: string;
  lastName: string;
} {
  if (!fullName) return { firstName: "", lastName: "" };
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().split("T")[0];
}

async function isHubSpotSyncEnabled(): Promise<boolean> {
  const { db } = await import("@/lib/db");
  const setting = await db.setting.findUnique({ where: { key: "hubspot_sync_enabled" } });
  return setting?.value === "true";
}

// ─── Line Item Aggregations ─────────────────────────────────

export function computeLineItemAggregations(items: LineItemData[]) {
  const agg = {
    numberOfWindows: 0,
    numberOfDoors: 0,
    numberOfIGs: 0,
    numberOfPetDoors: 0,
    numberOfStorms: 0,
    costOfWindows: 0,
    costOfDoors: 0,
    temperedGlassQty: 0,
    obscuredGlassQty: 0,
    coatedQty: 0,
    customShapesQty: 0,
    wrapQty: 0,
    patriotQty: 0,
    highPerformanceQty: 0,
    autographQty: 0,
    signatureQty: 0,
    imperialQty: 0,
    nailFinQty: 0,
    flushFinQty: 0,
    frameOverQty: 0,
    sliderQty: 0,
    pictureQty: 0,
    doubleVentQty: 0,
    eyebrowQty: 0,
    windowType: "No",
    windowColor: "",
  };

  const colorCounts: Record<string, number> = {};

  for (const item of items) {
    // type
    if (item.type === "Window") {
      agg.numberOfWindows += item.qty;
      agg.costOfWindows += item.price;
    } else if (item.type === "Door") {
      agg.numberOfDoors += item.qty;
      agg.costOfDoors += item.price;
    } else if (item.type === "IG") {
      agg.numberOfIGs += item.qty;
    } else if (item.type === "Pet Door") {
      agg.numberOfPetDoors += item.qty;
    } else if (item.type === "Storm") {
      agg.numberOfStorms += item.qty;
    }

    // boolean addons
    if (item.temperedGlass) agg.temperedGlassQty += item.qty;
    if (item.obscuredGlass) agg.obscuredGlassQty += item.qty;
    if (item.coated) {
      agg.coatedQty += item.qty;
      agg.windowType = "Yes";
    }
    if (item.customShape) agg.customShapesQty += item.qty;
    if (item.wrap) agg.wrapQty += item.qty;

    // series
    if (item.series === "Patriot") agg.patriotQty += item.qty;
    else if (item.series === "High Performance") agg.highPerformanceQty += item.qty;
    else if (item.series === "Autograph") agg.autographQty += item.qty;
    else if (item.series === "Signature") agg.signatureQty += item.qty;
    else if (item.series === "Imperial") agg.imperialQty += item.qty;

    // frame
    if (item.frame === "Nail Fin") agg.nailFinQty += item.qty;
    else if (item.frame === "Flush Fin") agg.flushFinQty += item.qty;
    else if (item.frame === "Frame Over") agg.frameOverQty += item.qty;

    // function
    if (item.function.includes("Slider")) agg.sliderQty += item.qty;
    if (item.function === "Picture") agg.pictureQty += item.qty;
    if (item.function === "Double Vent") agg.doubleVentQty += item.qty;
    if (item.function === "Eyebrow" || item.function.includes("Eyebrow")) agg.eyebrowQty += item.qty;

    // color tracking
    colorCounts[item.color] = (colorCounts[item.color] || 0) + item.qty;
  }

  // Most frequent color
  let maxCount = 0;
  for (const [color, count] of Object.entries(colorCounts)) {
    if (count > maxCount) {
      maxCount = count;
      agg.windowColor = color;
    }
  }

  return agg;
}

// ─── Deal Property Builder ──────────────────────────────────

const paymentMethodMap: Record<string, string> = {
  cash: "Cash",
  check: "Check",
  finance: "Financing",
  credit_card: "Credit Card",
  ach: "ACH",
};

export function buildDealProperties(contract: ContractData): Record<string, string> {
  const { firstName, lastName } = parseCustomerName(contract.customerName);
  const agg = computeLineItemAggregations(contract.lineItems);

  return {
    dealname: `Contract - ${contract.customerName || "Unknown"} (${contract.contractNumber})`,
    amount: String(contract.contractTotal),
    dealstage: "closedwon",
    pipeline: "Active",
    // Contact info
    first_name: firstName,
    last_name: lastName,
    email: contract.customerEmail || "",
    main_phone_number: contract.customerPhone || "",
    secondary_phone_number: contract.customerPhoneAlt || "",
    // Property
    property_street: contract.jobAddress || "",
    property_city: contract.customerCity || "",
    property_state: contract.customerState || "",
    property_postal_code: contract.customerZip || "",
    // Sales
    sales_rep: contract.salesman || "",
    measured_by: contract.measuredBy || "",
    preferred_communication_method: contract.preferredCommunication || "",
    lead_test: contract.leadTest || "",
    plan_number: contract.planNumber || "",
    auth_number: contract.authNumber || "",
    // Home
    year_home_was_built: contract.yearBuilt || "",
    // Contract
    temporary_contract_amount: String(contract.total),
    original_contract_signed_date: formatDate(contract.customerSignatureDate),
    // Payment
    payment_method: paymentMethodMap[contract.paymentMethod || ""] || contract.paymentMethod || "",
    commission: contract.commissionAmount != null ? String(contract.commissionAmount) : "",
    "down_payment___method": contract.downPaymentMethod || "",
    down_payment_amount: String(contract.downPayment),
    // Financing
    financing_option: contract.financingOption || "",
    financed_amount: String(contract.financeBalance),
    financing_account_number: contract.wfebAccount || "",
    financing_loan_id: contract.financingLoanId || "",
    financing_plan: contract.financingPlan || "",
    // Notes
    payment_notes: contract.paymentNotes || "",
    contract_notes: contract.contractNotes || "",
    customer_notes_preferences: contract.customerNotes || "",
    // Window details
    window_type: agg.windowType,
    window_color: agg.windowColor,
    windows_being_removed: contract.windowsBeingRemoved || "",
    // Application surfaces
    brick_applications: String(contract.brickApplicationQty),
    "stucco_application__": String(contract.stuccoApplicationQty),
    "siding_application__": String(contract.sidingApplicationQty),
    "foundation_application__": String(contract.foundationApplicationQty),
    "wood_application__": String(contract.woodApplicationQty),
    // Counts
    number_of_windows: String(agg.numberOfWindows),
    number_of_doors: String(agg.numberOfDoors),
    of_igs_ig_only_no_frame: String(agg.numberOfIGs),
    pet_door_qty: String(agg.numberOfPetDoors),
    storms_qty: String(agg.numberOfStorms),
    cost_of_windows: String(agg.costOfWindows),
    cost_of_doors: String(agg.costOfDoors),
    // Addon quantities
    tempered_glass_qty: String(agg.temperedGlassQty),
    obscured_glass_qty: String(agg.obscuredGlassQty),
    coated_qty: String(agg.coatedQty),
    custom_shapes_qty: String(agg.customShapesQty),
    "wraps__": String(agg.wrapQty),
    // Series quantities
    awp_patriot_qty: String(agg.patriotQty),
    awp_high_performance_qty: String(agg.highPerformanceQty),
    ww_autograph_qty: String(agg.autographQty),
    ww_signature_qty: String(agg.signatureQty),
    awp_imperial_casement_qty: String(agg.imperialQty),
    // Frame quantities
    nail_fin_qty: String(agg.nailFinQty),
    flush_fin_qty: String(agg.flushFinQty),
    frame_over_qty: String(agg.frameOverQty),
    // Function quantities
    slider_qty: String(agg.sliderQty),
    picture_qty: String(agg.pictureQty),
    double_vent_qty: String(agg.doubleVentQty),
    eyebrow_qty: String(agg.eyebrowQty),
  };
}

// ─── HubSpot API Operations ────────────────────────────────

export async function testConnection(accessToken: string): Promise<boolean> {
  const client = new Client({ accessToken });
  try {
    const response = await client.crm.contacts.basicApi.getPage(1);
    return response !== undefined;
  } catch {
    return false;
  }
}

export async function upsertContact(
  client: Client,
  contract: ContractData
): Promise<string> {
  const { firstName, lastName } = parseCustomerName(contract.customerName);

  // Search for existing contact by email
  if (contract.customerEmail) {
    try {
      const searchResponse = await client.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "email",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                operator: "EQ" as any,
                value: contract.customerEmail,
              },
            ],
          },
        ],
        properties: ["email", "firstname", "lastname"],
        limit: 1,
        after: "0",
        sorts: [],
      });

      if (searchResponse.results.length > 0) {
        const contactId = searchResponse.results[0].id;
        // Update existing contact
        await client.crm.contacts.basicApi.update(contactId, {
          properties: {
            firstname: firstName,
            lastname: lastName,
            phone: contract.customerPhone || "",
            mobilephone: contract.customerPhoneAlt || "",
            address: contract.jobAddress || "",
            city: contract.customerCity || "",
            zip: contract.customerZip || "",
          },
        });
        return contactId;
      }
    } catch {
      // Contact not found, will create
    }
  }

  // Create new contact
  const createResponse = await client.crm.contacts.basicApi.create({
    properties: {
      email: contract.customerEmail || "",
      firstname: firstName,
      lastname: lastName,
      phone: contract.customerPhone || "",
      mobilephone: contract.customerPhoneAlt || "",
      address: contract.jobAddress || "",
      city: contract.customerCity || "",
      zip: contract.customerZip || "",
      awp_billing_address: contract.billingAddress || "",
    },
    associations: [],
  });

  return createResponse.id;
}

export async function createDeal(
  client: Client,
  contract: ContractData,
  contactId: string
): Promise<string> {
  const dealResponse = await client.crm.deals.basicApi.create({
    properties: buildDealProperties(contract),
    associations: [
      {
        to: { id: contactId },
        types: [
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            associationCategory: "HUBSPOT_DEFINED" as any,
            associationTypeId: 3, // Deal to Contact
          },
        ],
      },
    ],
  });

  return dealResponse.id;
}

export async function addLineItems(
  client: Client,
  contract: ContractData,
  dealId: string
): Promise<void> {
  const inputs = contract.lineItems.map((item) => {
    const details = [
      `${item.width}"W x ${item.height}"H`,
      item.color,
      item.series,
      item.frame,
      item.function,
      item.temperedGlass ? "Tempered" : "",
      item.obscuredGlass ? "Obscured" : "",
      item.coated ? "Coated" : "",
      item.wrap ? "Wrap" : "",
      item.customShape ? "Custom Shape" : "",
    ]
      .filter(Boolean)
      .join(" | ");

    return {
      properties: {
        name: `${item.location || "Item"} - ${item.type}`,
        quantity: String(item.qty),
        price: String(item.price),
        description: details,
      },
      associations: [
        {
          to: { id: dealId },
          types: [
            {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              associationCategory: "HUBSPOT_DEFINED" as any,
              associationTypeId: 20, // Line Item to Deal
            },
          ],
        },
      ],
    };
  });

  // Batch in chunks of 100 (HubSpot API limit)
  for (let i = 0; i < inputs.length; i += 100) {
    await client.crm.lineItems.batchApi.create({ inputs: inputs.slice(i, i + 100) });
  }
}

export async function attachPdfNote(
  client: Client,
  contract: ContractData,
  dealId: string
): Promise<void> {
  if (!contract.pdfUrl) return;

  const pdfFullUrl = `${process.env.NEXTAUTH_URL || ""}${contract.pdfUrl}`;

  await client.crm.objects.notes.basicApi.create({
    properties: {
      hs_note_body: `Contract PDF: ${pdfFullUrl}`,
      hs_timestamp: new Date().toISOString(),
    },
    associations: [
      {
        to: { id: dealId },
        types: [
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            associationCategory: "HUBSPOT_DEFINED" as any,
            associationTypeId: 214, // Note to Deal
          },
        ],
      },
    ],
  });
}

// ─── Addendum Sync ──────────────────────────────────────────

function formatAddendumNote(addendum: AddendumData): string {
  const sections: string[] = [];

  sections.push(`# Addendum - ${addendum.createdAt.toLocaleDateString()}\n`);

  if (addendum.products) {
    sections.push(`## Products`);
    sections.push(`\`\`\`json\n${JSON.stringify(addendum.products, null, 2)}\n\`\`\`\n`);
  }

  sections.push(`## Colors`);
  sections.push(`- Interior Color: ${addendum.interiorColor || "N/A"}`);
  sections.push(`- Exterior Color: ${addendum.exteriorColor || "N/A"}`);
  sections.push(`- Color Description: ${addendum.colorDescription || "N/A"}\n`);

  sections.push(`## Installation Services`);
  sections.push(`- Remove Old: ${addendum.installRemoveOld ? "Yes" : "No"}`);
  sections.push(`- Haul Away: ${addendum.installHaulAway ? "Yes" : "No"}`);
  sections.push(`- Interior Trim: ${addendum.installInteriorTrim ? "Yes" : "No"}`);
  sections.push(`- Exterior Trim: ${addendum.installExteriorTrim ? "Yes" : "No"}`);
  sections.push(`- Caulk & Seal: ${addendum.installCaulkSeal ? "Yes" : "No"}`);
  sections.push(`- Screens: ${addendum.installScreens ? "Yes" : "No"}`);
  sections.push(`- Hardware: ${addendum.installHardware ? "Yes" : "No"}`);
  sections.push(`- Weatherstrip: ${addendum.installWeatherstrip ? "Yes" : "No"}`);
  sections.push(`- Cleanup: ${addendum.installCleanup ? "Yes" : "No"}`);
  sections.push(`- Other: ${addendum.installOther ? "Yes" : "No"}`);
  if (addendum.installNotes) {
    sections.push(`- Installation Notes: ${addendum.installNotes}`);
  }
  sections.push("");

  sections.push(`## Acknowledgements`);
  sections.push(`- Measurements: ${addendum.ackMeasurements ? "Acked" : "Not Acked"}`);
  sections.push(`- Specifications: ${addendum.ackSpecifications ? "Acked" : "Not Acked"}`);
  sections.push(`- Pricing: ${addendum.ackPricing ? "Acked" : "Not Acked"}`);
  sections.push(`- Terms: ${addendum.ackTerms ? "Acked" : "Not Acked"}`);
  if (addendum.ackInitials) {
    sections.push(`- Initials: ${addendum.ackInitials}`);
  }
  sections.push("");

  if (addendum.referralName || addendum.referralPhone) {
    sections.push(`## Referral`);
    sections.push(`- Name: ${addendum.referralName || "N/A"}`);
    sections.push(`- Phone: ${addendum.referralPhone || "N/A"}\n`);
  }

  if (addendum.notes) {
    sections.push(`## Notes`);
    sections.push(addendum.notes);
  }

  if (addendum.pdfUrl) {
    const pdfFullUrl = `${process.env.NEXTAUTH_URL || ""}${addendum.pdfUrl}`;
    sections.push(`\n## PDF`);
    sections.push(`[View Addendum PDF](${pdfFullUrl})`);
  }

  sections.push(`\n---`);
  sections.push(`*Customer Signed: ${addendum.customerSignatureDate ? addendum.customerSignatureDate.toLocaleString() : "Not signed"}*`);
  sections.push(`*Contractor Signed: ${addendum.contractorSignatureDate ? addendum.contractorSignatureDate.toLocaleString() : "Not signed"}*`);

  return sections.join("\n");
}

export async function syncAddendum(
  addendum: AddendumData,
  contract: { hubspotDealId: string | null; customerName: string | null },
  accessToken: string
): Promise<{ noteId: string } | null> {
  if (!contract.hubspotDealId) {
    console.warn("Cannot sync addendum: no HubSpot deal ID");
    return null;
  }

  const syncEnabled = await isHubSpotSyncEnabled();
  if (!syncEnabled) {
    console.log("[HubSpot DRY RUN] Would sync addendum for deal:", contract.hubspotDealId);
    return null;
  }

  const client = new Client({ accessToken });

  const noteContent = formatAddendumNote(addendum);

  const noteResponse = await client.crm.objects.notes.basicApi.create({
    properties: {
      hs_note_body: noteContent,
      hs_timestamp: new Date().toISOString(),
    },
    associations: [
      {
        to: { id: contract.hubspotDealId },
        types: [
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            associationCategory: "HUBSPOT_DEFINED" as any,
            associationTypeId: 214, // Note to Deal
          },
        ],
      },
    ],
  });

  return { noteId: noteResponse.id };
}

// ─── Change Order Sync ──────────────────────────────────────

function formatChangeOrderNote(changeOrder: ChangeOrderData): string {
  const sections: string[] = [];

  sections.push(`# Change Order - ${changeOrder.changeOrderNumber}\n`);
  sections.push(`**Created:** ${changeOrder.createdAt.toLocaleDateString()}\n`);

  if (changeOrder.changesDescription) {
    sections.push(`## Description`);
    sections.push(changeOrder.changesDescription);
    sections.push("");
  }

  sections.push(`## Price Change`);
  sections.push(`- Type: ${changeOrder.priceChangeType.toUpperCase()}`);
  sections.push(`- Change Amount: $${changeOrder.priceChangeAmount.toFixed(2)}`);
  sections.push(`- Original Price: $${changeOrder.originalPrice.toFixed(2)}`);
  sections.push(`- New Price: $${changeOrder.newPrice.toFixed(2)}`);
  sections.push(`- New Balance Due: $${changeOrder.newBalanceDue.toFixed(2)}\n`);

  if (changeOrder.pdfUrl) {
    const pdfFullUrl = `${process.env.NEXTAUTH_URL || ""}${changeOrder.pdfUrl}`;
    sections.push(`## PDF`);
    sections.push(`[View Change Order PDF](${pdfFullUrl})`);
  }

  sections.push(`\n---`);
  sections.push(`*Customer Signed: ${changeOrder.customerSignatureDate ? changeOrder.customerSignatureDate.toLocaleString() : "Not signed"}*`);
  sections.push(`*AWP Signed: ${changeOrder.awpSignatureDate ? changeOrder.awpSignatureDate.toLocaleString() : "Not signed"}*`);

  return sections.join("\n");
}

export async function syncChangeOrder(
  changeOrder: ChangeOrderData,
  contract: { hubspotDealId: string | null; contractTotal: number },
  accessToken: string
): Promise<{ noteId: string; dealUpdated: boolean } | null> {
  if (!contract.hubspotDealId) {
    console.warn("Cannot sync change order: no HubSpot deal ID");
    return null;
  }

  const syncEnabled = await isHubSpotSyncEnabled();
  if (!syncEnabled) {
    console.log("[HubSpot DRY RUN] Would sync change order for deal:", contract.hubspotDealId);
    return null;
  }

  const client = new Client({ accessToken });

  // Create note with change order details
  const noteContent = formatChangeOrderNote(changeOrder);
  const noteResponse = await client.crm.objects.notes.basicApi.create({
    properties: {
      hs_note_body: noteContent,
      hs_timestamp: new Date().toISOString(),
    },
    associations: [
      {
        to: { id: contract.hubspotDealId },
        types: [
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            associationCategory: "HUBSPOT_DEFINED" as any,
            associationTypeId: 214, // Note to Deal
          },
        ],
      },
    ],
  });

  // Update deal amount if price changed
  let dealUpdated = false;
  if (changeOrder.priceChangeType !== "no_change" && changeOrder.newPrice) {
    await client.crm.deals.basicApi.update(contract.hubspotDealId, {
      properties: {
        amount: String(changeOrder.newPrice),
      },
    });
    dealUpdated = true;
  }

  return { noteId: noteResponse.id, dealUpdated };
}

// ─── High-Level Sync ────────────────────────────────────────

export async function syncContract(
  contract: ContractData,
  accessToken: string
): Promise<{ contactId: string; dealId: string }> {
  const client = new Client({ accessToken });

  // 1. Upsert contact
  const contactId = await upsertContact(client, contract);

  // 2. Create deal
  const dealId = await createDeal(client, contract, contactId);

  // 3. Add line items
  await addLineItems(client, contract, dealId);

  // 4. Attach PDF as note
  await attachPdfNote(client, contract, dealId);

  return { contactId, dealId };
}

export async function syncContractToHubSpot(
  contract: Contract & { lineItems: LineItem[] }
): Promise<{ contactId: string; dealId: string } | null> {
  const { db } = await import("@/lib/db");

  // Fetch both settings in a single query
  const settings = await db.setting.findMany({
    where: { key: { in: ["hubspot_sync_enabled", "hubspot_api_key"] } },
  });
  const syncEnabled = settings.find((s) => s.key === "hubspot_sync_enabled")?.value === "true";
  const apiKey = settings.find((s) => s.key === "hubspot_api_key")?.value;

  if (!syncEnabled || !apiKey) return null;

  // Fetch commission amount only when sync will execute
  const commission = await db.commissionRecord.findFirst({
    where: { contractId: contract.id },
    orderBy: { createdAt: "desc" },
    select: { amount: true },
  });

  const contractData = toContractData(contract, commission?.amount ?? null);

  const result = await syncContract(contractData, apiKey);
  await db.contract.update({
    where: { id: contract.id },
    data: { hubspotContactId: result.contactId, hubspotDealId: result.dealId },
  });
  return result;
}

// ─── Data Converters ────────────────────────────────────────

export function toContractData(
  contract: Contract & { lineItems: LineItem[] },
  commissionAmount?: number | null
): ContractData {
  return {
    id: contract.id,
    contractNumber: contract.contractNumber,
    status: contract.status as ContractStatus,

    // Customer
    customerName: contract.customerName,
    customerEmail: contract.customerEmail,
    customerPhone: contract.customerPhone,
    customerPhoneAlt: contract.customerPhoneAlt,
    jobAddress: contract.jobAddress,
    billingAddress: contract.billingAddress,
    customerCity: contract.customerCity,
    customerZip: contract.customerZip,
    customerState: contract.customerState,

    // Job Details
    salesman: contract.salesman,
    measuredBy: contract.measuredBy,
    leadTest: contract.leadTest,
    yearBuilt: contract.yearBuilt,
    houseType: contract.houseType,
    measurementNotes: contract.measurementNotes,
    preferredCommunication: contract.preferredCommunication,

    // Pricing
    total: contract.total,
    discount: contract.discount,
    contractTotal: contract.contractTotal,
    downPayment: contract.downPayment,
    balanceDue: contract.balanceDue,
    financeBalance: contract.financeBalance,
    wfebAccount: contract.wfebAccount,

    // Payment
    paymentMethod: contract.paymentMethod,
    downPaymentMethod: contract.downPaymentMethod,
    financingOption: contract.financingOption,
    financingLoanId: contract.financingLoanId,
    financingPlan: contract.financingPlan,

    // Marketing
    planNumber: contract.planNumber,
    authNumber: contract.authNumber,
    marketingSource: contract.marketingSource,

    // Notes
    paymentNotes: contract.paymentNotes,
    contractNotes: contract.contractNotes,
    customerNotes: contract.customerNotes,

    // Window details
    windowsBeingRemoved: contract.windowsBeingRemoved,

    // Application surfaces
    brickApplicationQty: contract.brickApplicationQty,
    stuccoApplicationQty: contract.stuccoApplicationQty,
    sidingApplicationQty: contract.sidingApplicationQty,
    foundationApplicationQty: contract.foundationApplicationQty,
    woodApplicationQty: contract.woodApplicationQty,

    // Signatures
    customerSignatureDate: contract.customerSignatureDate,

    // Commission
    commissionAmount: commissionAmount ?? null,

    // HubSpot
    hubspotContactId: contract.hubspotContactId ?? undefined,
    hubspotDealId: contract.hubspotDealId ?? undefined,

    // PDF
    pdfUrl: contract.pdfUrl,

    // Relations
    lineItems: contract.lineItems.map((item: LineItem) => ({
      location: item.location,
      type: item.type,
      qty: item.qty,
      width: item.width,
      height: item.height,
      color: item.color,
      series: item.series,
      frame: item.frame,
      function: item.function,
      temperedGlass: item.temperedGlass,
      obscuredGlass: item.obscuredGlass,
      customShape: item.customShape,
      wrap: item.wrap,
      coated: item.coated,
      awpShutterRnr: item.awpShutterRnr,
      price: item.price,
    })),
  };
}

export function toAddendumData(addendum: Addendum): AddendumData {
  return {
    id: addendum.id,
    products: addendum.products,
    interiorColor: addendum.interiorColor,
    exteriorColor: addendum.exteriorColor,
    colorDescription: addendum.colorDescription,
    installRemoveOld: addendum.installRemoveOld,
    installHaulAway: addendum.installHaulAway,
    installInteriorTrim: addendum.installInteriorTrim,
    installExteriorTrim: addendum.installExteriorTrim,
    installCaulkSeal: addendum.installCaulkSeal,
    installScreens: addendum.installScreens,
    installHardware: addendum.installHardware,
    installWeatherstrip: addendum.installWeatherstrip,
    installCleanup: addendum.installCleanup,
    installOther: addendum.installOther,
    installNotes: addendum.installNotes,
    ackMeasurements: addendum.ackMeasurements,
    ackSpecifications: addendum.ackSpecifications,
    ackPricing: addendum.ackPricing,
    ackTerms: addendum.ackTerms,
    ackInitials: addendum.ackInitials,
    referralName: addendum.referralName,
    referralPhone: addendum.referralPhone,
    notes: addendum.notes,
    customerSignature: addendum.customerSignature,
    customerSignatureDate: addendum.customerSignatureDate,
    contractorSignature: addendum.contractorSignature,
    contractorSignatureDate: addendum.contractorSignatureDate,
    pdfUrl: addendum.pdfUrl,
    createdAt: addendum.createdAt,
  };
}

export function toChangeOrderData(changeOrder: ChangeOrder): ChangeOrderData {
  return {
    id: changeOrder.id,
    changeOrderNumber: changeOrder.changeOrderNumber,
    changesDescription: changeOrder.changesDescription,
    priceChangeType: changeOrder.priceChangeType,
    priceChangeAmount: changeOrder.priceChangeAmount,
    originalPrice: changeOrder.originalPrice,
    newPrice: changeOrder.newPrice,
    newBalanceDue: changeOrder.newBalanceDue,
    customerSignature: changeOrder.customerSignature,
    customerSignatureDate: changeOrder.customerSignatureDate,
    awpSignature: changeOrder.awpSignature,
    awpSignatureDate: changeOrder.awpSignatureDate,
    pdfUrl: changeOrder.pdfUrl,
    createdAt: changeOrder.createdAt,
  };
}
