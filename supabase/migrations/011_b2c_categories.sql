-- ============================================================
-- Migration 011 — B2C Category Seed
-- Step 2 of trust-cabbage-patch-final.md
-- Safe to re-run: ON CONFLICT (slug) DO NOTHING
-- Run AFTER 010_b2c_schema.sql
-- ============================================================

-- ─── B2C Parent Categories ────────────────────────────────────────────────────

INSERT INTO public.categories (name, slug, parent_id, icon, platform_type, sort_order, is_active) VALUES
  ('Fashion & Apparel',          'fashion-apparel',          NULL, '👗', 'b2c', 10, true),
  ('Beauty & Personal Care',     'beauty-personal-care',     NULL, '💄', 'b2c', 11, true),
  ('Home & Living',              'home-living',              NULL, '🏠', 'b2c', 12, true),
  ('Electronics & Gadgets',      'electronics-gadgets',      NULL, '📱', 'b2c', 13, true),
  ('Food & Beverages',           'food-beverages',           NULL, '🍽️', 'b2c', 14, true),
  ('Health & Wellness',          'health-wellness',          NULL, '🌿', 'b2c', 15, true),
  ('Books, Hobbies & Learning',  'books-hobbies-learning',   NULL, '📚', 'b2c', 16, true),
  ('Baby & Kids',                'baby-kids',                NULL, '👶', 'b2c', 17, true),
  ('Pets',                       'pets',                     NULL, '🐾', 'b2c', 18, true),
  ('Automotive',                 'automotive',               NULL, '🚗', 'b2c', 19, true),
  ('Sustainable & Eco Brands',   'sustainable-eco-brands',   NULL, '♻️', 'b2c', 20, true),
  ('Retail / Multi-brand',       'retail-multi-brand',       NULL, '🏪', 'b2c', 21, true)
ON CONFLICT (slug) DO NOTHING;

-- ─── Fashion & Apparel subcategories ─────────────────────────────────────────

INSERT INTO public.categories (name, slug, parent_id, icon, platform_type, sort_order, is_active)
SELECT v.name, v.slug, p.id, v.icon, 'b2c', v.sort_order, true
FROM (VALUES
  ('Clothing & Ethnic Wear',   'clothing-ethnic-wear',    '👘', 1),
  ('Footwear',                 'footwear',                '👟', 2),
  ('Accessories & Jewellery',  'accessories-jewellery',   '💍', 3),
  ('Sportswear & Activewear',  'sportswear-activewear',   '🏋️', 4),
  ('Kids Fashion',             'kids-fashion',            '🧒', 5),
  ('Innerwear & Loungewear',   'innerwear-loungewear',    '🩱', 6)
) AS v(name, slug, icon, sort_order)
JOIN public.categories p ON p.slug = 'fashion-apparel'
ON CONFLICT (slug) DO NOTHING;

-- ─── Beauty & Personal Care subcategories ────────────────────────────────────

INSERT INTO public.categories (name, slug, parent_id, icon, platform_type, sort_order, is_active)
SELECT v.name, v.slug, p.id, v.icon, 'b2c', v.sort_order, true
FROM (VALUES
  ('Skincare',           'skincare',         '✨', 1),
  ('Haircare',           'haircare',         '💇', 2),
  ('Makeup & Cosmetics', 'makeup-cosmetics', '💋', 3),
  ('Men Grooming',       'men-grooming',     '🪒', 4),
  ('Fragrances',         'fragrances-perfumes', '🌸', 5),
  ('Oral Care',          'oral-care',        '🦷', 6)
) AS v(name, slug, icon, sort_order)
JOIN public.categories p ON p.slug = 'beauty-personal-care'
ON CONFLICT (slug) DO NOTHING;

-- ─── Home & Living subcategories ─────────────────────────────────────────────

INSERT INTO public.categories (name, slug, parent_id, icon, platform_type, sort_order, is_active)
SELECT v.name, v.slug, p.id, v.icon, 'b2c', v.sort_order, true
FROM (VALUES
  ('Furniture & Decor',  'furniture-decor',  '🛋️', 1),
  ('Bedding & Bath',     'bedding-bath',     '🛁', 2),
  ('Kitchen & Dining',   'kitchen-dining',   '🍳', 3),
  ('Lighting',           'lighting',         '💡', 4),
  ('Home Appliances',    'home-appliances',  '🏠', 5),
  ('Home Cleaning',      'home-cleaning',    '🧹', 6)
) AS v(name, slug, icon, sort_order)
JOIN public.categories p ON p.slug = 'home-living'
ON CONFLICT (slug) DO NOTHING;

-- ─── Electronics & Gadgets subcategories ─────────────────────────────────────

INSERT INTO public.categories (name, slug, parent_id, icon, platform_type, sort_order, is_active)
SELECT v.name, v.slug, p.id, v.icon, 'b2c', v.sort_order, true
FROM (VALUES
  ('Headphones & Audio',      'headphones-audio',       '🎧', 1),
  ('Smartwatches & Wearables','smartwatches-wearables', '⌚', 2),
  ('Mobile Accessories',      'mobile-accessories',     '📱', 3),
  ('Laptops & Peripherals',   'laptops-peripherals',    '💻', 4),
  ('Smart Home Devices',      'smart-home-devices',     '🏠', 5)
) AS v(name, slug, icon, sort_order)
JOIN public.categories p ON p.slug = 'electronics-gadgets'
ON CONFLICT (slug) DO NOTHING;

-- ─── Food & Beverages subcategories ──────────────────────────────────────────

