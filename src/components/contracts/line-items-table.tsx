"use client";

import React from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import {
  FORM_OPTIONS,
  BOOLEAN_ADDON_LABELS,
  getProductsByMarket,
  PRODUCTS,
  OPERATIONS,
} from "@/lib/constants";
import { calculateLineItem, formatCurrency } from "@/lib/pricing";
import { type LineItemFormValues } from "@/lib/validations";
import { useEffect, useState } from "react";

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
  series: "Patriot",
  frame: "Nail Fin",
  function: "Slider",
  // New product fields
  productCode: "",
  operation: "",
  gridType: "",
  glassType: "",
  // Boolean addons
  temperedGlass: false,
  obscuredGlass: false,
  customShape: false,
  wrap: false,
  coated: false,
  awpShutterRnr: false,
  price: 0,
  sortOrder: 0,
};

export function LineItemsTable() {
  const { control, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  // Watch all line items for price recalculation
  const lineItems = useWatch({ control, name: "lineItems" });

  // Recalculate prices when any line item changes
  useEffect(() => {
    if (!lineItems) return;
    lineItems.forEach((item: LineItemFormValues, index: number) => {
      const price = calculateLineItem({
        width: Number(item.width) || 0,
        height: Number(item.height) || 0,
        qty: Number(item.qty) || 1,
        color: item.color || "White",
        series: item.series || "Patriot",
        frame: item.frame || "Nail Fin",
        function: item.function || "Slider",
        // New product fields
        productCode: item.productCode,
        operation: item.operation,
        gridType: item.gridType,
        glassType: item.glassType,
        // Boolean addons
        temperedGlass: !!item.temperedGlass,
        obscuredGlass: !!item.obscuredGlass,
        customShape: !!item.customShape,
        wrap: !!item.wrap,
        coated: !!item.coated,
        awpShutterRnr: !!item.awpShutterRnr,
      });
      if (item.price !== price) {
        setValue(`lineItems.${index}.price`, price, { shouldDirty: false });
      }
    });
  }, [lineItems, setValue]);

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
              <TableHead className="min-w-[160px]">Product</TableHead>
              <TableHead className="w-16">Qty</TableHead>
              <TableHead className="w-20">Width (ft)</TableHead>
              <TableHead className="w-20">Height (ft)</TableHead>
              <TableHead className="min-w-[100px]">Color</TableHead>
              <TableHead className="min-w-[100px]">Series</TableHead>
              <TableHead className="min-w-[100px]">Operation</TableHead>
              <TableHead className="min-w-[100px]">Grid Type</TableHead>
              <TableHead className="min-w-[100px]">Glass Type</TableHead>
              <TableHead className="min-w-[100px]">Frame</TableHead>
              <TableHead className="min-w-[100px]">Function</TableHead>
              {BOOLEAN_FIELDS.map((field) => (
                <TableHead key={field} className="w-14 text-center text-xs">
                  {BOOLEAN_ADDON_LABELS[field]}
                </TableHead>
              ))}
              <TableHead className="w-24 text-right">Price</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <LineItemRow
                key={field.id}
                index={index}
                canRemove={fields.length > 1}
                onRemove={() => remove(index)}
              />
            ))}
            <TableRow>
              <TableCell colSpan={BOOLEAN_FIELDS.length + 15}>
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
  canRemove,
  onRemove,
}: {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const { register, control, setValue, getValues } = useFormContext();

  const price = useWatch({ control, name: `lineItems.${index}.price` });
  const productCode = useWatch({ control, name: `lineItems.${index}.productCode` });

  // Get available products for SLC market (MVP)
  const [products] = useState(() => getProductsByMarket("SLC"));
  const [selectedProduct, setSelectedProduct] = useState(
    productCode ? PRODUCTS[productCode] : null
  );

  // Handle product code change - auto-fill series, function, and set valid options
  const handleProductCodeChange = (code: string) => {
    setValue(`lineItems.${index}.productCode`, code, { shouldDirty: true });
    const product = PRODUCTS[code];
    setSelectedProduct(product || null);

    if (product) {
      // Auto-fill series and function
      setValue(`lineItems.${index}.series`, product.series, { shouldDirty: true });
      setValue(`lineItems.${index}.function`, product.function, { shouldDirty: true });
      setValue(`lineItems.${index}.type`, product.type, { shouldDirty: true });

      // Set default operation if product has only one option
      if (product.operations.length === 1) {
        setValue(`lineItems.${index}.operation`, product.operations[0], { shouldDirty: true });
      }

      // Set default grid type if product has only one option
      if (product.grids.length === 1) {
        setValue(`lineItems.${index}.gridType`, product.grids[0], { shouldDirty: true });
      }

      // Set default glass type if product has only one option
      if (product.glassTypes.length === 1) {
        setValue(`lineItems.${index}.glassType`, product.glassTypes[0], { shouldDirty: true });
      }
    }
  };

  // Get valid operations for selected product
  const validOperations = selectedProduct?.operations || [];
  // Get valid grid types for selected product
  const validGridTypes = selectedProduct?.grids || [];
  // Get valid glass types for selected product
  const validGlassTypes = selectedProduct?.glassTypes || [];

  return (
    <TableRow>
      <TableCell>
        <Input
          {...register(`lineItems.${index}.location`)}
          placeholder="e.g. Kitchen"
          className="min-w-[90px]"
        />
      </TableCell>
      <TableCell>
        <Select
          value={getValues(`lineItems.${index}.productCode`) || ""}
          onValueChange={handleProductCodeChange}
        >
          <SelectTrigger className="min-w-[150px]">
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">-- None --</SelectItem>
            {Object.values(products)
              .sort((a, b) => a.series.localeCompare(b.series))
              .map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.code}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          {...register(`lineItems.${index}.qty`, { valueAsNumber: true })}
          type="number"
          min={1}
          className="w-14"
        />
      </TableCell>
      <TableCell>
        <Input
          {...register(`lineItems.${index}.width`, { valueAsNumber: true })}
          type="number"
          step="0.01"
          min={0}
          className="w-16"
        />
      </TableCell>
      <TableCell>
        <Input
          {...register(`lineItems.${index}.height`, { valueAsNumber: true })}
          type="number"
          step="0.01"
          min={0}
          className="w-16"
        />
      </TableCell>
      <TableCell>
        <Select
          value={getValues(`lineItems.${index}.color`) || "White"}
          onValueChange={(v) =>
            setValue(`lineItems.${index}.color`, v, { shouldDirty: true })
          }
        >
          <SelectTrigger className="min-w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORM_OPTIONS.color.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          {...register(`lineItems.${index}.series`)}
          placeholder="Series"
          className="min-w-[90px] bg-muted"
          readOnly
        />
      </TableCell>
      <TableCell>
        <Select
          value={getValues(`lineItems.${index}.operation`) || ""}
          onValueChange={(v) =>
            setValue(`lineItems.${index}.operation`, v, { shouldDirty: true })
          }
          disabled={!selectedProduct || validOperations.length === 0}
        >
          <SelectTrigger className="min-w-[90px]">
            <SelectValue placeholder={validOperations.length === 0 ? "N/A" : "Select"} />
          </SelectTrigger>
          <SelectContent>
            {validOperations.length === 0 ? (
              <SelectItem value="N/A">N/A</SelectItem>
            ) : (
              validOperations.map((op) => (
                <SelectItem key={op} value={op}>
                  {op} - {OPERATIONS[op]?.description}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={getValues(`lineItems.${index}.gridType`) || ""}
          onValueChange={(v) =>
            setValue(`lineItems.${index}.gridType`, v, { shouldDirty: true })
          }
          disabled={!selectedProduct || validGridTypes.length === 0}
        >
          <SelectTrigger className="min-w-[90px]">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {validGridTypes.length === 0 ? (
              <SelectItem value="">None</SelectItem>
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
      <TableCell>
        <Select
          value={getValues(`lineItems.${index}.glassType`) || ""}
          onValueChange={(v) =>
            setValue(`lineItems.${index}.glassType`, v, { shouldDirty: true })
          }
          disabled={!selectedProduct || validGlassTypes.length === 0}
        >
          <SelectTrigger className="min-w-[90px]">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {validGlassTypes.length === 0 ? (
              <SelectItem value="">None</SelectItem>
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
      <TableCell>
        <Select
          value={getValues(`lineItems.${index}.frame`) || "Nail Fin"}
          onValueChange={(v) =>
            setValue(`lineItems.${index}.frame`, v, { shouldDirty: true })
          }
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
      <TableCell>
        <Input
          {...register(`lineItems.${index}.function`)}
          placeholder="Function"
          className="min-w-[90px] bg-muted"
          readOnly
        />
      </TableCell>
      {BOOLEAN_FIELDS.map((boolField) => (
        <TableCell key={boolField} className="text-center">
          <Checkbox
            checked={!!getValues(`lineItems.${index}.${boolField}`)}
            onCheckedChange={(checked) =>
              setValue(`lineItems.${index}.${boolField}`, !!checked, {
                shouldDirty: true,
              })
            }
          />
        </TableCell>
      ))}
      <TableCell className="text-right font-medium">
        {formatCurrency(price || 0)}
      </TableCell>
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
