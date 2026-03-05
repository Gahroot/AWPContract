import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default admin user (password: admin123)
  const adminHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@awp.com" },
    update: { password: adminHash },
    create: {
      email: "admin@awp.com",
      name: "AWP Admin",
      password: adminHash,
      role: "ADMIN",
    },
  });

  // Create a test salesman
  const salesHash = await bcrypt.hash("sales123", 12);
  await prisma.user.upsert({
    where: { email: "sales@awp.com" },
    update: { password: salesHash },
    create: {
      email: "sales@awp.com",
      name: "Test Salesman",
      password: salesHash,
      role: "SALESMAN",
    },
  });

  // Create additional salespeople
  const jakeHash = await bcrypt.hash("sales123", 12);
  const jake = await prisma.user.upsert({
    where: { email: "jake.morrison@awp.com" },
    update: { password: jakeHash },
    create: {
      email: "jake.morrison@awp.com",
      name: "Jake Morrison",
      password: jakeHash,
      role: "SALESMAN",
      market: "SLC",
    },
  });

  const lisaHash = await bcrypt.hash("sales123", 12);
  const lisa = await prisma.user.upsert({
    where: { email: "lisa.chen@awp.com" },
    update: { password: lisaHash },
    create: {
      email: "lisa.chen@awp.com",
      name: "Lisa Chen",
      password: lisaHash,
      role: "SALESMAN",
      market: "OREM",
    },
  });

  // Default settings
  await prisma.setting.upsert({
    where: { key: "company_name" },
    update: {},
    create: { key: "company_name", value: "Advanced Window Products" },
  });

  await prisma.setting.upsert({
    where: { key: "company_phone" },
    update: {},
    create: { key: "company_phone", value: "(801) 505-9622" },
  });

  await prisma.setting.upsert({
    where: { key: "company_address" },
    update: {},
    create: {
      key: "company_address",
      value: "4035 S 500 W, Murray, UT 84123",
    },
  });

  // ─── Commission Settings ────────────────────────────────────
  await prisma.commissionSettings.deleteMany();
  await prisma.commissionSettings.create({
    data: {
      salesRepRate: 0.10,
      salesRepRateBelowFair: 0.05,
      salesRepFloor: 0.85,
      salesRepCeiling: 1.15,
      setterRate: 0.03,
      setterFloor: 0.85,
      setterManagerRate: 0.02,
      setterManagerRateBelowFair: 0.01,
      territoryOwnerRateTier1: 0.01,
      territoryOwnerRateTier2: 0.015,
      territoryOwnerRateTier3: 0.02,
      territoryOwnerTier2Threshold: 500000,
      territoryOwnerTier3Threshold: 1000000,
      vpRate: 0.01,
      vpRateBelowFair: 0.005,
      nsmRate: 0.005,
      nsmRateBelowFair: 0.0025,
      traditionalSalesRepRate: 0.12,
      traditionalSalesRepRateBelowFair: 0.07,
      traditionalFloorRate: 0.85,
      traditionalPriceCeiling: 1.15,
      traditionalNsmOverrideRate: 0.005,
      traditionalNsmOverrideRateBelowFair: 0.0025,
    },
  });

  // Set management role flags on test users
  await prisma.user.update({
    where: { email: "admin@awp.com" },
    data: { isVP: true, isNSM: true, territory: "SLC" },
  });
  await prisma.user.update({
    where: { email: "sales@awp.com" },
    data: { isSetterManager: true, territory: "SLC" },
  });
  await prisma.user.update({
    where: { email: "jake.morrison@awp.com" },
    data: { isTerritoryOwner: true, territory: "SLC" },
  });

  // ─── Demo Contracts ─────────────────────────────────────────
  // Clean existing demo data (line items cascade from contracts)
  await prisma.commissionRecord.deleteMany();
  await prisma.changeOrder.deleteMany();
  await prisma.addendum.deleteMany();
  await prisma.lineItem.deleteMany();
  await prisma.contract.deleteMany();

  // Fetch user IDs
  const salesUser = await prisma.user.findUnique({ where: { email: "sales@awp.com" } });
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@awp.com" } });

  // Helper: calculate line item price using the pricing formula
  function calcPrice(
    widthFt: number,
    heightFt: number,
    qty: number,
    opts: {
      color?: string;
      series?: string;
      frame?: string;
      fn?: string;
      operation?: string;
      gridType?: string;
      glassType?: string;
      tempered?: boolean;
      obscured?: boolean;
      wrap?: boolean;
      coated?: boolean;
    } = {},
  ): number {
    const sqIn = widthFt * heightFt * 144;
    if (sqIn <= 0) return 0;
    const PRICING = {
      baseRate: 0.55,
      color: { White: 0, "Light Tan": 0, "Dark Tan": 0, Black: 0, Bronze: 0 } as Record<string, number>,
      series: { Patriot: 0, "High Performance": 0.01, Sunview: -0.02, Imperial: 0.03, Legacy: 0.05 } as Record<string, number>,
      frame: { "Nail Fin": 0, "Flush Fin": 0, "Frame Over": -0.01 } as Record<string, number>,
      function: { Slider: 0.02, Picture: 0.01, "Single Hung": 0, "Double Vent": 0.02, "Sliding Door": 0.05 } as Record<string, number>,
      operation: { XO: 0, OX: 0, SH: 0, "N/A": 0, XOX: 0.02, STD: 0 } as Record<string, number>,
      gridType: { "STD GRID": 0, "CNT GRID": 0.01 } as Record<string, number>,
      glassType: { "LoE-366": 0, "LoE-i89": 0.01 } as Record<string, number>,
      booleanAddons: { tempered: 0.02, obscured: 0.01, wrap: 0.01, coated: 0.01 },
    };
    let addonRate = 0;
    addonRate += PRICING.color[opts.color ?? "White"] ?? 0;
    addonRate += PRICING.series[opts.series ?? "Patriot"] ?? 0;
    addonRate += PRICING.frame[opts.frame ?? "Nail Fin"] ?? 0;
    addonRate += PRICING.function[opts.fn ?? "Slider"] ?? 0;
    addonRate += PRICING.operation[opts.operation ?? "XO"] ?? 0;
    addonRate += PRICING.gridType[opts.gridType ?? "STD GRID"] ?? 0;
    addonRate += PRICING.glassType[opts.glassType ?? "LoE-366"] ?? 0;
    if (opts.tempered) addonRate += PRICING.booleanAddons.tempered;
    if (opts.obscured) addonRate += PRICING.booleanAddons.obscured;
    if (opts.wrap) addonRate += PRICING.booleanAddons.wrap;
    if (opts.coated) addonRate += PRICING.booleanAddons.coated;
    const basePrice = sqIn * PRICING.baseRate;
    const addonTotal = addonRate * sqIn;
    return Math.round((basePrice + addonTotal) * qty * 100) / 100;
  }

  // ────────────────────────────────────────────────────────────
  // CONTRACT 1: Johnson Residence - COMPLETED (whole-home, signed)
  // ────────────────────────────────────────────────────────────
  const c1Items = [
    { location: "Living Room - North", type: "Window", qty: 2, width: 4, height: 5, color: "White", series: "Patriot", frame: "Nail Fin", function: "Single Slider", productCode: "Patriot SS", operation: "XO", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
    { location: "Living Room - East", type: "Window", qty: 1, width: 6, height: 5, color: "White", series: "Patriot", frame: "Nail Fin", function: "Picture", productCode: "Patriot PW", operation: "N/A", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
    { location: "Master Bedroom", type: "Window", qty: 2, width: 3.5, height: 4, color: "White", series: "Patriot", frame: "Nail Fin", function: "Single Hung", productCode: "Patriot SH", operation: "SH", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
    { location: "Kitchen", type: "Window", qty: 1, width: 5, height: 4, color: "White", series: "Patriot", frame: "Nail Fin", function: "Single Slider", productCode: "Patriot SS", operation: "XO", gridType: "CNT GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
    { location: "Bathroom 1", type: "Window", qty: 1, width: 2.5, height: 3, color: "White", series: "Patriot", frame: "Nail Fin", function: "Single Hung", productCode: "Patriot SH", operation: "SH", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: true, obscuredGlass: true, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
    { location: "Bathroom 2", type: "Window", qty: 1, width: 2.5, height: 3, color: "White", series: "Patriot", frame: "Nail Fin", function: "Single Hung", productCode: "Patriot SH", operation: "SH", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: true, obscuredGlass: true, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
    { location: "Guest Bedroom", type: "Window", qty: 1, width: 4, height: 4, color: "White", series: "Patriot", frame: "Nail Fin", function: "Single Slider", productCode: "Patriot SS", operation: "OX", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
    { location: "Patio", type: "Door", qty: 1, width: 6, height: 6.67, color: "White", series: "Patriot", frame: "Nail Fin", function: "Sliding Door", productCode: "Patriot SGD", operation: "XO", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: true, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
  ];

  let c1Total = 0;
  const c1LineData = c1Items.map((item, i) => {
    const price = calcPrice(item.width, item.height, item.qty, {
      color: item.color, series: item.series, frame: item.frame, fn: item.function,
      operation: item.operation, gridType: item.gridType, glassType: item.glassType,
      tempered: item.temperedGlass, obscured: item.obscuredGlass, wrap: item.wrap,
    });
    c1Total += price;
    return { ...item, price, sortOrder: i };
  });
  const c1Discount = 500;
  const c1ContractTotal = Math.round((c1Total - c1Discount) * 100) / 100;
  const c1DownPayment = 3000;
  const c1Balance = Math.round((c1ContractTotal - c1DownPayment) * 100) / 100;

  await prisma.contract.create({
    data: {
      contractNumber: "AWP-2026-001",
      status: "COMPLETED",
      customerName: "Robert & Sarah Johnson",
      customerPhone: "(801) 555-0142",
      customerEmail: "rjohnson@email.com",
      jobAddress: "1847 Maple Ridge Dr, Sandy, UT 84092",
      billingAddress: "1847 Maple Ridge Dr, Sandy, UT 84092",
      customerCity: "Sandy",
      customerZip: "84092",
      customerState: "UT",
      salesman: "Test Salesman",
      measuredBy: "Jake Morrison",
      yearBuilt: "1998",
      houseType: "Brick",
      leadTest: "Negative",
      preferredCommunication: "Email",
      windowsBeingRemoved: "Aluminum",
      total: Math.round(c1Total * 100) / 100,
      discount: c1Discount,
      contractTotal: c1ContractTotal,
      downPayment: c1DownPayment,
      balanceDue: c1Balance,
      paymentMethod: "finance",
      financingOption: "Wells Fargo",
      downPaymentMethod: "check",
      marketingSource: JSON.stringify(["TV", "Referral"]),
      brickApplicationQty: 10,
      contractorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      contractorSignatureDate: new Date("2026-01-15"),
      customerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      customerSignatureDate: new Date("2026-01-16"),
      customerAcceptedTerms: true,
      userId: salesUser!.id,
      salesRepId: salesUser!.id,
      setterId: jake.id,
      createdAt: new Date("2026-01-10"),
      updatedAt: new Date("2026-01-16"),
      lineItems: {
        create: c1LineData,
      },
    },
  });

  // ────────────────────────────────────────────────────────────
  // CONTRACT 2: Garcia Home - SIGNED (pending completion)
  // ────────────────────────────────────────────────────────────
  const c2Items = [
    { location: "Family Room - West", type: "Window", qty: 3, width: 3.5, height: 5, color: "Dark Tan", series: "High Performance", frame: "Flush Fin", function: "Single Slider", productCode: "Patriot HP SS", operation: "XO", gridType: "CNT GRID", glassType: "LoE-i89", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: true, awpShutterRnr: false },
    { location: "Family Room - South", type: "Window", qty: 1, width: 8, height: 5, color: "Dark Tan", series: "High Performance", frame: "Flush Fin", function: "Picture", productCode: "Patriot HP PW", operation: "N/A", gridType: "CNT GRID", glassType: "LoE-i89", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: true, awpShutterRnr: false },
    { location: "Master Suite", type: "Window", qty: 2, width: 4, height: 5, color: "Dark Tan", series: "High Performance", frame: "Flush Fin", function: "Double Vent", productCode: "Patriot HP DV", operation: "XOX", gridType: "CNT GRID", glassType: "LoE-i89", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: true, awpShutterRnr: false },
    { location: "Dining Room", type: "Window", qty: 2, width: 3, height: 5, color: "Dark Tan", series: "High Performance", frame: "Flush Fin", function: "Single Hung", productCode: "Patriot HP SH", operation: "SH", gridType: "CNT GRID", glassType: "LoE-i89", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
  ];

  let c2Total = 0;
  const c2LineData = c2Items.map((item, i) => {
    const price = calcPrice(item.width, item.height, item.qty, {
      color: item.color, series: item.series, frame: item.frame, fn: item.function,
      operation: item.operation, gridType: item.gridType, glassType: item.glassType,
      wrap: item.wrap, coated: item.coated,
    });
    c2Total += price;
    return { ...item, price, sortOrder: i };
  });
  const c2Discount = 250;
  const c2ContractTotal = Math.round((c2Total - c2Discount) * 100) / 100;
  const c2DownPayment = 2000;
  const c2Balance = Math.round((c2ContractTotal - c2DownPayment) * 100) / 100;

  await prisma.contract.create({
    data: {
      contractNumber: "AWP-2026-002",
      status: "SIGNED",
      customerName: "Maria Garcia",
      customerPhone: "(801) 555-0287",
      customerPhoneAlt: "(801) 555-0288",
      customerEmail: "maria.garcia@email.com",
      jobAddress: "2563 Cottonwood Lane, Draper, UT 84020",
      billingAddress: "2563 Cottonwood Lane, Draper, UT 84020",
      customerCity: "Draper",
      customerZip: "84020",
      customerState: "UT",
      salesman: "Jake Morrison",
      measuredBy: "Jake Morrison",
      yearBuilt: "2005",
      houseType: "Stucco",
      leadTest: "Negative",
      preferredCommunication: "Text",
      windowsBeingRemoved: "Vinyl",
      total: Math.round(c2Total * 100) / 100,
      discount: c2Discount,
      contractTotal: c2ContractTotal,
      downPayment: c2DownPayment,
      balanceDue: c2Balance,
      paymentMethod: "finance",
      financingOption: "EnerBank",
      downPaymentMethod: "credit_card",
      marketingSource: JSON.stringify(["Digital"]),
      stuccoApplicationQty: 8,
      contractorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      contractorSignatureDate: new Date("2026-02-05"),
      customerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      customerSignatureDate: new Date("2026-02-06"),
      customerAcceptedTerms: true,
      userId: jake.id,
      createdAt: new Date("2026-02-01"),
      updatedAt: new Date("2026-02-06"),
      lineItems: {
        create: c2LineData,
      },
    },
  });

  // ────────────────────────────────────────────────────────────
  // CONTRACT 3: Thompson Remodel - PENDING_SIGNATURE
  // ────────────────────────────────────────────────────────────
  const c3Items = [
    { location: "Kitchen Bay", type: "Window", qty: 1, width: 6, height: 4, color: "White", series: "Patriot", frame: "Nail Fin", function: "Double Vent", productCode: "Patriot DV", operation: "XOX", gridType: "CNT GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
    { location: "Breakfast Nook", type: "Window", qty: 2, width: 3, height: 4, color: "White", series: "Patriot", frame: "Nail Fin", function: "Single Hung", productCode: "Patriot SH", operation: "SH", gridType: "CNT GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
    { location: "Back Door", type: "Door", qty: 1, width: 6, height: 6.67, color: "White", series: "Patriot", frame: "Nail Fin", function: "Sliding Door", productCode: "Patriot SGD", operation: "OX", gridType: "CNT GRID", glassType: "LoE-366", temperedGlass: true, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
  ];

  let c3Total = 0;
  const c3LineData = c3Items.map((item, i) => {
    const price = calcPrice(item.width, item.height, item.qty, {
      color: item.color, series: item.series, frame: item.frame, fn: item.function,
      operation: item.operation, gridType: item.gridType, glassType: item.glassType,
      tempered: item.temperedGlass, wrap: item.wrap,
    });
    c3Total += price;
    return { ...item, price, sortOrder: i };
  });
  const c3ContractTotal = Math.round(c3Total * 100) / 100;
  const c3DownPayment = 1500;
  const c3Balance = Math.round((c3ContractTotal - c3DownPayment) * 100) / 100;

  await prisma.contract.create({
    data: {
      contractNumber: "AWP-2026-003",
      status: "PENDING_SIGNATURE",
      customerName: "David & Jennifer Thompson",
      customerPhone: "(801) 555-0391",
      customerEmail: "dthompson@email.com",
      jobAddress: "892 Aspen Hills Blvd, Murray, UT 84107",
      billingAddress: "892 Aspen Hills Blvd, Murray, UT 84107",
      customerCity: "Murray",
      customerZip: "84107",
      customerState: "UT",
      salesman: "Test Salesman",
      measuredBy: "Test Salesman",
      yearBuilt: "1985",
      houseType: "Wood",
      leadTest: "Positive",
      preferredCommunication: "Phone",
      windowsBeingRemoved: "Wood",
      total: Math.round(c3Total * 100) / 100,
      discount: 0,
      contractTotal: c3ContractTotal,
      downPayment: c3DownPayment,
      balanceDue: c3Balance,
      paymentMethod: "check",
      downPaymentMethod: "check",
      marketingSource: JSON.stringify(["Radio"]),
      woodApplicationQty: 4,
      contractorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      contractorSignatureDate: new Date("2026-02-18"),
      userId: salesUser!.id,
      createdAt: new Date("2026-02-15"),
      updatedAt: new Date("2026-02-18"),
      lineItems: {
        create: c3LineData,
      },
    },
  });

  // ────────────────────────────────────────────────────────────
  // CONTRACT 4: Anderson New Build - DRAFT (large project)
  // ────────────────────────────────────────────────────────────
  const c4Items = [
    { location: "Great Room - N Wall", type: "Window", qty: 3, width: 4, height: 6, color: "Black", series: "High Performance", frame: "Nail Fin", function: "Single Hung", productCode: "Patriot HP SH", operation: "SH", gridType: "STD GRID", glassType: "LoE-i89", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
    { location: "Great Room - Picture", type: "Window", qty: 1, width: 8, height: 6, color: "Black", series: "High Performance", frame: "Nail Fin", function: "Picture", productCode: "Patriot HP PW", operation: "N/A", gridType: "STD GRID", glassType: "LoE-i89", temperedGlass: true, obscuredGlass: false, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
    { location: "Master - W Wall", type: "Window", qty: 2, width: 3.5, height: 5, color: "Black", series: "High Performance", frame: "Nail Fin", function: "Single Slider", productCode: "Patriot HP SS", operation: "XO", gridType: "STD GRID", glassType: "LoE-i89", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
    { location: "Office", type: "Window", qty: 2, width: 3, height: 4, color: "Black", series: "High Performance", frame: "Nail Fin", function: "Single Hung", productCode: "Patriot HP SH", operation: "SH", gridType: "STD GRID", glassType: "LoE-i89", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
    { location: "Bedroom 2", type: "Window", qty: 1, width: 4, height: 4, color: "Black", series: "High Performance", frame: "Nail Fin", function: "Single Slider", productCode: "Patriot HP SS", operation: "OX", gridType: "STD GRID", glassType: "LoE-i89", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
    { location: "Bedroom 3", type: "Window", qty: 1, width: 4, height: 4, color: "Black", series: "High Performance", frame: "Nail Fin", function: "Single Slider", productCode: "Patriot HP SS", operation: "XO", gridType: "STD GRID", glassType: "LoE-i89", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
    { location: "Hallway Bath", type: "Window", qty: 1, width: 2, height: 3, color: "Black", series: "High Performance", frame: "Nail Fin", function: "Single Hung", productCode: "Patriot HP SH", operation: "SH", gridType: "STD GRID", glassType: "LoE-i89", temperedGlass: true, obscuredGlass: true, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
    { location: "Main Entry", type: "Door", qty: 1, width: 6, height: 6.67, color: "Black", series: "Patriot", frame: "Nail Fin", function: "Sliding Door", productCode: "Patriot SGD", operation: "XO", gridType: "STD GRID", glassType: "LoE-i89", temperedGlass: true, obscuredGlass: false, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
  ];

  let c4Total = 0;
  const c4LineData = c4Items.map((item, i) => {
    const price = calcPrice(item.width, item.height, item.qty, {
      color: item.color, series: item.series, frame: item.frame, fn: item.function,
      operation: item.operation, gridType: item.gridType, glassType: item.glassType,
      tempered: item.temperedGlass, obscured: item.obscuredGlass,
    });
    c4Total += price;
    return { ...item, price, sortOrder: i };
  });
  const c4ContractTotal = Math.round(c4Total * 100) / 100;

  await prisma.contract.create({
    data: {
      contractNumber: "AWP-2026-004",
      status: "DRAFT",
      customerName: "Michael Anderson",
      customerPhone: "(385) 555-0104",
      customerEmail: "manderson@email.com",
      jobAddress: "4521 Summit View Ct, Herriman, UT 84096",
      billingAddress: "4521 Summit View Ct, Herriman, UT 84096",
      customerCity: "Herriman",
      customerZip: "84096",
      customerState: "UT",
      salesman: "Jake Morrison",
      measuredBy: "Jake Morrison",
      yearBuilt: "2026",
      houseType: "Siding",
      preferredCommunication: "Text",
      total: Math.round(c4Total * 100) / 100,
      discount: 0,
      contractTotal: c4ContractTotal,
      downPayment: 0,
      balanceDue: c4ContractTotal,
      marketingSource: JSON.stringify(["Digital", "TV"]),
      sidingApplicationQty: 12,
      userId: jake.id,
      createdAt: new Date("2026-02-18"),
      updatedAt: new Date("2026-02-19"),
      lineItems: {
        create: c4LineData,
      },
    },
  });

  // ────────────────────────────────────────────────────────────
  // CONTRACT 5: Patel Condo - COMPLETED (small, cash deal)
  // ────────────────────────────────────────────────────────────
  const c5Items = [
    { location: "Living Room", type: "Window", qty: 2, width: 3, height: 4, color: "White", series: "Sunview", frame: "Frame Over", function: "Single Hung", productCode: "Sunview SSH", operation: "SH", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
    { location: "Bedroom", type: "Window", qty: 1, width: 3, height: 3.5, color: "White", series: "Sunview", frame: "Frame Over", function: "Single Hung", productCode: "Sunview SSH", operation: "SH", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
  ];

  let c5Total = 0;
  const c5LineData = c5Items.map((item, i) => {
    const price = calcPrice(item.width, item.height, item.qty, {
      color: item.color, series: item.series, frame: item.frame, fn: item.function,
      operation: item.operation, gridType: item.gridType, glassType: item.glassType,
    });
    c5Total += price;
    return { ...item, price, sortOrder: i };
  });
  const c5ContractTotal = Math.round(c5Total * 100) / 100;

  await prisma.contract.create({
    data: {
      contractNumber: "AWP-2026-005",
      status: "COMPLETED",
      customerName: "Priya Patel",
      customerPhone: "(801) 555-0456",
      customerEmail: "ppatel@email.com",
      jobAddress: "1200 E 300 S #4B, Salt Lake City, UT 84102",
      billingAddress: "1200 E 300 S #4B, Salt Lake City, UT 84102",
      customerCity: "Salt Lake City",
      customerZip: "84102",
      customerState: "UT",
      salesman: "Lisa Chen",
      measuredBy: "Lisa Chen",
      yearBuilt: "2010",
      houseType: "Stucco",
      leadTest: "Negative",
      preferredCommunication: "Email",
      windowsBeingRemoved: "Vinyl",
      total: Math.round(c5Total * 100) / 100,
      discount: 0,
      contractTotal: c5ContractTotal,
      downPayment: c5ContractTotal,
      balanceDue: 0,
      paymentMethod: "cash",
      downPaymentMethod: "cash",
      marketingSource: JSON.stringify(["Referral"]),
      stuccoApplicationQty: 3,
      contractorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      contractorSignatureDate: new Date("2025-12-10"),
      customerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      customerSignatureDate: new Date("2025-12-10"),
      customerAcceptedTerms: true,
      userId: lisa.id,
      salesRepId: lisa.id,
      createdAt: new Date("2025-12-08"),
      updatedAt: new Date("2025-12-20"),
      lineItems: {
        create: c5LineData,
      },
    },
  });

  // ────────────────────────────────────────────────────────────
  // CONTRACT 6: Williams Estate - SIGNED (luxury, HP with addendum)
  // ────────────────────────────────────────────────────────────
  const c6Items = [
    { location: "Foyer - Transom", type: "Window", qty: 1, width: 6, height: 2, color: "Bronze", series: "High Performance", frame: "Flush Fin", function: "Picture", productCode: "Patriot HP PW", operation: "N/A", gridType: "CNT GRID", glassType: "LoE-i89", temperedGlass: true, obscuredGlass: false, customShape: false, wrap: true, coated: true, awpShutterRnr: false },
    { location: "Formal Living", type: "Window", qty: 4, width: 3.5, height: 5.5, color: "Bronze", series: "High Performance", frame: "Flush Fin", function: "Single Hung", productCode: "Patriot HP SH", operation: "SH", gridType: "CNT GRID", glassType: "LoE-i89", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: true, awpShutterRnr: false },
    { location: "Den", type: "Window", qty: 2, width: 5, height: 5, color: "Bronze", series: "High Performance", frame: "Flush Fin", function: "Double Vent", productCode: "Patriot HP DV", operation: "XOX", gridType: "CNT GRID", glassType: "LoE-i89", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: true, awpShutterRnr: false },
    { location: "Master Bath", type: "Window", qty: 1, width: 3, height: 4, color: "Bronze", series: "High Performance", frame: "Flush Fin", function: "Single Hung", productCode: "Patriot HP SH", operation: "SH", gridType: "CNT GRID", glassType: "LoE-i89", temperedGlass: true, obscuredGlass: true, customShape: false, wrap: true, coated: true, awpShutterRnr: false },
    { location: "Rear Patio", type: "Door", qty: 1, width: 9, height: 6.67, color: "Bronze", series: "Patriot", frame: "Flush Fin", function: "Sliding Door", productCode: "Patriot SGD", operation: "OXXO", gridType: "CNT GRID", glassType: "LoE-i89", temperedGlass: true, obscuredGlass: false, customShape: false, wrap: true, coated: true, awpShutterRnr: false },
  ];

  let c6Total = 0;
  const c6LineData = c6Items.map((item, i) => {
    const price = calcPrice(item.width, item.height, item.qty, {
      color: item.color, series: item.series, frame: item.frame, fn: item.function,
      operation: item.operation, gridType: item.gridType, glassType: item.glassType,
      tempered: item.temperedGlass, obscured: item.obscuredGlass, wrap: item.wrap, coated: item.coated,
    });
    c6Total += price;
    return { ...item, price, sortOrder: i };
  });
  const c6Discount = 1000;
  const c6ContractTotal = Math.round((c6Total - c6Discount) * 100) / 100;
  const c6DownPayment = 5000;
  const c6Balance = Math.round((c6ContractTotal - c6DownPayment) * 100) / 100;

  const c6 = await prisma.contract.create({
    data: {
      contractNumber: "AWP-2026-006",
      status: "SIGNED",
      customerName: "Charles & Diane Williams",
      customerPhone: "(801) 555-0721",
      customerEmail: "cwilliams@email.com",
      jobAddress: "7890 Wasatch Blvd, Holladay, UT 84121",
      billingAddress: "7890 Wasatch Blvd, Holladay, UT 84121",
      customerCity: "Holladay",
      customerZip: "84121",
      customerState: "UT",
      salesman: "Test Salesman",
      measuredBy: "Jake Morrison",
      yearBuilt: "1992",
      houseType: "Brick",
      leadTest: "Negative",
      preferredCommunication: "Phone",
      windowsBeingRemoved: "Wood",
      total: Math.round(c6Total * 100) / 100,
      discount: c6Discount,
      contractTotal: c6ContractTotal,
      downPayment: c6DownPayment,
      balanceDue: c6Balance,
      paymentMethod: "finance",
      financingOption: "Synchrony",
      downPaymentMethod: "ach",
      marketingSource: JSON.stringify(["Magazine", "TV"]),
      brickApplicationQty: 9,
      contractorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      contractorSignatureDate: new Date("2026-02-10"),
      customerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      customerSignatureDate: new Date("2026-02-11"),
      customerAcceptedTerms: true,
      userId: salesUser!.id,
      createdAt: new Date("2026-02-08"),
      updatedAt: new Date("2026-02-11"),
      lineItems: {
        create: c6LineData,
      },
    },
  });

  // Add an addendum to Contract 6
  await prisma.addendum.create({
    data: {
      contractId: c6.id,
      products: JSON.stringify([
        { type: "Double Hung Windows", qty: 2, description: "Upstairs bedrooms - added after initial walkthrough" },
      ]),
      interiorColor: "White",
      exteriorColor: "Bronze",
      colorDescription: "Bronze exterior to match existing windows",
      installRemoveOld: true,
      installHaulAway: true,
      installInteriorTrim: true,
      installExteriorTrim: true,
      installCaulkSeal: true,
      installScreens: true,
      installHardware: true,
      installCleanup: true,
      ackMeasurements: true,
      ackSpecifications: true,
      ackPricing: true,
      ackTerms: true,
      ackInitials: "CW",
      notes: "Customer requested adding 2 upstairs bedroom windows to the original scope.",
      customerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      customerSignatureDate: new Date("2026-02-14"),
      contractorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      contractorSignatureDate: new Date("2026-02-14"),
      createdAt: new Date("2026-02-13"),
    },
  });

  // ────────────────────────────────────────────────────────────
  // CONTRACT 7: Nguyen Kitchen Remodel - DRAFT (small, in progress)
  // ────────────────────────────────────────────────────────────
  const c7Items = [
    { location: "Kitchen - Above Sink", type: "Window", qty: 1, width: 3.5, height: 3, color: "White", series: "Patriot", frame: "Nail Fin", function: "Single Slider", productCode: "Patriot SS", operation: "XO", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
    { location: "Kitchen - Side", type: "Window", qty: 1, width: 2.5, height: 4, color: "White", series: "Patriot", frame: "Nail Fin", function: "Single Hung", productCode: "Patriot SH", operation: "SH", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
  ];

  let c7Total = 0;
  const c7LineData = c7Items.map((item, i) => {
    const price = calcPrice(item.width, item.height, item.qty, {
      color: item.color, series: item.series, frame: item.frame, fn: item.function,
      operation: item.operation, gridType: item.gridType, glassType: item.glassType,
      wrap: item.wrap,
    });
    c7Total += price;
    return { ...item, price, sortOrder: i };
  });
  const c7ContractTotal = Math.round(c7Total * 100) / 100;

  await prisma.contract.create({
    data: {
      contractNumber: "AWP-2026-007",
      status: "DRAFT",
      customerName: "Tran Nguyen",
      customerPhone: "(385) 555-0293",
      customerEmail: "tnguyen@email.com",
      jobAddress: "456 State St, Orem, UT 84057",
      billingAddress: "456 State St, Orem, UT 84057",
      customerCity: "Orem",
      customerZip: "84057",
      customerState: "UT",
      salesman: "Lisa Chen",
      measuredBy: "Lisa Chen",
      yearBuilt: "2001",
      houseType: "Siding",
      preferredCommunication: "Text",
      windowsBeingRemoved: "Aluminum",
      total: Math.round(c7Total * 100) / 100,
      discount: 0,
      contractTotal: c7ContractTotal,
      downPayment: 0,
      balanceDue: c7ContractTotal,
      marketingSource: JSON.stringify(["PC"]),
      sidingApplicationQty: 2,
      userId: lisa.id,
      createdAt: new Date("2026-02-19"),
      updatedAt: new Date("2026-02-19"),
      lineItems: {
        create: c7LineData,
      },
    },
  });

  // ────────────────────────────────────────────────────────────
  // CONTRACT 8: Martinez Whole Home - COMPLETED (with change order)
  // ────────────────────────────────────────────────────────────
  const c8Items = [
    { location: "Front Room L", type: "Window", qty: 1, width: 4, height: 5, color: "Light Tan", series: "Patriot", frame: "Nail Fin", function: "Single Slider", productCode: "Patriot SS", operation: "XO", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
    { location: "Front Room R", type: "Window", qty: 1, width: 4, height: 5, color: "Light Tan", series: "Patriot", frame: "Nail Fin", function: "Single Slider", productCode: "Patriot SS", operation: "OX", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
    { location: "Front Room Center", type: "Window", qty: 1, width: 4, height: 5, color: "Light Tan", series: "Patriot", frame: "Nail Fin", function: "Picture", productCode: "Patriot PW", operation: "N/A", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
    { location: "Side Bedroom", type: "Window", qty: 2, width: 3, height: 4, color: "Light Tan", series: "Patriot", frame: "Nail Fin", function: "Single Hung", productCode: "Patriot SH", operation: "SH", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
    { location: "Basement", type: "Window", qty: 3, width: 3, height: 2, color: "Light Tan", series: "Patriot", frame: "Nail Fin", function: "Single Slider", productCode: "Patriot SS", operation: "XO", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: true, obscuredGlass: false, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
  ];

  let c8Total = 0;
  const c8LineData = c8Items.map((item, i) => {
    const price = calcPrice(item.width, item.height, item.qty, {
      color: item.color, series: item.series, frame: item.frame, fn: item.function,
      operation: item.operation, gridType: item.gridType, glassType: item.glassType,
      tempered: item.temperedGlass, wrap: item.wrap,
    });
    c8Total += price;
    return { ...item, price, sortOrder: i };
  });
  const c8Discount = 200;
  const c8ContractTotal = Math.round((c8Total - c8Discount) * 100) / 100;
  const c8DownPayment = 2500;
  const c8Balance = Math.round((c8ContractTotal - c8DownPayment) * 100) / 100;

  const c8 = await prisma.contract.create({
    data: {
      contractNumber: "AWP-2026-008",
      status: "COMPLETED",
      customerName: "Carlos & Elena Martinez",
      customerPhone: "(801) 555-0834",
      customerEmail: "cmartinez@email.com",
      jobAddress: "3310 W Temple Dr, West Valley City, UT 84119",
      billingAddress: "3310 W Temple Dr, West Valley City, UT 84119",
      customerCity: "West Valley City",
      customerZip: "84119",
      customerState: "UT",
      salesman: "Jake Morrison",
      measuredBy: "Test Salesman",
      yearBuilt: "1976",
      houseType: "Brick",
      leadTest: "Positive",
      preferredCommunication: "Phone",
      windowsBeingRemoved: "Aluminum",
      total: Math.round(c8Total * 100) / 100,
      discount: c8Discount,
      contractTotal: c8ContractTotal,
      downPayment: c8DownPayment,
      balanceDue: c8Balance,
      paymentMethod: "finance",
      financingOption: "Wells Fargo",
      downPaymentMethod: "check",
      marketingSource: JSON.stringify(["TV"]),
      brickApplicationQty: 8,
      contractorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      contractorSignatureDate: new Date("2025-11-20"),
      customerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      customerSignatureDate: new Date("2025-11-21"),
      customerAcceptedTerms: true,
      userId: jake.id,
      salesRepId: jake.id,
      setterId: salesUser!.id,
      createdAt: new Date("2025-11-15"),
      updatedAt: new Date("2026-01-10"),
      lineItems: {
        create: c8LineData,
      },
    },
  });

  // Add a change order to Contract 8
  await prisma.changeOrder.create({
    data: {
      contractId: c8.id,
      changeOrderNumber: "AWP-2026-008-CO1",
      changesDescription: "Customer requested upgrade from standard glass to LoE-i89 on all basement windows after installation of upper floor. Price increase reflects glass upgrade on 3 windows.",
      priceChangeType: "increase",
      priceChangeAmount: 150,
      originalPrice: c8ContractTotal,
      newPrice: Math.round((c8ContractTotal + 150) * 100) / 100,
      newBalanceDue: Math.round((c8Balance + 150) * 100) / 100,
      customerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      customerSignatureDate: new Date("2025-12-05"),
      awpSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      awpSignatureDate: new Date("2025-12-05"),
      createdAt: new Date("2025-12-03"),
    },
  });

  // ────────────────────────────────────────────────────────────
  // CONTRACT 9: Kim Residence - PENDING_SIGNATURE
  // ────────────────────────────────────────────────────────────
  const c9Items = [
    { location: "Living Room", type: "Window", qty: 2, width: 4, height: 5, color: "White", series: "Patriot", frame: "Nail Fin", function: "Single Slider", productCode: "Patriot SS", operation: "XO", gridType: "CNT GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
    { location: "Dining Room", type: "Window", qty: 1, width: 5, height: 5, color: "White", series: "Patriot", frame: "Nail Fin", function: "Picture", productCode: "Patriot PW", operation: "N/A", gridType: "CNT GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
    { location: "Master", type: "Window", qty: 2, width: 3.5, height: 4.5, color: "White", series: "Patriot", frame: "Nail Fin", function: "Single Hung", productCode: "Patriot SH", operation: "SH", gridType: "CNT GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: true, coated: false, awpShutterRnr: false },
  ];

  let c9Total = 0;
  const c9LineData = c9Items.map((item, i) => {
    const price = calcPrice(item.width, item.height, item.qty, {
      color: item.color, series: item.series, frame: item.frame, fn: item.function,
      operation: item.operation, gridType: item.gridType, glassType: item.glassType,
      wrap: item.wrap,
    });
    c9Total += price;
    return { ...item, price, sortOrder: i };
  });
  const c9ContractTotal = Math.round(c9Total * 100) / 100;
  const c9DownPayment = 1000;
  const c9Balance = Math.round((c9ContractTotal - c9DownPayment) * 100) / 100;

  await prisma.contract.create({
    data: {
      contractNumber: "AWP-2026-009",
      status: "PENDING_SIGNATURE",
      customerName: "James & Susan Kim",
      customerPhone: "(801) 555-0567",
      customerEmail: "jkim@email.com",
      jobAddress: "1025 E Millcreek Way, Millcreek, UT 84106",
      billingAddress: "1025 E Millcreek Way, Millcreek, UT 84106",
      customerCity: "Millcreek",
      customerZip: "84106",
      customerState: "UT",
      salesman: "Test Salesman",
      measuredBy: "Test Salesman",
      yearBuilt: "1988",
      houseType: "Wood",
      leadTest: "Negative",
      preferredCommunication: "Email",
      windowsBeingRemoved: "Wood",
      total: Math.round(c9Total * 100) / 100,
      discount: 0,
      contractTotal: c9ContractTotal,
      downPayment: c9DownPayment,
      balanceDue: c9Balance,
      paymentMethod: "check",
      downPaymentMethod: "check",
      marketingSource: JSON.stringify(["Referral"]),
      woodApplicationQty: 5,
      contractorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      contractorSignatureDate: new Date("2026-02-20"),
      userId: salesUser!.id,
      createdAt: new Date("2026-02-19"),
      updatedAt: new Date("2026-02-20"),
      lineItems: {
        create: c9LineData,
      },
    },
  });

  // ────────────────────────────────────────────────────────────
  // CONTRACT 10: Davis Office Buildout - DRAFT (commercial feel)
  // ────────────────────────────────────────────────────────────
  const c10Items = [
    { location: "Conference Room A", type: "Window", qty: 4, width: 4, height: 5, color: "Black", series: "Patriot", frame: "Flush Fin", function: "Picture", productCode: "Patriot PW", operation: "N/A", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: true, obscuredGlass: false, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
    { location: "Reception", type: "Window", qty: 2, width: 5, height: 6, color: "Black", series: "Patriot", frame: "Flush Fin", function: "Picture", productCode: "Patriot PW", operation: "N/A", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: true, obscuredGlass: false, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
    { location: "Break Room", type: "Window", qty: 2, width: 3, height: 4, color: "Black", series: "Patriot", frame: "Flush Fin", function: "Single Slider", productCode: "Patriot SS", operation: "XO", gridType: "STD GRID", glassType: "LoE-366", temperedGlass: false, obscuredGlass: false, customShape: false, wrap: false, coated: false, awpShutterRnr: false },
  ];

  let c10Total = 0;
  const c10LineData = c10Items.map((item, i) => {
    const price = calcPrice(item.width, item.height, item.qty, {
      color: item.color, series: item.series, frame: item.frame, fn: item.function,
      operation: item.operation, gridType: item.gridType, glassType: item.glassType,
      tempered: item.temperedGlass,
    });
    c10Total += price;
    return { ...item, price, sortOrder: i };
  });
  const c10ContractTotal = Math.round(c10Total * 100) / 100;

  await prisma.contract.create({
    data: {
      contractNumber: "AWP-2026-010",
      status: "DRAFT",
      customerName: "Davis Property Management LLC",
      customerPhone: "(801) 555-0900",
      customerEmail: "procurement@davispm.com",
      jobAddress: "500 S Main St, Suite 200, Salt Lake City, UT 84101",
      billingAddress: "PO Box 45012, Salt Lake City, UT 84145",
      customerCity: "Salt Lake City",
      customerZip: "84101",
      customerState: "UT",
      salesman: "Test Salesman",
      preferredCommunication: "Email",
      total: Math.round(c10Total * 100) / 100,
      discount: 0,
      contractTotal: c10ContractTotal,
      downPayment: 0,
      balanceDue: c10ContractTotal,
      contractNotes: "Commercial property - coordinate access with building management. Install during business hours only.",
      marketingSource: JSON.stringify(["Other"]),
      foundationApplicationQty: 8,
      userId: salesUser!.id,
      createdAt: new Date("2026-02-20"),
      updatedAt: new Date("2026-02-20"),
      lineItems: {
        create: c10LineData,
      },
    },
  });

  console.log("Seed completed successfully — 10 demo contracts created");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
