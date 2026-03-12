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
import { SignaturePadComponent } from "@/components/shared/signature-pad";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Plus, Search, ClipboardList, Pen } from "lucide-react";

interface ServiceReceipt {
  id: string;
  receiptNumber: string;
  customer: { id: string; name: string };
  technician: { id: string; name: string };
  project?: { id: string; name: string };
  complaint: string;
  errorDescription?: string;
  workDone?: string;
  status: string;
  visitDate: string;
  customerSignature?: string;
  items: { id: string; type: string; description: string; quantity: number }[];
}

const statusColor: Record<string, "secondary" | "info" | "success" | "destructive"> = {
  DRAFT: "secondary",
  COMPLETED: "info",
  SIGNED: "success",
  CANCELLED: "destructive",
};

export default function ServiceReceiptsPage() {
  const [receipts, setReceipts] = useState<ServiceReceipt[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [sigOpen, setSigOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [custSig, setCustSig] = useState<string>("");
  const [techSig, setTechSig] = useState<string>("");

  const [form, setForm] = useState({
    customerId: "", projectId: "", technicianId: "",
    complaint: "", errorDescription: "", workDone: "", recommendations: "",
    visitDate: new Date().toISOString().slice(0, 10),
    items: [{ type: "REPLACED", description: "", partNumber: "", quantity: 1 }],
  });

  async function load() {
    const [r, c, u, p] = await Promise.all([
      fetch("/api/service-receipts").then(r => r.json()),
      fetch("/api/customers").then(r => r.json()),
      fetch("/api/users").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
    ]);
    setReceipts(r); setCustomers(c); setTechnicians(u); setProjects(p);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/service-receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOpen(false);
    load();
  }

  async function handleSign() {
    if (!selectedId) return;
    await fetch(`/api/service-receipts/${selectedId}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerSignature: custSig, technicianSignature: techSig }),
    });
    setSigOpen(false);
    load();
  }

  const filtered = receipts.filter(r =>
    r.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
    r.customer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Receipts</h2>
          <p className="text-sm text-gray-500">Issue service receipts and collect customer signatures</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New Receipt</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Service Receipt</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Customer *</Label>
                  <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Technician *</Label>
                  <Select value={form.technicianId} onValueChange={v => setForm(f => ({ ...f, technicianId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select technician" /></SelectTrigger>
                    <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Project</Label>
                  <Select value={form.projectId} onValueChange={v => setForm(f => ({ ...f, projectId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
                    <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Visit Date</Label>
                  <Input type="date" value={form.visitDate} onChange={e => setForm(f => ({ ...f, visitDate: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Complaint / Problem *</Label>
                <Textarea required value={form.complaint} onChange={e => setForm(f => ({ ...f, complaint: e.target.value }))} placeholder="Describe the customer complaint..." />
              </div>
              <div className="space-y-1">
                <Label>Error Description</Label>
                <Textarea value={form.errorDescription} onChange={e => setForm(f => ({ ...f, errorDescription: e.target.value }))} placeholder="Technical error details..." />
              </div>
              <div className="space-y-1">
                <Label>Work Done</Label>
                <Textarea value={form.workDone} onChange={e => setForm(f => ({ ...f, workDone: e.target.value }))} placeholder="Work performed..." />
              </div>

              {/* Items */}
              <div className="space-y-2">
                <Label>Replaced / Installed Items</Label>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 items-start border border-gray-100 p-2 rounded-lg">
                    <Select value={item.type} onValueChange={v => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, type: v } : it) }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["REPLACED","INSTALLED","REPAIRED","INSPECTED"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input className="col-span-2 h-8 text-sm" placeholder="Description" value={item.description} onChange={e => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, description: e.target.value } : it) }))} />
                    <Input className="h-8 text-sm" type="number" placeholder="Qty" min={1} value={item.quantity} onChange={e => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, quantity: parseInt(e.target.value) } : it) }))} />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, items: [...f.items, { type: "REPLACED", description: "", partNumber: "", quantity: 1 }] }))}>
                  + Add Item
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create Receipt</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search receipts..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaint</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No service receipts found.</td></tr>
                )}
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-blue-600">{r.receiptNumber}</td>
                    <td className="px-4 py-3">{r.customer.name}</td>
                    <td className="px-4 py-3">{r.technician.name}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-gray-600">{r.complaint}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(r.visitDate)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusColor[r.status] ?? "secondary"}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {r.status !== "SIGNED" && (
                        <Button size="sm" variant="outline" onClick={() => { setSelectedId(r.id); setSigOpen(true); }}>
                          <Pen className="h-3 w-3 mr-1" /> Sign
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Signature Dialog */}
      <Dialog open={sigOpen} onOpenChange={setSigOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Collect Signatures</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <SignaturePadComponent label="Customer Signature" onSave={setCustSig} />
            <SignaturePadComponent label="Technician Signature" onSave={setTechSig} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSigOpen(false)}>Cancel</Button>
              <Button onClick={handleSign} disabled={!custSig}>Save Signatures</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
