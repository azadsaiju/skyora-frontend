/**
 * Skyora seed script.
 * Usage:  bun prisma/seed.ts   (after `bun run db:push`)
 *
 * Creates:
 *  - 1 SUPER_ADMIN (ADMIN_EMAIL / ADMIN_PASSWORD from .env, mustChangePassword=true)
 *  - 1 ADMIN account (ADMIN2_EMAIL / ADMIN2_PASSWORD, mustChangePassword=true)
 *  - 7 courses (2 Aviation + 5 IT), 4 achievements, 3 vacancies,
 *  - 5 sample enquiries across statuses, with follow-up history.
 *
 * NOTE: passwords here come from .env only — never hardcode real credentials.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Skyora database…");

  // ── USERS ──────────────────────────────────────────────────────────────────
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@skyora.edu.in").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe@12345";
  const admin2Email = (process.env.ADMIN2_EMAIL || "counsellor@skyora.edu.in").toLowerCase();
  const admin2Password = process.env.ADMIN2_PASSWORD || "ChangeMe@12345";

  const superAdmin = await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: process.env.ADMIN_NAME || "Skyora Super Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "SUPER_ADMIN",
      isActive: true,
      mustChangePassword: true, // forced password change on first login
    },
  });

  const counsellor = await db.user.upsert({
    where: { email: admin2Email },
    update: {},
    create: {
      name: process.env.ADMIN2_NAME || "Skyora Admin",
      email: admin2Email,
      passwordHash: await bcrypt.hash(admin2Password, 12),
      role: "ADMIN",
      isActive: true,
      mustChangePassword: true,
    },
  });

  console.log(`  ✓ SUPER_ADMIN: ${superAdmin.email} (must change password on first login)`);
  console.log(`  ✓ ADMIN:       ${counsellor.email} (must change password on first login)`);

  // ── COURSES ────────────────────────────────────────────────────────────────
  const coursesData = [
    {
      title: "Cabin Crew Training",
      track: "AVIATION",
      duration: "4 Months",
      description:
        "Complete cabin crew program — safety drills, first aid, grooming, in-flight service and airline interview preparation with real mock panels.",
      syllabus:
        "Safety & Emergency Procedures (SEP)\nFirst Aid & Aviation Medicine\nIn-flight Service & Galley Management\nGrooming, Deportment & Communication\nAirline Interview & Mock Panels",
    },
    {
      title: "Ground Staff & Airport Operations",
      track: "AVIATION",
      duration: "3 Months",
      description:
        "Airport ground operations training — check-in systems, baggage handling, DCS, customer service and ramp safety, with airport visit modules.",
      syllabus:
        "Airport & Terminal Operations\nDeparture Control Systems (DCS)\nCheck-in, Boarding & Baggage Handling\nCustomer Service & Conflict Handling\nRamp Safety & Security (DGCA norms)",
    },
    {
      title: "Data Science",
      track: "IT",
      duration: "6 Months",
      description:
        "End-to-end data science — Python, statistics, machine learning and MLOps basics, capped with a portfolio project reviewed by working data scientists.",
      syllabus:
        "Python, NumPy, Pandas\nStatistics & Experiment Design\nMachine Learning (sklearn, XGBoost)\nDeep Learning Basics (PyTorch)\nCapstone: End-to-end ML Project",
    },
    {
      title: "Data Analytics",
      track: "IT",
      duration: "5 Months",
      description:
        "From spreadsheets to dashboards — Excel, SQL, Power BI and storytelling with data, built around real business case studies.",
      syllabus:
        "Advanced Excel & GSheets\nSQL for Analysts\nPower BI Dashboards\nData Storytelling & Presenting\nCapstone: Business Case Analysis",
    },
    {
      title: "Data Analyst",
      track: "IT",
      duration: "4 Months",
      description:
        "Job-focused analyst track — SQL mastery, Excel automation, Tableau and Python analytics, with weekly mock interviews and resume labs.",
      syllabus:
        "SQL Joins, Windows & Optimization\nExcel Automation (VBA, Pivot Engine)\nTableau Visualization\nPython for Analysis (Pandas)\nInterview Prep & Case Studies",
    },
    {
      title: "Flutter App Development",
      track: "IT",
      duration: "5 Months",
      description:
        "Cross-platform mobile development with Flutter & Dart — state management, APIs, Firebase, and two store-ready apps in your portfolio.",
      syllabus:
        "Dart Language Deep Dive\nWidgets, Layouts & Theming\nState Management (Riverpod/BLoC)\nREST APIs & Firebase\nCapstone: Publish a Play Store App",
    },
    {
      title: "Full Stack Development",
      track: "IT",
      duration: "6 Months",
      description:
        "MERN + Next.js full stack — from HTML fundamentals to deployed production apps with auth, databases, tests and CI/CD.",
      syllabus:
        "HTML, CSS, JavaScript ES6+\nReact & Next.js\nNode.js, Express & REST APIs\nMongoDB & SQL Basics\nCapstone: Deployed Production App",
    },
  ];

  for (const c of coursesData) {
    const slug = c.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    await db.course.upsert({
      where: { slug },
      update: {},
      create: { ...c, slug, isActive: true },
    });
  }
  console.log(`  ✓ ${coursesData.length} courses`);

  // ── ACHIEVEMENTS ───────────────────────────────────────────────────────────
  const achievementsData = [
    {
      title: "Smart India Hackathon — Regional Finalists",
      description:
        "Team Skyora IT built an AI-powered crop advisory app and placed in the regional finals, beating 40+ college teams.",
      type: "HACKATHON",
      date: new Date("2025-08-12T00:00:00"),
    },
    {
      title: "Microsoft Azure Data Fundamentals — 32 Certified",
      description:
        "32 Data Analytics students cleared the DP-900 Azure Data Fundamentals certification in a single batch — a Skyora record.",
      type: "CERTIFICATION",
      date: new Date("2025-06-20T00:00:00"),
    },
    {
      title: "CampusCare App — Flutter Capstone Shipped",
      description:
        "Flutter batch shipped a full campus attendance + fee-tracking app now piloted by two partner institutes.",
      type: "PROJECT",
      date: new Date("2025-09-05T00:00:00"),
    },
    {
      title: "45 Students Placed in Q2 Drive",
      description:
        "Our largest placement quarter yet — 45 students across Data Analyst and Full Stack tracks placed with average CTC ₹5.2 LPA.",
      type: "PLACEMENT",
      date: new Date("2025-07-28T00:00:00"),
    },
  ];

  for (const a of achievementsData) {
    const exists = await db.achievement.findFirst({ where: { title: a.title } });
    if (!exists) await db.achievement.create({ data: a });
  }
  console.log(`  ✓ ${achievementsData.length} achievements`);

  // ── VACANCIES ──────────────────────────────────────────────────────────────
  const vacanciesData = [
    {
      title: "Junior Data Analyst",
      company: "Infosys",
      location: "Bengaluru",
      jobType: "FULL_TIME",
      description:
        "SQL + Excel + Power BI role for freshers. Skyora alumni fast-tracked to interviews.",
      applyLink: "https://www.infosys.com/careers/apply.html",
    },
    {
      title: "Cabin Crew (Fresher Batch)",
      company: "SpiceJet",
      location: "Delhi (DEL Base)",
      jobType: "FULL_TIME",
      description:
        "Fresher-friendly cabin crew hiring. Requirements: 18–27 yrs, fluent English + one regional language.",
      applyLink: "https://www.spicejet.com/careers.aspx",
    },
    {
      title: "Flutter Developer Intern",
      company: "Zeta",
      location: "Remote",
      jobType: "INTERNSHIP",
      description:
        "6-month internship with PPO potential. Requires one published Flutter app or equivalent capstone.",
      applyLink: "https://www.zeta.tech/careers",
    },
  ];

  for (const v of vacanciesData) {
    const exists = await db.vacancy.findFirst({ where: { title: v.title, company: v.company } });
    if (!exists) await db.vacancy.create({ data: { ...v, isOpen: true } });
  }
  console.log(`  ✓ ${vacanciesData.length} vacancies`);

  // ── ENQUIRIES ──────────────────────────────────────────────────────────────
  const courseMap = new Map((await db.course.findMany()).map((c) => [c.title, c.id]));
  const enquiriesData = [
    {
      name: "Ishita Verma",
      phone: "+91 98220 11223",
      email: "ishita.verma@example.com",
      course: "Cabin Crew Training",
      source: "contact",
      status: "NEW",
      message: "Hi, I want details about the cabin crew batch starting next month. Am I eligible with a commerce background?",
      daysAgo: 0,
    },
    {
      name: "Rahul Deshmukh",
      phone: "+91 99700 44556",
      email: "rahul.d@example.com",
      course: "Data Analytics",
      source: "courses",
      status: "CONTACTED",
      message: "Please share the fee structure and weekend batch timings for Data Analytics.",
      daysAgo: 2,
    },
    {
      name: "Fatima Shaikh",
      phone: "+91 96110 77889",
      email: "fatima.s@example.com",
      course: "Full Stack Development",
      source: "courses",
      status: "FOLLOWUP",
      message: "Interested in the Full Stack program. Do you offer EMI options?",
      daysAgo: 5,
      followUps: [
        {
          note: "Called — explained EMI plans. Wants to visit campus this Saturday for a demo class.",
          nextActionDate: 1, // due tomorrow
        },
        {
          note: "First call, shared brochure on WhatsApp.",
          nextActionDate: null,
        },
      ],
    },
    {
      name: "Arnav Gupta",
      phone: "+91 98450 33221",
      email: "arnav.g@example.com",
      course: "Flutter App Development",
      source: "floating",
      status: "DEMO",
      message: "Can I attend a trial Flutter class before enrolling?",
      daysAgo: 7,
      followUps: [
        {
          note: "Attended demo class on Flutter widgets — loved it. Parent decision pending.",
          nextActionDate: -2, // overdue
        },
      ],
    },
    {
      name: "Neha Joshi",
      phone: "+91 90080 99117",
      email: "neha.j@example.com",
      course: "Data Science",
      source: "contact",
      status: "ENROLLED",
      message: "Enrolling for the Data Science morning batch. Please share onboarding steps.",
      daysAgo: 12,
      followUps: [
        {
          note: "Enrolled! Fee paid, batch assigned, kit handed over.",
          nextActionDate: null,
        },
      ],
    },
  ];

  for (const e of enquiriesData) {
    const exists = await db.enquiry.findFirst({
      where: { email: e.email, courseId: courseMap.get(e.course) ?? null },
    });
    if (exists) continue;
    const createdAt = new Date(Date.now() - e.daysAgo * 86_400_000);
    const enquiry = await db.enquiry.create({
      data: {
        name: e.name,
        phone: e.phone,
        email: e.email,
        courseId: courseMap.get(e.course) ?? null,
        source: e.source,
        status: e.status,
        message: e.message,
        createdAt,
        updatedAt: createdAt,
      },
    });
    for (const f of (e as { followUps?: { note: string; nextActionDate: number | null }[] }).followUps ?? []) {
      await db.followUp.create({
        data: {
          enquiryId: enquiry.id,
          note: f.note,
          nextActionDate:
            f.nextActionDate === null || f.nextActionDate === undefined
              ? null
              : new Date(Date.now() + f.nextActionDate * 86_400_000),
          createdById: counsellor.id,
          createdAt: createdAt,
        },
      });
    }
  }
  console.log(`  ✓ ${enquiriesData.length} sample enquiries (varied statuses + follow-ups)`);

  console.log("🌿 Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
