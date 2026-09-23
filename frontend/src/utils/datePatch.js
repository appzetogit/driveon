/**
 * Global Date Patch
 * Standardizes Date.prototype.toLocaleDateString and Date.prototype.toLocaleString
 * to consistently return dates in dd/mm/yyyy format across all environments.
 */

// Save original methods
const originalToLocaleDateString = Date.prototype.toLocaleDateString;
const originalToLocaleString = Date.prototype.toLocaleString;

// Overwrite toLocaleDateString
Date.prototype.toLocaleDateString = function (locale, options) {
  if (options) {
    const hasDay = 'day' in options;
    const hasMonth = 'month' in options;
    const hasYear = 'year' in options;
    const hasWeekday = 'weekday' in options;

    // If caller requests only partial/non-standard fields (e.g. only weekday or only month name),
    // delegate to original method.
    if (hasWeekday && !hasDay) {
      return originalToLocaleDateString.call(this, locale, options);
    }
    if (hasMonth && !hasDay) {
      return originalToLocaleDateString.call(this, locale, options);
    }
    if (hasYear && !hasMonth && !hasDay) {
      return originalToLocaleDateString.call(this, locale, options);
    }
  }

  // Format as dd/mm/yyyy
  const day = String(this.getDate()).padStart(2, '0');
  const month = String(this.getMonth() + 1).padStart(2, '0');
  const year = this.getFullYear();
  return `${day}/${month}/${year}`;
};

// Overwrite toLocaleString
Date.prototype.toLocaleString = function (locale, options) {
  if (options) {
    const hasDay = 'day' in options;
    const hasMonth = 'month' in options;
    const hasYear = 'year' in options;
    const hasWeekday = 'weekday' in options;

    // If caller requests only partial date component, delegate to original
    if (hasWeekday && !hasDay) {
      return originalToLocaleString.call(this, locale, options);
    }
    if (hasMonth && !hasDay) {
      return originalToLocaleString.call(this, locale, options);
    }
    if (hasYear && !hasMonth && !hasDay) {
      return originalToLocaleString.call(this, locale, options);
    }
  }

  // Format date component as dd/mm/yyyy
  const day = String(this.getDate()).padStart(2, '0');
  const month = String(this.getMonth() + 1).padStart(2, '0');
  const year = this.getFullYear();
  const dateStr = `${day}/${month}/${year}`;

  const hasHour = options && 'hour' in options;
  const hasMinute = options && 'minute' in options;
  const hasSecond = options && 'second' in options;

  // If time formatting options are provided, or if no options are specified (meaning default time inclusion is expected)
  if (!options || hasHour || hasMinute || hasSecond) {
    let hours = this.getHours();
    const minutes = String(this.getMinutes()).padStart(2, '0');
    const seconds = String(this.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes}${hasSecond ? `:${seconds}` : ''} ${ampm}`;
    return `${dateStr}, ${timeStr}`;
  }

  return dateStr;
};
