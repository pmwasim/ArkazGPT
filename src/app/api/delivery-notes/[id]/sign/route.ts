import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { customerSignature } = await req.json();

  const note = await prisma.deliveryNote.update({
    where: { id: params.id },
    data: {
      customerSignature,
      signedAt: new Date(),
      status: "SIGNED",
    },
  });

  return NextResponse.json(note);
}
