// Terms and Conditions page for contract packet
// Page 2 of the 5-page contract packet

import { Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles, PacketHeader, PacketFooter } from "./shared";

// Terms and Conditions text sections
const TERMS_SECTIONS = [
  {
    title: "TERMS AND CONDITIONS",
    body: "This Contract is entered into between Advanced Windows Direct, LLC (\"Seller\") and the undersigned Buyer. Seller agrees to sell and Buyer agrees to purchase the window and door products (\"Products\") listed in the Sales Contract, subject to the following terms and conditions:",
  },
  {
    title: "1. VERIFICATION OF SPECIFICATIONS",
    body: "Buyer acknowledges that they have verified all product specifications, including but not limited to sizes, colors, glass types, grid patterns, and installation requirements. Buyer understands that custom products cannot be returned or refunded once production has begun.",
  },
  {
    title: "2. SURPLUS MATERIAL",
    body: "Any surplus material left over after completion of the installation shall become the property of Advanced Windows Direct and will be removed from the job site.",
  },
  {
    title: "3. EXISTING CONDITIONS AND INSTALLATION RISKS",
    body: "Buyer acknowledges that installation involves inherent risks, including but not limited to: (a) damage to surrounding materials such as paint, wallpaper, stucco, siding, or trim; (b) discovery of hidden conditions such as rot, structural issues, or non-compliant prior work; (c) temporary exposure to weather during installation. Seller is not responsible for pre-existing conditions or damages that occur during normal installation procedures. Seller will notify Buyer of any issues that may affect cost or timeline and obtain written approval before proceeding with additional work.",
  },
  {
    title: "4. COMPLIANCE AND PERMITS",
    body: "Buyer is responsible for obtaining any required permits, approvals, or inspections from local authorities, homeowner associations, or historic districts. Buyer is responsible for all permit fees and compliance with applicable building codes, including but not limited to egress requirements, safety glass requirements, and energy code compliance. Seller is not responsible for installations that do not meet local code requirements if Buyer failed to obtain necessary permits or inspections.",
  },
  {
    title: "5. PAYMENT TERMS",
    body: "The total purchase price is payable as follows: (a) Down Payment due at signing; (b) Balance Due upon completion of installation. Any balance not paid within thirty (30) days of completion will accrue interest at the rate of 1.5% per month (18% annually) on the outstanding balance. Seller reserves the right to stop work or withhold final delivery until payment is made in full.",
  },
  {
    title: "6. DELAYS AND FORCE MAJEURE",
    body: "Seller shall use reasonable efforts to complete installation by the estimated completion date. However, time is of the essence of this Contract. Seller shall not be liable for delays caused by: (a) circumstances beyond Seller's reasonable control, including but not limited to weather, acts of God, labor disputes, material shortages, transportation delays, or government actions; (b) Buyer's requests for changes or delays; (c) unforeseen site conditions; (d) Buyer's failure to provide access to the property. Delivery dates are estimates and not guaranteed.",
  },
  {
    title: "7. LIMITATION OF LIABILITY",
    body: "SELLER'S LIABILITY SHALL BE LIMITED TO THE REPAIR OR REPLACEMENT OF DEFECTIVE PRODUCTS OR WORKMANSHIP THAT DOES NOT COMPLY WITH THIS CONTRACT. IN NO EVENT SHALL SELLER BE LIABLE FOR ANY INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO PROPERTY DAMAGE, PERSONAL INJURY, LOSS OF USE, OR ECONOMIC LOSS, REGARDLESS OF WHETHER SUCH DAMAGES WERE FORESEEABLE. Some products may contain tempered safety glass that may occasionally break spontaneously due to nickel sulfide inclusions. Such breakage is not considered a defect and is excluded from warranty coverage.",
  },
  {
    title: "8. SAFETY WARNING",
    body: "Buyer acknowledges receiving safety warnings regarding the operation of windows and doors, including: (a) screens are designed to keep insects out, not children or pets in; (b) children can fall out of windows and serious injury or death can result; (c) furniture or other objects that children can climb should be kept away from windows; (d) do not rely on screens to prevent falls; (e) keep windows closed and locked when children are present. Buyer agrees to communicate these warnings to all occupants of the property.",
  },
  {
    title: "9. DISPUTE RESOLUTION",
    body: "Any dispute arising out of or relating to this Contract shall be resolved through binding arbitration administered by the American Arbitration Association (AAA) in accordance with its Commercial Arbitration Rules. The arbitration shall be conducted in Salt Lake County, Utah. The arbitrator's award shall be final and binding, and judgment may be entered in any court having jurisdiction. Buyer and Seller hereby waive their right to a trial by jury.",
  },
  {
    title: "10. ENTIRE AGREEMENT",
    body: "This Contract, including any attached addendums or change orders, constitutes the entire agreement between the parties. This Contract supersedes all prior agreements, representations, or understandings, whether written or oral. No modification of this Contract shall be valid unless in writing and signed by both parties. Seller's employees, representatives, or installers are not authorized to make any warranties, promises, or representations that differ from the terms of this written Contract.",
  },
  {
    title: "11. POST-MEASUREMENT ALTERATIONS",
    body: "If post-measurement alterations are required due to Buyer's changes, additional work, or unforeseen conditions, any additional costs will be documented in a written Change Order and must be approved by Buyer in writing before work proceeds. Such approvals may be obtained electronically or via fax.",
  },
];

export function TermsAndConditionsPage() {
  return (
    <Page size="LETTER" style={sharedStyles.page}>
      <PacketHeader title="TERMS AND CONDITIONS" />

      {TERMS_SECTIONS.map((section, index) => (
        <View key={index} style={{ marginBottom: 10 }}>
          <Text style={[sharedStyles.bold, { fontSize: 8, marginBottom: 3 }]}>
            {section.title}
          </Text>
          <Text style={[sharedStyles.textSm, { lineHeight: 1.3 }]}>
            {section.body}
          </Text>
        </View>
      ))}

      <PacketFooter pageLabel="Terms and Conditions subject to change without notice." />
    </Page>
  );
}
