// PDF generation using @react-pdf/renderer
// 5-page Contract Packet: Sales Contract, Terms & Conditions, Addendum, What Happens Next, Grid Patterns (conditional)

import ReactPDF, { Document } from "@react-pdf/renderer";
import { formatCurrency } from "./pricing";
import { format } from "date-fns";
import {
  SalesContractPage,
  TermsAndConditionsPage,
  AddendumPage,
  WhatHappensNextPage,
  GridPatternPage,
  needsGridPatternPage,
  type PdfContract,
} from "./pdf-pages";

// Re-export types for external use
export type { PdfContract, PdfAddendum } from "./pdf-pages";

// ─── Contract Packet Document (5 pages) ───────────────────────────────────

function ContractPacketDocument({ contract }: { contract: PdfContract }) {
  const addendum = contract.addendums?.[0] ?? null;
  const showGridPage = needsGridPatternPage(contract);

  return (
    <Document>
      <SalesContractPage contract={contract} />
      <TermsAndConditionsPage />
      <AddendumPage contract={contract} addendum={addendum} />
      <WhatHappensNextPage contract={contract} />
      {showGridPage && <GridPatternPage contract={contract} />}
    </Document>
  );
}

// ─── Generate and Save PDF ───────────────────────────────────────────────

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
    <ContractPacketDocument contract={contract} />
  );

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

// ─── Commission Report PDF ───────────────────────────────────────────────

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

const reportStyles = {
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
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
    textAlign: "center" as const,
    marginBottom: 5,
    color: "#1a365d",
  },
  subtitle: {
    fontSize: 10,
    textAlign: "center" as const,
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
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
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
    flexDirection: "row" as const,
    backgroundColor: "#1a365d",
    color: "#fff",
    padding: 4,
    fontSize: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row" as const,
    borderBottom: "0.5px solid #ddd",
    padding: 3,
    fontSize: 8,
  },
  tableRowAlt: {
    backgroundColor: "#f9f9f9",
  },
  userCol1: { width: "40%" },
  userCol2: { width: "30%", textAlign: "right" as const },
  userCol3: { width: "30%", textAlign: "right" as const },
  detCol1: { width: "12%" },
  detCol2: { width: "16%" },
  detCol3: { width: "16%" },
  detCol4: { width: "12%" },
  detCol5: { width: "10%", textAlign: "right" as const },
  detCol6: { width: "12%", textAlign: "right" as const },
  detCol7: { width: "10%" },
  detCol8: { width: "12%" },
  footer: {
    position: "absolute" as const,
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    fontSize: 7,
    color: "#999",
  },
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { StyleSheet } = require("@react-pdf/renderer");
const reportSheet = StyleSheet.create(reportStyles);

