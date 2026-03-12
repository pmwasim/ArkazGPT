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
import { formatDate } from "@/lib/utils";
import { Plus, Search } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
  assignedTo?: { id: string; name: string };
  createdBy: { id: string; name: string };
  project?: { id: string; name: string };
}

const priorityColor: Record<string, "secondary" | "info" | "warning" | "destructive"> = {
  LOW: "secondary", MEDIUM: "info", HIGH: "warning", URGENT: "destructive"
};

const statusColor: Record<string, "secondary" | "info" | "warning" | "success" | "destructive"> = {
  PENDING: "secondary", IN_PROGRESS: "info", ON_HOLD: "warning", COMPLETED: "success", CANCELLED: "destructive"
};

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", assignedToId: "", projectId: "",
    priority: "MEDIUM", dueDate: "", notes: ""
  });

  async function load() {
    const [t, u, p] = await Promise.all([
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/users").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
    ]);
    setTasks(t); setUsers(u); setProjects(p);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dueDate: form.dueDate || undefined }),
    });
    setOpen(false);
    setForm({ title: "", description: "", assignedToId: "", projectId: "", priority: "MEDIUM", dueDate: "", notes: "" });
    load();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-sm text-gray-500">Assign and track team tasks</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New Task</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Title *</Label>
                <Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title..." />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Assign To</Label>
                  <Select value={form.assignedToId} onValueChange={v => setForm(f => ({ ...f, assignedToId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                    <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["LOW","MEDIUM","HIGH","URGENT"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
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
                  <Label>Due Date</Label>
                  <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create Task</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input className="pl-9 w-64" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban-style cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">No tasks found.</div>
        )}
        {filtered.map(task => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-gray-900 flex-1">{task.title}</p>
                <Badge variant={priorityColor[task.priority]}>{task.priority}</Badge>
              </div>
              {task.description && <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{task.assignedTo?.name ?? "Unassigned"}</span>
                {task.dueDate && <span>Due {formatDate(task.dueDate)}</span>}
              </div>
              {task.project && <p className="text-xs text-blue-600">{task.project.name}</p>}
              <div className="flex items-center justify-between pt-1">
                <Badge variant={statusColor[task.status]}>{task.status.replace("_"," ")}</Badge>
                <Select value={task.status} onValueChange={v => updateStatus(task.id, v)}>
                  <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
