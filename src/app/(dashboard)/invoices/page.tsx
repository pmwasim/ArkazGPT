"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Plus, Search, QrCode, Printer } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: { name: string; vatNumber?: string };
  issueDate: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  status: string;
  zatcaQrCode?: string;
  externalInvoiceRef?: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
}

const statusColor: Record<string, "secondary" | "info" | "success" | "destructive" | "warning"> = {
  DRAFT: "secondary", SENT: "info", PAID: "success", OVERDUE: "destructive", CANCELLED: "secondary"
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    customerId: "", vatRate: "15", notes: "", terms: "",
    externalInvoiceRef: "", zatcaQrCode: "", generateZatcaQr: false,
    items: [{ description: "", quantity: "1", unitPrice: "", vatRate: "15" }],
  });

  async function load() {
    const [inv, cust, sett] = await Promise.all([
      fetch("/api/invoices").then(r => r.json()),
      fetch("/api/customers").then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]);
    setInvoices(inv); setCustomers(cust); setSettings(sett);
  }

  useEffect(() => { load(); }, []);

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0);
  const vatAmt = subtotal * (parseFloat(form.vatRate) / 100);
  const total = subtotal + vatAmt;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        vatRate: parseFloat(form.vatRate),
        externalInvoiceRef: form.externalInvoiceRef || undefined,
        zatcaQrCode: form.zatcaQrCode || undefined,
        items: form.items.map(i => ({
          description: i.description,
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
          vatRate: parseFloat(i.vatRate),
        })),
      }),
    });
    setOpen(false);
    load();
  }

  const filtered = invoices.filter(i =>
    i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    i.customer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tax Invoices</h2>
          <p className="text-sm text-gray-500">Reference invoices with ZATCA QR code support</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New Invoice</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Reference Invoice</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <Label>Customer *</Label>
                  <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>VAT Rate (%)</Label>
                  <Input type="number" value={form.vatRate} onChange={e => setForm(f => ({ ...f, vatRate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>External Invoice Ref</Label>
                  <Input placeholder="Actual invoice number" value={form.externalInvoiceRef} onChange={e => setForm(f => ({ ...f, externalInvoiceRef: e.target.value }))} />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <Label>Line Items</Label>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <Input className="col-span-5 h-8 text-sm" placeholder="Description" value={item.description} onChange={e => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, description: e.target.value } : it) }))} />
                    <Input className="col-span-2 h-8 text-sm" type="number" placeholder="Qty" value={item.quantity} onChange={e => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, quantity: e.target.value } : it) }))} />
                    <Input className="col-span-3 h-8 text-sm" type="number" placeholder="Unit Price" value={item.unitPrice} onChange={e => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, unitPrice: e.target.value } : it) }))} />
                    <button type="button" className="col-span-2 text-xs text-red-500 hover:text-red-700" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))}>Remove</button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, items: [...f.items, { description: "", quantity: "1", unitPrice: "", vatRate: form.vatRate }] }))}>
                  + Add Line
                </Button>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between"><span>VAT ({form.vatRate}%)</span><span>{formatCurrency(vatAmt)}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>

              {/* ZATCA QR */}
              <div className="border border-dashed border-blue-300 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-blue-700 flex items-center gap-2"><QrCode className="h-4 w-4" /> ZATCA QR Code</p>
                <div className="space-y-1">
                  <Label className="text-xs">Paste ZATCA QR (base64) from external invoice</Label>
                  <Textarea className="text-xs font-mono" rows={2} placeholder="Paste base64 QR data here..." value={form.zatcaQrCode} onChange={e => setForm(f => ({ ...f, zatcaQrCode: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="gen-qr" checked={form.generateZatcaQr} onChange={e => setForm(f => ({ ...f, generateZatcaQr: e.target.checked }))} className="rounded" />
                  <label htmlFor="gen-qr" className="text-sm text-gray-600">
                    Generate ZATCA QR directly {!settings.companyName && <span className="text-orange-500">(configure company info in Settings first)</span>}
                  </label>
                </div>
              </div>

              <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create Invoice</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">VAT</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No invoices found.</td></tr>}
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-blue-600">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">{inv.customer.name}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(inv.issueDate)}</td>
                  <td className="px-4 py-3">{formatCurrency(inv.subtotal)}</td>
                  <td className="px-4 py-3">{formatCurrency(inv.vatAmount)}</td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(inv.total)}</td>
                  <td className="px-4 py-3"><Badge variant={statusColor[inv.status]}>{inv.status}</Badge></td>
                  <td className="px-4 py-3">
                    {inv.zatcaQrCode ? (
                      <Button size="sm" variant="outline" onClick={() => { setSelectedInvoice(inv); setQrOpen(true); }}>
                        <QrCode className="h-3 w-3" />
                      </Button>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* QR Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>ZATCA QR Code — {selectedInvoice?.invoiceNumber}</DialogTitle></DialogHeader>
          {selectedInvoice?.zatcaQrCode && (
            <div className="flex flex-col items-center space-y-4 py-4">
              {/* Render QR as image from base64 TLV data using a QR rendering URL */}
              <div className="bg-white p-4 border rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedInvoice.zatcaQrCode)}`}
                  alt="ZATCA QR Code"
                  width={200}
                  height={200}
                />
              </div>
              <p className="text-xs text-gray-400 text-center break-all font-mono max-w-full overflow-hidden">{selectedInvoice.externalInvoiceRef && `Ref: ${selectedInvoice.externalInvoiceRef}`}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
