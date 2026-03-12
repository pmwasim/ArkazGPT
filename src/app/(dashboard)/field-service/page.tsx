"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils";
import { Plus, MapPin } from "lucide-react";

interface FieldVisit {
  id: string;
  visitNumber: string;
  technician: { name: string };
  project?: { name: string };
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  status: string;
  location?: string;
  notes?: string;
}

const statusColor: Record<string, "secondary" | "info" | "warning" | "success" | "destructive"> = {
  SCHEDULED: "secondary", EN_ROUTE: "info", ON_SITE: "warning", COMPLETED: "success", CANCELLED: "destructive"
};

const STATUS_FLOW = ["SCHEDULED", "EN_ROUTE", "ON_SITE", "COMPLETED"];

export default function FieldServicePage() {
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    technicianId: "", projectId: "", scheduledAt: "", location: "", notes: ""
  });

  async function load() {
    const [v, u, p] = await Promise.all([
      fetch("/api/field-visits").then(r => r.json()),
      fetch("/api/users").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
    ]);
    setVisits(v); setUsers(u); setProjects(p);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/field-visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, projectId: form.projectId || undefined }),
    });
    setOpen(false);
    load();
  }

  async function advanceStatus(visit: FieldVisit) {
    const next = STATUS_FLOW[STATUS_FLOW.indexOf(visit.status) + 1];
    if (!next) return;
    await fetch(`/api/field-visits/${visit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: next,
        startedAt: next === "ON_SITE" ? new Date().toISOString() : undefined,
        completedAt: next === "COMPLETED" ? new Date().toISOString() : undefined,
      }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Field Service</h2>
          <p className="text-sm text-gray-500">Schedule and track technician field visits</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Schedule Visit</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Schedule Field Visit</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Technician *</Label>
                  <Select value={form.technicianId} onValueChange={v => setForm(f => ({ ...f, technicianId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select technician" /></SelectTrigger>
                    <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Project</Label>
                  <Select value={form.projectId} onValueChange={v => setForm(f => ({ ...f, projectId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Scheduled At *</Label>
                  <Input required type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Location / Site</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Address or site name" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Notes</Label>
                  <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Schedule</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visits.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No field visits scheduled.</div>}
        {visits.map(visit => (
          <Card key={visit.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-sm font-medium text-blue-600">{visit.visitNumber}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{visit.technician.name}</p>
                </div>
                <Badge variant={statusColor[visit.status]}>{visit.status.replace("_", " ")}</Badge>
              </div>
              {visit.project && <p className="text-sm text-gray-600">{visit.project.name}</p>}
              {visit.location && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {visit.location}
                </p>
              )}
              <p className="text-xs text-gray-400">Scheduled: {formatDateTime(visit.scheduledAt)}</p>
              {visit.notes && <p className="text-xs text-gray-500 italic">{visit.notes}</p>}
              {visit.status !== "COMPLETED" && visit.status !== "CANCELLED" && (
                <Button size="sm" variant="outline" className="w-full" onClick={() => advanceStatus(visit)}>
                  → {STATUS_FLOW[STATUS_FLOW.indexOf(visit.status) + 1]?.replace("_"," ")}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
