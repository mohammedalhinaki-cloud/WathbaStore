-- ============================================================
-- معون maaoun.com — تحديث نصوص وروابط النطاق القديم
--
-- لا يحذف أي صف، ولا يغيّر هيكل الجداول، ولا يمسّ حسابات الدخول
-- (auth.users / profiles / stores.owner_email / store_credentials)
-- ولا يغيّر النطاقات الفرعية للمتاجر ولا كلمات المرور.
-- آمن للتكرار.
-- ============================================================

begin;

update public.site_settings
set
  developer_url = replace(replace(coalesce(developer_url, ''), 'wathbastore.com', 'maaoun.com'), 'waathba.com', 'maaoun.com'),
  about_text = replace(
    replace(
      replace(
        replace(
          replace(coalesce(about_text, ''), 'wathbastore.com', 'maaoun.com'),
          'waathba.com', 'maaoun.com'
        ),
        'بثُبة واحدة', 'مع معون'
      ),
      'بوثبة واحدة', 'مع معون'
    ),
    'وثبة', 'معون'
  ),
  hero_title = replace(
    replace(
      replace(
        replace(coalesce(hero_title, ''), 'waathba.com', 'maaoun.com'),
        'بثُبة واحدة', 'مع معون'
      ),
      'بوثبة واحدة', 'مع معون'
    ),
    'وثبة', 'معون'
  ),
  hero_subtitle = replace(
    replace(
      replace(
        replace(
          replace(coalesce(hero_subtitle, ''), 'wathbastore.com', 'maaoun.com'),
          'waathba.com', 'maaoun.com'
        ),
        'بثُبة واحدة', 'مع معون'
      ),
      'بوثبة واحدة', 'مع معون'
    ),
    'وثبة', 'معون'
  ),
  features = replace(
    replace(
      replace(
        replace(coalesce(features, '[]'::jsonb)::text, 'wathbastore.com', 'maaoun.com'),
        'waathba.com', 'maaoun.com'
      ),
      'بوثبة واحدة', 'مع معون'
    ),
    'وثبة', 'معون'
  )::jsonb,
  faq = replace(
    replace(
      replace(
        replace(
          replace(coalesce(faq, '[]'::jsonb)::text, 'wathbastore.com', 'maaoun.com'),
          'waathba.com', 'maaoun.com'
        ),
        'ما هي وثبة', 'ما هو معون'
      ),
      'لماذا وثبة', 'لماذا معون'
    ),
    'وثبة', 'معون'
  )::jsonb,
  social_instagram = case
    when social_instagram in (
      'https://instagram.com/waathba',
      'http://instagram.com/waathba',
      'https://www.instagram.com/waathba',
      'instagram.com/waathba'
    ) then 'https://instagram.com/maaoun'
    else replace(coalesce(social_instagram, ''), 'waathba.com', 'maaoun.com')
  end,
  social_snapchat = case
    when lower(coalesce(social_snapchat, '')) in ('waathba', '@waathba') then 'maaoun'
    else social_snapchat
  end,
  social_tiktok = case
    when social_tiktok in (
      'https://tiktok.com/@waathba',
      'http://tiktok.com/@waathba',
      'https://www.tiktok.com/@waathba',
      '@waathba'
    ) then 'https://tiktok.com/@maaoun'
    else replace(coalesce(social_tiktok, ''), 'waathba.com', 'maaoun.com')
  end,
  updated_at = now()
where id = 1
  and (
    coalesce(developer_url, '') like '%waathba.com%'
    or coalesce(developer_url, '') like '%wathbastore.com%'
    or coalesce(about_text, '') like '%waathba%'
    or coalesce(about_text, '') like '%وثبة%'
    or coalesce(about_text, '') like '%بثُبة%'
    or coalesce(hero_title, '') like '%وثبة%'
    or coalesce(hero_title, '') like '%بثُبة%'
    or coalesce(hero_subtitle, '') like '%waathba%'
    or coalesce(hero_subtitle, '') like '%وثبة%'
    or coalesce(features, '[]'::jsonb)::text like '%waathba%'
    or coalesce(features, '[]'::jsonb)::text like '%وثبة%'
    or coalesce(faq, '[]'::jsonb)::text like '%waathba%'
    or coalesce(faq, '[]'::jsonb)::text like '%وثبة%'
    or coalesce(social_instagram, '') like '%waathba%'
    or lower(coalesce(social_snapchat, '')) in ('waathba', '@waathba')
    or coalesce(social_tiktok, '') like '%waathba%'
  );

-- روابط المطور والروابط الكنسية فقط. لا نغيّر أسماء المتاجر ولا أوصاف العملاء.
update public.store_settings
set
  developer_url = replace(replace(developer_url, 'wathbastore.com', 'maaoun.com'), 'waathba.com', 'maaoun.com'),
  updated_at = now()
where developer_url like '%waathba.com%'
   or developer_url like '%wathbastore.com%';

update public.store_settings
set
  seo_canonical = replace(replace(seo_canonical, 'wathbastore.com', 'maaoun.com'), 'waathba.com', 'maaoun.com'),
  updated_at = now()
where seo_canonical like '%waathba.com%'
   or seo_canonical like '%wathbastore.com%';

update public.portfolio_items
set store_url = replace(replace(store_url, 'wathbastore.com', 'maaoun.com'), 'waathba.com', 'maaoun.com')
where store_url like '%waathba.com%'
   or store_url like '%wathbastore.com%';

commit;
