"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Plus, Search, BarChart2 } from "lucide-react";

const CATEGORIES = ["FUEL","ACCOMMODATION","FOOD","TOOLS","MATERIALS","TRANSPORT","COMMUNICATION","MAINTENANCE","OTHER"];

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  status: string;
  submittedBy: { name: string };
  project?: { name: string };
  expenseDate: string;
}

const statusColor: Record<string, "secondary" | "info" | "success" | "destructive"> = {
  PENDING: "secondary", APPROVED: "success", REJECTED: "destructive", REIMBURSED: "info"
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", amount: "", vatAmount: "0",
    totalAmount: "", category: "OTHER", projectId: "",
    expenseDate: new Date().toISOString().slice(0, 10),
  });

  async function load() {
    const [e, p] = await Promise.all([
      fetch("/api/expenses").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
    ]);
    setExpenses(e); setProjects(p);
  }

  useEffect(() => { load(); }, []);

  function recalcTotal() {
    const amt = parseFloat(form.amount) || 0;
    const vat = parseFloat(form.vatAmount) || 0;
    setForm(f => ({ ...f, totalAmount: (amt + vat).toFixed(2) }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        vatAmount: parseFloat(form.vatAmount),
        totalAmount: parseFloat(form.totalAmount),
        projectId: form.projectId || undefined,
      }),
    });
    setOpen(false);
    load();
  }

  async function approve(id: string) {
    await fetch(`/api/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    load();
  }

  const filtered = expenses.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchProject = filterProject === "all" || e.project?.name === projects.find(p => p.id === filterProject)?.name;
    return matchSearch && matchProject;
  });

  const totalByProject = projects.map(p => ({
    name: p.name,
    total: expenses.filter(e => e.project?.name === p.name && e.status === "APPROVED")
      .reduce((sum, e) => sum + Number(e.totalAmount), 0),
  })).filter(p => p.total > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
          <p className="text-sm text-gray-500">Track and approve team expenses by project/site</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New Expense</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Submit Expense</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Title *</Label>
                <Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
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
                  <Label>Amount (SAR)</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} onBlur={recalcTotal} />
                </div>
                <div className="space-y-1">
                  <Label>VAT Amount</Label>
                  <Input type="number" step="0.01" value={form.vatAmount} onChange={e => setForm(f => ({ ...f, vatAmount: e.target.value }))} onBlur={recalcTotal} />
                </div>
                <div className="space-y-1">
                  <Label>Total Amount</Label>
                  <Input type="number" step="0.01" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Submit</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project Summary */}
      {totalByProject.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Expense by Project (Approved)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {totalByProject.map(p => (
                <div key={p.name} className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 truncate">{p.name}</p>
                  <p className="text-lg font-bold text-blue-700">{formatCurrency(p.total)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input className="pl-9 w-64" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No expenses found.</td></tr>}
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{e.title}</td>
                  <td className="px-4 py-3 text-gray-500">{e.category}</td>
                  <td className="px-4 py-3 text-gray-500">{e.project?.name ?? "-"}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(e.totalAmount)}</td>
                  <td className="px-4 py-3">{e.submittedBy.name}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(e.expenseDate)}</td>
                  <td className="px-4 py-3"><Badge variant={statusColor[e.status]}>{e.status}</Badge></td>
                  <td className="px-4 py-3">
                    {e.status === "PENDING" && (
                      <Button size="sm" variant="success" onClick={() => approve(e.id)}>Approve</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
