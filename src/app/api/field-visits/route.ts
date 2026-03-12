import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  projectId: z.string().optional(),
  technicianId: z.string(),
  scheduledAt: z.string(),
  notes: z.string().optional(),
  location: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const visits = await prisma.fieldVisit.findMany({
    include: {
      technician: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });
  return NextResponse.json(visits);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = createSchema.parse(body);

  const count = await prisma.fieldVisit.count();
  const visitNumber = `FV-${String(count + 1).padStart(5, "0")}`;

  const visit = await prisma.fieldVisit.create({
    data: {
      visitNumber,
      ...data,
      scheduledAt: new Date(data.scheduledAt),
    },
    include: {
      technician: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(visit, { status: 201 });
}
