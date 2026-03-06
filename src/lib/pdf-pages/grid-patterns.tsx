// Grid Patterns page for contract packet
// Page 5 of the 5-page contract packet (conditional - only if grids exist)

import { Page, Text, View } from "@react-pdf/renderer";
import {
  sharedStyles,
  type PdfContract,
  feetInchesFormat,
  formatDatePdf,
} from "./shared";

interface GridPatternPageProps {
  contract: PdfContract;
}

export function GridPatternPage({ contract }: GridPatternPageProps) {
  // Filter line items that have grid types
  const itemsWithGrids = (contract.lineItems || []).filter(
    (item) => item.gridType && item.gridType.trim() !== ""
  );

  if (itemsWithGrids.length === 0) {
    return null;
  }

  return (
    <Page size="LETTER" style={sharedStyles.page}>
      {/* Header */}
      <View style={gpStyles.header}>
        <Text style={gpStyles.headerTitle}>GRID PATTERNS</Text>
        <Text style={gpStyles.headerInfo}>
          2451 S 600 W STE 500, Salt Lake City, UT 84115 • Phone 801-438-4554
        </Text>
        <Text style={gpStyles.headerInfo}>
          direct@advancedwindows.com • www.advancedwindows.com
        </Text>
      </View>

      {/* Title */}
      <Text style={gpStyles.pageTitle}>Grid Pattern Specifications</Text>

      {/* Info Row */}
      <View style={gpStyles.infoRow}>
        <View style={gpStyles.infoCell}>
          <Text style={gpStyles.infoLabel}>Customer:</Text>
          <Text style={gpStyles.infoValue}>{contract.customerName || ""}</Text>
        </View>
        <View style={gpStyles.infoCell}>
          <Text style={gpStyles.infoLabel}>Date:</Text>
          <Text style={gpStyles.infoValue}>{formatDatePdf(contract.customerSignatureDate || contract.createdAt)}</Text>
        </View>
        <View style={gpStyles.infoCell}>
          <Text style={gpStyles.infoLabel}>Sales Rep:</Text>
          <Text style={gpStyles.infoValue}>{contract.salesman || ""}</Text>
        </View>
      </View>

      {/* Intro */}
      <Text style={gpStyles.introText}>
        The following grid patterns have been specified for windows/doors with grids. Visual representations are shown for each item.
      </Text>

      {/* Grid Items */}
      {itemsWithGrids.map((item, index) => (
        <View key={item.id || index} style={gpStyles.itemRow}>
          {/* Left - Details */}
          <View style={gpStyles.detailsSection}>
            <Text style={gpStyles.itemTitle}>{index + 1}. {item.location || ""}</Text>
            <Text style={gpStyles.itemText}>{item.type}</Text>
            <Text style={gpStyles.itemText}>
              {feetInchesFormat(item.width)} x {feetInchesFormat(item.height)}
            </Text>
            <Text style={gpStyles.itemText}>{item.gridType || ""}</Text>
          </View>

          {/* Right - Custom Sketch */}
          <View style={gpStyles.sketchSection}>
            <Text style={gpStyles.sketchLabel}>Custom sketch</Text>
            <View style={gpStyles.sketchArea} />
          </View>
        </View>
      ))}

      {/* Legend Box */}
      <View style={[sharedStyles.borderedBox, { marginTop: 15, backgroundColor: "#f9f9f9" }]}>
        <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>Grid Pattern Legend:</Text>
        <Text style={sharedStyles.textSm}>
          <Text style={sharedStyles.bold}>V (Vertical):</Text> Number of vertical grid lines dividing the glass horizontally
        </Text>
        <Text style={sharedStyles.textSm}>
          <Text style={sharedStyles.bold}>H (Horizontal):</Text> Number of horizontal grid lines dividing the glass vertically
        </Text>
        <Text style={[sharedStyles.textSm, { marginTop: 3 }]}>
          Example: 2V × 3H creates a pattern with 2 vertical and 3 horizontal lines (12 panes total)
        </Text>
      </View>

      {/* Footer */}
      <View style={gpStyles.footer}>
        <Text style={gpStyles.footerText}>&quot;Utah&apos;s Premier Replacement Window Company&quot;</Text>
        <Text style={gpStyles.footerText}>www.advancedwindows.com</Text>
        <Text style={gpStyles.footerText}>
          2451 S 600 W STE 500, Salt Lake City, UT 84115 • Office: 801-438-4554
        </Text>
      </View>
    </Page>
  );
}

// Export a helper function to check if grid page is needed
export function needsGridPatternPage(contract: PdfContract): boolean {
  return (contract.lineItems || []).some(
    (item) => item.gridType && item.gridType.trim() !== ""
  );
}

const gpStyles = {
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
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row" as const,
    marginBottom: 15,
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  infoCell: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 8,
  },
  introText: {
    fontSize: 8,
    marginBottom: 15,
    fontStyle: "italic" as const,
  },
  itemRow: {
    flexDirection: "row" as const,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#999",
    minHeight: 80,
  },
  detailsSection: {
    width: "60%",
    borderRightWidth: 1,
    borderRightColor: "#999",
    padding: 8,
  },
  itemTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 5,
  },
  itemText: {
    fontSize: 8,
    marginBottom: 2,
  },
  sketchSection: {
    width: "40%",
    padding: 8,
  },
  sketchLabel: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 3,
  },
  sketchArea: {
    flex: 1,
    borderWidth: 0.5,
    borderStyle: "dashed" as const,
    borderColor: "#999",
    minHeight: 50,
    backgroundColor: "#fafafa",
  },
  footer: {
    position: "absolute" as const,
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center" as const,
  },
  footerText: {
    fontSize: 8,
    color: "#666",
    marginBottom: 2,
  },
};
