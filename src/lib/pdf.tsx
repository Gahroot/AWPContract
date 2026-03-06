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
  // New product fields
  productCode?: string | null;
  operation?: string | null;
  gridType?: string | null;
  glassType?: string | null;
  frame?: string | null;
  function?: string | null;
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

  const getProductOptions = (item: PdfLineItem) => {
    const options: string[] = [];
    if (item.function) options.push(item.function);
    if (item.operation) options.push(`Op: ${item.operation}`);
    if (item.gridType) options.push(item.gridType);
    if (item.glassType) options.push(item.glassType);
    if (item.frame && item.frame !== "Nail Fin") options.push(item.frame);
    const addons = booleanAddons(item);
    if (addons) options.push(addons);
    return options.length > 0 ? options.join(", ") : "\u2014";
  };

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
                <Text style={styles.col7}>{getProductOptions(item)}</Text>
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

// Generate PDF and save to public/pdfs directory
export async function generateAndSavePdf(
  contract: PdfContract & { id?: string; contractNumber?: string }
): Promise<string> {
  const pdfBuffer = await generateSalesContractPdf(contract);
  const fs = await import("fs/promises");
  const path = await import("path");
  const pdfDir = path.join(process.cwd(), "public", "pdfs");
  await fs.mkdir(pdfDir, { recursive: true });
  const filename = `contract-${contract.contractNumber}-${Date.now()}.pdf`;
  await fs.writeFile(path.join(pdfDir, filename), Buffer.from(pdfBuffer));
  return `/pdfs/${filename}`;
}

// Render to buffer
async function generateSalesContractPdf(
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

// ─── Commission Report PDF ─────────────────────────────────

interface CommissionReportData {
  startDate: string;
  endDate: string;
  totalAmount: number;
  totalRecords: number;
  statusSummary: {
    status: string;
    amount: number;
    count: number;
  }[];
  perUser: {
    name: string;
    totalAmount: number;
    recordCount: number;
  }[];
  records: {
    contractNumber: string;
    customerName: string | null;
    recipientName: string;
    commissionType: string;
    rate: number;
    amount: number;
    status: string;
    createdAt: string;
  }[];
}

const ROLE_LABELS: Record<string, string> = {
  SALES_REP: "Sales Rep",
  SETTER: "Setter",
  SETTER_MANAGER: "Setter Mgr",
  TERRITORY_OWNER: "Territory",
  VP: "VP",
  NSM: "NSM",
};

const reportStyles = StyleSheet.create({
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
    marginBottom: 5,
    color: "#1a365d",
  },
  subtitle: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 15,
    color: "#666",
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    paddingHorizontal: 4,
  },
  summaryLabel: {
    color: "#666",
  },
  summaryValue: {
    fontWeight: "bold",
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
  userCol1: { width: "40%" },
  userCol2: { width: "30%", textAlign: "right" },
  userCol3: { width: "30%", textAlign: "right" },
  detCol1: { width: "12%" },
  detCol2: { width: "16%" },
  detCol3: { width: "16%" },
  detCol4: { width: "12%" },
  detCol5: { width: "10%", textAlign: "right" },
  detCol6: { width: "12%", textAlign: "right" },
  detCol7: { width: "10%" },
  detCol8: { width: "12%" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#999",
  },
});

