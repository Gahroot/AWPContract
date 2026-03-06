// Addendum page for contract packet
// Page 3 of the 5-page contract packet

import { Page, Text, View } from "@react-pdf/renderer";
import {
  sharedStyles,
  PacketHeader,
  PacketFooter,
  SignatureBlock,
  type PdfContract,
  type PdfAddendum,
  checkbox,
} from "./shared";

interface AddendumPageProps {
  contract: PdfContract;
  addendum: PdfAddendum | null;
}

export function AddendumPage({ contract, addendum }: AddendumPageProps) {
  // Get color checkbox value
  const getColorChecked = (color: string | null | undefined, checkValue: string) => {
    if (!color) return false;
    const c = color.toLowerCase();
    const cv = checkValue.toLowerCase();
    // Handle dual-tone colors
    if (c.includes("/") || c.includes("&") || c.includes(" + ")) {
      return c.includes(cv) || c === cv;
    }
    return c === cv;
  };

  // Count products by type
  const productCounts = () => {
    const counts: Record<string, number> = {};
    (contract.lineItems || []).forEach((item) => {
      const type = item.type || "Window";
      counts[type] = (counts[type] || 0) + (item.qty || 1);
    });
    return Object.entries(counts);
  };

  // Count windows and doors
  const windowsDoorsCount = () => {
    let windows = 0;
    let doors = 0;
    (contract.lineItems || []).forEach((item) => {
      const type = item.type?.toLowerCase() || "";
      if (type.includes("door")) {
        doors += item.qty || 1;
      } else {
        windows += item.qty || 1;
      }
    });
    return { windows, doors };
  };

  const counts = windowsDoorsCount();
  const hasInstall = addendum && (
    addendum.installRemoveOld || addendum.installHaulAway || addendum.installInteriorTrim ||
    addendum.installExteriorTrim || addendum.installCaulkSeal || addendum.installScreens ||
    addendum.installHardware || addendum.installWeatherstrip || addendum.installCleanup ||
    addendum.installOther
  );

  return (
    <Page size="LETTER" style={sharedStyles.page}>
      <PacketHeader title="ADVANCED WINDOWS DIRECT ADDENDUM" />

      {/* Red Banner */}
      <View style={{
        backgroundColor: "#cc0000",
        padding: 6,
        marginBottom: 10,
        alignItems: "center",
      }}>
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 10 }}>
          $ FACTORY DIRECT TO YOU $
        </Text>
      </View>

      {/* Customer Name */}
      <View style={{ marginBottom: 10 }}>
        <Text style={sharedStyles.bold}>Customer: {contract.customerName || ""}</Text>
      </View>

      {/* Two Column Layout */}
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        {/* Left - Quantity */}
        <View style={{ width: "48%", marginRight: "2%" }}>
          <View style={[sharedStyles.borderedBox, { minHeight: 80 }]}>
            <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>QUANTITY:</Text>
            {productCounts().map(([type, qty], i) => (
              <Text key={i} style={sharedStyles.textSm}>
                {qty} {type}
              </Text>
            ))}
          </View>
        </View>

        {/* Right - Installation */}
        <View style={{ width: "50%" }}>
          <View style={[sharedStyles.borderedBox, { minHeight: 80 }]}>
            <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>INSTALLATION:</Text>
            <Text style={sharedStyles.textSm}>
              {checkbox(hasInstall)} Install? Yes {checkbox(!hasInstall)} No
            </Text>
            <Text style={sharedStyles.textSm}>
              {checkbox(contract.measuredBy === "AWD" || contract.measuredBy === "Installer")} Measurements taken by: AWD
              {" "}{checkbox(contract.measuredBy === "Homeowner")} Homeowner
            </Text>
            <Text style={sharedStyles.textSm}>
              AWD will remove and replace: {counts.windows} Windows & {counts.doors} Doors
            </Text>
            <Text style={sharedStyles.textSm}>
              {checkbox(addendum?.hasInteriorShutters)} Interior Shutters: Yes
              {" "}{checkbox(!addendum?.hasInteriorShutters)} No
            </Text>
            <Text style={[sharedStyles.textSm, { marginTop: 3 }]}>
              Type of windows coming out: {contract.windowsBeingRemoved || ""}
            </Text>
          </View>
        </View>
      </View>

      {/* Color Section */}
      <View style={[sharedStyles.borderedBox, { marginBottom: 10 }]}>
        <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>COLOR:</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <View style={{ width: "30%", marginRight: "3%" }}>
            <Text style={sharedStyles.textSm}>
              {checkbox(getColorChecked(addendum?.exteriorColor, "white") ||
                     getColorChecked(addendum?.interiorColor, "white"))} White
            </Text>
            <Text style={sharedStyles.textSm}>
              {checkbox(getColorChecked(addendum?.exteriorColor, "light tan") ||
                     getColorChecked(addendum?.interiorColor, "light tan"))} Light Tan
            </Text>
            <Text style={sharedStyles.textSm}>
              {checkbox(getColorChecked(addendum?.exteriorColor, "dark tan") ||
                     getColorChecked(addendum?.interiorColor, "dark tan"))} Dark Tan
            </Text>
          </View>
          <View style={{ width: "30%", marginRight: "3%" }}>
            <Text style={sharedStyles.textSm}>
              {checkbox(getColorChecked(addendum?.exteriorColor, "black") ||
                     getColorChecked(addendum?.interiorColor, "black"))} Black
            </Text>
            <Text style={sharedStyles.textSm}>
              {checkbox(getColorChecked(addendum?.exteriorColor, "almond") ||
                     getColorChecked(addendum?.interiorColor, "almond"))} Almond
            </Text>
            <Text style={sharedStyles.textSm}>
              {checkbox(getColorChecked(addendum?.exteriorColor, "silver") ||
                     getColorChecked(addendum?.interiorColor, "silver"))} Silver
            </Text>
          </View>
          <View style={{ width: "30%" }}>
            <Text style={sharedStyles.textSm}>
              {checkbox(addendum?.exteriorColor?.toLowerCase().includes("white") &&
                     addendum?.interiorColor?.toLowerCase().includes("tan"))} White/Light Tan
            </Text>
            <Text style={sharedStyles.textSm}>
              {checkbox(addendum?.exteriorColor?.toLowerCase().includes("white") &&
                     addendum?.interiorColor?.toLowerCase().includes("dark"))} White/Dark Tan
            </Text>
            <Text style={sharedStyles.textSm}>
              {checkbox(addendum?.exteriorColor?.toLowerCase().includes("tan") &&
                     addendum?.interiorColor?.toLowerCase().includes("white"))} Tan/White
            </Text>
          </View>
        </View>
        {addendum?.colorDescription && (
          <Text style={[sharedStyles.textSm, { marginTop: 3 }]}>
            Description: {addendum.colorDescription}
          </Text>
        )}
      </View>

      {/* Acknowledgements */}
      <View style={[sharedStyles.borderedBox, { marginBottom: 10 }]}>
        <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>ACKNOWLEDGEMENTS:</Text>
        <Text style={sharedStyles.textSm}>
          {checkbox(addendum?.ackMeasurements)} Installation: AWD is not liable for shutters, blinds, or other
          treatments that do not fit after installation.
        </Text>
        <Text style={sharedStyles.textSm}>
          {checkbox(addendum?.ackSpecifications)} Exterior of Home: Homeowner is responsible for exterior painting,
          stucco, siding repair after installation.
        </Text>
        <Text style={sharedStyles.textSm}>
          {checkbox(addendum?.ackPricing)} Operation (from Exterior): Directions for operation are described from the
          exterior.
        </Text>
        <Text style={sharedStyles.textSm}>
          {checkbox(addendum?.ackTerms)} Permits: Homeowner is responsible for obtaining any required permits.
        </Text>
        {addendum?.ackInitials && (
          <Text style={[sharedStyles.textSm, { marginTop: 3 }]}>
            Initials: {addendum.ackInitials}
          </Text>
        )}
      </View>

      {/* Three Column Bottom */}
      <View style={{ flexDirection: "row", marginBottom: 15 }}>
        {/* Windows Coming Out Of */}
        <View style={{ width: "32%", marginRight: "2%" }}>
          <View style={[sharedStyles.borderedBox]}>
            <Text style={[sharedStyles.bold, { marginBottom: 3 }]}>WINDOWS COMING OUT OF:</Text>
            <Text style={sharedStyles.textSm}>{checkbox(contract.brickApplicationQty > 0)} Brick</Text>
            <Text style={sharedStyles.textSm}>{checkbox(contract.stuccoApplicationQty > 0)} Stucco</Text>
            <Text style={sharedStyles.textSm}>{checkbox(contract.sidingApplicationQty > 0)} Siding</Text>
            <Text style={sharedStyles.textSm}>{checkbox(contract.foundationApplicationQty > 0)} Foundation</Text>
            <Text style={sharedStyles.textSm}>{checkbox(contract.woodApplicationQty > 0)} Wood</Text>
          </View>
        </View>

        {/* Payment */}
        <View style={{ width: "32%", marginRight: "2%" }}>
          <View style={[sharedStyles.borderedBox]}>
            <Text style={[sharedStyles.bold, { marginBottom: 3 }]}>PAYMENT:</Text>
            <Text style={sharedStyles.textSm}>{checkbox(contract.paymentMethod?.toLowerCase().includes("cash"))} Cash</Text>
            <Text style={sharedStyles.textSm}>{checkbox(contract.paymentMethod?.toLowerCase().includes("check"))} Check</Text>
            <Text style={sharedStyles.textSm}>{checkbox(contract.paymentMethod?.toLowerCase().includes("credit") ||
                                                      contract.paymentMethod?.toLowerCase().includes("card"))} Credit Card</Text>
            <Text style={sharedStyles.textSm}>{checkbox(contract.paymentMethod?.toLowerCase().includes("finance"))} Financing</Text>
          </View>
        </View>

        {/* Referral */}
        <View style={{ width: "32%" }}>
          <View style={[sharedStyles.borderedBox]}>
            <Text style={[sharedStyles.bold, { marginBottom: 3 }]}>REFERRAL:</Text>
            <Text style={sharedStyles.textSm}>
              {checkbox(Boolean(addendum?.referralName || contract.referralName))} Yes
              {" "}{checkbox(!addendum?.referralName && !contract.referralName)} No
            </Text>
            {addendum?.referralName && (
              <Text style={sharedStyles.textSm}>Name: {addendum.referralName}</Text>
            )}
            {addendum?.referralPhone && (
              <Text style={sharedStyles.textSm}>Phone: {addendum.referralPhone}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Signatures */}
      <View style={{ flexDirection: "row", gap: 20 }}>
        <View style={{ flex: 1 }}>
          <SignatureBlock
            label="Homeowner Signature"
            signature={addendum?.customerSignature || contract.customerSignature}
            date={addendum?.customerSignatureDate || contract.customerSignatureDate}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SignatureBlock
            label="Sales Rep Signature"
            signature={addendum?.contractorSignature || contract.contractorSignature}
            date={addendum?.contractorSignatureDate || contract.contractorSignatureDate}
          />
        </View>
      </View>

      <PacketFooter />
    </Page>
  );
}
