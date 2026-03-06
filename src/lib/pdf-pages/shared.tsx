// PDF generation shared module for 5-page contract packet
// Company constants, types, helpers, and shared components

import { StyleSheet, Text, View, Image } from "@react-pdf/renderer";
import { format } from "date-fns";

// ─── Company Constants ───────────────────────────────────────────────────────

export const COMPANY_NAME = "Advanced Windows Direct";
export const COMPANY_ADDRESS = "2451 S 600 W STE 500, Salt Lake City, UT 84115";
export const COMPANY_PHONE = "801-438-4554";
export const COMPANY_EMAIL = "direct@advancedwindows.com";
export const COMPANY_WEBSITE = "www.advancedwindows.com";
export const CANCELLATION_ADDRESS = "3052 South 460 West, South Salt Lake, UT 84115";
export const CANCELLATION_EMAIL = "cancellations@advancedwindows.com";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PdfLineItem {
  id: string;
  location: string | null;
  type: string;
  qty: number;
  width: number;
  height: number;
  color: string;
  series: string;
  price: number;
  // Product fields
  productCode?: string | null;
  operation?: string | null;
  gridType?: string | null;
  glassType?: string | null;
  frame?: string | null;
  function?: string | null;
  // Boolean addons - explicitly typed
  temperedGlass: boolean;
  obscuredGlass: boolean;
  customShape: boolean;
  wrap: boolean;
  coated: boolean;
  awpShutterRnr: boolean;
  // Grid pattern fields
  gridVerticalLines?: number;
  gridHorizontalLines?: number;
  gridPatternNotes?: string | null;
}

export interface PdfAddendum {
  id: string;
  contractId: string;
  products: unknown | null;  // Prisma JsonValue can be various types
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
  hasInteriorShutters: boolean;
  referralName: string | null;
  referralPhone: string | null;
  notes: string | null;
  customerSignature: string | null;
  customerSignatureDate: Date | null;
  contractorSignature: string | null;
  contractorSignatureDate: Date | null;
  createdAt: Date;
}

export interface PdfContract {
  contractNumber?: string;
  createdAt?: string | Date;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  jobAddress: string | null;
  customerCity: string | null;
  customerZip: string | null;
  customerState: string | null;
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
  // Additional fields needed for 5-page packet
  leadTest: string | null;
  yearBuilt: string | null;
  measuredBy: string | null;
  paymentMethod: string | null;
  downPaymentMethod: string | null;
  windowsBeingRemoved: string | null;
  brickApplicationQty: number;
  stuccoApplicationQty: number;
  sidingApplicationQty: number;
  foundationApplicationQty: number;
  woodApplicationQty: number;
  addendums?: PdfAddendum[];
  // Additional fields from contract schema
  referralName?: string | null;
}

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Convert decimal feet to feet-inches format (e.g., 1.5 -> "1'6"")
 */
export function feetInchesFormat(decimalFeet: number): string {
  if (!decimalFeet || decimalFeet === 0) return "0'0\"";
  const feet = Math.floor(decimalFeet);
  const inches = Math.round((decimalFeet - feet) * 12);
  return `${feet}'${inches}"`;
}

/**
 * Format size display string (e.g., width=1.5, height=1.5 -> "1'6" x 1'6"")
 */
export function sizeDisplay(width: number, height: number): string {
  return `${feetInchesFormat(width)} x ${feetInchesFormat(height)}`;
}

/**
 * Calculate down payment percentage
 */
export function downPaymentPercent(downPayment: number, contractTotal: number): string {
  if (!contractTotal || contractTotal === 0) return "0%";
  const percent = Math.round((downPayment / contractTotal) * 100);
  return `${percent}%`;
}

/**
 * Check if any line items have grid types
 */
export function hasAnyGrids(lineItems: PdfLineItem[]): boolean {
  return lineItems.some((item) => item.gridType && item.gridType.trim() !== "");
}

/**
 * Convert boolean to Yes/No
 */
export function yesNo(val: boolean | undefined | null): string {
  return val ? "Yes" : "No";
}

/**
 * Get checked or unchecked checkbox character
 */
export function checkbox(checked: boolean | undefined | null): string {
  return checked ? "☑" : "☐";
}

/**
 * Format currency for PDF display
 */
export function formatCurrencyPdf(amount: number): string {
  if (isNaN(amount)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format date for PDF display
 */
export function formatDatePdf(date: string | Date | null | undefined): string {
  if (!date) return "";
  return format(new Date(date), "MM/dd/yyyy");
}

// ─── Shared Styles ───────────────────────────────────────────────────────────

export const sharedStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
    color: "#1a365d",
  },
  headerCompany: {
    fontSize: 10,
    textAlign: "right",
    color: "#333",
  },
  headerLine: {
    borderBottom: "2px solid #1a365d",
    marginTop: 5,
    marginBottom: 10,
  },
  borderedBox: {
    border: "1px solid #333",
    padding: 6,
  },
  borderedBoxBold: {
    border: "1px solid #333",
    padding: 6,
    fontWeight: "bold",
  },
  table: {
    marginBottom: 10,
  },
  tableCell: {
    border: "0.5px solid #999",
    padding: 3,
    fontSize: 7,
  },
  tableCellSm: {
    border: "0.5px solid #999",
    padding: 2,
    fontSize: 6,
  },
  tableHeader: {
    backgroundColor: "#1a365d",
    color: "#fff",
    padding: 4,
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
  },
  bold: {
    fontWeight: "bold",
  },
  textSm: {
    fontSize: 7,
  },
  textXs: {
    fontSize: 6,
  },
  signatureLine: {
    borderBottom: "1px solid #333",
    height: 35,
    marginBottom: 3,
    width: "100%",
  },
  signatureImage: {
    height: 35,
    marginBottom: 3,
    objectFit: "contain",
  },
  signatureLabel: {
    fontSize: 7,
    color: "#666",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 8,
    color: "#999",
    textAlign: "center",
  },
});

// ─── Shared Components ───────────────────────────────────────────────────────

interface PacketHeaderProps {
  title: string;
  subtitle?: string;
}

export function PacketHeader({ title, subtitle }: PacketHeaderProps) {
  return (
    <View style={sharedStyles.header}>
      <Text style={sharedStyles.headerTitle}>{title}</Text>
      <Text style={sharedStyles.headerCompany}>{COMPANY_NAME}</Text>
      <Text style={sharedStyles.headerCompany}>
        {COMPANY_ADDRESS} | {COMPANY_PHONE}
      </Text>
      {subtitle && (
        <Text style={[sharedStyles.headerCompany, { fontSize: 8 }]}>
          {subtitle}
        </Text>
      )}
      <View style={sharedStyles.headerLine} />
    </View>
  );
}

interface PacketFooterProps {
  pageLabel?: string;
}

export function PacketFooter({ pageLabel }: PacketFooterProps) {
  return (
    <Text style={sharedStyles.footer} fixed>
      {pageLabel || "Utah's Premier Replacement Window Company"}
    </Text>
  );
}

interface SignatureBlockProps {
  label: string;
  signature?: string | null;
  date?: string | Date | null;
  width?: string;
}

export function SignatureBlock({
  label,
  signature,
  date,
  width = "100%",
}: SignatureBlockProps) {
  return (
    <View style={{ width }}>
      {signature ? (
        // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop
        <Image src={signature} style={[sharedStyles.signatureImage, { width }]} />
      ) : (
        <View style={[sharedStyles.signatureLine, { width }]} />
      )}
      <Text style={sharedStyles.signatureLabel}>
        {label}
        {date && ` - ${formatDatePdf(date)}`}
      </Text>
    </View>
  );
}
