import { z } from "zod";

// Step validation field arrays for wizard navigation gating
export const STEP_1_FIELDS = ["customerName", "customerPhone", "customerEmail", "jobAddress", "customerCity", "customerState", "customerZip"] as const;
export const STEP_2_FIELDS = ["lineItems"]; // Validation: at least 1 item with location + type
export const STEP_3_FIELDS = ["paymentMethod", "downPayment"];
export const STEP_4_FIELDS = []; // No hard requirements (all optional)
export const STEP_5_FIELDS = []; // Read-only
export const STEP_6_FIELDS = ["contractorSignature", "customerSignature", "customerAcceptedTerms"];

// Line item schema
export const lineItemSchema = z.object({
  id: z.string().optional(),
  location: z.string().optional(),
  type: z.string().default("Window"),
  qty: z.coerce.number().min(1).default(1),
  width: z.coerce.number().min(0).default(0),
  height: z.coerce.number().min(0).default(0),
  color: z.string().default("White"),
  series: z.string().default(""),
  frame: z.string().default("Nail Fin"),
  function: z.string().default(""),
  // New product fields
  productCode: z.string().optional(),
  operation: z.string().optional(),
  gridType: z.string().optional(),
  glassType: z.string().optional(),
  // Boolean addons
  temperedGlass: z.boolean().default(false),
  obscuredGlass: z.boolean().default(false),
  customShape: z.boolean().default(false),
  wrap: z.boolean().default(false),
  coated: z.boolean().default(false),
  awpShutterRnr: z.boolean().default(false),
  // Grid pattern fields
  gridVerticalLines: z.coerce.number().min(0).default(0),
  gridHorizontalLines: z.coerce.number().min(0).default(0),
  gridPatternNotes: z.string().optional(),
  price: z.coerce.number().default(0),
  sortOrder: z.coerce.number().default(0),
});

export type LineItemFormValues = z.infer<typeof lineItemSchema>;

// Draft sales contract (minimal validation)
export const salesContractDraftSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerPhoneAlt: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  jobAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  customerCity: z.string().optional(),
  customerZip: z.string().optional(),
  salesman: z.string().optional(),
  measuredBy: z.string().optional(),
  leadTest: z.string().optional(),
  yearBuilt: z.string().optional(),
  houseType: z.string().optional(),
  lineItems: z.array(lineItemSchema).default([]),
  discount: z.coerce.number().min(0).default(0),
  downPayment: z.coerce.number().min(0).default(0),
  financeBalance: z.coerce.number().min(0).default(0),
  wfebAccount: z.string().optional(),
  planNumber: z.string().optional(),
  authNumber: z.string().optional(),
  marketingSource: z.array(z.string()).optional(),
  paymentMethod: z.string().optional(),
  customerState: z.string().optional(),
  preferredCommunication: z.string().optional(),
  downPaymentMethod: z.string().optional(),
  financingOption: z.string().optional(),
  financingLoanId: z.string().optional(),
  financingPlan: z.string().optional(),
  windowsBeingRemoved: z.string().optional(),
  paymentNotes: z.string().optional(),
  contractNotes: z.string().optional(),
  customerNotes: z.string().optional(),
  brickApplicationQty: z.coerce.number().min(0).default(0),
  stuccoApplicationQty: z.coerce.number().min(0).default(0),
  sidingApplicationQty: z.coerce.number().min(0).default(0),
  foundationApplicationQty: z.coerce.number().min(0).default(0),
  woodApplicationQty: z.coerce.number().min(0).default(0),
  salesRepId: z.string().optional(),
  setterId: z.string().optional(),
  measurementNotes: z.string().optional(),
  // Addendum fields
  installByAWD: z.boolean().default(false),
  measurementsTakenBy: z.string().optional(),
  hasShutters: z.boolean().default(false),
  removalWindows: z.coerce.number().min(0).default(0),
  removalDoors: z.coerce.number().min(0).default(0),
  typeComingOut: z.string().optional(),
  windowsComingOutOf: z.array(z.string()).optional(),
  referredBy: z.string().optional(),
  referralName: z.string().optional(),
  // Signatures
  contractorSignature: z.string().optional(),
  contractorSignatureDate: z.string().optional(),
  customerSignature: z.string().optional(),
  customerSignatureDate: z.string().optional(),
  authorizedSignature: z.string().optional(),
  authorizedSignatureDate: z.string().optional(),
  customerAcceptedTerms: z.boolean().default(false),
  status: z.string().optional(),
});

export type SalesContractDraftValues = z.infer<typeof salesContractDraftSchema>;

