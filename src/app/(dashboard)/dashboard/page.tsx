import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  ClipboardList, Truck, CheckSquare, MapPin,
  Package, Wrench, Receipt, Users
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const [
    serviceCount, deliveryCount, taskCount, visitCount,
    stockCount, toolCount, expenseTotal, customerCount,
    recentTasks, recentServices
  ] = await Promise.all([
    prisma.serviceReceipt.count(),
    prisma.deliveryNote.count(),
    prisma.task.count({ where: { status: { not: "COMPLETED" } } }),
    prisma.fieldVisit.count({ where: { status: "SCHEDULED" } }),
    prisma.stockItem.count({ where: { isActive: true } }),
    prisma.tool.count({ where: { isActive: true } }),
    prisma.expense.aggregate({ _sum: { totalAmount: true }, where: { status: "APPROVED" } }),
    prisma.customer.count(),
    prisma.task.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { assignedTo: { select: { name: true } }, project: { select: { name: true } } },
    }),
    prisma.serviceReceipt.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } }, technician: { select: { name: true } } },
    }),
  ]);

  const expenseSum = Number(expenseTotal._sum.totalAmount ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {session?.user?.name?.split(" ")[0]} 👋</h2>
        <p className="text-gray-500 text-sm mt-1">Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Service Receipts" value={serviceCount} icon={ClipboardList} color="blue" />
        <StatCard title="Delivery Notes" value={deliveryCount} icon={Truck} color="green" />
        <StatCard title="Open Tasks" value={taskCount} icon={CheckSquare} color="yellow" />
        <StatCard title="Scheduled Visits" value={visitCount} icon={MapPin} color="purple" />
        <StatCard title="Stock Items" value={stockCount} icon={Package} color="blue" />
        <StatCard title="Tools" value={toolCount} icon={Wrench} color="green" />
        <StatCard title="Customers" value={customerCount} icon={Users} color="purple" />
        <StatCard title="Approved Expenses" value={`SAR ${expenseSum.toFixed(2)}`} icon={Receipt} color="red" description="Total approved" />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.length === 0 && <p className="text-sm text-gray-400">No tasks yet.</p>}
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.assignedTo?.name ?? "Unassigned"} · {formatDate(task.createdAt)}</p>
                  </div>
                  <Badge variant={
                    task.status === "COMPLETED" ? "success" :
                    task.status === "IN_PROGRESS" ? "info" :
                    task.priority === "URGENT" ? "destructive" : "secondary"
                  }>
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Service Receipts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Service Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentServices.length === 0 && <p className="text-sm text-gray-400">No service receipts yet.</p>}
              {recentServices.map((sr) => (
                <div key={sr.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sr.receiptNumber}</p>
                    <p className="text-xs text-gray-500">{sr.customer.name} · {formatDate(sr.visitDate)}</p>
                  </div>
                  <Badge variant={
                    sr.status === "SIGNED" ? "success" :
                    sr.status === "COMPLETED" ? "info" : "secondary"
                  }>
                    {sr.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
