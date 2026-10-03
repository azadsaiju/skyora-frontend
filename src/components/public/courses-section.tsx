"use client";

/**
 * Courses page: track tabs (Aviation / IT) with brutal course cards,
 * syllabus highlights and an Enquire Now dialog per course.
 */

import { motion, type Variants } from "framer-motion";
import { Clock, Code2, Plane } from "lucide-react";
import type { CourseDTO, Track } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeading } from "@/components/public/section-heading";
import { EnquiryDialog } from "@/components/public/enquiry-dialog";
import { usePublicContent } from "@/components/public/use-public-content";
import { ContentError } from "@/components/public/content-state";

const TRACK_META: Record<Track, { color: string }> = {
  AVIATION: { color: "#2563EB" },
  IT: { color: "#00B8D9" },
};

const GRID_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const GRID_ITEM: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function syllabusHighlights(syllabus: string): string[] {
  return syllabus
    .split("\n")
    .map((line) => line.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean)
    .slice(0, 3);
}

function CourseCard({
  course,
  courses,
}: {
  course: CourseDTO;
  courses: CourseDTO[];
}) {
  const color = TRACK_META[course.track].color;
  const highlights = syllabusHighlights(course.syllabus);

  return (
    <motion.div variants={GRID_ITEM} className="brutal-card flex min-w-0 flex-col p-6">
      <span
        aria-hidden
        className="mb-4 block h-1.5 w-12 rounded-full"
        style={{ background: color }}
      />
      <h3 className="font-grotesk text-xl font-bold break-words">
        {course.title}
      </h3>
      <Badge
        variant="outline"
        className="mt-2 w-fit rounded-full border-2 border-ink bg-white font-grotesk font-bold"
      >
        <Clock aria-hidden />
        {course.duration}
      </Badge>
      <p className="mt-3 line-clamp-3 text-sm break-words text-muted-foreground">
        {course.description}
      </p>

      {highlights.length > 0 && (
        <div className="mt-4">
          <p className="font-grotesk text-xs font-bold tracking-wide uppercase">
            What you&apos;ll learn:
          </p>
          <ul className="mt-2 space-y-1.5">
            {highlights.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 text-sm break-words text-muted-foreground"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <span className="min-w-0">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1" />
      <div className="mt-6">
        <EnquiryDialog
          courses={courses}
          initialCourseId={course.id}
          source={`courses:${course.slug}`}
          triggerLabel="Enquire Now"
          triggerClassName="w-full rounded-lg font-bold uppercase brutal-hover sm:w-auto"
        />
      </div>
    </motion.div>
  );
}

function CourseSkeleton() {
  return (
    <div className="brutal-card min-w-0 p-6" aria-hidden>
      <Skeleton className="h-1.5 w-12 rounded-full" />
      <Skeleton className="mt-4 h-6 w-3/4" />
      <Skeleton className="mt-2 h-6 w-32 rounded-full" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="mt-6 h-10 w-full rounded-lg" />
    </div>
  );
}

function TrackGrid({
  courses,
  track,
}: {
  courses: CourseDTO[];
  track: Track;
}) {
  const trackCourses = courses.filter((c) => c.track === track);

  if (trackCourses.length === 0) {
    return (
      <div className="brutal-card p-8 text-center md:p-12 sm:mx-auto sm:max-w-lg">
        <p className="font-display text-xl uppercase">No courses here yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;re finalising the {track === "AVIATION" ? "Aviation" : "IT"}{" "}
          lineup — enquire on WhatsApp and we&apos;ll send the brochure first.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={GRID_CONTAINER}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {trackCourses.map((course) => (
        <CourseCard key={course.id} course={course} courses={courses} />
      ))}
    </motion.div>
  );
}

export function CoursesSection() {
  const { data, error, loading, refetch } = usePublicContent();
  const courses = data?.courses ?? [];

  return (
    <section
      aria-label="Courses"
      className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20"
    >
      <SectionHeading
        eyebrow="Programs"
        title="COURSES THAT GET YOU HIRED"
        highlight="HIRED"
        description="Two career tracks, one outcome: employability. Every program is mentor-led, project-first and mapped to what airlines and tech companies actually test for."
      />

      {loading ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <CourseSkeleton />
          <CourseSkeleton />
          <CourseSkeleton />
        </div>
      ) : error ? (
        <div className="mt-10">
          <ContentError message={error} onRetry={refetch} />
        </div>
      ) : (
        <Tabs defaultValue="AVIATION" className="mt-10" aria-label="Course tracks">
          <TabsList className="h-auto w-fit gap-1 rounded-xl border-2 border-ink bg-white p-1">
            <TabsTrigger
              value="AVIATION"
              className="gap-2 rounded-lg px-4 py-2 font-grotesk text-sm font-bold uppercase data-[state=active]:bg-ink data-[state=active]:text-white"
            >
              <Plane className="h-4 w-4" aria-hidden />
              Aviation
            </TabsTrigger>
            <TabsTrigger
              value="IT"
              className="gap-2 rounded-lg px-4 py-2 font-grotesk text-sm font-bold uppercase data-[state=active]:bg-ink data-[state=active]:text-white"
            >
              <Code2 className="h-4 w-4" aria-hidden />
              IT
            </TabsTrigger>
          </TabsList>

          <TabsContent value="AVIATION" className="mt-8 outline-none">
            <TrackGrid courses={courses} track="AVIATION" />
          </TabsContent>
          <TabsContent value="IT" className="mt-8 outline-none">
            <TrackGrid courses={courses} track="IT" />
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
}