function CommissionReportDocument({ data }: { data: CommissionReportData }) {
  const getStatusAmount = (status: string) =>
    data.statusSummary.find((s) => s.status === status)?.amount ?? 0;
  const getStatusCount = (status: string) =>
    data.statusSummary.find((s) => s.status === status)?.count ?? 0;

  return (
    <Document>
      <Page size="LETTER" style={reportSheet.page}>
        {/* Header */}
        <View style={reportSheet.header}>
          <View>
            <Text style={reportSheet.companyName}>Advanced Window Products</Text>
            <Text style={reportSheet.companyInfo}>4035 S 500 W, Murray, UT 84123</Text>
            <Text style={reportSheet.companyInfo}>(801) 505-9622</Text>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: "#666" }}>Commission Report</Text>
          </View>
        </View>

        <Text style={reportSheet.title}>COMMISSION REPORT</Text>
        <Text style={reportSheet.subtitle}>
          Period: {format(new Date(data.startDate), "MM/dd/yyyy")} -{" "}
          {format(new Date(data.endDate), "MM/dd/yyyy")}
        </Text>

        {/* Summary */}
        <View style={reportSheet.section}>
          <Text style={reportSheet.sectionTitle}>Summary</Text>
          <View style={reportSheet.summaryRow}>
            <Text style={reportSheet.summaryLabel}>Total Commissions:</Text>
            <Text style={reportSheet.summaryValue}>{formatCurrency(data.totalAmount)}</Text>
          </View>
          <View style={reportSheet.summaryRow}>
            <Text style={reportSheet.summaryLabel}>Total Records:</Text>
            <Text style={reportSheet.summaryValue}>{data.totalRecords}</Text>
          </View>
          <View style={reportSheet.summaryRow}>
            <Text style={reportSheet.summaryLabel}>
              Pending: {getStatusCount("PENDING")} records
            </Text>
            <Text style={reportSheet.summaryValue}>
              {formatCurrency(getStatusAmount("PENDING"))}
            </Text>
          </View>
          <View style={reportSheet.summaryRow}>
            <Text style={reportSheet.summaryLabel}>
              Approved: {getStatusCount("APPROVED")} records
            </Text>
            <Text style={reportSheet.summaryValue}>
              {formatCurrency(getStatusAmount("APPROVED"))}
            </Text>
          </View>
          <View style={reportSheet.summaryRow}>
            <Text style={reportSheet.summaryLabel}>
              Paid: {getStatusCount("PAID")} records
            </Text>
            <Text style={reportSheet.summaryValue}>
              {formatCurrency(getStatusAmount("PAID"))}
            </Text>
          </View>
        </View>

        {/* Per-user summary */}
        <View style={reportSheet.section}>
          <Text style={reportSheet.sectionTitle}>Per-User Summary</Text>
          <View style={reportSheet.tableHeader}>
            <Text style={reportSheet.userCol1}>Name</Text>
            <Text style={reportSheet.userCol2}>Records</Text>
            <Text style={reportSheet.userCol3}>Total Amount</Text>
          </View>
          {data.perUser.map((u, i) => (
            <View
              key={i}
              style={[reportSheet.tableRow, i % 2 === 1 ? reportSheet.tableRowAlt : {}]}
            >
              <Text style={reportSheet.userCol1}>{u.name}</Text>
              <Text style={reportSheet.userCol2}>{u.recordCount}</Text>
              <Text style={reportSheet.userCol3}>{formatCurrency(u.totalAmount)}</Text>
            </View>
          ))}
        </View>

        {/* Detail table */}
        <View style={reportSheet.section}>
          <Text style={reportSheet.sectionTitle}>Detail Records</Text>
          <View style={reportSheet.tableHeader}>
            <Text style={reportSheet.detCol1}>Contract #</Text>
            <Text style={reportSheet.detCol2}>Customer</Text>
            <Text style={reportSheet.detCol3}>Recipient</Text>
            <Text style={reportSheet.detCol4}>Role</Text>
            <Text style={reportSheet.detCol5}>Rate</Text>
            <Text style={reportSheet.detCol6}>Amount</Text>
            <Text style={reportSheet.detCol7}>Status</Text>
            <Text style={reportSheet.detCol8}>Date</Text>
          </View>
          {data.records.map((r, i) => (
            <View
              key={i}
              style={[reportSheet.tableRow, i % 2 === 1 ? reportSheet.tableRowAlt : {}]}
            >
              <Text style={reportSheet.detCol1}>{r.contractNumber.slice(0, 8)}</Text>
              <Text style={reportSheet.detCol2}>{r.customerName ?? "-"}</Text>
              <Text style={reportSheet.detCol3}>{r.recipientName}</Text>
              <Text style={reportSheet.detCol4}>{ROLE_LABELS[r.commissionType] ?? r.commissionType}</Text>
              <Text style={reportSheet.detCol5}>{(r.rate * 100).toFixed(2)}%</Text>
              <Text style={reportSheet.detCol6}>{formatCurrency(r.amount)}</Text>
              <Text style={reportSheet.detCol7}>{r.status}</Text>
              <Text style={reportSheet.detCol8}>{format(new Date(r.createdAt), "MM/dd/yy")}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={reportSheet.footer} fixed>
          <Text>Generated: {format(new Date(), "MM/dd/yyyy HH:mm")}</Text>
          <Text render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

const { Page, Text, View } = ReactPDF;

export async function generateCommissionReportPdf(
  data: CommissionReportData
): Promise<Uint8Array> {
  const stream = await ReactPDF.renderToStream(<CommissionReportDocument data={data} />);

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
