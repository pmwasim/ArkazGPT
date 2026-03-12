import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@arkazsaudi.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@arkazsaudi.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create technician
  const techPassword = await bcrypt.hash("tech123", 12);
  await prisma.user.upsert({
    where: { email: "tech@arkazsaudi.com" },
    update: {},
    create: {
      name: "Ahmad Al-Rashidi",
      email: "tech@arkazsaudi.com",
      password: techPassword,
      role: "TECHNICIAN",
      phone: "+966501234567",
    },
  });

  // Create sample customer
  const customer = await prisma.customer.upsert({
    where: { id: "sample-customer-1" },
    update: {},
    create: {
      id: "sample-customer-1",
      name: "Saudi Telecom Company",
      phone: "+966112345678",
      email: "procurement@stc.com.sa",
      address: "Olaya District, Riyadh",
      vatNumber: "300000000000003",
    },
  });

  // Create sample project
  await prisma.project.upsert({
    where: { code: "PROJ-001" },
    update: {},
    create: {
      code: "PROJ-001",
      name: "STC Network Upgrade — Riyadh",
      customerId: customer.id,
      location: "Riyadh, Saudi Arabia",
      status: "ACTIVE",
      startDate: new Date("2025-01-01"),
    },
  });

  // Create default settings
  const defaultSettings = [
    { key: "companyName", value: "Arkaz Al Saudi General Contracting Company" },
    { key: "vatNumber", value: "300000000000003" },
    { key: "address", value: "Khalid Ibn Al Waleed St, Ash Sharafiyah, Jeddah 23216, KSA" },
    { key: "phone", value: "+966122345678" },
    { key: "email", value: "info@arkazsaudi.com" },
    { key: "invoiceTerms", value: "Payment due within 30 days from invoice date." },
    { key: "invoicePrefix", value: "INV" },
    { key: "receiptPrefix", value: "SR" },
    { key: "deliveryPrefix", value: "DN" },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // Chart of Accounts
  const chartOfAccounts = [
    { code: "1000", name: "Cash & Bank", type: "ASSET" as const },
    { code: "1100", name: "Accounts Receivable", type: "ASSET" as const },
    { code: "1200", name: "Inventory", type: "ASSET" as const },
    { code: "1300", name: "Prepaid Expenses", type: "ASSET" as const },
    { code: "2000", name: "Accounts Payable", type: "LIABILITY" as const },
    { code: "2100", name: "VAT Payable", type: "LIABILITY" as const },
    { code: "3000", name: "Owner Equity", type: "EQUITY" as const },
    { code: "4000", name: "Service Revenue", type: "REVENUE" as const },
    { code: "4100", name: "Parts Revenue", type: "REVENUE" as const },
    { code: "5000", name: "Cost of Services", type: "EXPENSE" as const },
    { code: "5100", name: "Salaries", type: "EXPENSE" as const },
    { code: "5200", name: "Fuel & Transport", type: "EXPENSE" as const },
    { code: "5300", name: "Tools & Equipment", type: "EXPENSE" as const },
  ];

  for (const account of chartOfAccounts) {
    await prisma.account.upsert({
      where: { code: account.code },
      update: {},
      create: account,
    });
  }

  console.log("✓ Seed completed!");
  console.log("  Admin login: admin@arkazsaudi.com / admin123");
  console.log("  Tech login:  tech@arkazsaudi.com / tech123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
