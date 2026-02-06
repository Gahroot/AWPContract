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
import { FORM_OPTIONS, BOOLEAN_ADDON_LABELS } from "@/lib/constants";
import { calculateLineItem, formatCurrency } from "@/lib/pricing";
import { type LineItemFormValues } from "@/lib/validations";
import { useEffect } from "react";

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
              <TableHead className="min-w-[120px]">Location</TableHead>
              <TableHead className="min-w-[100px]">Type</TableHead>
              <TableHead className="w-16">Qty</TableHead>
              <TableHead className="w-20">Width (ft)</TableHead>
              <TableHead className="w-20">Height (ft)</TableHead>
              <TableHead className="min-w-[120px]">Color</TableHead>
              <TableHead className="min-w-[140px]">Series</TableHead>
              <TableHead className="min-w-[110px]">Frame</TableHead>
              <TableHead className="min-w-[120px]">Function</TableHead>
              {BOOLEAN_FIELDS.map((field) => (
                <TableHead key={field} className="w-16 text-center text-xs">
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
              <TableCell colSpan={BOOLEAN_FIELDS.length + 11}>
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

  return (
    <TableRow>
      <TableCell>
        <Input
          {...register(`lineItems.${index}.location`)}
          placeholder="e.g. Kitchen"
          className="min-w-[100px]"
        />
      </TableCell>
      <TableCell>
        <Select
          value={getValues(`lineItems.${index}.type`) || "Window"}
          onValueChange={(v) =>
            setValue(`lineItems.${index}.type`, v, { shouldDirty: true })
          }
        >
          <SelectTrigger className="min-w-[90px]">
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
      <TableCell>
        <Input
          {...register(`lineItems.${index}.qty`, { valueAsNumber: true })}
          type="number"
          min={1}
          className="w-16"
        />
      </TableCell>
      <TableCell>
        <Input
          {...register(`lineItems.${index}.width`, { valueAsNumber: true })}
          type="number"
          step="0.01"
          min={0}
          className="w-20"
        />
      </TableCell>
      <TableCell>
        <Input
          {...register(`lineItems.${index}.height`, { valueAsNumber: true })}
          type="number"
          step="0.01"
          min={0}
          className="w-20"
        />
      </TableCell>
      <TableCell>
        <Select
          value={getValues(`lineItems.${index}.color`) || "White"}
          onValueChange={(v) =>
            setValue(`lineItems.${index}.color`, v, { shouldDirty: true })
          }
        >
          <SelectTrigger className="min-w-[100px]">
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
        <Select
          value={getValues(`lineItems.${index}.series`) || "Patriot"}
          onValueChange={(v) =>
            setValue(`lineItems.${index}.series`, v, { shouldDirty: true })
          }
        >
          <SelectTrigger className="min-w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORM_OPTIONS.series.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
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
          <SelectTrigger className="min-w-[100px]">
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
        <Select
          value={getValues(`lineItems.${index}.function`) || "Slider"}
          onValueChange={(v) =>
            setValue(`lineItems.${index}.function`, v, { shouldDirty: true })
          }
        >
          <SelectTrigger className="min-w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORM_OPTIONS.function.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
