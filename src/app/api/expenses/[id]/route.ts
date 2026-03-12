import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const expense = await prisma.expense.update({
    where: { id: params.id },
    data: {
      ...body,
      approvedById: body.status === "APPROVED" ? session.user.id : undefined,
      approvedAt: body.status === "APPROVED" ? new Date() : undefined,
    },
  });

  return NextResponse.json(expense);
}
