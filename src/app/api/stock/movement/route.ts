import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  stockItemId: z.string(),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "TRANSFER"]),
  quantity: z.number(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = schema.parse(body);

  const [movement, item] = await prisma.$transaction([
    prisma.stockMovement.create({ data }),
    prisma.stockItem.update({
      where: { id: data.stockItemId },
      data: {
        quantity: {
          increment: data.type === "IN" ? data.quantity :
                     data.type === "OUT" ? -data.quantity :
                     data.type === "ADJUSTMENT" ? data.quantity : 0,
        },
      },
    }),
  ]);

  return NextResponse.json({ movement, item }, { status: 201 });
}
