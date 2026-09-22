// ============================================================
// وثبة — أيقونات التواصل الاجتماعي (الشكل والشعار الأصلي لكل شبكة)
// تُستخدم في فوتر الموقع العام وفوتر كل متجر
//
// كل زر يظهر بهيئة العلامة التجارية الرسمية:
// إنستغرام  → تدرّج الألوان الرسمي + الشعار الأبيض
// سناب شات  → الدائرة الصفراء (#FFFC00) + الشبح الأبيض بحدود سوداء
// تيك توك   → الدائرة السوداء + النوتة البيضاء بظلّيها السماوي/الأحمر
// واتساب    → الدائرة الخضراء (#25D366) + سماعة الهاتف البيضاء
// ============================================================

"use client";

import { FaWhatsapp, FaInstagram } from "react-icons/fa";
import { SiSnapchat, SiTiktok } from "react-icons/si";
import type { CSSProperties } from "react";
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
  /** خلفية الزر بلون/تدرّج العلامة التجارية الرسمي */
  background: string;
  /** لون شعار الشبكة نفسه */
  glyph: string;
  /** لمسات إضافية لإظهار الشعار بهيئته الأصلية */
  glyphStyle?: CSSProperties;
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
      // تدرّج إنستغرام الرسمي
      background:
        "linear-gradient(135deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)",
      glyph: "#FFFFFF",
    });
  if (snapchat)
    items.push({
      key: "snapchat",
      icon: SiSnapchat,
      href: normalize(snapchat, (u) =>
        u.startsWith("http") ? u : `https://snapchat.com/add/${u}`
      ),
      label: "سناب شات",
      background: "#FFFC00",
      glyph: "#FFFFFF",
      // الشبح الأبيض بحدود سوداء مثل الشعار الرسمي
      glyphStyle: {
        filter:
          "drop-shadow(1px 0 0 #000) drop-shadow(-1px 0 0 #000) drop-shadow(0 1px 0 #000) drop-shadow(0 -1px 0 #000)",
      },
    });
  if (tiktok)
    items.push({
      key: "tiktok",
      icon: SiTiktok,
      href: normalize(tiktok, (u) => (u.startsWith("http") ? u : `https://tiktok.com/@${u}`)),
      label: "تيك توك",
      background: "#000000",
      glyph: "#FFFFFF",
      // ظلّا التيك توك الرسميان: سماوي يسارًا وأحمر يمينًا
      glyphStyle: {
        filter:
          "drop-shadow(-1.5px 0 0 #25F4EE) drop-shadow(1.5px 0 0 #FE2C55)",
      },
    });
  if (whatsapp)
    items.push({
      key: "whatsapp",
      icon: FaWhatsapp,
      href: `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`,
      label: "واتساب",
      background: "#25D366",
      glyph: "#FFFFFF",
    });

  if (items.length === 0) return null;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
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
            className="flex h-10 w-10 items-center justify-center rounded-full shadow-md ring-1 ring-black/10 transition-all hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg"
            style={{ background: it.background }}
          >
            <Icon
              style={{ color: it.glyph, width: size, height: size, ...it.glyphStyle }}
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
