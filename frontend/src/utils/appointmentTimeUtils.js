/**
 * Utility functions for dynamic real-time doctor appointment scheduling.
 * Synchronizes available dates and time slots with the current real-time clock.
 */

/**
 * Parses a 12-hour formatted time string (e.g. "09:30 AM", "01:30 PM", "04:30 PM")
 * into total minutes from start of day (0 - 1439).
 */
export function parseSlotToMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const isPM = match[3].toUpperCase() === 'PM';
  if (isPM && hours < 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Master catalog of appointment time slots by session.
 */
export const MASTER_TIME_SLOTS = {
  morning: ['09:30 AM', '10:00 AM', '10:30 AM', '11:30 AM'],
  afternoon: ['01:30 PM', '02:00 PM', '03:00 PM'],
  evening: ['04:30 PM', '05:30 PM', '06:30 PM', '07:00 PM']
};

export const ALL_MASTER_SLOTS = [
  ...MASTER_TIME_SLOTS.morning,
  ...MASTER_TIME_SLOTS.afternoon,
  ...MASTER_TIME_SLOTS.evening
];

/**
 * Formats a Date object into YYYY-MM-DD in local time.
 */
export function formatLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a specific time slot has already passed for a given date.
 * If the date is today, any slot earlier than current local time (+ buffer) is expired.
 */
export function isSlotExpired(slotTimeStr, targetDateStr, referenceDate = new Date(), bufferMinutes = 15) {
  const todayStr = formatLocalDateString(referenceDate);
  if (targetDateStr < todayStr) return true; // Past date
  if (targetDateStr > todayStr) return false; // Future date

  // Target date is TODAY
  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  const slotMinutes = parseSlotToMinutes(slotTimeStr);
  return slotMinutes <= (currentMinutes + bufferMinutes);
}

/**
 * Returns available time slots for a specific date, filtering out expired ones.
 */
export function getAvailableSlotsForDate(targetDateStr, referenceDate = new Date()) {
  const todayStr = formatLocalDateString(referenceDate);
  if (targetDateStr < todayStr) return [];

  const filterSlots = (slots) => slots.filter(slot => !isSlotExpired(slot, targetDateStr, referenceDate));

  return {
    morning: filterSlots(MASTER_TIME_SLOTS.morning),
    afternoon: filterSlots(MASTER_TIME_SLOTS.afternoon),
    evening: filterSlots(MASTER_TIME_SLOTS.evening),
    all: ALL_MASTER_SLOTS.filter(slot => !isSlotExpired(slot, targetDateStr, referenceDate))
  };
}

/**
 * Generates dynamic upcoming appointment dates (e.g. next 6 days) from the current clock.
 * - Today is labeled "Today" (if all slots have passed, marked hasSlots: false).
 * - Tomorrow is labeled "Tomorrow".
 * - Subsequent days are labeled with Day of week and Date (e.g. "Sat, 5 Sep").
 */
export function getDynamicAppointmentDates(referenceDate = new Date(), count = 6) {
  const dates = [];

  for (let i = 0; i < count; i++) {
    const d = new Date(referenceDate);
    d.setDate(referenceDate.getDate() + i);

    const dateStr = formatLocalDateString(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const dayDisplay = `${dayName}, ${d.getDate()} ${monthName}`;

    const isToday = i === 0;
    const isTomorrow = i === 1;

    const available = getAvailableSlotsForDate(dateStr, referenceDate);
    const hasSlots = available.all.length > 0;

    dates.push({
      date: dateStr,
      label: isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dayDisplay,
      day: dayDisplay,
      isToday,
      isTomorrow,
      hasSlots,
      remainingCount: available.all.length
    });
  }

  return dates;
}

/**
 * Resolves the default valid appointment date and slot.
 * If today has remaining slots, starts today; otherwise advances to tomorrow.
 */
export function getDefaultAppointmentSelection(referenceDate = new Date()) {
  const dates = getDynamicAppointmentDates(referenceDate);
  const firstAvailableDate = dates.find(d => d.hasSlots) || dates[1] || dates[0];
  const slots = getAvailableSlotsForDate(firstAvailableDate.date, referenceDate);
  const firstSlot = slots.all[0] || '10:00 AM';

  return {
    selectedDate: firstAvailableDate.date,
    selectedTime: firstSlot,
    availableDates: dates,
    availableSlots: slots
  };
}
