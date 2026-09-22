// ============================================================
// معين — واجهة الخدمات الموحدة
// تختار تلقائيًا: Supabase (عند تهيئة المتغيرات) أو SQLite المحلية
// ============================================================

import { isSupabaseConfigured } from "../supabase/client";
import { localServices } from "./local";
import { getSupabaseServices } from "./supabase";
import type { Services } from "./types";

let _services: Services | null = null;

/**
 * هل يعمل الكود داخل بيئة Cloudflare Workers (workerd)؟
 * الوضع التجريبي المحلي (SQLite + نظام الملفات) يعمل على Node فقط،
 * ولا يعمل على Workers (لا نظام ملفات قابلًا للكتابة على Cloudflare).
 * في الإنتاج على Cloudflare يجب ضبط Supabase.
 */
export function isWorkersRuntime(): boolean {
  try {
    return globalThis.navigator?.userAgent === "Cloudflare-Workers";
  } catch {
    return false;
  }
}

export function services(): Services {
  if (!_services) {
    if (isSupabaseConfigured()) {
      _services = getSupabaseServices();
    } else if (isWorkersRuntime()) {
      throw new Error(
        "وضع Cloudflare Workers يتطلب Supabase: أضِف متغيرات " +
          "NEXT_PUBLIC_SUPABASE_URL وNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY وSUPABASE_SECRET_KEY " +
          "في إعدادات مشروعك على Cloudflare ثم أعد النشر. " +
          "الوضع التجريبي المحلي (SQLite) خاص بالجهاز المحلي فقط (npm run dev)."
      );
    } else {
      _services = localServices;
    }
  }
  return _services;
}

export type { Services } from "./types";
export type {
  CategoryInput,
  ClientRow,
  CreateStoreInput,
  PageInput,
  ProductInput,
  StoreInput,
} from "./types";
