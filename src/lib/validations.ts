import { z } from "zod";

// Line item schema
export const lineItemSchema = z.object({
  id: z.string().optional(),
  location: z.string().optional(),
  type: z.string().default("Window"),
  qty: z.coerce.number().min(1).default(1),
  width: z.coerce.number().min(0).default(0),
  height: z.coerce.number().min(0).default(0),
  color: z.string().default("White"),
  series: z.string().default("Patriot"),
  frame: z.string().default("Nail Fin"),
  function: z.string().default("Slider"),
  temperedGlass: z.boolean().default(false),
  obscuredGlass: z.boolean().default(false),
  customShape: z.boolean().default(false),
  wrap: z.boolean().default(false),
  coated: z.boolean().default(false),
  awpShutterRnr: z.boolean().default(false),
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
  measurementDate: z.string().optional(),
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
  measurementNotes: z.string().optional(),
  contractorSignature: z.string().optional(),
  contractorSignatureDate: z.string().optional(),
  customerSignature: z.string().optional(),
  customerSignatureDate: z.string().optional(),
  authorizedSignature: z.string().optional(),
  authorizedSignatureDate: z.string().optional(),
  status: z.string().optional(),
});

export type SalesContractDraftValues = z.infer<typeof salesContractDraftSchema>;

// Submit sales contract (full validation)
export const salesContractSubmitSchema = salesContractDraftSchema.extend({
  customerName: z.string().min(1, "Customer name is required"),
  customerSignature: z.string().min(1, "Customer signature is required"),
  customerSignatureDate: z.string().min(1, "Customer signature date is required"),
  contractorSignature: z.string().min(1, "Contractor signature is required"),
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
