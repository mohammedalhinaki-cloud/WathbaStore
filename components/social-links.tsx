// ============================================================
// وثبة — أيقونات التواصل الاجتماعي (شكل الأيقونات الرسمية)
// تُستخدم في فوتر الموقع العام وفوتر كل متجر
// ============================================================

"use client";

import { FaWhatsapp, FaInstagram } from "react-icons/fa";
import { SiSnapchat, SiTiktok } from "react-icons/si";
import type { IconType } from "react-icons";

interface Props {
  instagram?: string;
  snapchat?: string;
  tiktok?: string;
  whatsapp?: string;
  size?: number;
  className?: string;
}

interface Item {
  key: string;
  icon: IconType;
  href: string;
  label: string;
  color: string;
}

export default function SocialLinks({
  instagram,
  snapchat,
  tiktok,
  whatsapp,
  size = 20,
  className = "",
}: Props) {
  const items: Item[] = [];
  if (instagram)
    items.push({
      key: "instagram",
      icon: FaInstagram,
      href: normalize(instagram, (u) => u.startsWith("http") ? u : `https://instagram.com/${u}`),
      label: "انستقرام",
      color: "#E4405F",
    });
  if (snapchat)
    items.push({
      key: "snapchat",
      icon: SiSnapchat,
      href: normalize(snapchat, (u) =>
        u.startsWith("http") ? u : `https://snapchat.com/add/${u}`
      ),
      label: "سناب شات",
      color: "#FFFC00",
    });
  if (tiktok)
    items.push({
      key: "tiktok",
      icon: SiTiktok,
      href: normalize(tiktok, (u) => (u.startsWith("http") ? u : `https://tiktok.com/@${u}`)),
      label: "تيك توك",
      color: "#000000",
    });
  if (whatsapp)
    items.push({
      key: "whatsapp",
      icon: FaWhatsapp,
      href: `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`,
      label: "واتساب",
      color: "#25D366",
    });

  if (items.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <a
            key={it.key}
            href={it.href}
            target="_blank"
            rel="noopener noreferrer"
            title={it.label}
            aria-label={it.label}
            className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 transition-all hover:-translate-y-0.5 hover:ring-2"
            style={{ ["--hover-color" as string]: it.color }}
          >
            <Icon
              className="h-5 w-5 text-white/90 transition-colors group-hover:text-white"
              style={{ fontSize: size }}
            />
          </a>
        );
      })}
    </div>
  );
}

function normalize(v: string, fallback: (u: string) => string): string {
  const t = v.trim();
  if (!t) return "#";
  return t.startsWith("http") ? t : fallback(t);
}
