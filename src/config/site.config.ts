/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SKYORA GROUP OF INSTITUTES — CENTRAL SITE CONFIG
 * Edit this file once to update institute info across the entire site.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const siteConfig = {
  name: "Skyora Group of Institutes",
  shortName: "Skyora",
  tagline: "Careers take flight here.",
  description:
    "Skyora Group of Institutes — industry-focused Aviation & IT training with mentor-led programs, real projects and placement support.",

  // ── CONTACT LINKS (edit once, used everywhere) ────────────────────────────
  links: {
    // WhatsApp with pre-filled enquiry message
    whatsapp:
      "https://wa.me/919876543210?text=Hi%2C%20I%20want%20a%20course%20enquiry",
    whatsappMessage: "Hi, I want a course enquiry",
    // Gmail
    gmail: "mailto:youremail@gmail.com",
    // Socials
    instagram: "https://instagram.com/skyorainstitutes",
    linkedin: "https://linkedin.com/company/skyora-group",
    // GitHub (IT section)
    github: "https://github.com/skyora-org",
    // Phone
    phoneDisplay: "+91 98765 43210",
    phoneHref: "tel:+919876543210",
  },

  // ── ANIMATED STAT CARDS (Home) ────────────────────────────────────────────
  stats: [
    { value: 500, suffix: "+", label: "PLACED", color: "#FF2E63" },
    { value: 20, suffix: "+", label: "MENTORS", color: "#2563EB" },
    { value: 1200, suffix: "+", label: "STUDENTS TRAINED", color: "#FF7A00" },
    { value: 40, suffix: "+", label: "HIRING PARTNERS", color: "#00B8D9" },
  ],

  // ── TRACK CERTIFICATIONS (Courses page + Home highlights) ────────────────
  // One entry per career track. "short" is the badge label, "full" is the
  // explanatory line shown in the certification banner on the courses page.
  certifications: {
    AVIATION: {
      short: "IATA Preferred",
      full:
        "IATA-preferred aviation academy — curriculum aligned with International Air Transport Association (IATA) standards.",
    },
    IT: {
      short: "Certificate by STED Council",
      full:
        "Certificate provided by STED Council (Scientific & Technical Education Development Council) on successful course completion.",
    },
  },

  // ── RECRUITER / PARTNER MARQUEE STRIP ─────────────────────────────────────
  recruiters: [
    "IndiGo",
    "Air India",
    "Vistara",
    "SpiceJet",
    "Akasa Air",
    "TCS",
    "Infosys",
    "Wipro",
    "Accenture",
    "Cognizant",
    "Amazon",
    "Deloitte",
  ],

  // ── TESTIMONIALS (Home) ───────────────────────────────────────────────────
  testimonials: [
    {
      name: "Ananya Sharma",
      role: "Cabin Crew, IndiGo",
      quote:
        "Skyora's aviation program gave me the confidence and skills to clear my airline interview in the first attempt. The mock drills were gold!",
      color: "#FF2E63",
    },
    {
      name: "Rohan Mehta",
      role: "Data Analyst, TCS",
      quote:
        "From Excel dashboards to SQL and Power BI — the IT track is brutally practical. I had 3 offers before the course even ended.",
      color: "#2563EB",
    },
    {
      name: "Priya Nair",
      role: "Flutter Developer, Zeta",
      quote:
        "Built 4 real apps during the course. My mentor reviewed every PR. That's why I walked into interviews with a live portfolio.",
      color: "#FF7A00",
    },
    {
      name: "Karan Singh",
      role: "Ground Staff, Air India",
      quote:
        "The ground staff module covered everything — DCS, safety, grooming. Placement team scheduled my interviews within weeks.",
      color: "#00B8D9",
    },
  ],

  // ── PLACEMENT CARDS (Placements page — student wins) ──────────────────────
  placements: [
    { name: "Ananya Sharma", course: "Cabin Crew Training", company: "IndiGo", role: "Cabin Crew", color: "#FF2E63" },
    { name: "Rohan Mehta", course: "Data Analytics", company: "TCS", role: "Data Analyst", color: "#2563EB" },
    { name: "Priya Nair", course: "Flutter App Development", company: "Zeta", role: "App Developer", color: "#FF7A00" },
    { name: "Karan Singh", course: "Ground Staff & Airport Ops", company: "Air India", role: "Ground Staff", color: "#00B8D9" },
    { name: "Meera Iyer", course: "Data Science", company: "Flipkart", role: "Data Scientist", color: "#FF2E63" },
    { name: "Aditya Rao", course: "Full Stack Development", company: "Razorpay", role: "SDE-1", color: "#2563EB" },
    { name: "Sana Sheikh", course: "Data Analyst", company: "Swiggy", role: "Business Analyst", color: "#FF7A00" },
    { name: "Vikram Patil", course: "Cabin Crew Training", company: "Vistara", role: "Cabin Crew", color: "#00B8D9" },
  ],

  // ── MENTORS (About page) ──────────────────────────────────────────────────
  mentors: [
    { name: "Capt. Rekha Menon", role: "Aviation Lead", bio: "Ex-Air India, 18 yrs flying & training experience. IATA certified instructor.", initials: "RM", color: "#FF2E63" },
    { name: "Arjun Deshpande", role: "Data Science Mentor", bio: "12 yrs in ML & analytics. Previously at Flipkart and Mu Sigma.", initials: "AD", color: "#2563EB" },
    { name: "Sneha Kulkarni", role: "Full Stack Mentor", bio: "10 yrs building products at startups. MERN + Flutter specialist.", initials: "SK", color: "#FF7A00" },
    { name: "Faisal Khan", role: "Placement Head", bio: "Placed 500+ students. Direct lines to 40+ hiring partners.", initials: "FK", color: "#00B8D9" },
  ],

  // ── WHY US (About page) ───────────────────────────────────────────────────
  whyUs: [
    { title: "Learn By Doing", text: "Every course is 70% practical — live projects, mock interviews, real tools.", color: "#FF2E63" },
    { title: "Mentor-Led Batches", text: "Small batches, industry mentors, personal code/craft reviews every week.", color: "#2563EB" },
    { title: "Placement Engine", text: "Dedicated placement cell with 40+ hiring partners and a live vacancies board.", color: "#FF7A00" },
    { title: "Dual Career Tracks", text: "Aviation and IT under one roof — switch tracks with counselling support.", color: "#00B8D9" },
  ],

  // ── STORY (About page) ────────────────────────────────────────────────────
  story:
    "Skyora started with one belief: careers shouldn't wait. We saw brilliant students stuck between outdated theory-heavy training and employers who wanted job-ready skills. So we built an institute that runs like an airport and a tech lab at the same time — discipline, checklists and safety from aviation; sprints, code reviews and ship-it energy from IT. Today, Skyora runs two career tracks — Aviation and IT — with the same DNA: mentor-led, project-first, placement-obsessed.",
} as const;

export type SiteConfig = typeof siteConfig;
