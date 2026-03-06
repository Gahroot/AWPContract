// PDF pages module index
// Exports all pages and shared components for the 5-page contract packet

export {
  PacketHeader,
  PacketFooter,
  SignatureBlock,
  sharedStyles,
  type PdfLineItem,
  type PdfAddendum,
  type PdfContract,
  feetInchesFormat,
  sizeDisplay,
  downPaymentPercent,
  hasAnyGrids,
  yesNo,
  checkbox,
  formatCurrencyPdf,
  formatDatePdf,
} from "./shared";

export { SalesContractPage } from "./sales-contract";
export { TermsAndConditionsPage } from "./terms-conditions";
export { AddendumPage } from "./addendum";
export { WhatHappensNextPage } from "./what-happens-next";
export { GridPatternPage, needsGridPatternPage } from "./grid-patterns";
