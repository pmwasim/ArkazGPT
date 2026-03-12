"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, ArrowUp, ArrowDown } from "lucide-react";

interface StockItem {
  id: string;
  name: string;
  code: string;
  category?: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  costPrice?: number;
  location?: string;
}

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  const [form, setForm] = useState({ name: "", code: "", category: "", unit: "PCS", quantity: "0", minQuantity: "0", costPrice: "", location: "" });
  const [move, setMove] = useState({ type: "IN", quantity: "1", notes: "" });

  async function load() {
    const items = await fetch("/api/stock").then(r => r.json());
    setItems(items);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantity: parseFloat(form.quantity), minQuantity: parseFloat(form.minQuantity), costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined }),
    });
    setOpen(false);
    load();
  }

  async function handleMove(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/stock/movement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockItemId: selectedId, type: move.type, quantity: parseFloat(move.quantity), notes: move.notes }),
    });
    setMoveOpen(false);
    load();
  }

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stock</h2>
          <p className="text-sm text-gray-500">Manage inventory and stock movements</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add Item</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Stock Item</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2"><Label>Name *</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Code *</Label><Input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Unit</Label><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Initial Qty</Label><Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Min Qty</Label><Input type="number" value={form.minQuantity} onChange={e => setForm(f => ({ ...f, minQuantity: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Cost Price</Label><Input type="number" step="0.01" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} /></div>
                <div className="space-y-1 col-span-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Add Item</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search stock..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No stock items found.</td></tr>}
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.category ?? "-"}</td>
                  <td className="px-4 py-3 font-bold">{Number(item.quantity)}</td>
                  <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                  <td className="px-4 py-3">
                    <Badge variant={Number(item.quantity) <= Number(item.minQuantity) ? "destructive" : "success"}>
                      {Number(item.quantity) <= Number(item.minQuantity) ? "Low Stock" : "In Stock"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedId(item.id); setMove({ type: "IN", quantity: "1", notes: "" }); setMoveOpen(true); }}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedId(item.id); setMove({ type: "OUT", quantity: "1", notes: "" }); setMoveOpen(true); }}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Movement Dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Stock Movement</DialogTitle></DialogHeader>
          <form onSubmit={handleMove} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={move.type} onValueChange={v => setMove(m => ({ ...m, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["IN","OUT","ADJUSTMENT"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Quantity</Label><Input type="number" step="0.001" value={move.quantity} onChange={e => setMove(m => ({ ...m, quantity: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Notes</Label><Input value={move.notes} onChange={e => setMove(m => ({ ...m, notes: e.target.value }))} /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMoveOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
