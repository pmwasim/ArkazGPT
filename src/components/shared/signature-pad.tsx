"use client";
import { useRef, useEffect, useState } from "react";
import SignaturePad from "signature_pad";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  label?: string;
  existingSignature?: string | null;
}

export function SignaturePadComponent({ onSave, label = "Signature", existingSignature }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      padRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: "rgb(255, 255, 255)",
        penColor: "rgb(0, 0, 0)",
      });

      if (existingSignature) {
        padRef.current.fromDataURL(existingSignature);
        setSaved(true);
      }
    }
    return () => {
      padRef.current?.off();
    };
  }, [existingSignature]);

  const handleSave = () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      const dataUrl = padRef.current.toDataURL("image/png");
      onSave(dataUrl);
      setSaved(true);
    }
  };

  const handleClear = () => {
    padRef.current?.clear();
    setSaved(false);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full touch-none"
          style={{ touchAction: "none" }}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleClear}>
          Clear
        </Button>
        <Button type="button" size="sm" onClick={handleSave} variant={saved ? "success" : "default"}>
          {saved ? "Saved ✓" : "Save Signature"}
        </Button>
      </div>
    </div>
  );
}
