"use client";

/**
 * Fixed floating action buttons (bottom-right): WhatsApp chat + phone call.
 * 56px touch targets, always reachable on every public route.
 */

import { motion } from "framer-motion";
import { MessageCircle, Phone } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { trackWhatsApp } from "@/lib/track-whatsapp";

export function FloatingButtons() {
  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-3">
      <motion.a
        href={siteConfig.links.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        onClick={() => trackWhatsApp("floating")}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-white shadow-lg shadow-brand-green/30 transition-shadow hover:shadow-xl hover:shadow-brand-green/40"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </motion.a>
      <motion.a
        href={siteConfig.links.phoneHref}
        aria-label="Call Skyora"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-lg shadow-brand-blue/30 transition-shadow hover:shadow-xl hover:shadow-brand-blue/40"
      >
        <Phone className="h-6 w-6" aria-hidden />
      </motion.a>
    </div>
  );
}
