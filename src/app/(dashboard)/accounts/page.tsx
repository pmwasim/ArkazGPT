"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen } from "lucide-react";

interface Account { id: string; name: string; code: string; type: string; isActive: boolean; }

const typeColor: Record<string, "info" | "success" | "warning" | "destructive" | "secondary"> = {
  ASSET: "info", LIABILITY: "destructive", EQUITY: "warning", REVENUE: "success", EXPENSE: "secondary"
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", type: "ASSET", description: "" });

  async function load() {
    const a = await fetch("/api/accounts").then(r => r.json());
    setAccounts(a);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOpen(false);
    load();
  }

  const grouped = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map(type => ({
    type,
    accounts: accounts.filter(a => a.type === type),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chart of Accounts</h2>
          <p className="text-sm text-gray-500">Manage accounts and journal entries</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add Account</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Account</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1"><Label>Account Name *</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Code *</Label><Input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["ASSET","LIABILITY","EQUITY","REVENUE","EXPENSE"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {grouped.map(group => (
          <Card key={group.type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {group.type}
                <Badge variant={typeColor[group.type]} className="ml-auto">{group.accounts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {group.accounts.length === 0 && <p className="text-sm text-gray-400">No accounts.</p>}
              <div className="space-y-1">
                {group.accounts.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{a.code}</p>
                    </div>
                    <Badge variant={a.isActive ? "success" : "secondary"} className="text-xs">{a.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
