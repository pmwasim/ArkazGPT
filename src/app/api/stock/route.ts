import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().default("PCS"),
  quantity: z.number().default(0),
  minQuantity: z.number().default(0),
  costPrice: z.number().optional(),
  salePrice: z.number().optional(),
  location: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.stockItem.findMany({
    where: { isActive: true },
    include: { movements: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = createSchema.parse(body);

  const item = await prisma.stockItem.create({ data });
  return NextResponse.json(item, { status: 201 });
}
