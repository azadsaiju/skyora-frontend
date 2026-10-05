import type { Metadata } from "next";
import { AboutPage } from "@/components/public/about-page";

export const metadata: Metadata = {
  title: "About Skyora — Built like an airport. Runs like a tech lab.",
  description:
    "The story, mission and vision of Skyora Group of Institutes — mentor-led Aviation and IT training with small batches, real projects and an active placement cell.",
};

export default function About() {
  return <AboutPage />;
}
