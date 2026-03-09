"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  ChevronDown,
  Grid2x2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
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
import {
  calculateLineItem,
  calculateLineItemBreakdown,
  formatCurrency,
  type PricingBreakdown,
} from "@/lib/pricing";
import { GridPatternDialog } from "@/components/contracts/wizard/grid-pattern-dialog";

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
  const { fields, append, remove, swap, insert } = useFieldArray({
    control,
    name: "lineItems",
  });

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const market: Market = "SLC";

  const handleToggleExpand = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    swap(index, index - 1);
    if (expandedIndex === index) setExpandedIndex(index - 1);
    else if (expandedIndex === index - 1) setExpandedIndex(index);
  };

  const handleMoveDown = (index: number) => {
    if (index >= fields.length - 1) return;
    swap(index, index + 1);
    if (expandedIndex === index) setExpandedIndex(index + 1);
    else if (expandedIndex === index + 1) setExpandedIndex(index);
  };

  const handleDuplicate = (index: number) => {
    const { control: _c, ...rest } = fields[index] as Record<string, unknown>;
    const { id: _id, ...data } = rest;
    insert(index + 1, { ...defaultLineItem, ...data, sortOrder: index + 1 });
    setExpandedIndex(index + 1);
  };

  const handleRemove = (index: number) => {
    remove(index);
    if (expandedIndex === index) {
      setExpandedIndex(index < fields.length - 1 ? index : Math.max(0, index - 1));
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleAddItem = () => {
    append({ ...defaultLineItem, sortOrder: fields.length });
    setExpandedIndex(fields.length);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Line Items</h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Window/Door
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <LineItemCard
            key={field.id}
            index={index}
            market={market}
            isExpanded={expandedIndex === index}
            isFirst={index === 0}
            isLast={index === fields.length - 1}
            canRemove={fields.length > 1}
            onToggle={() => handleToggleExpand(index)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            onDuplicate={() => handleDuplicate(index)}
            onRemove={() => handleRemove(index)}
          />
        ))}
      </div>

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
    </div>
  );
}

// ─── Line Item Card (Accordion) ──────────────────────────────────────────────

