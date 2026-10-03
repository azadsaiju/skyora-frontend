"use client";

/**
 * Fixed floating action buttons (bottom-right): WhatsApp chat + phone call.
 * 56px touch targets, always reachable on every public route.
 */

import { motion } from "framer-motion";
import { MessageCircle, Phone } from "lucide-react";
import { siteConfig } from "@/config/site.config";

export function FloatingButtons() {
  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-3">
      <motion.a
        href={siteConfig.links.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="brutal-hover flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-[#16A34A] text-white shadow-hard-lg"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </motion.a>
      <motion.a
        href={siteConfig.links.phoneHref}
        aria-label="Call Skyora"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="brutal-hover flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-brand-pink text-white shadow-hard-lg"
      >
        <Phone className="h-6 w-6" aria-hidden />
      </motion.a>
    </div>
  );
}