// Submit sales contract (full validation)
export const salesContractSubmitSchema = salesContractDraftSchema.extend({
  customerName: z.string().min(1, "Customer name is required"),
  customerSignature: z.string().min(1, "Customer signature is required"),
  customerSignatureDate: z.string().min(1, "Customer signature date is required"),
  contractorSignature: z.string().min(1, "Contractor signature is required"),
  customerAcceptedTerms: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export type SalesContractSubmitValues = z.infer<typeof salesContractSubmitSchema>;

// Addendum schema
export const addendumSchema = z.object({
  contractId: z.string().min(1),
  products: z
    .array(
      z.object({
        type: z.string(),
        qty: z.coerce.number().min(0).default(0),
        width: z.coerce.number().min(0).default(0),
        height: z.coerce.number().min(0).default(0),
        notes: z.string().optional(),
      })
    )
    .optional(),
  interiorColor: z.string().optional(),
  exteriorColor: z.string().optional(),
  colorDescription: z.string().optional(),
  installRemoveOld: z.boolean().default(false),
  installHaulAway: z.boolean().default(false),
  installInteriorTrim: z.boolean().default(false),
  installExteriorTrim: z.boolean().default(false),
  installCaulkSeal: z.boolean().default(false),
  installScreens: z.boolean().default(false),
  installHardware: z.boolean().default(false),
  installWeatherstrip: z.boolean().default(false),
  installCleanup: z.boolean().default(false),
  installOther: z.boolean().default(false),
  installNotes: z.string().optional(),
  ackMeasurements: z.boolean().default(false),
  ackSpecifications: z.boolean().default(false),
  ackPricing: z.boolean().default(false),
  ackTerms: z.boolean().default(false),
  ackInitials: z.string().optional(),
  hasInteriorShutters: z.boolean().default(false),
  referralName: z.string().optional(),
  referralPhone: z.string().optional(),
  notes: z.string().optional(),
  customerSignature: z.string().optional(),
  customerSignatureDate: z.string().optional(),
  contractorSignature: z.string().optional(),
  contractorSignatureDate: z.string().optional(),
});

export type AddendumFormValues = z.infer<typeof addendumSchema>;

// Change order schema
export const changeOrderSchema = z.object({
  contractId: z.string().min(1),
  changesDescription: z.string().min(1, "Changes description is required"),
  priceChangeType: z.enum(["no_change", "increase", "decrease"]).default("no_change"),
  priceChangeAmount: z.coerce.number().min(0).default(0),
  customerSignature: z.string().optional(),
  customerSignatureDate: z.string().optional(),
  awpSignature: z.string().optional(),
  awpSignatureDate: z.string().optional(),
});

export type ChangeOrderFormValues = z.infer<typeof changeOrderSchema>;

// Commission settings schema (7-section panel)
const rate = z.coerce.number().min(0).max(1);
const threshold = z.coerce.number().min(0);
const ceiling = z.coerce.number().min(0.5).max(2);
const floor = z.coerce.number().min(0.5).max(1);

export const commissionSettingsSchema = z.object({
  // Sales Rep
  salesRepRate: rate,
  salesRepRateBelowFair: rate,
  salesRepFloor: floor,
  salesRepCeiling: ceiling,
  // Setter
  setterRate: rate,
  setterFloor: floor,
  // Setter Manager
  setterManagerRate: rate,
  setterManagerRateBelowFair: rate,
  // Territory Owner
  territoryOwnerRateTier1: rate,
  territoryOwnerRateTier2: rate,
  territoryOwnerRateTier3: rate,
  territoryOwnerTier2Threshold: threshold,
  territoryOwnerTier3Threshold: threshold,
  // VP
  vpRate: rate,
  vpRateBelowFair: rate,
  // NSM
  nsmRate: rate,
  nsmRateBelowFair: rate,
  // Traditional Sales (self-gen)
  traditionalSalesRepRate: rate,
  traditionalSalesRepRateBelowFair: rate,
  traditionalFloorRate: floor,
  traditionalPriceCeiling: ceiling,
  traditionalNsmOverrideRate: rate,
  traditionalNsmOverrideRateBelowFair: rate,
});

export type CommissionSettingsFormValues = z.infer<typeof commissionSettingsSchema>;

// Territory schemas
export const createTerritorySchema = z.object({
  name: z.string().min(1, "Territory name is required").max(50),
  market: z.string().min(1).max(50).default("SLC"),
});

export type CreateTerritoryValues = z.infer<typeof createTerritorySchema>;

export const updateTerritorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  market: z.string().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateTerritoryValues = z.infer<typeof updateTerritorySchema>;

// Commission override schemas
export const commissionOverrideSchema = z.object({
  commissionType: z.enum([
    "SALES_REP",
    "SETTER",
    "SETTER_MANAGER",
    "TERRITORY_OWNER",
    "VP",
    "NSM",
  ]),
  rateOverride: z.coerce.number().min(0).max(1),
});

export const upsertOverridesSchema = z.object({
  overrides: z.array(commissionOverrideSchema).min(1),
});

export type UpsertOverridesValues = z.infer<typeof upsertOverridesSchema>;

// Invite schemas
export const createInviteSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(["ADMIN", "SALESMAN"]).default("SALESMAN"),
  isSetterManager: z.boolean().default(false),
  isTerritoryOwner: z.boolean().default(false),
  isVP: z.boolean().default(false),
  isNSM: z.boolean().default(false),
  territoryId: z.string().optional(),
});

export type CreateInviteValues = z.infer<typeof createInviteSchema>;

export const acceptInviteSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AcceptInviteValues = z.infer<typeof acceptInviteSchema>;
