import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateZatcaQrBase64 } from "@/lib/zatca";

const itemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  vatRate: z.number().default(15),
});

const createSchema = z.object({
  customerId: z.string(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  vatRate: z.number().default(15),
  externalInvoiceRef: z.string().optional(),
  zatcaQrCode: z.string().optional(), // embedded QR from external system
  generateZatcaQr: z.boolean().default(false),
  items: z.array(itemSchema),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = createSchema.parse(body);

  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vatAmount = subtotal * (data.vatRate / 100);
  const total = subtotal + vatAmount;

  const count = await prisma.invoice.count();
  const invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`;

  let zatcaQrCode = data.zatcaQrCode ?? null;
  let zatcaQrGenerated = false;

  if (data.generateZatcaQr && !zatcaQrCode) {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["companyName", "vatNumber"] } },
    });
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    if (settingsMap.companyName && settingsMap.vatNumber) {
      zatcaQrCode = generateZatcaQrBase64({
        sellerName: settingsMap.companyName,
        vatNumber: settingsMap.vatNumber,
        timestamp: new Date().toISOString(),
        totalAmount: total.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
      });
      zatcaQrGenerated = true;
    }
  }

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerId: data.customerId,
      issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      subtotal,
      vatRate: data.vatRate,
      vatAmount,
      total,
      notes: data.notes,
      terms: data.terms,
      externalInvoiceRef: data.externalInvoiceRef,
      zatcaQrCode,
      zatcaQrGenerated,
      items: {
        create: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          vatRate: item.vatRate,
        })),
      },
    },
    include: { customer: true, items: true },
  });

  return NextResponse.json(invoice, { status: 201 });
}
