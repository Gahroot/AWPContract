// Isomorphic pricing calculator - runs on client AND server
// Ported from ezcontract/public/js/pricing-calculator.js + class-awp-pricing.php

import { PRICING } from "./constants";

export interface LineItemInput {
  width: number;   // feet
  height: number;  // feet
  qty: number;
  color: string;
  series: string;
  frame: string;
  function: string;
  temperedGlass: boolean;
  obscuredGlass: boolean;
  customShape: boolean;
  wrap: boolean;
  coated: boolean;
  awpShutterRnr: boolean;
}

export interface PricingBreakdown {
  sqIn: number;
  basePrice: number;
  addonTotal: number;
  unitPrice: number;
  lineTotal: number;
}

export function calculateSquareInches(widthFt: number, heightFt: number): number {
  return widthFt * heightFt * 144;
}

export function calculateLineItem(item: LineItemInput): number {
  const sqIn = calculateSquareInches(item.width, item.height);
  if (sqIn <= 0) return 0;

  const basePrice = sqIn * PRICING.baseRate;

  let addonRate = 0;
  addonRate += PRICING.color[item.color] ?? 0;
  addonRate += PRICING.series[item.series] ?? 0;
  addonRate += PRICING.frame[item.frame] ?? 0;
  addonRate += PRICING.function[item.function] ?? 0;

  // Boolean addons
  if (item.temperedGlass) addonRate += PRICING.booleanAddons.temperedGlass;
  if (item.obscuredGlass) addonRate += PRICING.booleanAddons.obscuredGlass;
  if (item.customShape) addonRate += PRICING.booleanAddons.customShape;
  if (item.wrap) addonRate += PRICING.booleanAddons.wrap;
  if (item.coated) addonRate += PRICING.booleanAddons.coated;
  if (item.awpShutterRnr) addonRate += PRICING.booleanAddons.awpShutterRnr;

  const addonTotal = addonRate * sqIn;
  const unitPrice = basePrice + addonTotal;
  const lineTotal = unitPrice * (item.qty || 1);

  return Math.round(lineTotal * 100) / 100;
}

export function calculateLineItemBreakdown(item: LineItemInput): PricingBreakdown {
  const sqIn = calculateSquareInches(item.width, item.height);
  const basePrice = sqIn * PRICING.baseRate;

  let addonRate = 0;
  addonRate += PRICING.color[item.color] ?? 0;
  addonRate += PRICING.series[item.series] ?? 0;
  addonRate += PRICING.frame[item.frame] ?? 0;
  addonRate += PRICING.function[item.function] ?? 0;

  if (item.temperedGlass) addonRate += PRICING.booleanAddons.temperedGlass;
  if (item.obscuredGlass) addonRate += PRICING.booleanAddons.obscuredGlass;
  if (item.customShape) addonRate += PRICING.booleanAddons.customShape;
  if (item.wrap) addonRate += PRICING.booleanAddons.wrap;
  if (item.coated) addonRate += PRICING.booleanAddons.coated;
  if (item.awpShutterRnr) addonRate += PRICING.booleanAddons.awpShutterRnr;

  const addonTotal = addonRate * sqIn;
  const unitPrice = basePrice + addonTotal;
  const lineTotal = unitPrice * (item.qty || 1);

  return {
    sqIn: Math.round(sqIn * 100) / 100,
    basePrice: Math.round(basePrice * 100) / 100,
    addonTotal: Math.round(addonTotal * 100) / 100,
    unitPrice: Math.round(unitPrice * 100) / 100,
    lineTotal: Math.round(lineTotal * 100) / 100,
  };
}

export function calculateTotal(items: LineItemInput[]): number {
  return items.reduce((sum, item) => sum + calculateLineItem(item), 0);
}

export function calculateContractTotal(subtotal: number, discount: number): number {
  return Math.round((subtotal - (discount || 0)) * 100) / 100;
}

export function calculateBalanceDue(contractTotal: number, downPayment: number): number {
  return Math.round((contractTotal - (downPayment || 0)) * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
