// Addendum page for contract packet
// Page 3 of the 5-page contract packet

import { Page, Text, View } from "@react-pdf/renderer";
import {
  sharedStyles,
  type PdfContract,
  type PdfAddendum,
  checkbox,
} from "./shared";

interface AddendumPageProps {
  contract: PdfContract;
  addendum: PdfAddendum | null;
}

export function AddendumPage({ contract, addendum }: AddendumPageProps) {
  // Count products by type/series
  const productCounts = () => {
    const counts: Record<string, number> = {};
    (contract.lineItems || []).forEach((item) => {
      const series = item.series || "Standard";
      counts[series] = (counts[series] || 0) + (item.qty || 1);
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

  // Get color checkbox value
  const getColorChecked = (color: string | null | undefined, checkValue: string) => {
    if (!color) return false;
    const c = color.toLowerCase();
    const cv = checkValue.toLowerCase();
    return c === cv || c.includes(cv);
  };

  // Check payment method
  const getPaymentChecked = (method: string) => {
    const pm = contract.paymentMethod?.toLowerCase() || "";
    if (method === "cash") return pm.includes("cash");
    if (method === "credit") return pm.includes("credit") || pm.includes("card");
    if (method === "check") return pm.includes("check");
    if (method === "ach") return pm.includes("ach");
    if (method === "finance") return pm.includes("finance");
    return false;
  };

  return (
    <Page size="LETTER" style={sharedStyles.page}>
      {/* Header */}
      <View style={addendumStyles.header}>
        <Text style={addendumStyles.headerTitle}>ADVANCED WINDOWS DIRECT ADDENDUM</Text>
        <Text style={addendumStyles.headerInfo}>
          2451 S 600 W STE 500, Salt Lake City, UT 84115 | Phone: 801-438-4554
        </Text>
        <Text style={addendumStyles.headerInfo}>
          direct@advancedwindows.com | www.advancedwindows.com
        </Text>
      </View>

      {/* Red Banner */}
      <View style={addendumStyles.redBanner}>
        <Text style={addendumStyles.redBannerText}>$ FACTORY DIRECT TO YOU $</Text>
      </View>

      {/* Customer Name */}
      <View style={{ marginBottom: 10 }}>
        <Text style={sharedStyles.bold}>Customer:</Text>
        <Text>{contract.customerName || ""}</Text>
      </View>

      {/* Two Column Layout */}
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        {/* Left - Quantity */}
        <View style={{ width: "48%", marginRight: "2%" }}>
          <View style={[sharedStyles.borderedBox, { minHeight: 80 }]}>
            <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>QUANTITY:</Text>
            <Text style={sharedStyles.textSm}>Windows:</Text>
            {productCounts().map(([series, qty], i) => (
              <Text key={i} style={[sharedStyles.textSm, { marginLeft: 10 }]}>
                {qty} {series}
              </Text>
            ))}
            <Text style={sharedStyles.textSm}>Doors:</Text>
            <Text style={[sharedStyles.textSm, { marginLeft: 10 }]}>
              {counts.doors > 0 ? counts.doors : "0"}
            </Text>
          </View>
        </View>

        {/* Right - Installation */}
        <View style={{ width: "50%" }}>
          <View style={[sharedStyles.borderedBox, { minHeight: 80 }]}>
            <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>INSTALLATION:</Text>
            <Text style={sharedStyles.textSm}>
              Install? {checkbox(hasInstall)} Yes {checkbox(!hasInstall)} No
            </Text>
            <Text style={sharedStyles.textSm}>
              Measurements taken by: {checkbox(contract.measuredBy === "AWD" || contract.measuredBy === "Installer")} AWD
              {" "}{checkbox(contract.measuredBy === "Homeowner")} Homeowner
            </Text>
            <Text style={sharedStyles.textSm}>
              AWD will remove and replace:
            </Text>
            <Text style={[sharedStyles.textSm, { marginLeft: 10 }]}>
              {counts.windows} Windows & {counts.doors} Doors
            </Text>
            <Text style={sharedStyles.textSm}>
              Interior Shutters: {checkbox(addendum?.hasInteriorShutters)} Yes
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
        <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>Color:</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 5 }}>
          <Text style={sharedStyles.textSm}>
            {checkbox(getColorChecked(addendum?.exteriorColor, "white") ||
                   getColorChecked(addendum?.interiorColor, "white"))} White
            {"  "}{checkbox(getColorChecked(addendum?.exteriorColor, "light tan") ||
                   getColorChecked(addendum?.interiorColor, "light tan"))} Light Tan
            {"  "}{checkbox(getColorChecked(addendum?.exteriorColor, "dark tan") ||
                   getColorChecked(addendum?.interiorColor, "dark tan"))} Dark Tan
            {"  "}{checkbox(getColorChecked(addendum?.exteriorColor, "black") ||
                   getColorChecked(addendum?.interiorColor, "black"))} Black
          </Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Text style={sharedStyles.textSm}>
            {checkbox(addendum?.exteriorColor?.toLowerCase().includes("white") &&
                   addendum?.interiorColor?.toLowerCase().includes("tan"))} Outside/White Inside
            {"  "}{checkbox(addendum?.exteriorColor?.toLowerCase().includes("black") &&
                   addendum?.interiorColor?.toLowerCase().includes("light") ||
                   addendum?.interiorColor?.toLowerCase().includes("lt"))} Black Outside/LT Inside
            {"  "}{checkbox(addendum?.exteriorColor?.toLowerCase().includes("black") &&
                   addendum?.interiorColor?.toLowerCase().includes("dark") ||
                   addendum?.interiorColor?.toLowerCase().includes("dt"))} Black Outside/DT Inside
          </Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 5 }}>
          <Text style={sharedStyles.textSm}>
            {checkbox(addendum?.exteriorColor?.toLowerCase().includes("bronze"))} Bronze Outside/White Inside
            {"  "}{checkbox(addendum?.exteriorColor?.toLowerCase().includes("bronze"))} Bronze Outside/LT Inside
            {"  "}{checkbox(addendum?.exteriorColor?.toLowerCase().includes("bronze"))} Bronze Outside/DT Inside
          </Text>
        </View>
      </View>

      {/* Acknowledgements */}
      <View style={[sharedStyles.borderedBox, { marginBottom: 10 }]}>
        <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>ACKNOWLEDGEMENTS</Text>
        <Text style={sharedStyles.textSm}>
          Advanced Windows Direct will clean up and remove all debris from home.
        </Text>

        {/* Initials placeholder */}
        <Text style={[sharedStyles.textSm, { marginTop: 5 }]}>
          {"______      "}Installation:
        </Text>
        <Text style={[sharedStyles.textSm, { marginLeft: 20 }]}>
          AWD assumes no liability for damage to shutters, blinds or items surrounding the installation area. Homeowner is responsible to remove
          and replace shutters and blinds and move belongings at least 3&apos; from window openings.
        </Text>

        <Text style={[sharedStyles.textSm, { marginTop: 5 }]}>
          {"______      "}Exterior of Home:
        </Text>
        <Text style={[sharedStyles.textSm, { marginLeft: 20 }]}>
          Homeowner is responsible for any damage and/or repair to home.
        </Text>

        <Text style={[sharedStyles.textSm, { marginTop: 5 }]}>
          {"______      "}Operation (from Exterior):
        </Text>
        <Text style={[sharedStyles.textSm, { marginLeft: 20 }]}>
          Homeowner understands that all window and door operational directions (e.g., XO, OX) are described as viewed from the exterior of the
          home.
        </Text>

        <Text style={[sharedStyles.textSm, { marginTop: 5 }]}>
          {"______      "}Permits:
        </Text>
        <Text style={[sharedStyles.textSm, { marginLeft: 20 }]}>
          Homeowner is responsible for permitting.
        </Text>
      </View>

      {/* Three Column Bottom */}
      <View style={{ flexDirection: "row", marginBottom: 15 }}>
        {/* Windows Coming Out Of */}
        <View style={{ width: "32%", marginRight: "2%" }}>
          <View style={[sharedStyles.borderedBox]}>
            <Text style={[sharedStyles.bold, { marginBottom: 3 }]}>WINDOWS COMING OUT OF</Text>
            <Text style={sharedStyles.textSm}>{checkbox(contract.brickApplicationQty > 0)} Brick</Text>
            <Text style={sharedStyles.textSm}>{checkbox(contract.sidingApplicationQty > 0)} Siding</Text>
            <Text style={sharedStyles.textSm}>{checkbox(contract.woodApplicationQty > 0)} Wood</Text>
            <Text style={sharedStyles.textSm}>{checkbox(contract.stuccoApplicationQty > 0)} Stucco</Text>
            <Text style={sharedStyles.textSm}>{checkbox(contract.foundationApplicationQty > 0)} Foundation</Text>
          </View>
        </View>

        {/* Payment */}
        <View style={{ width: "32%", marginRight: "2%" }}>
          <View style={[sharedStyles.borderedBox]}>
            <Text style={[sharedStyles.bold, { marginBottom: 3 }]}>PAYMENT</Text>
            <Text style={sharedStyles.textSm}>{checkbox(getPaymentChecked("cash"))} Cash</Text>
            <Text style={sharedStyles.textSm}>{checkbox(getPaymentChecked("credit"))} Credit Card</Text>
            <Text style={sharedStyles.textSm}>{checkbox(getPaymentChecked("check"))} Check</Text>
            <Text style={sharedStyles.textSm}>{checkbox(getPaymentChecked("ach"))} ACH</Text>
            <Text style={sharedStyles.textSm}>{checkbox(getPaymentChecked("finance"))} Finance</Text>
          </View>
        </View>

        {/* Referral */}
        <View style={{ width: "32%" }}>
          <View style={[sharedStyles.borderedBox]}>
            <Text style={[sharedStyles.bold, { marginBottom: 3 }]}>REFERRAL</Text>
            <Text style={sharedStyles.textSm}>
              {checkbox(Boolean(addendum?.referralName || contract.referralName))} Yes
              {" "}{checkbox(!addendum?.referralName && !contract.referralName)} No
            </Text>
            <Text style={[sharedStyles.textSm, { marginTop: 3 }]}>
              Referred by family or friend?
            </Text>
            {(addendum?.referralName || contract.referralName) && (
              <>
                <Text style={sharedStyles.textSm}>
                  Referring customer name:
                </Text>
                <Text style={sharedStyles.textSm}>
                  {addendum?.referralName || contract.referralName || ""}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Signatures */}
      <View style={{ flexDirection: "row", gap: 20 }}>
        <View style={{ flex: 1 }}>
          <View style={addendumStyles.signatureLine} />
          <Text style={sharedStyles.textSm}>Homeowner Signature</Text>
          <Text style={sharedStyles.textSm}>
            Date: {addendum?.customerSignatureDate || contract.customerSignatureDate
              ? new Date(addendum?.customerSignatureDate || contract.customerSignatureDate || "").toLocaleDateString()
              : "____________"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={addendumStyles.signatureLine} />
          <Text style={sharedStyles.textSm}>Sales Rep. Signature</Text>
          <Text style={sharedStyles.textSm}>
            Date: {addendum?.contractorSignatureDate || contract.contractorSignatureDate
              ? new Date(addendum?.contractorSignatureDate || contract.contractorSignatureDate || "").toLocaleDateString()
              : "____________"}
          </Text>
        </View>
      </View>
    </Page>
  );
}

const addendumStyles = {
  header: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center" as const,
    color: "#1a365d",
  },
  headerInfo: {
    fontSize: 7,
    textAlign: "center" as const,
    color: "#333",
  },
  redBanner: {
    backgroundColor: "#cc0000",
    padding: 6,
    marginBottom: 10,
    alignItems: "center" as const,
  },
  redBannerText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    height: 30,
    marginBottom: 3,
  },
};
