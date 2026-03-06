"use client";

import React, { useState, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Grid2x2 } from "lucide-react";

interface GridPatternDialogProps {
  lineItemIndex: number;
  children?: React.ReactNode;
}

export function GridPatternDialog({ lineItemIndex, children }: GridPatternDialogProps) {
  const { setValue } = useFormContext();
  const [open, setOpen] = useState(false);

  // Watch form values for initial state
  const formValues = useWatch({
    name: `lineItems.${lineItemIndex}`,
  }) as {
    gridVerticalLines?: number;
    gridHorizontalLines?: number;
    gridPatternNotes?: string;
    location?: string;
  };

  // Local state for form inputs - initialize from form values when dialog opens
  const [localValues, setLocalValues] = useState(() => ({
    verticalLines: formValues?.gridVerticalLines || 0,
    horizontalLines: formValues?.gridHorizontalLines || 0,
    patternNotes: formValues?.gridPatternNotes || "",
  }));

  // Reset local values when dialog opens
  const verticalLines = useMemo(
    () => (open ? localValues.verticalLines : formValues?.gridVerticalLines || 0),
    [open, localValues.verticalLines, formValues?.gridVerticalLines],
  );

  const horizontalLines = useMemo(
    () => (open ? localValues.horizontalLines : formValues?.gridHorizontalLines || 0),
    [open, localValues.horizontalLines, formValues?.gridHorizontalLines],
  );

  const patternNotes = useMemo(
    () => (open ? localValues.patternNotes : formValues?.gridPatternNotes || ""),
    [open, localValues.patternNotes, formValues?.gridPatternNotes],
  );

  const handleSave = () => {
    setValue(`lineItems.${lineItemIndex}.gridVerticalLines`, verticalLines, {
      shouldDirty: true,
    });
    setValue(`lineItems.${lineItemIndex}.gridHorizontalLines`, horizontalLines, {
      shouldDirty: true,
    });
    setValue(`lineItems.${lineItemIndex}.gridPatternNotes`, patternNotes, {
      shouldDirty: true,
    });
    setOpen(false);
  };

  const handleCancel = () => {
    // Reset local values to current form values
    setLocalValues({
      verticalLines: formValues?.gridVerticalLines || 0,
      horizontalLines: formValues?.gridHorizontalLines || 0,
      patternNotes: formValues?.gridPatternNotes || "",
    });
    setOpen(false);
  };

  const location = formValues?.location || "Item";

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (newOpen) {
        // Reset local values when opening
        setLocalValues({
          verticalLines: formValues?.gridVerticalLines || 0,
          horizontalLines: formValues?.gridHorizontalLines || 0,
          patternNotes: formValues?.gridPatternNotes || "",
        });
      }
      setOpen(newOpen);
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            title="Grid Pattern"
          >
            <Grid2x2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Grid Pattern - {location}</DialogTitle>
          <DialogDescription>
            Configure grid pattern layout for this window.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="grid-counts">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grid-counts">Grid Counts</TabsTrigger>
            <TabsTrigger value="draw-pattern">Draw Pattern</TabsTrigger>
          </TabsList>

          <TabsContent value="grid-counts" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vertical-lines">Vertical Lines</Label>
                <Input
                  id="vertical-lines"
                  type="number"
                  min={0}
                  max={20}
                  value={verticalLines}
                  onChange={(e) => setLocalValues((prev) => ({
                    ...prev,
                    verticalLines: parseInt(e.target.value) || 0,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horizontal-lines">Horizontal Lines</Label>
                <Input
                  id="horizontal-lines"
                  type="number"
                  min={0}
                  max={20}
                  value={horizontalLines}
                  onChange={(e) => setLocalValues((prev) => ({
                    ...prev,
                    horizontalLines: parseInt(e.target.value) || 0,
                  }))}
                />
              </div>
            </div>

            {/* Grid Preview */}
            <div className="space-y-2">
              <Label>Grid Preview</Label>
              <div className="border rounded-md p-4 bg-muted/30">
                <GridPreview
                  verticalLines={verticalLines}
                  horizontalLines={horizontalLines}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pattern-notes">Pattern Notes</Label>
              <Textarea
                id="pattern-notes"
                placeholder="Additional notes about the grid pattern..."
                value={patternNotes}
                onChange={(e) => setLocalValues((prev) => ({
                  ...prev,
                  patternNotes: e.target.value,
                }))}
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="draw-pattern" className="py-8">
            <div className="flex flex-col items-center justify-center text-center space-y-2 text-muted-foreground">
              <Grid2x2 className="h-12 w-12 opacity-20" />
              <p className="font-medium">Coming Soon</p>
              <p className="text-sm">
                Visual pattern drawing tool will be available in a future update.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Grid Preview Component - simple CSS grid visualization
function GridPreview({
  verticalLines,
  horizontalLines,
}: {
  verticalLines: number;
  horizontalLines: number;
}) {
  // Create grid cells based on lines
  // verticalLines = number of vertical dividers (creates verticalLines + 1 columns)
  // horizontalLines = number of horizontal dividers (creates horizontalLines + 1 rows)
  const cols = Math.max(1, verticalLines + 1);
  const rows = Math.max(1, horizontalLines + 1);
  const totalCells = cols * rows;

  // Limit preview for performance
  const maxCells = 25;
  const displayCells = Math.min(totalCells, maxCells);

  return (
    <div className="flex flex-col items-center">
      <div
        className="w-full max-w-[200px] aspect-square border-2 border-primary/40 bg-white rounded"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: "2px",
        }}
      >
        {Array.from({ length: displayCells }).map((_, i) => (
          <div
            key={i}
            className="bg-primary/10 rounded-sm border border-primary/20"
            style={{
              gridColumn: (i % cols) + 1,
              gridRow: Math.floor(i / cols) + 1,
            }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {verticalLines} vertical × {horizontalLines} horizontal lines
        {totalCells > maxCells && " (preview limited)"}
      </p>
    </div>
  );
}
