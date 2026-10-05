/**
 * Generates the department/mentor/campus imagery for the olive-themed site.
 * Run: bun scripts/generate-site-images.ts
 * Outputs into public/departments/ and public/mentors/.
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const STYLE =
  "Flat vector illustration, bold neo-brutalist poster style, thick dark olive-green outlines (#141C08), muted olive green background (#6E9622), cream and warm off-white surfaces, restrained cobalt blue and teal accents, subtle grain texture, clean geometric shapes, no text, no letters, no words, high quality, detailed";

const JOBS: {
  prompt: string;
  out: string;
  size: "1344x768" | "1024x1024" | "768x1344" | "864x1152" | "1152x864" | "1440x720" | "720x1440";
}[] = [
  {
    prompt: `Wide hero illustration for an aviation training institute: a modern passenger jet at an airport gate with a confident cabin crew member in uniform pulling a suitcase and ground staff with headset marshalling, airport terminal and control tower behind, ${STYLE}`,
    out: "public/departments/aviation-hero.png",
    size: "1344x768",
  },
  {
    prompt: `Wide hero illustration for a software and IT training institute: a developer at a laptop with code editor windows, floating dashboard panels with charts and data visualizations, server racks and abstract machine-learning nodes around, ${STYLE}`,
    out: "public/departments/it-hero.png",
    size: "1344x768",
  },
  {
    prompt: `Illustration of a bright modern institute classroom: diverse young students collaborating around tables with laptops and notebooks, a mentor pointing at a whiteboard with charts, big windows and indoor plants, warm energetic learning atmosphere, ${STYLE}`,
    out: "public/departments/about-campus.png",
    size: "1344x768",
  },
  {
    prompt: `Illustration of a one-on-one mentorship session: a friendly industry mentor and a young student sitting across a desk with an open laptop, the mentor gesturing toward a checklist and mock-interview notes, coffee cups and notebooks on the desk, encouraging mood, ${STYLE}`,
    out: "public/departments/mentorship-hero.png",
    size: "1344x768",
  },
  {
    prompt: `Square portrait illustration of a confident Indian woman aviation instructor in her forties, airline captain style dark uniform with epaulettes and silk scarf, warm smile, arms crossed, plain cream circle backdrop with olive green frame, ${STYLE}`,
    out: "public/mentors/mentor-aviation.png",
    size: "1024x1024",
  },
  {
    prompt: `Square portrait illustration of a friendly Indian man data science mentor in his thirties wearing a casual hoodie and glasses, holding a tablet showing a chart, warm smile, plain cream circle backdrop with teal frame, ${STYLE}`,
    out: "public/mentors/mentor-data.png",
    size: "1024x1024",
  },
  {
    prompt: `Square portrait illustration of a young Indian woman software developer with a laptop under her arm wearing a mustard yellow jacket, confident smile, plain cream circle backdrop with cobalt blue frame, ${STYLE}`,
    out: "public/mentors/mentor-fullstack.png",
    size: "1024x1024",
  },
  {
    prompt: `Square portrait illustration of a cheerful Indian man placement officer in a smart olive green blazer holding a clipboard with a checklist, big welcoming smile, plain cream circle backdrop with orange frame, ${STYLE}`,
    out: "public/mentors/mentor-placement.png",
    size: "1024x1024",
  },
];

async function main() {
  const zai = await ZAI.create();
  let ok = 0;
  for (const job of JOBS) {
    const outPath = path.join(process.cwd(), job.out);
    if (fs.existsSync(outPath)) {
      console.log(`↷ skip (exists): ${job.out}`);
      ok++;
      continue;
    }
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      try {
        const res = await zai.images.generations.create({
          prompt: job.prompt,
          size: job.size,
        });
        const b64 = res.data?.[0]?.base64;
        if (!b64) throw new Error("empty base64");
        fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
        console.log(`✓ ${job.out}`);
        done = true;
        ok++;
      } catch (e) {
        console.error(`✗ attempt ${attempt} ${job.out}:`, (e as Error).message);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }
  console.log(`Done: ${ok}/${JOBS.length} images present.`);
  if (ok < JOBS.length) process.exit(1);
}

main();
