// Test script to generate a contract PDF
import { db } from "../src/lib/db.js";
import { generateAndSavePdf } from "../src/lib/pdf.js";

async function main() {
  // Get a contract with line items
  const contract = await db.contract.findFirst({
    where: {
      customerName: { not: null },
      lineItems: { some: {} },
    },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      addendums: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!contract) {
    console.error("No contract found with data");
    process.exit(1);
  }

  console.log(`Generating PDF for contract: ${contract.contractNumber?.slice(0, 8)}`);
  console.log(`Customer: ${contract.customerName}`);
  console.log(`Line items: ${contract.lineItems.length}`);
  console.log(`Has addendum: ${!!contract.addendums?.length}`);

  // Generate PDF
  try {
    const pdfUrl = await generateAndSavePdf(contract);
    console.log(`\n✓ PDF generated successfully!`);
    console.log(`URL: ${pdfUrl}`);
    console.log(`Full path: ${process.cwd()}/public${pdfUrl}`);
  } catch (error) {
    console.error("\n✗ PDF generation failed:", error);
    process.exit(1);
  }
}

main().catch(console.error).finally(() => process.exit(0));
