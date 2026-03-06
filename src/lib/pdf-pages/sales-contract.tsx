// Sales Contract page for contract packet
// Page 1 of the 5-page contract packet

import { Page, Text, View } from "@react-pdf/renderer";
import {
  sharedStyles,
  feetInchesFormat,
  formatDatePdf,
  formatCurrencyPdf,
  downPaymentPercent,
  checkbox,
  type PdfContract,
  type PdfLineItem,
} from "./shared";

interface SalesContractPageProps {
  contract: PdfContract;
}

export function SalesContractPage({ contract }: SalesContractPageProps) {
  // Helper to get operation display
  const getOperationDisplay = (item: PdfLineItem) => {
    const op = item.operation || "";
    if (!op) return "";
    return op;
  };

  return (
    <Page size="LETTER" style={sharedStyles.page}>
      {/* Header */}
      <View style={salesContractStyles.header}>
        <Text style={salesContractStyles.headerTitle}>SALES CONTRACT</Text>
        <Text style={salesContractStyles.headerInfo}>
          2451 S 600 W STE 500, Salt Lake City, UT 84115 • Phone 801-438-4554
        </Text>
        <Text style={salesContractStyles.headerInfo}>
          direct@advancedwindows.com • www.advancedwindows.com
        </Text>
      </View>

      {/* Page Title */}
      <View style={{ alignItems: "center", marginBottom: 15 }}>
        <Text style={salesContractStyles.pageTitle}>Sales Contract</Text>
      </View>

      {/* Customer Info Grid */}
      <View style={salesContractStyles.customerGrid}>
        {/* Row 1 */}
        <View style={salesContractStyles.gridRow}>
          <View style={[salesContractStyles.gridCell, { borderLeftWidth: 1 }]}>
            <Text style={salesContractStyles.label}>Customer:</Text>
            <Text style={salesContractStyles.value}>{contract.customerName || ""}</Text>
          </View>
          <View style={salesContractStyles.gridCell}>
            <Text style={salesContractStyles.label}>Date Written:</Text>
            <Text style={salesContractStyles.value}>{formatDatePdf(contract.createdAt)}</Text>
          </View>
          <View style={[salesContractStyles.gridCell, { borderRightWidth: 1 }]}>
            <Text style={salesContractStyles.label}>Year Built:</Text>
            <Text style={salesContractStyles.value}>{contract.yearBuilt || ""}</Text>
          </View>
        </View>
        {/* Row 2 */}
        <View style={salesContractStyles.gridRow}>
          <View style={[salesContractStyles.gridCell, { borderLeftWidth: 1 }]}>
            <Text style={salesContractStyles.label}>Job Address:</Text>
            <Text style={salesContractStyles.value}>{contract.jobAddress || ""}</Text>
          </View>
          <View style={salesContractStyles.gridCell}>
            <Text style={salesContractStyles.label}>City:</Text>
            <Text style={salesContractStyles.value}>{contract.customerCity || ""}</Text>
          </View>
          <View style={[salesContractStyles.gridCell, { borderRightWidth: 1 }]}>
            <Text style={salesContractStyles.label}>Zip:</Text>
            <Text style={salesContractStyles.value}>{contract.customerZip || ""}</Text>
          </View>
        </View>
        {/* Row 3 */}
        <View style={[salesContractStyles.gridRow, { borderBottomWidth: 1 }]}>
          <View style={[salesContractStyles.gridCell, { borderLeftWidth: 1 }]}>
            <Text style={salesContractStyles.label}>Phone:</Text>
            <Text style={salesContractStyles.value}>{contract.customerPhone || ""}</Text>
          </View>
          <View style={salesContractStyles.gridCell}>
            <Text style={salesContractStyles.label}>Email:</Text>
            <Text style={salesContractStyles.value}>{contract.customerEmail || ""}</Text>
          </View>
          <View style={salesContractStyles.gridCell}>
            <Text style={salesContractStyles.label}>Lead Test:</Text>
            <Text style={salesContractStyles.value}>{contract.leadTest || "No"}</Text>
          </View>
          <View style={[salesContractStyles.gridCell, { borderRightWidth: 1 }]}>
            <Text style={salesContractStyles.label}>Sales Rep:</Text>
            <Text style={salesContractStyles.value}>{contract.salesman || ""}</Text>
          </View>
        </View>
      </View>

      {/* Cancellation Notice */}
      <View style={salesContractStyles.noticeBox}>
        <Text style={salesContractStyles.noticeText}>
          YOU, THE BUYER, MAY CANCEL THIS CONTRACT AT ANY TIME PRIOR TO MIDNIGHT OF THE THIRD
          BUSINESS DAY AFTER THE DATE OF THE TRANSACTION OR RECEIPT OF THE PRODUCT, WHICHEVER IS
          LATER.
        </Text>
        <Text style={salesContractStyles.noticeText}>
          To cancel this transaction, deliver, mail, or email a signed and dated written notice to:
        </Text>
        <Text style={salesContractStyles.noticeText}>Advanced Windows Direct</Text>
        <Text style={salesContractStyles.noticeText}>3052 South 460 West, South Salt Lake, UT 84115</Text>
        <Text style={salesContractStyles.noticeText}>cancellations@advancedwindows.com</Text>
      </View>

      {/* Line Items Table */}
      <View style={salesContractStyles.tableContainer}>
        {/* Header */}
        <View style={salesContractStyles.tableHeader}>
          <Text style={[salesContractStyles.th, { width: "9%" }]}>Location</Text>
          <Text style={[salesContractStyles.th, { width: "7%" }]}>Type</Text>
          <Text style={[salesContractStyles.th, { width: "8%" }]}>Size</Text>
          <Text style={[salesContractStyles.th, { width: "7%" }]}>Net Size</Text>
          <Text style={[salesContractStyles.th, { width: "6%" }]}>Fin</Text>
          <Text style={[salesContractStyles.th, { width: "8%" }]}>Color</Text>
          <Text style={[salesContractStyles.th, { width: "8%" }]}>Glass Type</Text>
          <Text style={[salesContractStyles.th, { width: "4%" }]}>Temp</Text>
          <Text style={[salesContractStyles.th, { width: "4%" }]}>OBS</Text>
          <Text style={[salesContractStyles.th, { width: "6%" }]}>Grid</Text>
          <Text style={[salesContractStyles.th, { width: "5%" }]}>Storms</Text>
          <Text style={[salesContractStyles.th, { width: "5%" }]}>Wraps</Text>
          <Text style={[salesContractStyles.th, { width: "13%" }]}>Operation</Text>
        </View>

        {/* Data Rows */}
        {(contract.lineItems || []).map((item, idx) => (
          <View key={item.id || idx} style={salesContractStyles.tableRow}>
            <Text style={[salesContractStyles.td, { width: "9%" }]}>{item.location || ""}</Text>
            <Text style={[salesContractStyles.td, { width: "7%" }]}>{item.type}</Text>
            <Text style={[salesContractStyles.td, { width: "8%" }]}>
              {feetInchesFormat(item.width)} x {feetInchesFormat(item.height)}
            </Text>
            <Text style={[salesContractStyles.td, { width: "7%" }]}>
              {feetInchesFormat(item.width)} x {feetInchesFormat(item.height)}
            </Text>
            <Text style={[salesContractStyles.td, { width: "6%" }]}>{item.frame || ""}</Text>
            <Text style={[salesContractStyles.td, { width: "8%" }]}>{item.color}</Text>
            <Text style={[salesContractStyles.td, { width: "8%" }]}>{item.glassType || ""}</Text>
            <Text style={[salesContractStyles.td, { width: "4%" }]}>{checkbox(item.temperedGlass)}</Text>
            <Text style={[salesContractStyles.td, { width: "4%" }]}>{checkbox(item.obscuredGlass)}</Text>
            <Text style={[salesContractStyles.td, { width: "6%" }]}>{item.gridType || ""}</Text>
            <Text style={[salesContractStyles.td, { width: "5%" }]}>
              {checkbox(item.type?.toLowerCase().includes("storm"))}
            </Text>
            <Text style={[salesContractStyles.td, { width: "5%" }]}>{checkbox(item.wrap)}</Text>
            <Text style={[salesContractStyles.td, { width: "13%" }]}>{getOperationDisplay(item)}</Text>
          </View>
        ))}
      </View>

      {/* Bottom Section */}
      <View style={salesContractStyles.bottomSection}>
        {/* Left - Totals */}
        <View style={salesContractStyles.totalsBox}>
          <View style={salesContractStyles.totalRow}>
            <Text style={salesContractStyles.totalLabel}>Contract Total:</Text>
            <Text style={salesContractStyles.totalValue}>{formatCurrencyPdf(contract.contractTotal)}</Text>
          </View>
          <View style={salesContractStyles.totalRow}>
            <Text style={salesContractStyles.totalLabel}>
              Down Payment ({downPaymentPercent(contract.downPayment, contract.contractTotal)}):
            </Text>
            <Text style={salesContractStyles.totalValue}>{formatCurrencyPdf(contract.downPayment)}</Text>
          </View>
          <View style={salesContractStyles.totalRow}>
            <Text style={[salesContractStyles.totalLabel, salesContractStyles.bold]}>Balance Due at Installation:</Text>
            <Text style={[salesContractStyles.totalValue, salesContractStyles.bold]}>
              {formatCurrencyPdf(contract.balanceDue)}
            </Text>
          </View>
          <View style={[salesContractStyles.totalRow, { marginTop: 8 }]}>
            <Text style={salesContractStyles.totalLabel}>Method of Payment:</Text>
            <Text style={salesContractStyles.totalValue}>{contract.paymentMethod || ""}</Text>
          </View>
        </View>

        {/* Right - Acknowledgement and Signatures */}
        <View style={salesContractStyles.signatureSection}>
          <Text style={[salesContractStyles.textSm, { marginBottom: 10, textAlign: "center" }]}>
            Customer acknowledges receipt of and agreement to all Terms and Conditions
            contained in this Contract, including those on subsequent pages.
          </Text>

          <View style={{ marginBottom: 15 }}>
            <View style={salesContractStyles.signatureLine} />
            <Text style={salesContractStyles.signatureLabel}>Customer Signature</Text>
            <Text style={salesContractStyles.signatureLabel}>Date: _____________</Text>
          </View>

          <View>
            <View style={salesContractStyles.signatureLine} />
            <Text style={salesContractStyles.signatureLabel}>Sales Representative Signature</Text>
            <Text style={salesContractStyles.signatureLabel}>Date: _____________</Text>
          </View>
        </View>
      </View>
    </Page>
  );
}

