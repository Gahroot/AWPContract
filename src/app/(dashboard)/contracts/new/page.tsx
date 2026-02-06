"use client";

import dynamic from "next/dynamic";

const SalesContractForm = dynamic(
  () =>
    import("@/components/contracts/sales-contract-form").then(
      (mod) => mod.SalesContractForm
    ),
  { ssr: false }
);

export default function NewContractPage() {
  return <SalesContractForm />;
}
