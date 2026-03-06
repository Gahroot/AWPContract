// What Happens Next page for contract packet
// Page 4 of the 5-page contract packet

import { Page, Text, View } from "@react-pdf/renderer";
import {
  sharedStyles,
  PacketHeader,
  PacketFooter,
  SignatureBlock,
  type PdfContract,
  formatDatePdf,
} from "./shared";

interface WhatHappensNextPageProps {
  contract: PdfContract;
}

export function WhatHappensNextPage({ contract }: WhatHappensNextPageProps) {
  return (
    <Page size="LETTER" style={sharedStyles.page}>
      <PacketHeader title="WHAT HAPPENS NEXT?" />

      {/* Red underline for title */}
      <View style={{
        borderBottom: "3px solid #cc0000",
        marginBottom: 15,
      }} />

      {/* Thank you paragraph */}
      <Text style={[sharedStyles.textSm, { marginBottom: 10, lineHeight: 1.3 }]}>
        Thank you for choosing Advanced Windows Direct for your home improvement project. We appreciate
        your business and want to ensure you have a smooth experience from start to finish. Below is
        an overview of what to expect during the process.
      </Text>

      {/* Info Row */}
      <View style={{
        flexDirection: "row",
        backgroundColor: "#f5f5f5",
        padding: 8,
        marginBottom: 15,
        border: "1px solid #ddd",
      }}>
        <View style={{ flex: 1 }}>
          <Text style={[sharedStyles.bold, { fontSize: 7 }]}>ORDER DATE:</Text>
          <Text style={sharedStyles.textSm}>{formatDatePdf(contract.createdAt)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sharedStyles.bold, { fontSize: 7 }]}>FINAL MEASURE DATE:</Text>
          <Text style={sharedStyles.textSm}>_____________________</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sharedStyles.bold, { fontSize: 7 }]}>SALES REP:</Text>
          <Text style={sharedStyles.textSm}>{contract.salesman || ""}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sharedStyles.bold, { fontSize: 7 }]}>OFFICE PHONE:</Text>
          <Text style={sharedStyles.textSm}>801-438-4554</Text>
        </View>
      </View>

      {/* Prior to Measure Box */}
      <View style={[sharedStyles.borderedBox, { marginBottom: 10, backgroundColor: "#f9f9f9" }]}>
        <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>PRIOR TO THE MEASURE:</Text>
        <Text style={[sharedStyles.textSm, { lineHeight: 1.2 }]}>
          • Please ensure access to all windows and doors that will be measured.
        </Text>
        <Text style={[sharedStyles.textSm, { lineHeight: 1.2 }]}>
          • Clear any obstacles around window and door areas (furniture, curtains, blinds, etc.).
        </Text>
        <Text style={[sharedStyles.textSm, { lineHeight: 1.2 }]}>
          • If you have pets, please secure them during the measure appointment.
        </Text>
        <Text style={[sharedStyles.textSm, { lineHeight: 1.2 }]}>
          • Have any questions ready for our measure technician.
        </Text>
        <Text style={[sharedStyles.textSm, { lineHeight: 1.2 }]}>
          • Production time typically takes 2-4 weeks from final measure.
        </Text>
      </View>

      {/* Installation Timeline */}
      <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>INSTALLATION:</Text>
      <Text style={[sharedStyles.textSm, { marginBottom: 10, lineHeight: 1.2 }]}>
        Once your products are ready, our installation team will contact you to schedule your installation
        date. Typical installation takes 1-3 days depending on the scope of work. Our crew will arrive
        between 8:00 AM and 9:00 AM on the scheduled date. Please ensure someone is available to let
        our team in and be available throughout the installation. Our crew will clean up the work area
        daily before leaving.
      </Text>

      {/* After Installation */}
      <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>AFTER YOUR INSTALLATION:</Text>
      <Text style={[sharedStyles.textSm, { marginBottom: 10, lineHeight: 1.2 }]}>
        Please allow 24-72 hours for any caulks and sealants to fully cure. During this time, avoid
        opening and closing windows excessively. If you notice any issues, please contact our office
        within 48 hours of installation so we can address any concerns promptly.
      </Text>

      {/* Contact Info Box */}
      <View style={[sharedStyles.borderedBox, { marginBottom: 15, backgroundColor: "#f0f4f8" }]}>
        <Text style={[sharedStyles.bold, { marginBottom: 5 }]}>CONTACT INFORMATION:</Text>
        <Text style={sharedStyles.textSm}>
          <Text style={sharedStyles.bold}>Phone:</Text> 801-438-4554
        </Text>
        <Text style={sharedStyles.textSm}>
          <Text style={sharedStyles.bold}>Email:</Text> direct@advancedwindows.com
        </Text>
        <Text style={sharedStyles.textSm}>
          <Text style={sharedStyles.bold}>Website:</Text> www.advancedwindows.com
        </Text>
        <Text style={sharedStyles.textSm}>
          <Text style={sharedStyles.bold}>Address:</Text> 2451 S 600 W STE 500, Salt Lake City, UT 84115
        </Text>
      </View>

      {/* Thank you closing */}
      <Text style={[sharedStyles.textSm, { marginBottom: 15, lineHeight: 1.2 }]}>
        Thank you again for choosing Advanced Windows Direct. We value your business and look forward
        to providing you with beautiful, energy-efficient windows and doors that will enhance your
        home for years to come.
      </Text>

      {/* Signatures */}
      <View style={{ flexDirection: "row", gap: 20 }}>
        <View style={{ flex: 1 }}>
          <SignatureBlock
            label="Homeowner Signature"
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

      <PacketFooter pageLabel="Utah's Premier Replacement Window Company" />
    </Page>
  );
}
