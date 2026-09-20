// ============================================================
// وثبة — واجهة الخدمات الموحدة
// تختار تلقائيًا: Supabase (عند تهيئة المتغيرات) أو SQLite المحلية
// ============================================================

import { isSupabaseConfigured } from "../supabase/client";
import { localServices } from "./local";
import { getSupabaseServices } from "./supabase";
import type { Services } from "./types";

let _services: Services | null = null;

export function services(): Services {
  if (!_services) {
    _services = isSupabaseConfigured() ? getSupabaseServices() : localServices;
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
