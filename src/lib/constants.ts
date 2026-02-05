// Ported from ezcontract/includes/class-awp-pricing.php lines 16-59

export const PRICING = {
  baseRate: 0.55, // $ per square inch

  color: {
    White: 0,
    "Light Tan": 0,
    "Dark Tan": 0,
    Eclipse: 0.01,
    "Black Out White": 0,
  } as Record<string, number>,

  series: {
    Patriot: 0,
    "High Performance": 0.01,
    Autograph: 0,
    Signature: 0.01,
  } as Record<string, number>,

  frame: {
    "Nail Fin": 0,
    "Flush Fin": 0,
    "Frame Over": -0.01,
  } as Record<string, number>,

  function: {
    Slider: 0,
    Picture: 0,
    Eyebrow: 0.02,
    Vent: 0.02,
    "Double Vent": 0.02,
  } as Record<string, number>,

  booleanAddons: {
    temperedGlass: 0.01,
    obscuredGlass: 0.01,
    customShape: 0.02,
    wrap: 0.01,
    coated: 0.01,
    awpShutterRnr: 0.02,
  } as Record<string, number>,
};

export const FORM_OPTIONS = {
  type: ["Window", "Door"],

  color: ["White", "Light Tan", "Dark Tan", "Eclipse", "Black Out White"],

  series: ["Patriot", "High Performance", "Autograph", "Signature"],

  frame: ["Nail Fin", "Flush Fin", "Frame Over"],

  function: ["Slider", "Picture", "Eyebrow", "Vent", "Double Vent"],

  houseType: ["Brick", "Siding", "Wood", "Stucco", "Foundation"],

  paymentMethod: [
    { value: "cash", label: "Cash" },
    { value: "check", label: "Check" },
    { value: "finance", label: "Finance" },
    { value: "credit_card", label: "Credit Card" },
    { value: "ach", label: "ACH" },
  ],

  marketingSource: [
    "TV",
    "Digital",
    "PC",
    "Magazine",
    "Radio",
    "Referral",
    "Other",
  ],

  addendumProductTypes: [
    "Double Hung Windows",
    "Slider Windows",
    "Casement Windows",
    "Awning Windows",
    "Picture Windows",
    "Bay Windows",
    "Bow Windows",
    "Garden Windows",
    "Hopper Windows",
    "Patio Doors",
    "Entry Doors",
    "Storm Doors",
    "Specialty Windows",
    "Skylights",
  ],

  interiorColors: [
    "White",
    "Light Tan",
    "Dark Tan",
    "Woodgrain",
    "Custom",
  ],

  exteriorColors: [
    "White",
    "Light Tan",
    "Dark Tan",
    "Bronze",
    "Black",
    "Custom",
  ],
};

export const CONTRACT_STATUSES = {
  DRAFT: { label: "Draft", color: "secondary" },
  PENDING_SIGNATURE: { label: "Pending Signature", color: "default" },
  SIGNED: { label: "Signed", color: "outline" },
  COMPLETED: { label: "Completed", color: "destructive" },
} as const;

export const BOOLEAN_ADDON_LABELS: Record<string, string> = {
  temperedGlass: "Tempered",
  obscuredGlass: "Obscured",
  customShape: "Custom Shape",
  wrap: "Wrap",
  coated: "Coated",
  awpShutterRnr: "Shutter RNR",
};
