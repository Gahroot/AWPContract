"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Pen, Printer } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";
import { format } from "date-fns";
import { BOOLEAN_ADDON_LABELS, CONTRACT_STATUSES } from "@/lib/constants";

export default function ContractViewPage() {
  const params = useParams();
  const token = params.token as string;
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/contracts/public/${token}`)
      .then((r) => r.json())
      .then(setContract)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-16 w-48 mx-auto" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!contract || contract.error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Contract Not Found</h1>
        <p className="text-muted-foreground">
          This contract link may be invalid or expired.
        </p>
      </div>
    );
  }

  const statusConfig =
    CONTRACT_STATUSES[contract.status as keyof typeof CONTRACT_STATUSES];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 print:p-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Image src="/logo.png" alt="AWP" width={160} height={48} />
        <div className="flex gap-2">
          {contract.pdfUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={contract.pdfUrl} download>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {contract.status === "PENDING_SIGNATURE" && (
            <Button size="sm" asChild>
              <Link href={`/contracts/sign/${token}`}>
                <Pen className="h-4 w-4 mr-2" />
                Sign Contract
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Contract Info */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Sales Contract</h1>
        <Badge variant={statusConfig?.color as any}>
          {statusConfig?.label}
        </Badge>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>{" "}
              {contract.customerName || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>{" "}
              {contract.customerEmail || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {contract.customerPhone || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Job Address:</span>{" "}
              {contract.jobAddress || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">City:</span>{" "}
              {contract.customerCity || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">ZIP:</span>{" "}
              {contract.customerZip || "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      {contract.lineItems?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Size (ft)</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Series</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contract.lineItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.location || "—"}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.qty}</TableCell>
                      <TableCell>
                        {item.width} x {item.height}
                      </TableCell>
                      <TableCell>{item.color}</TableCell>
                      <TableCell>{item.series}</TableCell>
                      <TableCell className="text-xs">
                        {Object.entries(BOOLEAN_ADDON_LABELS)
                          .filter(([key]) => item[key])
                          .map(([, label]) => label)
                          .join(", ") || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-w-sm ml-auto">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(contract.total)}</span>
          </div>
          {contract.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span>Discount</span>
              <span>-{formatCurrency(contract.discount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Contract Total</span>
            <span>{formatCurrency(contract.contractTotal)}</span>
          </div>
          {contract.downPayment > 0 && (
            <div className="flex justify-between text-sm">
              <span>Down Payment</span>
              <span>-{formatCurrency(contract.downPayment)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg">
            <span>Balance Due</span>
            <span>{formatCurrency(contract.balanceDue)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Contractor Signature
              </p>
              {contract.contractorSignature ? (
                <img
                  src={contract.contractorSignature}
                  alt="Contractor signature"
                  className="h-20 border rounded"
                />
              ) : (
                <div className="h-20 border rounded flex items-center justify-center text-muted-foreground text-sm">
                  Not signed
                </div>
              )}
              {contract.contractorSignatureDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  {format(
                    new Date(contract.contractorSignatureDate),
                    "MMM d, yyyy"
                  )}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Customer Signature
              </p>
              {contract.customerSignature ? (
                <img
                  src={contract.customerSignature}
                  alt="Customer signature"
                  className="h-20 border rounded"
                />
              ) : (
                <div className="h-20 border rounded flex items-center justify-center text-muted-foreground text-sm">
                  Not signed
                </div>
              )}
              {contract.customerSignatureDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  {format(
                    new Date(contract.customerSignatureDate),
                    "MMM d, yyyy"
                  )}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
