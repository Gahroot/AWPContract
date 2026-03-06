// Grid Patterns page for contract packet
// Page 5 of the 5-page contract packet (conditional - only if grids exist)

import { Page, Text, View } from "@react-pdf/renderer";
import {
  sharedStyles,
  PacketHeader,
  PacketFooter,
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
      <PacketHeader title="GRID PATTERN SPECIFICATIONS" />

      {/* Blue underline */}
      <View style={{
        borderBottom: "3px solid #1a365d",
        marginBottom: 15,
      }} />

      {/* Info Row */}
      <View style={{
        flexDirection: "row",
        marginBottom: 15,
        backgroundColor: "#f5f5f5",
        padding: 8,
        border: "1px solid #ddd",
      }}>
        <View style={{ flex: 1 }}>
          <Text style={[sharedStyles.bold, { fontSize: 7 }]}>CUSTOMER:</Text>
          <Text style={sharedStyles.textSm}>{contract.customerName || ""}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sharedStyles.bold, { fontSize: 7 }]}>DATE:</Text>
          <Text style={sharedStyles.textSm}>{formatDatePdf(contract.customerSignatureDate || contract.createdAt)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sharedStyles.bold, { fontSize: 7 }]}>SALES REP:</Text>
          <Text style={sharedStyles.textSm}>{contract.salesman || ""}</Text>
        </View>
      </View>

      {/* Grid Items Table */}
      {itemsWithGrids.map((item, index) => (
        <View key={item.id || index} style={{
          flexDirection: "row",
          marginBottom: 10,
          border: "1px solid #999",
          minHeight: 80,
        }}>
          {/* Left - Window/Door Details */}
          <View style={{ width: "60%", borderRight: "1px solid #999" }}>
            <View style={{
              backgroundColor: "#1a365d",
              color: "#fff",
              padding: 4,
            }}>
              <Text style={[sharedStyles.bold, { fontSize: 8 }]}>
                Location: {item.location || ""} | Type: {item.type}
              </Text>
            </View>
            <View style={{ padding: 6 }}>
              <Text style={sharedStyles.textSm}>
                <Text style={sharedStyles.bold}>Size:</Text> {feetInchesFormat(item.width)} x {feetInchesFormat(item.height)}
              </Text>
              <Text style={sharedStyles.textSm}>
                <Text style={sharedStyles.bold}>Grid Type:</Text> {item.gridType || ""}
              </Text>
              <Text style={sharedStyles.textSm}>
                <Text style={sharedStyles.bold}>Color:</Text> {item.color || ""}
              </Text>
              {item.series && (
                <Text style={sharedStyles.textSm}>
                  <Text style={sharedStyles.bold}>Series:</Text> {item.series}
                </Text>
              )}
            </View>
          </View>

          {/* Right - Custom Sketch Area */}
          <View style={{ width: "40%", padding: 6 }}>
            <Text style={[sharedStyles.bold, { fontSize: 7, marginBottom: 3 }]}>
              CUSTOM SKETCH:
            </Text>
            <View style={{
              flex: 1,
              border: "0.5px dashed #999",
              minHeight: 50,
              backgroundColor: "#fafafa",
            }} />
          </View>
        </View>
      ))}

      {/* Legend Box */}
      <View style={[sharedStyles.borderedBox, { marginTop: 15, backgroundColor: "#f9f9f9" }]}>
        <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>LEGEND:</Text>
        <Text style={sharedStyles.textSm}>
          <Text style={sharedStyles.bold}>V</Text> = Vertical bars (top to bottom)
        </Text>
        <Text style={sharedStyles.textSm}>
          <Text style={sharedStyles.bold}>H</Text> = Horizontal bars (left to right)
        </Text>
        <Text style={sharedStyles.textSm}>
          Example: &quot;2V 1H&quot; = 2 vertical bars with 1 horizontal bar intersection
        </Text>
      </View>

      <PacketFooter pageLabel="Grid patterns are custom made to your specifications." />
    </Page>
  );
}

// Export a helper function to check if grid page is needed
export function needsGridPatternPage(contract: PdfContract): boolean {
  return (contract.lineItems || []).some(
    (item) => item.gridType && item.gridType.trim() !== ""
  );
}
