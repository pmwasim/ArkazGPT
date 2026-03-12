import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number(),
  vatAmount: z.number().default(0),
  totalAmount: z.number(),
  category: z.enum(["FUEL","ACCOMMODATION","FOOD","TOOLS","MATERIALS","TRANSPORT","COMMUNICATION","MAINTENANCE","OTHER"]),
  projectId: z.string().optional(),
  expenseDate: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");

  const expenses = await prisma.expense.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(status ? { status: status as never } : {}),
    },
    include: {
      submittedBy: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { expenseDate: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = createSchema.parse(body);

  const expense = await prisma.expense.create({
    data: {
      ...data,
      submittedById: session.user.id,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
    },
    include: { submittedBy: true, project: true },
  });

  return NextResponse.json(expense, { status: 201 });
}
