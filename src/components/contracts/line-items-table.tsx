"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Check, ChevronsUpDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BOOLEAN_ADDON_LABELS,
  FORM_OPTIONS,
  OPERATIONS,
  PRODUCTS,
  CUSTOM_SHAPE_STYLES,
  getAvailableStyles,
  getAvailableSeries,
  findProduct,
  getColorsForMarket,
  initFromProductCode,
  type Market,
  type ProductDef,
} from "@/lib/constants";
import { calculateLineItem, formatCurrency } from "@/lib/pricing";
import { GridPatternDialog } from "@/components/contracts/wizard/grid-pattern-dialog";

const BOOLEAN_FIELDS = [
  "temperedGlass",
  "obscuredGlass",
  "customShape",
  "wrap",
  "coated",
  "awpShutterRnr",
] as const;

const defaultLineItem = {
  location: "",
  type: "Window",
  qty: 1,
  width: 0,
  height: 0,
  color: "White",
  series: "",
  frame: "Nail Fin",
  function: "",
  productCode: "",
  operation: "",
  gridType: "",
  glassType: "",
  temperedGlass: false,
  obscuredGlass: false,
  customShape: false,
  wrap: false,
  coated: false,
  awpShutterRnr: false,
  price: 0,
  sortOrder: 0,
  gridVerticalLines: 0,
  gridHorizontalLines: 0,
  gridPatternNotes: "",
};

