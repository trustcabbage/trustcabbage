-- Add search_tags column to categories for admin-defined search aliases
-- e.g. "esign api document signing digital contracts" on the "Document Signing" category
ALTER TABLE categories ADD COLUMN IF NOT EXISTS search_tags text;