INSERT INTO public.categories (name, slug, parent_id, icon, platform_type, sort_order, is_active)
SELECT v.name, v.slug, p.id, v.icon, 'b2c', v.sort_order, true
FROM (VALUES
  ('Health & Nutrition',       'health-nutrition',       '🥗', 1),
  ('Organic & Natural Foods',  'organic-natural-foods',  '🌾', 2),
  ('Snacks & Packaged Foods',  'snacks-packaged-foods',  '🍪', 3),
  ('Beverages & Juices',       'beverages-juices',       '🧃', 4),
  ('Baby Food & Nutrition',    'baby-food-nutrition',    '🍼', 5),
  ('Gourmet & Specialty Foods','gourmet-specialty-foods','🫙', 6)
) AS v(name, slug, icon, sort_order)
JOIN public.categories p ON p.slug = 'food-beverages'
ON CONFLICT (slug) DO NOTHING;

-- ─── Health & Wellness subcategories ─────────────────────────────────────────

INSERT INTO public.categories (name, slug, parent_id, icon, platform_type, sort_order, is_active)
SELECT v.name, v.slug, p.id, v.icon, 'b2c', v.sort_order, true
FROM (VALUES
  ('Fitness Equipment',    'fitness-equipment',  '🏋️', 1),
  ('Ayurvedic & Herbal',   'ayurvedic-herbal',   '🌿', 2),
  ('Medical Devices',      'medical-devices',    '🩺', 3),
  ('Mental Wellness',      'mental-wellness',    '🧘', 4),
  ('Sexual Wellness',      'sexual-wellness',    '💜', 5)
) AS v(name, slug, icon, sort_order)
JOIN public.categories p ON p.slug = 'health-wellness'
ON CONFLICT (slug) DO NOTHING;

-- ─── Books, Hobbies & Learning subcategories ─────────────────────────────────

INSERT INTO public.categories (name, slug, parent_id, icon, platform_type, sort_order, is_active)
SELECT v.name, v.slug, p.id, v.icon, 'b2c', v.sort_order, true
FROM (VALUES
  ('Books & Stationery',    'books-stationery',    '📖', 1),
  ('Art & Craft Supplies',  'art-craft-supplies',  '🎨', 2),
  ('Musical Instruments',   'musical-instruments', '🎸', 3),
  ('Board Games & Toys',    'board-games-toys',    '🎲', 4),
  ('Edtech & Online Courses','edtech-online-courses','🎓', 5)
) AS v(name, slug, icon, sort_order)
JOIN public.categories p ON p.slug = 'books-hobbies-learning'
ON CONFLICT (slug) DO NOTHING;

-- ─── Baby & Kids subcategories ────────────────────────────────────────────────

INSERT INTO public.categories (name, slug, parent_id, icon, platform_type, sort_order, is_active)
SELECT v.name, v.slug, p.id, v.icon, 'b2c', v.sort_order, true
FROM (VALUES
  ('Baby Care & Hygiene',  'baby-care-hygiene',  '🛁', 1),
  ('Maternity & Feeding',  'maternity-feeding',  '🤱', 2),
  ('Toys & Early Learning','toys-early-learning', '🧸', 3),
  ('Kids Nutrition',       'kids-nutrition',     '🥛', 4)
) AS v(name, slug, icon, sort_order)
JOIN public.categories p ON p.slug = 'baby-kids'
ON CONFLICT (slug) DO NOTHING;

-- ─── Pets subcategories ───────────────────────────────────────────────────────

INSERT INTO public.categories (name, slug, parent_id, icon, platform_type, sort_order, is_active)
SELECT v.name, v.slug, p.id, v.icon, 'b2c', v.sort_order, true
FROM (VALUES
  ('Pet Food & Treats',     'pet-food-treats',       '🦴', 1),
  ('Pet Accessories',       'pet-accessories',        '🐾', 2),
  ('Pet Grooming Products', 'pet-grooming-products',  '✂️', 3),
  ('Pet Healthcare',        'pet-healthcare',         '🩺', 4)
) AS v(name, slug, icon, sort_order)
JOIN public.categories p ON p.slug = 'pets'
ON CONFLICT (slug) DO NOTHING;

-- ─── Automotive subcategories ─────────────────────────────────────────────────

INSERT INTO public.categories (name, slug, parent_id, icon, platform_type, sort_order, is_active)
SELECT v.name, v.slug, p.id, v.icon, 'b2c', v.sort_order, true
FROM (VALUES
  ('Car Accessories',   'car-accessories',   '🚗', 1),
  ('Bike Accessories',  'bike-accessories',  '🏍️', 2),
  ('Car Care Products', 'car-care-products', '🧽', 3)
) AS v(name, slug, icon, sort_order)
JOIN public.categories p ON p.slug = 'automotive'
ON CONFLICT (slug) DO NOTHING;

-- ─── Sustainable & Eco Brands subcategories ──────────────────────────────────

INSERT INTO public.categories (name, slug, parent_id, icon, platform_type, sort_order, is_active)
SELECT v.name, v.slug, p.id, v.icon, 'b2c', v.sort_order, true
FROM (VALUES
  ('Sustainable Fashion',   'sustainable-fashion',   '♻️', 1),
  ('Zero Waste Products',   'zero-waste-products',   '🌱', 2),
  ('Organic Living',        'organic-living',         '🌿', 3)
) AS v(name, slug, icon, sort_order)
JOIN public.categories p ON p.slug = 'sustainable-eco-brands'
ON CONFLICT (slug) DO NOTHING;
