import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  customerId: z.string(),
  projectId: z.string().optional(),
  driverId: z.string(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  deliveryDate: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    partNumber: z.string().optional(),
    quantity: z.number(),
    unit: z.string().optional(),
    notes: z.string().optional(),
  })),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const status = searchParams.get("status");

  const notes = await prisma.deliveryNote.findMany({
    where: {
      ...(customerId ? { customerId } : {}),
      ...(status ? { status: status as never } : {}),
    },
    include: {
      customer: { select: { id: true, name: true } },
      driver: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = createSchema.parse(body);

  const count = await prisma.deliveryNote.count();
  const noteNumber = `DN-${String(count + 1).padStart(5, "0")}`;

  const note = await prisma.deliveryNote.create({
    data: {
      noteNumber,
      customerId: data.customerId,
      projectId: data.projectId,
      driverId: data.driverId,
      deliveryAddress: data.deliveryAddress,
      notes: data.notes,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
      items: { create: data.items },
    },
    include: { customer: true, driver: true, items: true },
  });

  return NextResponse.json(note, { status: 201 });
}
