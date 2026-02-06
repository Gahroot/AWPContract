// PDF generation using @react-pdf/renderer
// Ported from ezcontract/includes/class-awp-pdf.php

import ReactPDF, {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { formatCurrency } from "./pricing";
import { BOOLEAN_ADDON_LABELS } from "./constants";
import { format } from "date-fns";

interface PdfLineItem {
  location: string | null;
  type: string;
  qty: number;
  width: number;
  height: number;
  color: string;
  series: string;
  price: number;
  [key: string]: unknown;
}

interface PdfContract {
  contractNumber?: string;
  createdAt?: string | Date;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  jobAddress: string | null;
  customerCity: string | null;
  customerZip: string | null;
  salesman: string | null;
  houseType: string | null;
  lineItems: PdfLineItem[];
  total: number;
  discount: number;
  contractTotal: number;
  downPayment: number;
  balanceDue: number;
  contractorSignature: string | null;
  contractorSignatureDate: string | Date | null;
  customerSignature: string | null;
  customerSignatureDate: string | Date | null;
}

interface PdfAddendumProduct {
  type: string;
  qty: number;
  width: number;
  height: number;
  notes?: string;
}

interface PdfAddendum {
  products?: PdfAddendumProduct[];
  interiorColor: string | null;
  exteriorColor: string | null;
  contractorSignature: string | null;
  customerSignature: string | null;
}

interface PdfChangeOrder {
  changeOrderNumber: string;
  originalPrice: number;
  changesDescription: string | null;
  priceChangeType: string;
  priceChangeAmount: number;
  newPrice: number;
  newBalanceDue: number;
  customerSignature: string | null;
  awpSignature: string | null;
}

interface PdfContractBase {
  contractNumber?: string;
  customerName: string | null;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: "2px solid #333",
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a365d",
  },
  companyInfo: {
    fontSize: 8,
    color: "#666",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#1a365d",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
    padding: 4,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: 120,
    color: "#666",
  },
  value: {
    flex: 1,
  },
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1a365d",
    color: "#fff",
    padding: 4,
    fontSize: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5px solid #ddd",
    padding: 3,
    fontSize: 8,
  },
  tableRowAlt: {
    backgroundColor: "#f9f9f9",
  },
  col1: { width: "12%" },
  col2: { width: "8%" },
  col3: { width: "5%" },
  col4: { width: "10%" },
  col5: { width: "10%" },
  col6: { width: "10%" },
  col7: { width: "30%" },
  col8: { width: "15%", textAlign: "right" },
  totalsSection: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 3,
    width: 200,
  },
  totalLabel: {
    width: 120,
    textAlign: "right",
    paddingRight: 10,
  },
  totalValue: {
    width: 80,
    textAlign: "right",
    fontWeight: "bold",
  },
  totalHighlight: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1a365d",
  },
  signatureSection: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBlock: {
    width: "45%",
  },
  signatureLine: {
    borderBottom: "1px solid #333",
    height: 40,
    marginBottom: 3,
  },
  signatureImage: {
    height: 40,
    marginBottom: 3,
    objectFit: "contain",
  },
  signatureLabel: {
    fontSize: 8,
    color: "#666",
  },
});

