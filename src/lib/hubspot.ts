// HubSpot CRM integration
// Ported from ezcontract/includes/class-awp-hubspot.php

import { Client } from "@hubspot/api-client";

interface ContractData {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  jobAddress: string | null;
  customerCity: string | null;
  customerZip: string | null;
  contractTotal: number;
  pdfUrl: string | null;
  lineItems: Array<{
    location: string | null;
    type: string;
    price: number;
  }>;
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

export async function testConnection(accessToken: string): Promise<boolean> {
  const client = new Client({ accessToken });
  // Try to fetch one contact to verify connection
  const response = await client.crm.contacts.basicApi.getPage(1);
  return response !== undefined;
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
      address: contract.jobAddress || "",
      city: contract.customerCity || "",
      zip: contract.customerZip || "",
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
    properties: {
      dealname: `Contract - ${contract.customerName || "Unknown"}`,
      amount: String(contract.contractTotal),
      dealstage: "closedwon",
      closedate: new Date().toISOString().split("T")[0],
      pipeline: "default",
    },
    associations: [
      {
        to: { id: contactId },
        types: [
          {
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
        quantity: "1",
        price: String(item.price),
      },
      associations: [
        {
          to: { id: dealId },
          types: [
            {
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

  const pdfFullUrl = `${process.env.NEXTAUTH_URL}${contract.pdfUrl}`;

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
            associationCategory: "HUBSPOT_DEFINED" as any,
            associationTypeId: 214, // Note to Deal
          },
        ],
      },
    ],
  });
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
