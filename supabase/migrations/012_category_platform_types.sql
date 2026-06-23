-- ============================================================
-- Migration 012 — Category platform_type classification
-- Step 3 of trust-cabbage-patch-final.md (Part 3)
-- Run AFTER 011_b2c_categories.sql
-- Safe to re-run (idempotent)
-- ============================================================

-- Step 1: Baseline — all existing categories default to b2b (already set by column default)
-- This ensures any that slipped through are covered
UPDATE public.categories
  SET platform_type = 'b2b'
  WHERE platform_type IS NULL;

-- Step 2: B2C top-level categories
UPDATE public.categories SET platform_type = 'b2c' WHERE slug IN (
  'fashion-apparel',
  'beauty-personal-care',
  'home-living',
  'electronics-gadgets',
  'food-beverages',
  'health-wellness',
  'books-hobbies-learning',
  'baby-kids',
  'pets',
  'automotive',
  'sustainable-eco-brands',
  'retail-multi-brand'
);

-- Step 3: B2C subcategories
UPDATE public.categories SET platform_type = 'b2c' WHERE slug IN (
  -- Fashion
  'clothing-ethnic-wear','footwear','accessories-jewellery',
  'sportswear-activewear','kids-fashion','innerwear-loungewear',
  -- Beauty
  'skincare','haircare','makeup-cosmetics','men-grooming',
  'fragrances-perfumes','oral-care',
  -- Home
  'furniture-decor','bedding-bath','kitchen-dining',
  'lighting','home-appliances','home-cleaning',
  -- Electronics
  'headphones-audio','smartwatches-wearables','mobile-accessories',
  'laptops-peripherals','smart-home-devices',
  -- Food
  'health-nutrition','organic-natural-foods','snacks-packaged-foods',
  'beverages-juices','baby-food-nutrition','gourmet-specialty-foods',
  -- Health
  'fitness-equipment','ayurvedic-herbal','medical-devices',
  'sexual-wellness',
  -- Hobbies
  'books-stationery','art-craft-supplies','musical-instruments',
  'board-games-toys',
  -- Baby
  'baby-care-hygiene','maternity-feeding','toys-early-learning',
  'kids-nutrition',
  -- Pets
  'pet-food-treats','pet-accessories','pet-grooming-products',
  'pet-healthcare',
  -- Automotive
  'car-accessories','bike-accessories','car-care-products',
  -- Eco
  'sustainable-fashion','zero-waste-products','organic-living'
);

-- Step 4: Categories that serve both B2B and B2C
UPDATE public.categories SET platform_type = 'both' WHERE slug IN (
  'photography',
  'video-production',
  'edtech-online-courses',
  'mental-wellness',
  'packaging-solutions'
);

-- Step 5: Verify counts
SELECT platform_type, COUNT(*) AS total
FROM public.categories
GROUP BY platform_type
ORDER BY platform_type;
-- Expected: b2b ~55, b2c ~50, both ~5
