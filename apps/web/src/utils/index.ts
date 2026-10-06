/**
 * Formatting and utility helper functions
 */

export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
};
