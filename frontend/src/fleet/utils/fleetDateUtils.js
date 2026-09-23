const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toUtcDayNumber = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-').map((p) => Number(p));
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
};

export const isValidDateRange = (fromDate, toDate) => {
  const fromDay = toUtcDayNumber(fromDate);
  const toDay = toUtcDayNumber(toDate);
  if (fromDay === null || toDay === null) return false;
  // toDate must be strictly after fromDate (at least 1 full day = 24 hours)
  return toDay > fromDay;
};

export const getNumberOfDaysInclusive = (fromDate, toDate) => {
  const fromDay = toUtcDayNumber(fromDate);
  const toDay = toUtcDayNumber(toDate);
  if (fromDay === null || toDay === null) return 0;
  if (toDay < fromDay) return 0;
  return toDay - fromDay + 1;
};

/**
 * getDaysBetween — 24-hour period counting.
 * Today 3pm → Tomorrow 3pm = 1 day (not 2).
 * Simply toDay - fromDay (no +1).
 */
export const getDaysBetween = (fromDate, toDate) => {
  const fromDay = toUtcDayNumber(fromDate);
  const toDay = toUtcDayNumber(toDate);
  if (fromDay === null || toDay === null) return 0;
  if (toDay < fromDay) return 0;
  return toDay - fromDay;
};

export const getDaysBetweenWithTime = (fromDate, startTime, toDate, endTime) => {
  if (!fromDate || !toDate || !startTime || !endTime) return 0;
  const start = new Date(`${fromDate}T${startTime}`);
  const end = new Date(`${toDate}T${endTime}`);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  const diffInMs = end.getTime() - start.getTime();
  if (diffInMs <= 0) return 0;
  return Math.ceil(diffInMs / (24 * 60 * 60 * 1000));
};

export const rangesOverlapInclusive = (aFrom, aTo, bFrom, bTo) => {
  const aFromDay = toUtcDayNumber(aFrom);
  const aToDay = toUtcDayNumber(aTo);
  const bFromDay = toUtcDayNumber(bFrom);
  const bToDay = toUtcDayNumber(bTo);
  if ([aFromDay, aToDay, bFromDay, bToDay].some((v) => v === null)) return false;
  return aFromDay <= bToDay && bFromDay <= aToDay;
};

export const isTodayWithinRangeInclusive = (fromDate, toDate) => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  return rangesOverlapInclusive(fromDate, toDate, todayStr, todayStr);
};

