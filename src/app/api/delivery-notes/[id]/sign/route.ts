import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { customerSignature } = await req.json();

  const note = await prisma.deliveryNote.update({
    where: { id },
    data: {
      customerSignature,
      signedAt: new Date(),
      status: "SIGNED",
    },
  });

  return NextResponse.json(note);
}
