"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SignaturePadComponent } from "@/components/shared/signature-pad";
import { formatDate } from "@/lib/utils";
import { Plus, Search, Pen } from "lucide-react";

interface DeliveryNote {
  id: string;
  noteNumber: string;
  customer: { id: string; name: string };
  driver: { id: string; name: string };
  project?: { id: string; name: string };
  deliveryAddress?: string;
  status: string;
  deliveryDate: string;
  customerSignature?: string;
  items: { description: string; quantity: number; unit?: string }[];
}

const statusColor: Record<string, "secondary" | "info" | "success" | "destructive" | "warning"> = {
  PENDING: "secondary", IN_TRANSIT: "info", DELIVERED: "warning", SIGNED: "success", RETURNED: "destructive"
};

export default function DeliveryNotesPage() {
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [sigOpen, setSigOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [custSig, setCustSig] = useState("");

  const [form, setForm] = useState({
    customerId: "", driverId: "", projectId: "", deliveryAddress: "", notes: "",
    deliveryDate: new Date().toISOString().slice(0, 10),
    items: [{ description: "", quantity: "1", unit: "PCS" }],
  });

  async function load() {
    const [n, c, u, p] = await Promise.all([
      fetch("/api/delivery-notes").then(r => r.json()),
      fetch("/api/customers").then(r => r.json()),
      fetch("/api/users").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
    ]);
    setNotes(n); setCustomers(c); setDrivers(u); setProjects(p);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/delivery-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        items: form.items.map(i => ({ ...i, quantity: parseInt(i.quantity) })),
        projectId: form.projectId || undefined,
      }),
    });
    setOpen(false);
    load();
  }

  async function handleSign() {
    if (!selectedId) return;
    await fetch(`/api/delivery-notes/${selectedId}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerSignature: custSig }),
    });
    setSigOpen(false);
    load();
  }

  const filtered = notes.filter(n =>
    n.noteNumber.toLowerCase().includes(search.toLowerCase()) ||
    n.customer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Delivery Notes</h2>
          <p className="text-sm text-gray-500">Issue delivery notes and collect signatures on mobile</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New Delivery Note</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Delivery Note</DialogTitle></DialogHeader>
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
                  <Label>Driver / Staff *</Label>
                  <Select value={form.driverId} onValueChange={v => setForm(f => ({ ...f, driverId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                    <SelectContent>{drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Project</Label>
                  <Select value={form.projectId} onValueChange={v => setForm(f => ({ ...f, projectId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Delivery Date</Label>
                  <Input type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Delivery Address</Label>
                  <Input value={form.deliveryAddress} onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))} />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <Label>Items to Deliver</Label>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-10 gap-2 items-center">
                    <Input className="col-span-5 h-8 text-sm" placeholder="Description" value={item.description} onChange={e => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, description: e.target.value } : it) }))} />
                    <Input className="col-span-2 h-8 text-sm" type="number" placeholder="Qty" value={item.quantity} onChange={e => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, quantity: e.target.value } : it) }))} />
                    <Input className="col-span-2 h-8 text-sm" placeholder="Unit" value={item.unit} onChange={e => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, unit: e.target.value } : it) }))} />
                    <button type="button" className="text-xs text-red-400 hover:text-red-600" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))}>✕</button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, items: [...f.items, { description: "", quantity: "1", unit: "PCS" }] }))}>
                  + Add Item
                </Button>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create Delivery Note</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No delivery notes found.</td></tr>}
              {filtered.map(n => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-blue-600">{n.noteNumber}</td>
                  <td className="px-4 py-3">{n.customer.name}</td>
                  <td className="px-4 py-3">{n.driver.name}</td>
                  <td className="px-4 py-3 text-gray-500">{n.items.length} item(s)</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(n.deliveryDate)}</td>
                  <td className="px-4 py-3"><Badge variant={statusColor[n.status]}>{n.status}</Badge></td>
                  <td className="px-4 py-3">
                    {n.status !== "SIGNED" && (
                      <Button size="sm" variant="outline" onClick={() => { setSelectedId(n.id); setCustSig(""); setSigOpen(true); }}>
                        <Pen className="h-3 w-3 mr-1" /> Sign
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Signature Dialog */}
      <Dialog open={sigOpen} onOpenChange={setSigOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Customer Signature</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <SignaturePadComponent label="Customer Signature" onSave={setCustSig} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSigOpen(false)}>Cancel</Button>
              <Button onClick={handleSign} disabled={!custSig}>Confirm Delivery</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
