/**
 * Utility functions for handling customer names consistently across the application
 */

export interface NameFields {
  first_name?: string | null;
  last_name?: string | null;
}

/**
 * Smart name display logic:
 * - If first_name exists and last_name is null/empty: show only first_name
 * - If both first_name and last_name exist: show "first_name last_name"
 * - If neither exists: show fallback
 */
export function formatCustomerName(
  customer: NameFields, 
  fallback: string = 'Unnamed Customer'
): string {
  // Handle null, undefined, empty string, or the string "None"/"null"
  const cleanName = (name: string | null | undefined): string => {
    if (!name) return '';
    const trimmed = name.trim();
    // Remove "None" or "null" strings (case insensitive)
    if (trimmed.toLowerCase() === 'none' || trimmed.toLowerCase() === 'null') {
      return '';
    }
    return trimmed;
  };
  
  const firstName = cleanName(customer.first_name);
  const lastName = cleanName(customer.last_name);
  
  if (!firstName && !lastName) {
    return fallback;
  }
  
  if (firstName && !lastName) {
    return firstName;
  }
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  
  // Edge case: only last name exists (unlikely but handle it)
  return lastName || fallback;
}

/**
 * Get customer initials for avatars
 */
export function getCustomerInitials(customer: NameFields): string {
  const firstName = customer.first_name?.trim() || '';
  const lastName = customer.last_name?.trim() || '';
  
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  
  if (lastName) {
    return lastName.slice(0, 2).toUpperCase();
  }
  
  return 'UC'; // Unnamed Customer
}

/**
 * Split a full name into first and last name parts
 * Used when converting from fullName input to separate fields
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }
  
  const parts = trimmed.split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
  
  return { firstName, lastName };
}

/**
 * Clean customer name from strings that may contain "None" or "null"
 * Removes " None", " null", "None", "null" from the end of strings
 * Commonly used for cleaning appointment purposes or other text fields
 */
export function cleanCustomerNameFromText(text: string): string {
  if (!text) return text;
  
  // Remove " None", " null", "None", "null" from the end
  return text
    .replace(/\s+None\s*$/i, '')
    .replace(/\s+null\s*$/i, '')
    .replace(/^None\s+/i, '')
    .replace(/^null\s+/i, '')
    .trim();
}

