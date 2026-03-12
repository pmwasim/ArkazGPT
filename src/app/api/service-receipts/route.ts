import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  customerId: z.string(),
  projectId: z.string().optional(),
  technicianId: z.string(),
  complaint: z.string().min(1),
  errorDescription: z.string().optional(),
  workDone: z.string().optional(),
  recommendations: z.string().optional(),
  visitDate: z.string().optional(),
  items: z.array(z.object({
    type: z.enum(["REPLACED", "INSTALLED", "REPAIRED", "INSPECTED"]),
    description: z.string(),
    partNumber: z.string().optional(),
    quantity: z.number().default(1),
    notes: z.string().optional(),
  })).optional(),
});

async function getNextReceiptNumber() {
  const count = await prisma.serviceReceipt.count();
  return `SR-${String(count + 1).padStart(5, "0")}`;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const status = searchParams.get("status");

  const receipts = await prisma.serviceReceipt.findMany({
    where: {
      ...(customerId ? { customerId } : {}),
      ...(status ? { status: status as never } : {}),
    },
    include: {
      customer: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(receipts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = createSchema.parse(body);

  const receipt = await prisma.serviceReceipt.create({
    data: {
      receiptNumber: await getNextReceiptNumber(),
      customerId: data.customerId,
      projectId: data.projectId,
      technicianId: data.technicianId,
      complaint: data.complaint,
      errorDescription: data.errorDescription,
      workDone: data.workDone,
      recommendations: data.recommendations,
      visitDate: data.visitDate ? new Date(data.visitDate) : undefined,
      items: data.items ? {
        create: data.items,
      } : undefined,
    },
    include: { customer: true, technician: true, items: true },
  });

  return NextResponse.json(receipt, { status: 201 });
}