export function LineItemsTable() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  // Default market for product catalog
  const market: Market = "SLC";

  const handleAddItem = () => {
    append({ ...defaultLineItem, sortOrder: fields.length });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Line Items</h3>

      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">Location</TableHead>
              <TableHead className="min-w-[90px]">Type</TableHead>
              <TableHead className="min-w-[150px]">Style</TableHead>
              <TableHead className="min-w-[130px]">Series</TableHead>
              <TableHead className="w-16">Qty</TableHead>
              <TableHead className="w-20">Width (ft)</TableHead>
              <TableHead className="w-20">Height (ft)</TableHead>
              <TableHead className="min-w-[110px]">Color</TableHead>
              <TableHead className="min-w-[100px]">Frame</TableHead>
              <TableHead className="min-w-[100px]">Operation</TableHead>
              <TableHead className="min-w-[100px]">Grid Type</TableHead>
              <TableHead className="min-w-[100px]">Glass Type</TableHead>
              <TableHead className="w-10">Grid Pattern</TableHead>
              <TableHead className="w-12 text-center text-xs">Options</TableHead>
              <TableHead className="w-24 text-right">Price</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <LineItemRow
                key={field.id}
                index={index}
                market={market}
                canRemove={fields.length > 1}
                onRemove={() => remove(index)}
              />
            ))}
            <TableRow>
              <TableCell colSpan={16}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add item
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LineItemRow({
  index,
  market,
  canRemove,
  onRemove,
}: {
  index: number;
  market: Market;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const { register, control, setValue, getValues } = useFormContext();

  const price = useWatch({ control, name: `lineItems.${index}.price` });
  const productCode = useWatch({ control, name: `lineItems.${index}.productCode` });
  const itemType = useWatch({ control, name: `lineItems.${index}.type` }) || "Window";

  // Recalculate price when any pricing field changes
  const rowData = useWatch({ control, name: `lineItems.${index}` });
  useEffect(() => {
    if (!rowData) return;
    const newPrice = calculateLineItem({
      width: Number(rowData.width) || 0,
      height: Number(rowData.height) || 0,
      qty: Number(rowData.qty) || 1,
      color: rowData.color || "White",
      series: rowData.series || "",
      frame: rowData.frame || "Nail Fin",
      function: rowData.function || "",
      productCode: rowData.productCode,
      operation: rowData.operation,
      gridType: rowData.gridType,
      glassType: rowData.glassType,
      temperedGlass: !!rowData.temperedGlass,
      obscuredGlass: !!rowData.obscuredGlass,
      customShape: !!rowData.customShape,
      wrap: !!rowData.wrap,
      coated: !!rowData.coated,
      awpShutterRnr: !!rowData.awpShutterRnr,
    });
    if (rowData.price !== newPrice) {
      setValue(`lineItems.${index}.price`, newPrice, { shouldDirty: false });
    }
  }, [rowData, index, setValue]);

  // Local state for the display style (not stored in form, derived from cascade)
  const [selectedStyle, setSelectedStyle] = useState("");
  const [resolvedProduct, setResolvedProduct] = useState<ProductDef | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Backwards compat: populate selectedStyle from existing productCode on mount
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    const code = getValues(`lineItems.${index}.productCode`);
    if (code) {
      const init = initFromProductCode(code);
      if (init) {
        setSelectedStyle(init.displayStyle);
        // Resolve the product for filtering dependent dropdowns
        const product = findProduct(market, itemType as "Window" | "Door", init.displayStyle, init.series);
        setResolvedProduct(product || null);
        return;
      }
    }

    // Fallback: if series/function are set but no productCode (legacy data)
    const series = getValues(`lineItems.${index}.series`);
    const fn = getValues(`lineItems.${index}.function`);
    if (series && fn) {
      const match = (Object.values(PRODUCTS) as ProductDef[]).find(
        (p) => p.series === series && p.function === fn && p.markets.includes(market),
      );
      if (match) {
        const init = initFromProductCode(match.code);
        if (init) {
          setSelectedStyle(init.displayStyle);
          setResolvedProduct(match);
          setValue(`lineItems.${index}.productCode`, match.code, { shouldDirty: false });
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute available styles for current market + type
  const availableStyles = useMemo(
    () => getAvailableStyles(market, itemType as "Window" | "Door"),
    [market, itemType],
  );

  // Compute available series for current style
  const availableSeries = useMemo(
    () =>
      selectedStyle
        ? getAvailableSeries(market, itemType as "Window" | "Door", selectedStyle)
        : [],
    [market, itemType, selectedStyle],
  );

  // Market-aware colors
  const marketColors = useMemo(() => getColorsForMarket(market), [market]);

  // Check if current productCode is valid for the market (red border indicator)
  const isProductInvalid = useMemo(() => {
    if (!productCode) return false;
    const init = initFromProductCode(productCode);
    if (!init) return true;
    const product = findProduct(market, itemType as "Window" | "Door", init.displayStyle, init.series);
    return !product;
  }, [productCode, market, itemType]);

  // Resolve product and update form fields
  const resolveAndSetProduct = useCallback(
    (style: string, series: string) => {
      const product = findProduct(market, itemType as "Window" | "Door", style, series);
      setResolvedProduct(product || null);

      if (product) {
        setValue(`lineItems.${index}.productCode`, product.code, { shouldDirty: true });
        setValue(`lineItems.${index}.series`, product.series, { shouldDirty: true });
        setValue(`lineItems.${index}.function`, product.function, { shouldDirty: true });

        // Auto-set defaults for single-option fields
        if (product.operations.length === 1) {
          setValue(`lineItems.${index}.operation`, product.operations[0], { shouldDirty: true });
        } else {
          // Clear if current value isn't in new product's operations
          const currentOp = getValues(`lineItems.${index}.operation`);
          if (currentOp && !product.operations.includes(currentOp as never)) {
            setValue(`lineItems.${index}.operation`, "", { shouldDirty: true });
          }
        }

        if (product.grids.length === 1) {
          setValue(`lineItems.${index}.gridType`, product.grids[0], { shouldDirty: true });
        } else {
          const currentGrid = getValues(`lineItems.${index}.gridType`);
          if (currentGrid && !product.grids.includes(currentGrid as never)) {
            setValue(`lineItems.${index}.gridType`, "", { shouldDirty: true });
          }
        }

        if (product.glassTypes.length === 1) {
          setValue(`lineItems.${index}.glassType`, product.glassTypes[0], { shouldDirty: true });
        } else {
          const currentGlass = getValues(`lineItems.${index}.glassType`);
          if (currentGlass && !product.glassTypes.includes(currentGlass as never)) {
            setValue(`lineItems.${index}.glassType`, "", { shouldDirty: true });
          }
        }

        // Sunview constraints: White only, Flush Fin only
        if (product.series === "Sunview") {
          setValue(`lineItems.${index}.color`, "White", { shouldDirty: true });
          setValue(`lineItems.${index}.frame`, "Flush Fin", { shouldDirty: true });
        }
      } else {
        setValue(`lineItems.${index}.productCode`, "", { shouldDirty: true });
        setValue(`lineItems.${index}.series`, "", { shouldDirty: true });
        setValue(`lineItems.${index}.function`, "", { shouldDirty: true });
      }
    },
    [market, itemType, index, setValue, getValues],
  );

  // Type change handler
  const handleTypeChange = (newType: string) => {
    setValue(`lineItems.${index}.type`, newType, { shouldDirty: true });
    setSelectedStyle("");
    setResolvedProduct(null);
    setValue(`lineItems.${index}.productCode`, "", { shouldDirty: true });
    setValue(`lineItems.${index}.series`, "", { shouldDirty: true });
    setValue(`lineItems.${index}.function`, "", { shouldDirty: true });
    setValue(`lineItems.${index}.operation`, "", { shouldDirty: true });
    setValue(`lineItems.${index}.gridType`, "", { shouldDirty: true });
    setValue(`lineItems.${index}.glassType`, "", { shouldDirty: true });
  };

  // Style change handler
  const handleStyleChange = (style: string) => {
    setSelectedStyle(style);

    // Auto-tick customShape for custom shape styles
    const isCustomShape = CUSTOM_SHAPE_STYLES.has(style);
    setValue(`lineItems.${index}.customShape`, isCustomShape, { shouldDirty: true });

    const series = getAvailableSeries(market, itemType as "Window" | "Door", style);

    if (series.length === 1) {
      // Auto-select the only available series
      setValue(`lineItems.${index}.series`, series[0].value, { shouldDirty: true });
      resolveAndSetProduct(style, series[0].value);
    } else {
      // Reset series and let user pick
      setValue(`lineItems.${index}.series`, "", { shouldDirty: true });
      setResolvedProduct(null);
      setValue(`lineItems.${index}.productCode`, "", { shouldDirty: true });
      setValue(`lineItems.${index}.function`, "", { shouldDirty: true });
      setValue(`lineItems.${index}.operation`, "", { shouldDirty: true });
      setValue(`lineItems.${index}.gridType`, "", { shouldDirty: true });
      setValue(`lineItems.${index}.glassType`, "", { shouldDirty: true });
    }
  };

  // Series change handler
  const handleSeriesChange = (series: string) => {
    setValue(`lineItems.${index}.series`, series, { shouldDirty: true });
    resolveAndSetProduct(selectedStyle, series);
  };

  // Valid options for dependent dropdowns
  const validOperations = resolvedProduct?.operations || [];
  const validGridTypes = resolvedProduct?.grids || [];
  const validGlassTypes = resolvedProduct?.glassTypes || [];

  return (
    <TableRow className={isProductInvalid ? "ring-2 ring-inset ring-destructive" : ""}>
      {/* Location */}
      <TableCell>
        <Input
          {...register(`lineItems.${index}.location`)}
          placeholder="e.g. Kitchen"
          className="min-w-[90px]"
        />
      </TableCell>

      {/* Type */}
      <TableCell>
        <Select
          value={itemType}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="min-w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORM_OPTIONS.type.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Style (searchable combobox) */}
      <TableCell>
        <StyleCombobox
          value={selectedStyle}
          availableStyles={availableStyles}
          onSelect={handleStyleChange}
        />
      </TableCell>

      {/* Series */}
      <TableCell>
        <Select
          value={getValues(`lineItems.${index}.series`) || "__none__"}
          onValueChange={(v) => handleSeriesChange(v === "__none__" ? "" : v)}
          disabled={!selectedStyle || availableSeries.length === 0}
        >
          <SelectTrigger className="min-w-[120px]">
            <SelectValue placeholder="Select series" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">-- Select --</SelectItem>
            {availableSeries.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Qty */}
      <TableCell>
        <Input
          {...register(`lineItems.${index}.qty`, { valueAsNumber: true })}
          type="number"
          min={1}
          className="w-14"
        />
      </TableCell>

      {/* Width */}
      <TableCell>
        <Input
          {...register(`lineItems.${index}.width`, { valueAsNumber: true })}
          type="number"
          step="0.01"
          min={0}
          className="w-16"
        />
      </TableCell>

      {/* Height */}
      <TableCell>
        <Input
          {...register(`lineItems.${index}.height`, { valueAsNumber: true })}
          type="number"
          step="0.01"
          min={0}
          className="w-16"
        />
      </TableCell>

      {/* Color (market-aware) */}
      <TableCell>
        <Select
          value={getValues(`lineItems.${index}.color`) || "White"}
          onValueChange={(v) =>
            setValue(`lineItems.${index}.color`, v, { shouldDirty: true })
          }
          disabled={resolvedProduct?.series === "Sunview"}
        >
          <SelectTrigger className="min-w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {marketColors.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Frame */}
      <TableCell>
        <Select
          value={getValues(`lineItems.${index}.frame`) || "Nail Fin"}
          onValueChange={(v) =>
            setValue(`lineItems.${index}.frame`, v, { shouldDirty: true })
          }
          disabled={resolvedProduct?.series === "Sunview"}
        >
          <SelectTrigger className="min-w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORM_OPTIONS.frame.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Operation */}
      <TableCell>
        <Select
          value={getValues(`lineItems.${index}.operation`) || "__none__"}
          onValueChange={(v) =>
            setValue(`lineItems.${index}.operation`, v === "__none__" ? "" : v, { shouldDirty: true })
          }
          disabled={!resolvedProduct || validOperations.length === 0}
        >
          <SelectTrigger className="min-w-[90px]">
            <SelectValue placeholder={validOperations.length === 0 ? "N/A" : "Select"} />
          </SelectTrigger>
          <SelectContent>
            {validOperations.length === 0 ? (
              <SelectItem value="__na__">N/A</SelectItem>
            ) : (
              validOperations.map((op) => (
                <SelectItem key={op} value={op} textValue={op}>
                  <span className="font-medium">{op}</span>
                  <span className="text-muted-foreground text-xs ml-1">- {OPERATIONS[op]?.description}</span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Grid Type */}
      <TableCell>
        <Select
          value={getValues(`lineItems.${index}.gridType`) || "__none__"}
          onValueChange={(v) =>
            setValue(`lineItems.${index}.gridType`, v === "__none__" ? "" : v, { shouldDirty: true })
          }
          disabled={!resolvedProduct || validGridTypes.length === 0}
        >
          <SelectTrigger className="min-w-[90px]">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {validGridTypes.length === 0 ? (
              <SelectItem value="__none__">None</SelectItem>
            ) : (
              validGridTypes.map((gt) => (
                <SelectItem key={gt} value={gt}>
                  {gt}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Glass Type */}
      <TableCell>
        <Select
          value={getValues(`lineItems.${index}.glassType`) || "__none__"}
          onValueChange={(v) =>
            setValue(`lineItems.${index}.glassType`, v === "__none__" ? "" : v, { shouldDirty: true })
          }
          disabled={!resolvedProduct || validGlassTypes.length === 0}
        >
          <SelectTrigger className="min-w-[90px]">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {validGlassTypes.length === 0 ? (
              <SelectItem value="__none__">None</SelectItem>
            ) : (
              validGlassTypes.map((gt) => (
                <SelectItem key={gt} value={gt}>
                  {gt}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Grid Pattern */}
      <TableCell>
        <GridPatternDialog lineItemIndex={index} />
      </TableCell>

      {/* Boolean Addons (popover) */}
      <TableCell className="text-center">
        <BooleanOptionsPopover index={index} />
      </TableCell>

      {/* Price */}
      <TableCell className="text-right font-medium">
        {formatCurrency(price || 0)}
      </TableCell>

      {/* Delete */}
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!canRemove}
          onClick={onRemove}
          aria-label="Remove line item"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ─── Searchable Style Combobox ────────────────────────────────────────────────

function StyleCombobox({
  value,
  availableStyles,
  onSelect,
}: {
  value: string;
  availableStyles: Array<{ category: string; styles: string[] }>;
  onSelect: (style: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-[140px] justify-between font-normal h-9 px-3"
        >
          <span className="truncate">
            {value || "Select style"}
          </span>
          <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search styles..." />
          <CommandList>
            <CommandEmpty>No style found.</CommandEmpty>
            {availableStyles.map((group) => (
              <CommandGroup key={group.category} heading={group.category}>
                {group.styles.map((style) => (
                  <CommandItem
                    key={style}
                    value={style}
                    onSelect={() => {
                      onSelect(style);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === style ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {style}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Boolean Options Popover ─────────────────────────────────────────────────

function BooleanOptionsPopover({ index }: { index: number }) {
  const { setValue, getValues } = useFormContext();

  const activeCount = BOOLEAN_FIELDS.filter(
    (f) => !!getValues(`lineItems.${index}.${f}`),
  ).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <MoreHorizontal className="h-4 w-4" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-3" align="end">
        <p className="text-xs font-medium text-muted-foreground mb-2">Add-ons</p>
        <div className="space-y-2">
          {BOOLEAN_FIELDS.map((boolField) => (
            <label key={boolField} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={!!getValues(`lineItems.${index}.${boolField}`)}
                onCheckedChange={(checked) =>
                  setValue(`lineItems.${index}.${boolField}`, !!checked, {
                    shouldDirty: true,
                  })
                }
              />
              {BOOLEAN_ADDON_LABELS[boolField]}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
