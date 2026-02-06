"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eraser } from "lucide-react";

interface SignaturePadProps {
  label: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function SignaturePad({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
}: SignaturePadProps) {
  const canvasRef = useRef<SignatureCanvas>(null);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [hasSignature, setHasSignature] = useState(!!value);
  const initialLoadRef = useRef(false);

  // Only load the signature once on mount, not on every value change
  useEffect(() => {
    if (value && canvasRef.current && mode === "draw" && !initialLoadRef.current) {
      canvasRef.current.fromDataURL(value);
      initialLoadRef.current = true;
    }
  }, [value, mode]);

  const handleDrawEnd = useCallback(() => {
    if (canvasRef.current && !canvasRef.current.isEmpty()) {
      initialLoadRef.current = true;
      const dataUrl = canvasRef.current.getTrimmedCanvas().toDataURL("image/png");
      onChange(dataUrl);
      setHasSignature(true);
    }
  }, [onChange]);

  const handleTypedSignature = useCallback(
    (name: string) => {
      setTypedName(name);
      if (!name.trim()) {
        onChange("");
        setHasSignature(false);
        return;
      }

      // Render typed name as image
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 400, 100);
        ctx.fillStyle = "black";
        ctx.font = "italic 36px Georgia, serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(name, 200, 50);
        const dataUrl = canvas.toDataURL("image/png");
        onChange(dataUrl);
        setHasSignature(true);
      }
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    if (mode === "draw" && canvasRef.current) {
      canvasRef.current.clear();
    } else {
      setTypedName("");
    }
    onChange("");
    setHasSignature(false);
  }, [mode, onChange]);

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Tabs
        value={mode}
        onValueChange={(v) => {
          setMode(v as "draw" | "type");
          handleClear();
        }}
      >
        <TabsList className="mb-2">
          <TabsTrigger value="draw" disabled={disabled}>
            Draw
          </TabsTrigger>
          <TabsTrigger value="type" disabled={disabled}>
            Type
          </TabsTrigger>
        </TabsList>
        <TabsContent value="draw">
          <div className="border rounded-md bg-white relative">
            <SignatureCanvas
              ref={canvasRef}
              penColor="black"
              canvasProps={{
                className: "w-full h-32 touch-none",
                style: { width: "100%", height: "128px" },
              }}
              onEnd={handleDrawEnd}
            />
            {!hasSignature && !disabled && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground text-sm">
                Sign here
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="type">
          <Input
            placeholder="Type your full name"
            value={typedName}
            onChange={(e) => handleTypedSignature(e.target.value)}
            disabled={disabled}
            className="font-serif italic text-lg"
          />
          {typedName && (
            <div className="mt-2 border rounded-md bg-white p-4 text-center">
              <span className="font-serif italic text-3xl">{typedName}</span>
            </div>
          )}
        </TabsContent>
      </Tabs>
      {!disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-muted-foreground"
        >
          <Eraser className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
