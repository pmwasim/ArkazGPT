"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Building2, QrCode } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: "", vatNumber: "", crNumber: "", address: "",
    phone: "", email: "", website: "", invoiceTerms: "",
    invoicePrefix: "INV", receiptPrefix: "SR", deliveryPrefix: "DN",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      setSettings(s => ({ ...s, ...data }));
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Configure company information and platform settings</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Company Information</CardTitle>
            <CardDescription>Used on receipts, invoices, and ZATCA QR code generation</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2"><Label>Company Name</Label><Input value={settings.companyName} onChange={e => setSettings(s => ({ ...s, companyName: e.target.value }))} /></div>
            <div className="space-y-1"><Label>VAT Number</Label><Input value={settings.vatNumber} onChange={e => setSettings(s => ({ ...s, vatNumber: e.target.value }))} placeholder="15-digit VAT number" /></div>
            <div className="space-y-1"><Label>CR Number</Label><Input value={settings.crNumber} onChange={e => setSettings(s => ({ ...s, crNumber: e.target.value }))} /></div>
            <div className="space-y-1 col-span-2"><Label>Address</Label><Input value={settings.address} onChange={e => setSettings(s => ({ ...s, address: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={settings.phone} onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={settings.email} onChange={e => setSettings(s => ({ ...s, email: e.target.value }))} /></div>
            <div className="space-y-1 col-span-2"><Label>Website</Label><Input value={settings.website} onChange={e => setSettings(s => ({ ...s, website: e.target.value }))} /></div>
          </CardContent>
        </Card>

        {/* Numbering */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Document Numbering Prefixes</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-1"><Label>Invoice Prefix</Label><Input value={settings.invoicePrefix} onChange={e => setSettings(s => ({ ...s, invoicePrefix: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Service Receipt</Label><Input value={settings.receiptPrefix} onChange={e => setSettings(s => ({ ...s, receiptPrefix: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Delivery Note</Label><Input value={settings.deliveryPrefix} onChange={e => setSettings(s => ({ ...s, deliveryPrefix: e.target.value }))} /></div>
          </CardContent>
        </Card>

        {/* ZATCA */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><QrCode className="h-4 w-4" /> ZATCA QR Configuration</CardTitle>
            <CardDescription>
              When company name and VAT number are set above, the platform can generate ZATCA-compliant TLV QR codes directly on invoices.
              You can also paste a QR from your main accounting software per invoice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <Label>Default Invoice Terms</Label>
              <Input value={settings.invoiceTerms} onChange={e => setSettings(s => ({ ...s, invoiceTerms: e.target.value }))} placeholder="e.g. Payment due within 30 days" />
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p className="font-medium">ZATCA QR Mode: {settings.companyName && settings.vatNumber ? "✓ Direct Generation Ready" : "⚠ Fill company name & VAT number to enable direct QR generation"}</p>
              <p className="mt-1 text-xs text-blue-500">Note: This generates a reference invoice only, not a legal ZATCA e-invoice. Always cross-reference with your official accounting system.</p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          <Save className="h-4 w-4 mr-2" /> {saved ? "Saved ✓" : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
