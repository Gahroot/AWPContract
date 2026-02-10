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

  // Job Details
  salesman: string | null;
  measurementDate: Date | null;
  leadTest: string | null;
  yearBuilt: string | null;
  houseType: string | null;
  measurementNotes: string | null;

  // Pricing
  total: number;
  discount: number;
  contractTotal: number;
  downPayment: number;
  balanceDue: number;
  financeBalance: number;
  wfebAccount: string | null;

  // Marketing
  planNumber: string | null;
  authNumber: string | null;
  marketingSource: unknown;

  // Payment
  paymentMethod: string | null;

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

function formatJson(value: unknown): string {
  if (value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

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

function getDealStageFromStatus(status: ContractStatus): string {
  switch (status) {
    case "DRAFT":
      return "appointmentscheduled";
    case "PENDING_SIGNATURE":
      return "qualifiedtobuy";
    case "SIGNED":
      return "contractsent";
    case "COMPLETED":
      return "closedwon";
    default:
      return "appointmentscheduled";
  }
}

export async function createDeal(
  client: Client,
  contract: ContractData,
  contactId: string
): Promise<string> {
  const dealResponse = await client.crm.deals.basicApi.create({
    properties: {
      dealname: `Contract - ${contract.customerName || "Unknown"} (${contract.contractNumber})`,
      amount: String(contract.contractTotal),
      dealstage: getDealStageFromStatus(contract.status),
      closedate: formatDate(new Date()),
      pipeline: "default",
      // Contract details
      awp_contract_number: contract.contractNumber,
      awp_salesman: contract.salesman || "",
      awp_measurement_date: formatDate(contract.measurementDate),
      awp_lead_test: contract.leadTest || "",
      awp_year_built: contract.yearBuilt || "",
      awp_house_type: contract.houseType || "",
      awp_measurement_notes: contract.measurementNotes || "",
      // Pricing
      awp_total: String(contract.total),
      awp_discount: String(contract.discount),
      awp_down_payment: String(contract.downPayment),
      awp_balance_due: String(contract.balanceDue),
      awp_finance_balance: String(contract.financeBalance),
      awp_wfeb_account: contract.wfebAccount || "",
      // Marketing
      awp_plan_number: contract.planNumber || "",
      awp_auth_number: contract.authNumber || "",
      awp_marketing_source: formatJson(contract.marketingSource),
      // Payment
      awp_payment_method: contract.paymentMethod || "",
    },
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
  for (const item of contract.lineItems) {
    await client.crm.lineItems.basicApi.create({
      properties: {
        name: `${item.location || "Item"} - ${item.type}`,
        quantity: String(item.qty),
        price: String(item.price),
        // Custom properties
        awp_qty: String(item.qty),
        awp_width: String(item.width),
        awp_height: String(item.height),
        awp_color: item.color,
        awp_series: item.series,
        awp_frame: item.frame,
        awp_function: item.function,
        awp_tempered_glass: item.temperedGlass ? "true" : "false",
        awp_obscured_glass: item.obscuredGlass ? "true" : "false",
        awp_custom_shape: item.customShape ? "true" : "false",
        awp_wrap: item.wrap ? "true" : "false",
        awp_coated: item.coated ? "true" : "false",
        awp_shutter_rnr: item.awpShutterRnr ? "true" : "false",
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
    });
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

export async function updateDealCommission(
  client: Client,
  dealId: string,
  commissionAmount: number,
  commissionRate: number
): Promise<void> {
  await client.crm.deals.basicApi.update(dealId, {
    properties: {
      awp_commission_amount: String(commissionAmount),
      awp_commission_rate: String(commissionRate),
    },
  });
}

export async function updateDealForContract(
  contract: ContractData,
  accessToken: string
): Promise<void> {
  if (!contract.hubspotDealId) {
    console.warn("Cannot update deal: no HubSpot deal ID");
    return;
  }

  const client = new Client({ accessToken });

  await client.crm.deals.basicApi.update(contract.hubspotDealId, {
    properties: {
      amount: String(contract.contractTotal),
      dealstage: getDealStageFromStatus(contract.status),
      awp_total: String(contract.total),
      awp_discount: String(contract.discount),
      awp_down_payment: String(contract.downPayment),
      awp_balance_due: String(contract.balanceDue),
      awp_finance_balance: String(contract.financeBalance),
    },
  });
}

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
        awp_original_price: String(changeOrder.originalPrice),
        awp_price_change_type: changeOrder.priceChangeType,
        awp_price_change_amount: String(changeOrder.priceChangeAmount),
        awp_new_balance_due: String(changeOrder.newBalanceDue),
      },
    });
    dealUpdated = true;
  }

  return { noteId: noteResponse.id, dealUpdated };
}

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

// Helper to convert database contract to ContractData
export function toContractData(
  contract: Contract & { lineItems: LineItem[] }
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

    // Job Details
    salesman: contract.salesman,
    measurementDate: contract.measurementDate,
    leadTest: contract.leadTest,
    yearBuilt: contract.yearBuilt,
    houseType: contract.houseType,
    measurementNotes: contract.measurementNotes,

    // Pricing
    total: contract.total,
    discount: contract.discount,
    contractTotal: contract.contractTotal,
    downPayment: contract.downPayment,
    balanceDue: contract.balanceDue,
    financeBalance: contract.financeBalance,
    wfebAccount: contract.wfebAccount,

    // Marketing
    planNumber: contract.planNumber,
    authNumber: contract.authNumber,
    marketingSource: contract.marketingSource,

    // Payment
    paymentMethod: contract.paymentMethod,

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

// Helper to convert database addendum to AddendumData
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

// Helper to convert database change order to ChangeOrderData
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
