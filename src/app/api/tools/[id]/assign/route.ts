import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, purpose, notes } = await req.json();

  const [assignment] = await prisma.$transaction([
    prisma.toolAssignment.create({
      data: { toolId: params.id, userId, purpose, notes },
    }),
    prisma.tool.update({
      where: { id: params.id },
      data: { status: "ASSIGNED" },
    }),
  ]);

  return NextResponse.json(assignment, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { condition } = await req.json();

  await prisma.$transaction([
    prisma.toolAssignment.updateMany({
      where: { toolId: params.id, returnedAt: null },
      data: { returnedAt: new Date(), condition },
    }),
    prisma.tool.update({
      where: { id: params.id },
      data: { status: "AVAILABLE", condition: condition ?? undefined },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