function CommissionReportDocument({ data }: { data: CommissionReportData }) {
  const getStatusAmount = (status: string) =>
    data.statusSummary.find((s) => s.status === status)?.amount ?? 0;
  const getStatusCount = (status: string) =>
    data.statusSummary.find((s) => s.status === status)?.count ?? 0;

  return (
    <Document>
      <Page size="LETTER" style={reportStyles.page}>
        {/* Header */}
        <View style={reportStyles.header}>
          <View>
            <Text style={reportStyles.companyName}>
              Advanced Window Products
            </Text>
            <Text style={reportStyles.companyInfo}>
              4035 S 500 W, Murray, UT 84123
            </Text>
            <Text style={reportStyles.companyInfo}>(801) 505-9622</Text>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: "#666" }}>Commission Report</Text>
          </View>
        </View>

        <Text style={reportStyles.title}>COMMISSION REPORT</Text>
        <Text style={reportStyles.subtitle}>
          Period: {format(new Date(data.startDate), "MM/dd/yyyy")} -{" "}
          {format(new Date(data.endDate), "MM/dd/yyyy")}
        </Text>

        {/* Summary */}
        <View style={reportStyles.section}>
          <Text style={reportStyles.sectionTitle}>Summary</Text>
          <View style={reportStyles.summaryRow}>
            <Text style={reportStyles.summaryLabel}>Total Commissions:</Text>
            <Text style={reportStyles.summaryValue}>
              {formatCurrency(data.totalAmount)}
            </Text>
          </View>
          <View style={reportStyles.summaryRow}>
            <Text style={reportStyles.summaryLabel}>Total Records:</Text>
            <Text style={reportStyles.summaryValue}>{data.totalRecords}</Text>
          </View>
          <View style={reportStyles.summaryRow}>
            <Text style={reportStyles.summaryLabel}>
              Pending: {getStatusCount("PENDING")} records
            </Text>
            <Text style={reportStyles.summaryValue}>
              {formatCurrency(getStatusAmount("PENDING"))}
            </Text>
          </View>
          <View style={reportStyles.summaryRow}>
            <Text style={reportStyles.summaryLabel}>
              Approved: {getStatusCount("APPROVED")} records
            </Text>
            <Text style={reportStyles.summaryValue}>
              {formatCurrency(getStatusAmount("APPROVED"))}
            </Text>
          </View>
          <View style={reportStyles.summaryRow}>
            <Text style={reportStyles.summaryLabel}>
              Paid: {getStatusCount("PAID")} records
            </Text>
            <Text style={reportStyles.summaryValue}>
              {formatCurrency(getStatusAmount("PAID"))}
            </Text>
          </View>
        </View>

        {/* Per-user summary */}
        <View style={reportStyles.section}>
          <Text style={reportStyles.sectionTitle}>Per-User Summary</Text>
          <View style={reportStyles.tableHeader}>
            <Text style={reportStyles.userCol1}>Name</Text>
            <Text style={reportStyles.userCol2}>Records</Text>
            <Text style={reportStyles.userCol3}>Total Amount</Text>
          </View>
          {data.perUser.map((u, i) => (
            <View
              key={i}
              style={[
                reportStyles.tableRow,
                i % 2 === 1 ? reportStyles.tableRowAlt : {},
              ]}
            >
              <Text style={reportStyles.userCol1}>{u.name}</Text>
              <Text style={reportStyles.userCol2}>{u.recordCount}</Text>
              <Text style={reportStyles.userCol3}>
                {formatCurrency(u.totalAmount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Detail table */}
        <View style={reportStyles.section}>
          <Text style={reportStyles.sectionTitle}>Detail Records</Text>
          <View style={reportStyles.tableHeader}>
            <Text style={reportStyles.detCol1}>Contract #</Text>
            <Text style={reportStyles.detCol2}>Customer</Text>
            <Text style={reportStyles.detCol3}>Recipient</Text>
            <Text style={reportStyles.detCol4}>Role</Text>
            <Text style={reportStyles.detCol5}>Rate</Text>
            <Text style={reportStyles.detCol6}>Amount</Text>
            <Text style={reportStyles.detCol7}>Status</Text>
            <Text style={reportStyles.detCol8}>Date</Text>
          </View>
          {data.records.map((r, i) => (
            <View
              key={i}
              style={[
                reportStyles.tableRow,
                i % 2 === 1 ? reportStyles.tableRowAlt : {},
              ]}
            >
              <Text style={reportStyles.detCol1}>
                {r.contractNumber.slice(0, 8)}
              </Text>
              <Text style={reportStyles.detCol2}>
                {r.customerName ?? "-"}
              </Text>
              <Text style={reportStyles.detCol3}>{r.recipientName}</Text>
              <Text style={reportStyles.detCol4}>
                {ROLE_LABELS[r.commissionType] ?? r.commissionType}
              </Text>
              <Text style={reportStyles.detCol5}>
                {(r.rate * 100).toFixed(2)}%
              </Text>
              <Text style={reportStyles.detCol6}>
                {formatCurrency(r.amount)}
              </Text>
              <Text style={reportStyles.detCol7}>{r.status}</Text>
              <Text style={reportStyles.detCol8}>
                {format(new Date(r.createdAt), "MM/dd/yy")}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={reportStyles.footer} fixed>
          <Text>
            Generated: {format(new Date(), "MM/dd/yyyy HH:mm")}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export async function generateCommissionReportPdf(
  data: CommissionReportData
): Promise<Uint8Array> {
  const stream = await ReactPDF.renderToStream(
    <CommissionReportDocument data={data} />
  );

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

