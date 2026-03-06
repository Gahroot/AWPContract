// Sales Contract page for contract packet
// Page 1 of the 5-page contract packet

import { Page, Text, View } from "@react-pdf/renderer";
import {
  sharedStyles,
  PacketHeader,
  PacketFooter,
  SignatureBlock,
  type PdfContract,
  feetInchesFormat,
  formatCurrencyPdf,
  formatDatePdf,
  downPaymentPercent,
} from "./shared";

interface SalesContractPageProps {
  contract: PdfContract;
}

export function SalesContractPage({ contract }: SalesContractPageProps) {
  return (
    <Page size="LETTER" style={sharedStyles.page}>
      <PacketHeader
        title="SALES CONTRACT"
        subtitle={contract.contractNumber ? `Contract #: ${contract.contractNumber.slice(0, 8)}` : undefined}
      />

      {/* Customer Info Grid */}
      <View style={[sharedStyles.table, { border: "1px solid #333" }]}>
        {/* Row 1 */}
        <View style={{ flexDirection: "row", borderBottom: "0.5px solid #999" }}>
          <View style={[sharedStyles.tableCell, { width: "25%" }, sharedStyles.bold]}>
            <Text>Customer:</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "25%" }]}>
            <Text>Date Written:</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "25%" }]}>
            <Text>Year Built:</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "25%" }]}>
            <Text>Sales Rep:</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", borderBottom: "0.5px solid #999" }}>
          <View style={[sharedStyles.tableCell, { width: "25%" }, sharedStyles.bold]}>
            <Text>{contract.customerName || ""}</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "25%" }]}>
            <Text>{formatDatePdf(contract.createdAt)}</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "25%" }]}>
            <Text>{contract.yearBuilt || ""}</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "25%" }]}>
            <Text>{contract.salesman || ""}</Text>
          </View>
        </View>
        {/* Row 2 */}
        <View style={{ flexDirection: "row", borderBottom: "0.5px solid #999" }}>
          <View style={[sharedStyles.tableCell, { width: "33%" }]}>
            <Text>Job Address:</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "33%" }]}>
            <Text>City:</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "34%" }]}>
            <Text>Zip:</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", borderBottom: "0.5px solid #999" }}>
          <View style={[sharedStyles.tableCell, { width: "33%" }]}>
            <Text>{contract.jobAddress || ""}</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "33%" }]}>
            <Text>{contract.customerCity || ""}</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "34%" }]}>
            <Text>{contract.customerZip || ""}</Text>
          </View>
        </View>
        {/* Row 3 */}
        <View style={{ flexDirection: "row" }}>
          <View style={[sharedStyles.tableCell, { width: "25%" }]}>
            <Text>Phone:</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "25%" }]}>
            <Text>Email:</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "25%" }]}>
            <Text>Lead Test:</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "25%" }]}>
            <Text>House Type:</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row" }}>
          <View style={[sharedStyles.tableCell, { width: "25%" }]}>
            <Text>{contract.customerPhone || ""}</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "25%" }]}>
            <Text>{contract.customerEmail || ""}</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "25%" }]}>
            <Text>{contract.leadTest || ""}</Text>
          </View>
          <View style={[sharedStyles.tableCell, { width: "25%" }]}>
            <Text>{contract.houseType || ""}</Text>
          </View>
        </View>
      </View>

      {/* Cancellation Notice */}
      <View style={[sharedStyles.borderedBoxBold, { marginBottom: 10, backgroundColor: "#f5f5f5" }]}>
        <Text style={[sharedStyles.bold, { marginBottom: 3 }]}>CANCELLATION NOTICE:</Text>
        <Text style={[sharedStyles.textSm, { lineHeight: 1.2 }]}>
          YOU, THE BUYER, MAY CANCEL THIS CONTRACT AT ANY TIME PRIOR TO MIDNIGHT OF THE THIRD BUSINESS DAY AFTER THE
          SALE. IF YOU CANCEL, ANY PAYMENTS MADE BY YOU UNDER THE CONTRACT WILL BE RETURNED WITHIN 10 BUSINESS DAYS
          FOLLOWING RECEIPT OF YOUR CANCELLATION NOTICE. TO CANCEL THIS CONTRACT, MAIL OR DELIVER A SIGNED AND DATED
          COPY OF YOUR CANCELLATION NOTICE OR ANY OTHER WRITTEN NOTICE TO:
        </Text>
        <Text style={[sharedStyles.bold, { marginTop: 3 }]}>
          {contract.customerCity?.toLowerCase().includes("phoenix") ||
           contract.customerState?.toLowerCase().includes("az")
            ? "Advanced Windows Direct, 2451 S 600 W STE 500, Salt Lake City, UT 84115"
            : "3052 South 460 West, South Salt Lake, UT 84115"}
        </Text>
        <Text style={[sharedStyles.bold, { marginTop: 1 }]}>Email: cancellations@advancedwindows.com</Text>
      </View>

      {/* Line Items Table */}
      <View style={sharedStyles.table}>
        <View style={{ flexDirection: "row" }}>
          <Text style={[sharedStyles.tableHeader, { width: "9%" }]}>Loc</Text>
          <Text style={[sharedStyles.tableHeader, { width: "7%" }]}>Type</Text>
          <Text style={[sharedStyles.tableHeader, { width: "8%" }]}>Size</Text>
          <Text style={[sharedStyles.tableHeader, { width: "7%" }]}>Net Sz</Text>
          <Text style={[sharedStyles.tableHeader, { width: "6%" }]}>Fin</Text>
          <Text style={[sharedStyles.tableHeader, { width: "8%" }]}>Color</Text>
          <Text style={[sharedStyles.tableHeader, { width: "7%" }]}>Glass</Text>
          <Text style={[sharedStyles.tableHeader, { width: "5%" }]}>Tmp</Text>
          <Text style={[sharedStyles.tableHeader, { width: "5%" }]}>OBS</Text>
          <Text style={[sharedStyles.tableHeader, { width: "8%" }]}>Grid</Text>
          <Text style={[sharedStyles.tableHeader, { width: "6%" }]}>Strm</Text>
          <Text style={[sharedStyles.tableHeader, { width: "5%" }]}>Wrp</Text>
          <Text style={[sharedStyles.tableHeader, { width: "19%" }]}>Operation</Text>
        </View>
        {(contract.lineItems || []).map((item, i) => (
          <View key={i} style={{ flexDirection: "row", borderBottom: "0.5px solid #ddd" }}>
            <View style={[sharedStyles.tableCellSm, { width: "9%" }]}>
              <Text>{item.location || ""}</Text>
            </View>
            <View style={[sharedStyles.tableCellSm, { width: "7%" }]}>
              <Text>{item.type}</Text>
            </View>
            <View style={[sharedStyles.tableCellSm, { width: "8%" }]}>
              <Text>{feetInchesFormat(item.width)} x {feetInchesFormat(item.height)}</Text>
            </View>
            <View style={[sharedStyles.tableCellSm, { width: "7%" }]}>
              <Text>{feetInchesFormat(item.width)} x {feetInchesFormat(item.height)}</Text>
            </View>
            <View style={[sharedStyles.tableCellSm, { width: "6%" }]}>
              <Text>{item.frame === "Nail Fin" ? "Nail Fin" : (item.frame || "Nail Fin").substring(0, 3)}</Text>
            </View>
            <View style={[sharedStyles.tableCellSm, { width: "8%" }]}>
              <Text>{item.color.substring(0, 6)}</Text>
            </View>
            <View style={[sharedStyles.tableCellSm, { width: "7%" }]}>
              <Text>{item.glassType ? item.glassType.substring(0, 4) : ""}</Text>
            </View>
            <View style={[sharedStyles.tableCellSm, { width: "5%" }]}>
              <Text>{item.temperedGlass ? "Yes" : "No"}</Text>
            </View>
            <View style={[sharedStyles.tableCellSm, { width: "5%" }]}>
              <Text>{item.obscuredGlass ? "Yes" : "No"}</Text>
            </View>
            <View style={[sharedStyles.tableCellSm, { width: "8%" }]}>
              <Text>{item.gridType ? item.gridType.substring(0, 5) : "—"}</Text>
            </View>
            <View style={[sharedStyles.tableCellSm, { width: "6%" }]}>
              <Text>{item.coated ? "Yes" : "No"}</Text>
            </View>
            <View style={[sharedStyles.tableCellSm, { width: "5%" }]}>
              <Text>{item.wrap ? "Yes" : "No"}</Text>
            </View>
            <View style={[sharedStyles.tableCellSm, { width: "19%" }]}>
              <Text>{item.operation || ""}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Bottom Section */}
      <View style={{ flexDirection: "row", marginTop: 10 }}>
        {/* Left - Totals */}
        <View style={{ width: "50%" }}>
          <View style={[sharedStyles.borderedBox, { height: "100%" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
              <Text>Contract Total:</Text>
              <Text>{formatCurrencyPdf(contract.contractTotal)}</Text>
            </View>
            {contract.downPayment > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                <Text>Down Payment ({downPaymentPercent(contract.downPayment, contract.contractTotal)}):</Text>
                <Text>{formatCurrencyPdf(contract.downPayment)}</Text>
              </View>
            )}
            <View style={[{ flexDirection: "row", justifyContent: "space-between", marginTop: 5, paddingTop: 5, borderTop: "1px solid #333" }]}>
              <Text style={[sharedStyles.bold]}>Balance Due at Installation:</Text>
              <Text style={[sharedStyles.bold, { fontSize: 10 }]}>{formatCurrencyPdf(contract.balanceDue)}</Text>
            </View>
            <View style={{ marginTop: 5 }}>
              <Text style={sharedStyles.textSm}>Method of Payment: {contract.paymentMethod || ""}</Text>
            </View>
          </View>
        </View>

        {/* Right - Acknowledgement and Signatures */}
        <View style={{ width: "45%", marginLeft: "5%" }}>
          <Text style={[sharedStyles.textSm, { marginBottom: 8, lineHeight: 1.2 }]}>
            Customer acknowledges receipt of a copy of this contract and agrees to all terms and conditions.
            Customer understands that products are custom made and cannot be returned.
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <SignatureBlock
                label="Customer Signature"
                signature={contract.customerSignature}
                date={contract.customerSignatureDate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <SignatureBlock
                label="Sales Rep Signature"
                signature={contract.contractorSignature}
                date={contract.contractorSignatureDate}
              />
            </View>
          </View>
        </View>
      </View>

      <PacketFooter />
    </Page>
  );
}
