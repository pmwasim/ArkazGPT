"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Building2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Project {
  id: string; name: string; code?: string; location?: string;
  status: string; startDate?: string; customer?: { name: string };
}

const statusColor: Record<string, "success" | "secondary" | "warning" | "destructive"> = {
  ACTIVE: "success", COMPLETED: "secondary", ON_HOLD: "warning", CANCELLED: "destructive"
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", customerId: "", location: "", description: "", startDate: "", endDate: "" });

  async function load() {
    const [p, c] = await Promise.all([
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/customers").then(r => r.json()),
    ]);
    setProjects(p); setCustomers(c);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, customerId: form.customerId || undefined }),
    });
    setOpen(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects / Sites</h2>
          <p className="text-sm text-gray-500">Manage projects and track site-wise activities</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New Project</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2"><Label>Project Name *</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Code</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
                <div className="space-y-1">
                  <Label>Customer</Label>
                  <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                <div className="space-y-1"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create Project</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No projects found.</div>}
        {projects.map(p => (
          <Card key={p.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
                  <p className="font-semibold text-gray-900">{p.name}</p>
                </div>
                <Badge variant={statusColor[p.status]}>{p.status}</Badge>
              </div>
              {p.code && <p className="text-xs font-mono text-gray-400">{p.code}</p>}
              {p.customer && <p className="text-sm text-gray-600">{p.customer.name}</p>}
              {p.location && <p className="text-sm text-gray-500">{p.location}</p>}
              {p.startDate && <p className="text-xs text-gray-400">Started: {formatDate(p.startDate)}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
