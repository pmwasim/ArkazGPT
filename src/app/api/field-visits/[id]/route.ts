import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["SCHEDULED", "EN_ROUTE", "ON_SITE", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = patchSchema.parse(body);

  const visit = await prisma.fieldVisit.update({
    where: { id: params.id },
    data: {
      ...data,
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
    },
    include: { technician: true, project: true },
  });

  return NextResponse.json(visit);
}
