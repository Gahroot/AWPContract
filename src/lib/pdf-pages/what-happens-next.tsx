// What Happens Next page for contract packet
// Page 4 of the 5-page contract packet

import { Page, Text, View } from "@react-pdf/renderer";
import {
  sharedStyles,
  formatDatePdf,
  type PdfContract,
} from "./shared";

interface WhatHappensNextPageProps {
  contract: PdfContract;
}

export function WhatHappensNextPage({ contract }: WhatHappensNextPageProps) {
  return (
    <Page size="LETTER" style={sharedStyles.page}>
      {/* Header */}
      <View style={whnStyles.header}>
        <Text style={whnStyles.title}>WHAT HAPPENS NEXT?</Text>
        <Text style={whnStyles.redLine} />
      </View>

      {/* Intro paragraph */}
      <Text style={whnStyles.introText}>
        Thank you for placing your order with Advanced Windows Direct! Use this sheet to guide you through the production and installation
        process.
      </Text>

      {/* Info Row */}
      <View style={whnStyles.infoRow}>
        <View style={whnStyles.infoCell}>
          <Text style={whnStyles.infoLabel}>Order Date:</Text>
          <Text style={whnStyles.infoValue}>{formatDatePdf(contract.createdAt)}</Text>
        </View>
        <View style={whnStyles.infoCell}>
          <Text style={whnStyles.infoLabel}>Final Measure Date:</Text>
          <Text style={whnStyles.infoValue}>_______________</Text>
        </View>
        <View style={whnStyles.infoCell}>
          <Text style={whnStyles.infoLabel}>Sales Representative:</Text>
          <Text style={whnStyles.infoValue}>{contract.salesman || ""}</Text>
        </View>
        <View style={whnStyles.infoCell}>
          <Text style={whnStyles.infoLabel}>Office Phone:</Text>
          <Text style={whnStyles.infoValue}>801-438-4554</Text>
        </View>
      </View>

      {/* Prior to measure */}
      <View style={whnStyles.sectionBox}>
        <Text style={whnStyles.sectionText}>
          Prior to the measure: Please have blinds and/or shades open, and anything in front of your windows/doors moved away
          approximately 2 feet.
        </Text>
      </View>

      {/* Installation time frame */}
      <Text style={whnStyles.sectionText}>
        Installation time frame can fluctuate depending on the time of year and volume of windows on order. Special shapes, custom color,
        and/or special items can also affect the time frame. Lead time begins from the date of your purchase, not from the date of your final
        measure.
      </Text>

      <Text style={whnStyles.sectionText}>
        Once your windows/doors are ready for installation, we will contact you to schedule a date and time for the installation.
      </Text>

      <Text style={whnStyles.sectionText}>
        Prior to your installation, please follow instructions regarding installation preparation on the addendum you were provided by your sales
        representative and the measuring representative. If you are removing plantation shutters, please be sure to have them removed prior to
        install.
      </Text>

      <Text style={whnStyles.sectionText}>
        At the completion of your installation, you will fill out a completion form, sign it, and submit final payment to the installation crew.
      </Text>

      {/* After installation */}
      <Text style={whnStyles.sectionText}>
        After your installation: Please allow 72 hours before any cleaning of windows or doors. This allows all caulk and trim to cure. Also
        never pressure wash windows or doors.
      </Text>

      {/* Contact Info */}
      <View style={whnStyles.sectionBox}>
        <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>
          Should you have any questions regarding your order, please contact:
        </Text>
        <Text style={whnStyles.sectionText}>
          Changes to your order: Contact your sales representative
        </Text>
        <Text style={whnStyles.sectionText}>
          Any other questions regarding your order: Call 801-438-4554
        </Text>
      </View>

      {/* Thank you closing */}
      <Text style={whnStyles.sectionText}>
        Again, thank you so much for choosing Advanced Windows Direct! We look forward to working with you.
      </Text>

      {/* Signatures */}
      <View style={{ flexDirection: "row", gap: 20, marginTop: 15 }}>
        <View style={{ flex: 1 }}>
          <View style={whnStyles.signatureLine} />
          <Text style={sharedStyles.textSm}>Homeowner Signature</Text>
          <Text style={sharedStyles.textSm}>
            Date: {contract.customerSignatureDate
              ? new Date(contract.customerSignatureDate).toLocaleDateString()
              : "_______________"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={whnStyles.signatureLine} />
          <Text style={sharedStyles.textSm}>Sales Representative Signature</Text>
          <Text style={sharedStyles.textSm}>
            Date: {contract.contractorSignatureDate
              ? new Date(contract.contractorSignatureDate).toLocaleDateString()
              : "_______________"}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={whnStyles.footer}>
        <Text style={whnStyles.footerText}>&quot;Utah&apos;s Premier Replacement Window Company&quot;</Text>
        <Text style={whnStyles.footerText}>www.advancedwindows.com</Text>
        <Text style={whnStyles.footerText}>
          2451 S 600 W STE 500, Salt Lake City, UT 84115 • Office: 801-438-4554
        </Text>
      </View>
    </Page>
  );
}

const whnStyles = {
  header: {
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a365d",
    textAlign: "center" as const,
  },
  redLine: {
    backgroundColor: "#cc0000",
    height: 3,
    width: "100%",
    marginTop: 5,
  },
  introText: {
    fontSize: 9,
    marginBottom: 12,
    lineHeight: 1.3,
  },
  infoRow: {
    flexDirection: "row" as const,
    marginBottom: 12,
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
  sectionBox: {
    borderWidth: 1,
    borderColor: "#999",
    padding: 8,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
  },
  sectionText: {
    fontSize: 8,
    lineHeight: 1.4,
    marginBottom: 8,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    height: 30,
    marginBottom: 3,
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
