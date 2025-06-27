// Simple utility functions for URL handling without slugify

export const generateSlug = (id: string | number): string => {
  // Simply return the ID directly
  return id.toString();
};

export const extractIdFromSlug = (slug: string): string => {
  // In our simplified approach, the slug is the ID
  return slug;
};