// Terms and Conditions page for contract packet
// Page 2 of the 5-page contract packet

import { Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles } from "./shared";

export function TermsAndConditionsPage() {
  return (
    <Page size="LETTER" style={sharedStyles.page}>
      {/* Header */}
      <View style={tcStyles.header}>
        <Text style={tcStyles.headerTitle}>TERMS AND CONDITIONS</Text>
        <Text style={tcStyles.headerInfo}>
          2451 S 600 W STE 500, Salt Lake City, UT 84115 • Phone 801-438-4554
        </Text>
        <Text style={tcStyles.headerInfo}>
          direct@advancedwindows.com • www.advancedwindows.com
        </Text>
      </View>

      {/* Title */}
      <Text style={tcStyles.pageTitle}>Contract Terms and Conditions</Text>

      {/* Terms Sections */}
      <View style={tcStyles.section}>
        <Text style={tcStyles.sectionTitle}>Terms and Conditions.</Text>
        <Text style={tcStyles.sectionText}>
          This Contract is entered into between Advanced Windows Direct, LLC (&quot;AWD&quot;) and the Customer identified on
          Page 1.
        </Text>
      </View>

      <View style={tcStyles.section}>
        <Text style={tcStyles.sectionTitle}>Verification of Specifications.</Text>
        <Text style={tcStyles.sectionText}>
          Customer has reviewed and approved all product selections, sizes, colors, grid patterns, configurations, and
          specifications listed in this Contract and is responsible for confirming accuracy prior to production. Products are custom manufactured. After
          expiration of the cancellation period stated on page 1, orders are non-cancellable except as otherwise required by law. Changes and
          Additional Work. Any labor, materials, services, or work not expressly described in this Contract must be authorized in writing by Customer
          and will result in additional charges. AWD is not obligated to perform additional work unless agreed to in writing.
        </Text>
      </View>

      <View style={tcStyles.section}>
        <Text style={tcStyles.sectionTitle}>Surplus Material.</Text>
        <Text style={tcStyles.sectionText}>
          All surplus material is property of AWD.
        </Text>
      </View>

      <View style={tcStyles.section}>
        <Text style={tcStyles.sectionTitle}>Existing Conditions and Installation Risks.</Text>
        <Text style={tcStyles.sectionText}>
          Customer acknowledges that removal of existing windows, doors, stucco, siding, drywall,
          plaster, trim, or related materials may expose concealed deterioration, water damage, structural defects, code deficiencies, or other hidden
          conditions not visible at the time of estimate. AWD is not responsible for pre-existing deterioration, concealed structural defects, cracking of
          stucco, drywall, plaster, or siding due to age or brittleness, or repairs not specifically included in this Contract. Repairs to concealed
          conditions require written approval and may result in additional charges.
        </Text>
      </View>

      <View style={tcStyles.section}>
        <Text style={tcStyles.sectionTitle}>Compliance and Permits.</Text>
        <Text style={tcStyles.sectionText}>
          AWD will perform installation in accordance with applicable building codes in effect at the time of installation.
          Customer is responsible for homeowner association approvals, restrictive covenants, and permit fees unless otherwise stated in writing.
          Customer agrees to notify AWD prior to installation of any specific code requirements, homeowner association conditions, or property
          restrictions known to Customer that may affect the products or installation.
        </Text>
      </View>

      <View style={tcStyles.section}>
        <Text style={tcStyles.sectionTitle}>Payment Terms.</Text>
        <Text style={tcStyles.sectionText}>
          Customer agrees to pay the total Contract Price set forth in this Contract, as adjusted by any written change orders signed
          by both parties. Any remaining balance is due upon substantial completion of installation. Substantial completion occurs when the products
          have been installed and are operational, excluding minor punch list items that do not materially impair function. Failure to make payment
          when due constitutes a material breach of this Contract. Any unpaid balance shall accrue interest at the rate of 1.5% per month (18%
          annually) or the maximum rate permitted by applicable law, whichever is less, until paid in full. Customer agrees to pay reasonable
          attorney&apos;s fees, court costs, and collection expenses incurred in enforcing this Contract, as permitted by law.
        </Text>
      </View>

      <View style={tcStyles.section}>
        <Text style={tcStyles.sectionTitle}>Delays and Force Majeure.</Text>
        <Text style={tcStyles.sectionText}>
          Installation dates are estimates only. AWD shall not be liable for delays caused by events beyond its
          reasonable control, including material shortages, supply chain disruptions, weather, labor disputes, or governmental actions. Such delays do
          not constitute breach of contract.
        </Text>
      </View>

      <View style={tcStyles.section}>
        <Text style={tcStyles.sectionTitle}>Limitation of Liability.</Text>
        <Text style={tcStyles.sectionText}>
          To the fullest extent permitted by law, AWD shall not be liable for incidental, special, or consequential damages of
          any kind arising out of this Contract, and AWD&apos;s total liability shall not exceed the amount actually paid to AWD by Customer under this
          Contract.
        </Text>
      </View>

      <View style={tcStyles.section}>
        <Text style={tcStyles.sectionTitle}>Safety Warning.</Text>
        <Text style={tcStyles.sectionText}>
          Window screens are not safety devices and will not prevent falls. Keep children away from open windows.
        </Text>
      </View>

      <View style={tcStyles.section}>
        <Text style={tcStyles.sectionTitle}>Dispute Resolution.</Text>
        <Text style={tcStyles.sectionText}>
          Any controversy or claim arising out of or relating to this Contract shall be resolved by binding arbitration administered
          by the American Arbitration Association under its Consumer Arbitration Rules, and judgment on the award may be entered in any court
          having jurisdiction. Customer retains any non-waivable statutory rights.
        </Text>
      </View>

      <View style={tcStyles.section}>
        <Text style={tcStyles.sectionTitle}>Entire Agreement.</Text>
        <Text style={tcStyles.sectionText}>
          This Contract constitutes the entire agreement between the parties and supersedes all prior discussions,
          representations, or agreements. No modification shall be binding unless in writing and signed by both parties.
        </Text>
      </View>

      <View style={tcStyles.section}>
        <Text style={tcStyles.sectionTitle}>Post-Measurement Alterations.</Text>
        <Text style={tcStyles.sectionText}>
          AWD shall not be responsible for delays, additional costs, or fitment issues resulting from structural
          modifications made by Customer after final measurements have been taken.
        </Text>
      </View>
    </Page>
  );
}

const tcStyles = {
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
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 3,
  },
  sectionText: {
    fontSize: 7,
    lineHeight: 1.3,
  },
};