const salesContractStyles = {
  header: {
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "right" as const,
    color: "#1a365d",
  },
  headerInfo: {
    fontSize: 8,
    textAlign: "right" as const,
    color: "#333",
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1a365d",
  },
  customerGrid: {
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 15,
  },
  gridRow: {
    flexDirection: "row" as const,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 28,
  },
  gridCell: {
    flex: 1,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: "#000",
    justifyContent: "center" as const,
  },
  label: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 2,
  },
  value: {
    fontSize: 8,
  },
  noticeBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 10,
    marginBottom: 15,
  },
  noticeText: {
    fontSize: 9,
    lineHeight: 1.3,
    marginBottom: 3,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row" as const,
    backgroundColor: "#1a365d",
    padding: 4,
  },
  th: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center" as const,
  },
  tableRow: {
    flexDirection: "row" as const,
    borderBottomWidth: 0.5,
    borderBottomColor: "#999",
    minHeight: 24,
  },
  td: {
    fontSize: 7,
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#999",
    textAlign: "center" as const,
  },
  bottomSection: {
    flexDirection: "row" as const,
    gap: 15,
  },
  totalsBox: {
    width: "40%",
    borderWidth: 1,
    borderColor: "#000",
    padding: 10,
  },
  totalRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 9,
  },
  totalValue: {
    fontSize: 9,
  },
  signatureSection: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    height: 30,
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 8,
  },
  textSm: {
    fontSize: 8,
  },
  bold: {
    fontWeight: "bold",
  },
};
