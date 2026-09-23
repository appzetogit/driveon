/**
 * Recursively scans API response data and resolves relative /uploads paths
 * to absolute backend URLs. Bypasses File/Blob objects to protect frontend file uploading.
 *
 * @param {*} obj - Response payload (string, object, array, or primitive)
 * @param {string} origin - Backend origin URL (e.g. http://localhost:5000 or https://api.driveoncar.co.in)
 * @returns {*} Transformed payload with absolute URLs
 */
export const resolveUploadsUrls = (obj, origin) => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // If it's a relative uploads path, prepend the backend origin
    if (obj.startsWith('/uploads/') && !obj.startsWith('//') && !obj.startsWith('data:')) {
      const baseOrigin = (origin || '').endsWith('/') ? origin.slice(0, -1) : (origin || '');
      return `${baseOrigin}${obj}`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => resolveUploadsUrls(item, origin));
  }

  if (typeof obj === 'object') {
    // Protect raw binary/DOM objects
    if (
      (typeof Blob !== 'undefined' && obj instanceof Blob) ||
      (typeof File !== 'undefined' && obj instanceof File) ||
      (typeof HTMLElement !== 'undefined' && obj instanceof HTMLElement)
    ) {
      return obj;
    }
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = resolveUploadsUrls(obj[key], origin);
      }
    }
    return newObj;
  }

  return obj;
};

export default resolveUploadsUrls;