function LineItemCard({
  index,
  market,
  isExpanded,
  isFirst,
  isLast,
  canRemove,
  onToggle,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}: {
  index: number;
  market: Market;
  isExpanded: boolean;
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
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

  // Pricing breakdown for expanded view
  const breakdown = useMemo<PricingBreakdown>(() => {
    if (!rowData) return { sqIn: 0, basePrice: 0, addonTotal: 0, unitPrice: 0, lineTotal: 0 };
    return calculateLineItemBreakdown({
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
  }, [rowData]);

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
        const product = findProduct(market, itemType as "Window" | "Door", init.displayStyle, init.series);
        setResolvedProduct(product || null);
        return;
      }
    }

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

  const availableStyles = useMemo(
    () => getAvailableStyles(market, itemType as "Window" | "Door"),
    [market, itemType],
  );

  const availableSeries = useMemo(
    () =>
      selectedStyle
        ? getAvailableSeries(market, itemType as "Window" | "Door", selectedStyle)
        : [],
    [market, itemType, selectedStyle],
  );

  const marketColors = useMemo(() => getColorsForMarket(market), [market]);

  const isProductInvalid = useMemo(() => {
    if (!productCode) return false;
    const init = initFromProductCode(productCode);
    if (!init) return true;
    const product = findProduct(market, itemType as "Window" | "Door", init.displayStyle, init.series);
    return !product;
  }, [productCode, market, itemType]);

  const resolveAndSetProduct = useCallback(
    (style: string, series: string) => {
      const product = findProduct(market, itemType as "Window" | "Door", style, series);
      setResolvedProduct(product || null);

      if (product) {
        setValue(`lineItems.${index}.productCode`, product.code, { shouldDirty: true });
        setValue(`lineItems.${index}.series`, product.series, { shouldDirty: true });
        setValue(`lineItems.${index}.function`, product.function, { shouldDirty: true });

        if (product.operations.length === 1) {
          setValue(`lineItems.${index}.operation`, product.operations[0], { shouldDirty: true });
        } else {
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

  const handleStyleChange = (style: string) => {
    setSelectedStyle(style);

    const isCustomShape = CUSTOM_SHAPE_STYLES.has(style);
    setValue(`lineItems.${index}.customShape`, isCustomShape, { shouldDirty: true });

    const series = getAvailableSeries(market, itemType as "Window" | "Door", style);

    if (series.length === 1) {
      setValue(`lineItems.${index}.series`, series[0].value, { shouldDirty: true });
      resolveAndSetProduct(style, series[0].value);
    } else {
      setValue(`lineItems.${index}.series`, "", { shouldDirty: true });
      setResolvedProduct(null);
      setValue(`lineItems.${index}.productCode`, "", { shouldDirty: true });
      setValue(`lineItems.${index}.function`, "", { shouldDirty: true });
      setValue(`lineItems.${index}.operation`, "", { shouldDirty: true });
      setValue(`lineItems.${index}.gridType`, "", { shouldDirty: true });
      setValue(`lineItems.${index}.glassType`, "", { shouldDirty: true });
    }
  };

  const handleSeriesChange = (series: string) => {
    setValue(`lineItems.${index}.series`, series, { shouldDirty: true });
    resolveAndSetProduct(selectedStyle, series);
  };

  const validOperations = resolvedProduct?.operations || [];
  const validGridTypes = resolvedProduct?.grids || [];
  const validGlassTypes = resolvedProduct?.glassTypes || [];

  // Computed values for collapsed summary
  const location = rowData?.location || "";
  const width = Number(rowData?.width) || 0;
  const height = Number(rowData?.height) || 0;
  const sqIn = width * height * 144;
  const qty = Number(rowData?.qty) || 1;

  const activeBooleans = useMemo(() => {
    if (!rowData) return [];
    const labels: string[] = [];
    if (rowData.temperedGlass) labels.push("TEMP");
    if (rowData.obscuredGlass) labels.push("OBS");
    if (rowData.coated) labels.push("HP");
    if (rowData.wrap) labels.push("WRAP");
    if (rowData.awpShutterRnr) labels.push("RNR");
    return labels;
  }, [rowData]);

  const gridPatternLabel = useMemo(() => {
    if (!rowData) return "";
    const v = rowData.gridVerticalLines || 0;
    const h = rowData.gridHorizontalLines || 0;
    if (v === 0 && h === 0) return "";
    return `${v}V × ${h}H`;
  }, [rowData]);

  return (
    <div
      className={cn(
        "border rounded-lg transition-shadow",
        isExpanded && "shadow-md ring-1 ring-primary/20",
        isProductInvalid && "ring-2 ring-destructive",
      )}
    >
      {/* Collapsed Header - always visible */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 cursor-pointer select-none",
          isExpanded && "border-b bg-muted/30",
        )}
        onClick={onToggle}
      >
        {/* Left: Item number + summary */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-bold text-muted-foreground w-6 shrink-0">
            #{index + 1}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              isExpanded && "rotate-180",
            )}
          />
          <span className="text-sm font-medium truncate">
            {location || "Untitled"}{" "}
            {selectedStyle && (
              <span className="text-muted-foreground font-normal">({selectedStyle})</span>
            )}
          </span>
          {width > 0 && height > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">
              {width}&apos; × {height}&apos; → {Math.round(sqIn)} UI
            </span>
          )}
          {qty > 1 && (
            <Badge variant="secondary" className="text-xs shrink-0">
              ×{qty}
            </Badge>
          )}
        </div>

        {/* Center: Option badges */}
        <div className="hidden md:flex items-center gap-1 shrink-0">
          {activeBooleans.map((label) => (
            <Badge key={label} variant="outline" className="text-[10px] px-1.5 py-0">
              {label}
            </Badge>
          ))}
          {gridPatternLabel && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {gridPatternLabel}
            </Badge>
          )}
          {rowData?.gridType && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {rowData.gridType}
            </Badge>
          )}
        </div>

        {/* Right: Price + action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-sm font-semibold mr-2">
            {formatCurrency(price || 0)}
          </span>
          <div className="hidden md:flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={isFirst}
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              aria-label="Move up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={isLast}
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              aria-label="Move down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            aria-label="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canRemove}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label="Remove"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="px-4 py-4 space-y-4">
          {/* Row 1: Location, Type, Product Type, Glass Type, Frame Color */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Input
                {...register(`lineItems.${index}.location`)}
                placeholder="e.g. Kitchen"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Product Type</Label>
              <StyleCombobox
                value={selectedStyle}
                availableStyles={availableStyles}
                onSelect={handleStyleChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Glass Type</Label>
              <Select
                value={getValues(`lineItems.${index}.glassType`) || "__none__"}
                onValueChange={(v) =>
                  setValue(`lineItems.${index}.glassType`, v === "__none__" ? "" : v, { shouldDirty: true })
                }
                disabled={!resolvedProduct || validGlassTypes.length === 0}
              >
                <SelectTrigger>
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
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Frame Color</Label>
              <Select
                value={getValues(`lineItems.${index}.color`) || "White"}
                onValueChange={(v) =>
                  setValue(`lineItems.${index}.color`, v, { shouldDirty: true })
                }
                disabled={resolvedProduct?.series === "Sunview"}
              >
                <SelectTrigger>
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
            </div>
          </div>

          {/* Row 2: Type, Width, Height, Qty, UI Value, Matched Size */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select
                value={itemType}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
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
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Width (ft)</Label>
              <Input
                {...register(`lineItems.${index}.width`, { valueAsNumber: true })}
                type="number"
                step="0.01"
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Height (ft)</Label>
              <Input
                {...register(`lineItems.${index}.height`, { valueAsNumber: true })}
                type="number"
                step="0.01"
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Qty</Label>
              <Input
                {...register(`lineItems.${index}.qty`, { valueAsNumber: true })}
                type="number"
                min={1}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">UI Value</Label>
              <Input
                value={sqIn > 0 ? Math.round(sqIn).toLocaleString() : "—"}
                readOnly
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Frame</Label>
              <Select
                value={getValues(`lineItems.${index}.frame`) || "Nail Fin"}
                onValueChange={(v) =>
                  setValue(`lineItems.${index}.frame`, v, { shouldDirty: true })
                }
                disabled={resolvedProduct?.series === "Sunview"}
              >
                <SelectTrigger>
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
            </div>
          </div>

          {/* Row 3: Grids, Grid Pattern, Series, Operation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Grids</Label>
              <Select
                value={getValues(`lineItems.${index}.gridType`) || "__none__"}
                onValueChange={(v) =>
                  setValue(`lineItems.${index}.gridType`, v === "__none__" ? "" : v, { shouldDirty: true })
                }
                disabled={!resolvedProduct || validGridTypes.length === 0}
              >
                <SelectTrigger>
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
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Grid Pattern</Label>
              <GridPatternDialog lineItemIndex={index}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start font-normal"
                >
                  <Grid2x2 className="h-4 w-4 mr-2 shrink-0" />
                  {gridPatternLabel || "Set pattern"}
                </Button>
              </GridPatternDialog>
            </div>
            {availableSeries.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Series</Label>
                <Select
                  value={getValues(`lineItems.${index}.series`) || "__none__"}
                  onValueChange={(v) => handleSeriesChange(v === "__none__" ? "" : v)}
                  disabled={!selectedStyle || availableSeries.length === 0}
                >
                  <SelectTrigger>
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
              </div>
            )}
            {validOperations.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Operation</Label>
                <Select
                  value={getValues(`lineItems.${index}.operation`) || "__none__"}
                  onValueChange={(v) =>
                    setValue(`lineItems.${index}.operation`, v === "__none__" ? "" : v, { shouldDirty: true })
                  }
                  disabled={!resolvedProduct || validOperations.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {validOperations.map((op) => (
                      <SelectItem key={op} value={op} textValue={op}>
                        <span className="font-medium">{op}</span>
                        <span className="text-muted-foreground text-xs ml-1">
                          - {OPERATIONS[op]?.description}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Row 4: Toggle switches */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
            <div className="flex items-center gap-2">
              <Switch
                id={`hp-${index}`}
                checked={!!rowData?.coated}
                onCheckedChange={(checked) =>
                  setValue(`lineItems.${index}.coated`, !!checked, { shouldDirty: true })
                }
              />
              <Label htmlFor={`hp-${index}`} className="text-sm cursor-pointer">HP</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`tempered-${index}`}
                checked={!!rowData?.temperedGlass}
                onCheckedChange={(checked) =>
                  setValue(`lineItems.${index}.temperedGlass`, !!checked, { shouldDirty: true })
                }
              />
              <Label htmlFor={`tempered-${index}`} className="text-sm cursor-pointer">Tempered</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`wrap-${index}`}
                checked={!!rowData?.wrap}
                onCheckedChange={(checked) =>
                  setValue(`lineItems.${index}.wrap`, !!checked, { shouldDirty: true })
                }
              />
              <Label htmlFor={`wrap-${index}`} className="text-sm cursor-pointer">Ext Wraps</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`obscure-${index}`}
                checked={!!rowData?.obscuredGlass}
                onCheckedChange={(checked) =>
                  setValue(`lineItems.${index}.obscuredGlass`, !!checked, { shouldDirty: true })
                }
              />
              <Label htmlFor={`obscure-${index}`} className="text-sm cursor-pointer">Obscure Glass</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`rnr-${index}`}
                checked={!!rowData?.awpShutterRnr}
                onCheckedChange={(checked) =>
                  setValue(`lineItems.${index}.awpShutterRnr`, !!checked, { shouldDirty: true })
                }
              />
              <Label htmlFor={`rnr-${index}`} className="text-sm cursor-pointer">Remove Storms</Label>
            </div>
          </div>

          {/* Row 5: Pricing breakdown bar */}
          <div className="flex flex-wrap items-center gap-4 rounded-md bg-muted/50 px-4 py-2.5 text-sm">
            <div>
              <span className="text-muted-foreground">Base: </span>
              <span className="font-medium">{formatCurrency(breakdown.basePrice)}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div>
              <span className="text-muted-foreground">Add-ons: </span>
              <span className="font-medium">{formatCurrency(breakdown.addonTotal)}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div>
              <span className="text-muted-foreground">Unit: </span>
              <span className="font-medium">{formatCurrency(breakdown.unitPrice)}</span>
            </div>
            {qty > 1 && (
              <>
                <div className="h-4 w-px bg-border" />
                <div>
                  <span className="text-muted-foreground">× {qty} = </span>
                </div>
              </>
            )}
            <div className="ml-auto">
              <span className="text-muted-foreground">Line Total: </span>
              <span className="font-bold">{formatCurrency(breakdown.lineTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
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
          className="w-full justify-between font-normal h-9 px-3"
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