// Sales Contract PDF
function SalesContractDocument({ contract }: { contract: PdfContract }) {
  const booleanAddons = (item: PdfLineItem) =>
    Object.entries(BOOLEAN_ADDON_LABELS)
      .filter(([key]) => item[key])
      .map(([, label]) => label)
      .join(", ");

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Advanced Window Products</Text>
            <Text style={styles.companyInfo}>
              4035 S 500 W, Murray, UT 84123
            </Text>
            <Text style={styles.companyInfo}>(801) 505-9622</Text>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: "#666" }}>
              Contract #: {contract.contractNumber?.slice(0, 8)}
            </Text>
            <Text style={{ fontSize: 8, color: "#666" }}>
              Date:{" "}
              {format(new Date(contract.createdAt || new Date()), "MM/dd/yyyy")}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>SALES CONTRACT</Text>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{contract.customerName || ""}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{contract.customerPhone || ""}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{contract.customerEmail || ""}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Job Address:</Text>
            <Text style={styles.value}>{contract.jobAddress || ""}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>City / ZIP:</Text>
            <Text style={styles.value}>
              {contract.customerCity || ""} {contract.customerZip || ""}
            </Text>
          </View>
        </View>

        {/* Job Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Salesman:</Text>
            <Text style={styles.value}>{contract.salesman || ""}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>House Type:</Text>
            <Text style={styles.value}>{contract.houseType || ""}</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Location</Text>
              <Text style={styles.col2}>Type</Text>
              <Text style={styles.col3}>Qty</Text>
              <Text style={styles.col4}>Size (ft)</Text>
              <Text style={styles.col5}>Color</Text>
              <Text style={styles.col6}>Series</Text>
              <Text style={styles.col7}>Options</Text>
              <Text style={styles.col8}>Price</Text>
            </View>
            {(contract.lineItems || []).map((item: PdfLineItem, i: number) => (
              <View
                key={i}
                style={[
                  styles.tableRow,
                  i % 2 === 1 ? styles.tableRowAlt : {},
                ]}
              >
                <Text style={styles.col1}>{item.location || ""}</Text>
                <Text style={styles.col2}>{item.type}</Text>
                <Text style={styles.col3}>{item.qty}</Text>
                <Text style={styles.col4}>
                  {item.width}x{item.height}
                </Text>
                <Text style={styles.col5}>{item.color}</Text>
                <Text style={styles.col6}>{item.series}</Text>
                <Text style={styles.col7}>{booleanAddons(item) || "\u2014"}</Text>
                <Text style={styles.col8}>{formatCurrency(item.price)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(contract.total || 0)}
            </Text>
          </View>
          {contract.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(contract.discount)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.totalHighlight]}>
              Contract Total:
            </Text>
            <Text style={[styles.totalValue, styles.totalHighlight]}>
              {formatCurrency(contract.contractTotal || 0)}
            </Text>
          </View>
          {contract.downPayment > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Down Payment:</Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(contract.downPayment)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.totalHighlight]}>
              Balance Due:
            </Text>
            <Text style={[styles.totalValue, styles.totalHighlight]}>
              {formatCurrency(contract.balanceDue || 0)}
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            {contract.contractorSignature ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop
              <Image
                src={contract.contractorSignature}
                style={styles.signatureImage}
              />
            ) : (
              <View style={styles.signatureLine} />
            )}
            <Text style={styles.signatureLabel}>
              Contractor Signature{" "}
              {contract.contractorSignatureDate
                ? `- ${format(new Date(contract.contractorSignatureDate), "MM/dd/yyyy")}`
                : ""}
            </Text>
          </View>
          <View style={styles.signatureBlock}>
            {contract.customerSignature ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop
              <Image
                src={contract.customerSignature}
                style={styles.signatureImage}
              />
            ) : (
              <View style={styles.signatureLine} />
            )}
            <Text style={styles.signatureLabel}>
              Customer Signature{" "}
              {contract.customerSignatureDate
                ? `- ${format(new Date(contract.customerSignatureDate), "MM/dd/yyyy")}`
                : ""}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Addendum PDF
function AddendumDocument({
  addendum,
  contract,
}: {
  addendum: PdfAddendum;
  contract: PdfContractBase;
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Advanced Window Products</Text>
            <Text style={styles.companyInfo}>Contract Addendum</Text>
          </View>
        </View>

        <Text style={styles.title}>ADDENDUM</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parent Contract</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Contract #:</Text>
            <Text style={styles.value}>
              {contract.contractNumber?.slice(0, 8)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{contract.customerName || ""}</Text>
          </View>
        </View>

        {addendum.products && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Products</Text>
            {addendum.products.map((p: PdfAddendumProduct, i: number) => (
              <View key={i} style={styles.row}>
                <Text style={styles.value}>
                  {p.type} - Qty: {p.qty}, Size: {p.width}x{p.height}
                  {p.notes ? ` (${p.notes})` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Colors</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Interior:</Text>
            <Text style={styles.value}>
              {addendum.interiorColor || "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Exterior:</Text>
            <Text style={styles.value}>
              {addendum.exteriorColor || "N/A"}
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            {addendum.contractorSignature ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop
              <Image
                src={addendum.contractorSignature}
                style={styles.signatureImage}
              />
            ) : (
              <View style={styles.signatureLine} />
            )}
            <Text style={styles.signatureLabel}>Contractor Signature</Text>
          </View>
          <View style={styles.signatureBlock}>
            {addendum.customerSignature ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop
              <Image
                src={addendum.customerSignature}
                style={styles.signatureImage}
              />
            ) : (
              <View style={styles.signatureLine} />
            )}
            <Text style={styles.signatureLabel}>Customer Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Change Order PDF
function ChangeOrderDocument({
  changeOrder,
  contract,
}: {
  changeOrder: PdfChangeOrder;
  contract: PdfContractBase;
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Advanced Window Products</Text>
            <Text style={styles.companyInfo}>Change Order</Text>
          </View>
        </View>

        <Text style={styles.title}>
          CHANGE ORDER - {changeOrder.changeOrderNumber}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Original Contract</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Contract #:</Text>
            <Text style={styles.value}>
              {contract.contractNumber?.slice(0, 8)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{contract.customerName || ""}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Original Price:</Text>
            <Text style={styles.value}>
              {formatCurrency(changeOrder.originalPrice)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description of Changes</Text>
          <Text>{changeOrder.changesDescription || ""}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Adjustment</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Change Type:</Text>
            <Text style={styles.value}>
              {changeOrder.priceChangeType === "no_change"
                ? "No Change"
                : changeOrder.priceChangeType === "increase"
                  ? "Increase"
                  : "Decrease"}
            </Text>
          </View>
          {changeOrder.priceChangeType !== "no_change" && (
            <View style={styles.row}>
              <Text style={styles.label}>Amount:</Text>
              <Text style={styles.value}>
                {formatCurrency(changeOrder.priceChangeAmount)}
              </Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={[styles.label, { fontWeight: "bold" }]}>
              New Price:
            </Text>
            <Text style={[styles.value, { fontWeight: "bold" }]}>
              {formatCurrency(changeOrder.newPrice)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { fontWeight: "bold" }]}>
              New Balance:
            </Text>
            <Text style={[styles.value, { fontWeight: "bold" }]}>
              {formatCurrency(changeOrder.newBalanceDue)}
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            {changeOrder.customerSignature ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop
              <Image
                src={changeOrder.customerSignature}
                style={styles.signatureImage}
              />
            ) : (
              <View style={styles.signatureLine} />
            )}
            <Text style={styles.signatureLabel}>Customer Approval</Text>
          </View>
          <View style={styles.signatureBlock}>
            {changeOrder.awpSignature ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop
              <Image
                src={changeOrder.awpSignature}
                style={styles.signatureImage}
              />
            ) : (
              <View style={styles.signatureLine} />
            )}
            <Text style={styles.signatureLabel}>AWP Approval</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Render to buffer
export async function generateSalesContractPdf(
  contract: PdfContract
): Promise<Uint8Array> {
  const stream = await ReactPDF.renderToStream(
    <SalesContractDocument contract={contract} />
  );

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function generateAddendumPdf(
  addendum: PdfAddendum,
  contract: PdfContractBase
): Promise<Uint8Array> {
  const stream = await ReactPDF.renderToStream(
    <AddendumDocument addendum={addendum} contract={contract} />
  );

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function generateChangeOrderPdf(
  changeOrder: PdfChangeOrder,
  contract: PdfContractBase
): Promise<Uint8Array> {
  const stream = await ReactPDF.renderToStream(
    <ChangeOrderDocument changeOrder={changeOrder} contract={contract} />
  );

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
