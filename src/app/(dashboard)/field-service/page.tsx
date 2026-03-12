"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SignaturePadComponent } from "@/components/shared/signature-pad";
import { VisitReport, type VisitReportData } from "@/components/shared/visit-report";
import { formatDateTime } from "@/lib/utils";
import { Plus, MapPin, Pen, FileText, X, Search, Users } from "lucide-react";

interface FieldVisit {
  id: string;
  visitNumber: string;
  technician: { id: string; name: string };
  project?: { id: string; name: string } | null;
  scheduledAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  status: string;
  location?: string | null;
  notes?: string | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
  customerSignature?: string | null;
  technicianSignature?: string | null;
  signedAt?: string | null;
}

const statusColor: Record<string, "secondary" | "info" | "warning" | "success" | "destructive"> = {
  SCHEDULED: "secondary",
  EN_ROUTE: "info",
  ON_SITE: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const STATUS_FLOW = ["SCHEDULED", "EN_ROUTE", "ON_SITE"];

export default function FieldServicePage() {
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [sigOpen, setSigOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<FieldVisit | null>(null);
  const [custSig, setCustSig] = useState("");
  const [techSig, setTechSig] = useState("");

  const reportRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    technicianId: "", projectId: "", scheduledAt: "", location: "", notes: ""
  });

  async function load() {
    const [v, u, p, s] = await Promise.all([
      fetch("/api/field-visits").then(r => r.json()),
      fetch("/api/users").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]);
    setVisits(v); setUsers(u); setProjects(p); setSettings(s);
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
    setForm({ technicianId: "", projectId: "", scheduledAt: "", location: "", notes: "" });
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
      }),
    });
    load();
  }

  async function handleCancel() {
    if (!selectedVisit) return;
    await fetch(`/api/field-visits/${selectedVisit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    setCancelOpen(false);
    setSelectedVisit(null);
    load();
  }

  async function handleSign() {
    if (!selectedVisit) return;
    await fetch(`/api/field-visits/${selectedVisit.id}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerSignature: custSig, technicianSignature: techSig }),
    });
    setSigOpen(false);
    setCustSig("");
    setTechSig("");
    load();
  }

  async function captureGps(visit: FieldVisit) {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    setGpsLoading(visit.id);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await fetch(`/api/field-visits/${visit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gpsLat: pos.coords.latitude, gpsLng: pos.coords.longitude }),
        });
        setGpsLoading(null);
        load();
      },
      () => {
        alert("Unable to retrieve location. Please allow location access.");
        setGpsLoading(null);
      }
    );
  }

  async function exportPdf(data: VisitReportData) {
    setPdfLoading(data.visitNumber);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      if (!reportRef.current) return;

      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`visit-${data.visitNumber}.pdf`);
    } finally {
      setPdfLoading(null);
    }
  }

  const filtered = visits.filter(v => {
    const matchSearch =
      v.technician.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.location ?? "").toLowerCase().includes(search.toLowerCase()) ||
      v.visitNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Workload per technician
  const workload = users.map(u => {
    const techVisits = visits.filter(v => v.technician.id === u.id);
    return {
      name: u.name,
      scheduled: techVisits.filter(v => v.status === "SCHEDULED").length,
      inProgress: techVisits.filter(v => ["EN_ROUTE", "ON_SITE"].includes(v.status)).length,
      completed: techVisits.filter(v => v.status === "COMPLETED").length,
      cancelled: techVisits.filter(v => v.status === "CANCELLED").length,
      total: techVisits.length,
    };
  }).filter(w => w.total > 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Field Service</h2>
          <p className="text-sm text-gray-500">Schedule, track, and sign off field visits</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Schedule Visit</Button>
          </DialogTrigger>
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

      {/* Tabs */}
      <Tabs defaultValue="visits">
        <TabsList>
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="workload" className="flex items-center gap-1">
            <Users className="h-4 w-4" /> Workload
          </TabsTrigger>
        </TabsList>

        {/* ── VISITS TAB ─────────────────────────────────────────────── */}
        <TabsContent value="visits">
          <div className="flex gap-3 flex-wrap mb-4 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9 w-64"
                placeholder="Search technician, location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {["SCHEDULED","EN_ROUTE","ON_SITE","COMPLETED","CANCELLED"].map(s => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400">No field visits found.</div>
            )}
            {filtered.map(visit => (
              <Card key={visit.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  {/* Card Header */}
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
                      <MapPin className="h-3 w-3 shrink-0" /> {visit.location}
                    </p>
                  )}

                  {/* GPS coordinates */}
                  {visit.gpsLat && visit.gpsLng && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {visit.gpsLat.toFixed(5)}, {visit.gpsLng.toFixed(5)}
                    </p>
                  )}

                  <p className="text-xs text-gray-400">Scheduled: {formatDateTime(visit.scheduledAt)}</p>
                  {visit.notes && <p className="text-xs text-gray-500 italic line-clamp-2">{visit.notes}</p>}
                  {visit.signedAt && (
                    <p className="text-xs text-green-600">✓ Signed {formatDateTime(visit.signedAt)}</p>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Advance status */}
                    {STATUS_FLOW.includes(visit.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="col-span-2"
                        onClick={() => advanceStatus(visit)}
                      >
                        → {STATUS_FLOW[STATUS_FLOW.indexOf(visit.status) + 1]?.replace("_", " ")}
                      </Button>
                    )}

                    {/* GPS capture */}
                    {!["CANCELLED", "COMPLETED"].includes(visit.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        title="Capture GPS location"
                        disabled={gpsLoading === visit.id}
                        onClick={() => captureGps(visit)}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {gpsLoading === visit.id ? "…" : "GPS"}
                      </Button>
                    )}

                    {/* Sign off (only when ON_SITE and not yet signed) */}
                    {visit.status === "ON_SITE" && !visit.signedAt && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVisit(visit);
                          setCustSig("");
                          setTechSig("");
                          setSigOpen(true);
                        }}
                      >
                        <Pen className="h-3 w-3 mr-1" /> Sign
                      </Button>
                    )}

                    {/* PDF export (always available) */}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pdfLoading === visit.visitNumber}
                      onClick={() => {
                        setSelectedVisit(visit);
                        setTimeout(() => exportPdf({ ...visit, companyName: settings.companyName }), 80);
                      }}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      {pdfLoading === visit.visitNumber ? "…" : "PDF"}
                    </Button>

                    {/* Cancel */}
                    {!["COMPLETED", "CANCELLED"].includes(visit.status) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => { setSelectedVisit(visit); setCancelOpen(true); }}
                      >
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── WORKLOAD TAB ────────────────────────────────────────────── */}
        <TabsContent value="workload">
          <Card className="mt-2">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">In Progress</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Completed</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cancelled</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workload.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No visit data yet.</td></tr>
                  )}
                  {workload.map(w => (
                    <tr key={w.name} className={w.inProgress >= 3 ? "bg-yellow-50" : "hover:bg-gray-50"}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {w.name}
                        {w.inProgress >= 3 && (
                          <span className="ml-2 text-xs text-yellow-600 font-normal">⚠ High load</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center"><Badge variant="secondary">{w.scheduled}</Badge></td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={w.inProgress >= 3 ? "warning" : "info"}>{w.inProgress}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center"><Badge variant="success">{w.completed}</Badge></td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={w.cancelled > 0 ? "destructive" : "secondary"}>{w.cancelled}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{w.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── SIGNATURE DIALOG ─────────────────────────────────────────── */}
      <Dialog open={sigOpen} onOpenChange={setSigOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sign Off — {selectedVisit?.visitNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <SignaturePadComponent label="Customer Signature" onSave={setCustSig} />
            <SignaturePadComponent label="Technician Signature" onSave={setTechSig} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSigOpen(false)}>Cancel</Button>
              <Button onClick={handleSign} disabled={!custSig || !techSig}>Complete Visit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── CANCEL CONFIRM DIALOG ────────────────────────────────────── */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Cancel Visit?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500 mt-2">
            Are you sure you want to cancel <strong>{selectedVisit?.visitNumber}</strong>?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep Visit</Button>
            <Button variant="destructive" onClick={handleCancel}>Yes, Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── HIDDEN PDF REPORT (rendered off-screen for html2canvas) ──── */}
      <div
        style={{ position: "absolute", left: "-9999px", top: 0, pointerEvents: "none" }}
        aria-hidden="true"
      >
        {selectedVisit && (
          <VisitReport
            ref={reportRef}
            data={{ ...selectedVisit, companyName: settings.companyName }}
          />
        )}
      </div>
    </div>
  );
}
