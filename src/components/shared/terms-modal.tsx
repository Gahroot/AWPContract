"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const TERMS_AND_CONDITIONS = `1. Verification. Customer must verify contract specifications described above carefully. Items are custom built and are not subject to cancellation, exchange, or alteration by Customer. Customer agrees to pay for all such items.

2. Additions. Any additional services or merchandise provided at the request of the Customer, and not specifically listed herein, must be in writing and will be charged for separately.

3. Surplus Material. All surplus material is property of Advanced Window Products, Inc. ("AWP").

4. Compliance with Laws and Regulations. Customer is solely responsible to adhere to all applicable local, state, and federal law, and applicable historical society, homeowner association, and/or other restrictive covenants and conditions and is solely liable for violations of the same in connection with Customer's requested items provided and/or installed by AWP. Without limiting the foregoing, Customer is responsible to make certain that windows, doors and other similar products included in this Contract are installed in accordance with federal, state and local safety glazing standards and ingress/egress codes.

5. Damage During Installation. AWP is not responsible for damage to stucco, sheet rock, plaster, tile, or wood during the installation process due to natural deterioration of the existing home/stucco. Further, AWP is not responsible for damage to such materials, or for broken glass, resulting from Customer's installation, maintenance, or repair of such products and materials supplied by AWP.

6. CUSTOMER'S RIGHT TO CANCEL. ON ORDERS MARKETED THROUGH FACE TO FACE SOLICITATIONS AT CUSTOMER'S RESIDENCE OR PLACE OF EMPLOYMENT, IF CUSTOMER DOES NOT WANT THE MATERIALS OR INSTALLATION SERVICES CONTRACTED FOR, CUSTOMER MAY CANCEL THIS CONTRACT UNTIL MIDNIGHT OF THE 3RD BUSINESS DAY (SATURDAY BEING A BUSINESS DAY) ON WHICH THE CUSTOMER SIGNS THE CONTRACT BY MAIL POSTMARKED BY MIDNIGHT OF THE 3RD BUSINESS DAY BY LETTER OF CANCELLATION WITH NOTARY ONLY AND MAILED TO ADVANCED WINDOW PRODUCTS, 3052 SOUTH 460 WEST, SLC, UTAH 84115 OR IN PERSON AT AWP'S PLACE OF BUSINESS WITH VALID PICTURE I.D. EXCEPT AS PROVIDED IN THIS PARAGRAPH, CUSTOMER SHALL NOT HAVE THE RIGHT TO CANCEL THIS CONTRACT.

7. Conditions of Sale. If collection is made by suit or otherwise. Customer agrees to pay all collection costs, including but not limited to interest (at the rate of 1.5% per month) and attorney's fees and, to the extent permitted by applicable law, hereby waives all rights to claim exemption under state laws.

8. Force Majeure. AWP will not be liable for delays caused by strikes, weather conditions, delays in obtaining materials or causes beyond its control.

9. Limitation of Liability. IN NO EVENT WILL AWP BE LIABLE FOR CONSEQUENTIAL OR INCIDENTAL DAMAGES OF ANY KIND SUSTAINED FROM ANY CAUSE OR ARISING OUT OF ANY LEGAL THEORY, WHETHER CONTRACT, TORT, STRICT LIABILITY, OR OTHERWISE. IN NO EVENT SHALL AWP BE LIABLE TO CUSTOMER IN AN AMOUNT EXCEEDING THE CONTRACT PRICE UNDER THIS CONTRACT. THESE LIMITATIONS INCLUDE ANY AND ALL OF CUSTOMER'S CLAIMS.

10. WARNING: Screen will not stop child from falling out of window. Keep child away from open window.

11. Arbitration. Customer agrees that any controversy or claim arising out of or relating to this Contract shall be settled by arbitration under the Commercial Arbitration Rules of the American Arbitration Association, and any judgment on the award rendered by the arbitrator(s) may be entered in any court having jurisdiction thereof.

12. ENTIRE AGREEMENT. THESE TERMS AND CONDITIONS SHALL SUPERSEDE ANY PROVISIONS, TERMS AND CONDITIONS CONTAINED ON ANY PURCHASE OR CONFIRMATION ORDER, OR OTHER WRITING CUSTOMER MAY GIVE OR RECEIVE, AND THE RIGHTS OF THE PARTIES SHALL BE GOVERNED EXCLUSIVELY BY THE PROVISIONS, TERMS AND CONDITIONS OF THIS CONTRACT. EXCEPT TO THE EXTENT PROVIDED IN ANY WRITTEN LIMITED LIFETIME WARRANTY FURNISHED BY AWP TO CUSTOMER IN CONNECTION WITH CUSTOMER'S PURCHASE, AWP MAKES NO REPRESENTATIONS OR WARRANTIES CONCERNING THE SUBJECT MATTER OF THIS CONTRACT. THIS CONTRACT MAY NOT BE CHANGED OR MODIFIED ORALLY.

13. AWP will not be held responsible for any modifications to window/door openings by home owner after the final measurement by AWP has been taken.`;

interface TermsModalProps {
  onAccept?: () => void;
}

export function TermsModal({ onAccept }: TermsModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
        >
          <FileText className="h-3 w-3" />
          Read Terms
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Please read the following terms and conditions carefully before accepting.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {TERMS_AND_CONDITIONS}
            </p>
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={() => {
              setOpen(false);
              onAccept?.();
            }}
          >
            I Have Read the Terms
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
