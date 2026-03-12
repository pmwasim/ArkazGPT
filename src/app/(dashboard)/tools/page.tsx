"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, UserCheck, UserX } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Tool {
  id: string;
  name: string;
  code: string;
  category?: string;
  serialNumber?: string;
  condition: string;
  status: string;
  location?: string;
  assignments: { user: { id: string; name: string }; assignedAt: string }[];
}

const conditionColor: Record<string, "success" | "info" | "warning" | "destructive" | "secondary"> = {
  EXCELLENT: "success", GOOD: "success", FAIR: "warning", POOR: "destructive", DAMAGED: "destructive"
};

const statusColor: Record<string, "success" | "info" | "warning" | "secondary"> = {
  AVAILABLE: "success", ASSIGNED: "info", MAINTENANCE: "warning", RETIRED: "secondary"
};

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  const [form, setForm] = useState({ name: "", code: "", category: "", serialNumber: "", location: "", notes: "" });
  const [assign, setAssign] = useState({ userId: "", purpose: "" });

  async function load() {
    const [t, u] = await Promise.all([
      fetch("/api/tools").then(r => r.json()),
      fetch("/api/users").then(r => r.json()),
    ]);
    setTools(t); setUsers(u);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOpen(false);
    load();
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/tools/${selectedId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assign),
    });
    setAssignOpen(false);
    load();
  }

  async function handleReturn(id: string) {
    await fetch(`/api/tools/${id}/assign`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ condition: "GOOD" }),
    });
    load();
  }

  const filtered = tools.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tools</h2>
          <p className="text-sm text-gray-500">Track tools and equipment assignments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add Tool</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Tool</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2"><Label>Name *</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Code *</Label><Input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Serial Number</Label><Input value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Add Tool</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search tools..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No tools found.</div>}
        {filtered.map(tool => (
          <Card key={tool.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{tool.name}</p>
                  <p className="text-xs font-mono text-gray-400">{tool.code}</p>
                </div>
                <Badge variant={statusColor[tool.status]}>{tool.status}</Badge>
              </div>
              {tool.category && <p className="text-sm text-gray-500">{tool.category}</p>}
              {tool.serialNumber && <p className="text-xs text-gray-400">S/N: {tool.serialNumber}</p>}
              <div className="flex items-center justify-between">
                <Badge variant={conditionColor[tool.condition]} className="text-xs">{tool.condition}</Badge>
                {tool.location && <span className="text-xs text-gray-400">{tool.location}</span>}
              </div>
              {tool.assignments[0] && (
                <p className="text-xs text-blue-600">Assigned to: {tool.assignments[0].user.name} ({formatDate(tool.assignments[0].assignedAt)})</p>
              )}
              <div className="flex gap-2 pt-1">
                {tool.status === "AVAILABLE" && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedId(tool.id); setAssign({ userId: "", purpose: "" }); setAssignOpen(true); }}>
                    <UserCheck className="h-3 w-3 mr-1" /> Assign
                  </Button>
                )}
                {tool.status === "ASSIGNED" && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleReturn(tool.id)}>
                    <UserX className="h-3 w-3 mr-1" /> Return
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign Tool</DialogTitle></DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Staff Member *</Label>
              <Select value={assign.userId} onValueChange={v => setAssign(a => ({ ...a, userId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Purpose</Label><Input value={assign.purpose} onChange={e => setAssign(a => ({ ...a, purpose: e.target.value }))} /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button type="submit">Assign</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
