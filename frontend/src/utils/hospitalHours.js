/**
 * Hospital Operating Hours & Open/Closed Status Engine
 * Dynamically computes open vs closed status against local time
 */

export function getHospitalOperatingStatus(openingHoursStr, emergencyAvailable = true) {
  if (!openingHoursStr) {
    return {
      isOpen: true,
      statusText: emergencyAvailable ? '24/7 Open' : 'Open Today',
      emergencyNote: emergencyAvailable ? '24/7 Emergency Active' : null,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }

  const str = String(openingHoursStr).trim();
  if (str.toLowerCase().includes('24/7')) {
    return {
      isOpen: true,
      statusText: '24/7 Open',
      emergencyNote: emergencyAvailable ? '24/7 Emergency Active' : null,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }

  // Parse time e.g. "Closes 10:00 PM" or "10:00 PM" or "9:00 PM"
  const matchWithMin = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  const matchWithoutMin = str.match(/(\d{1,2})\s*(AM|PM)/i);

  let closeHour = 22; // default 10 PM
  let closeMin = 0;
  let formattedTime = '10:00 PM';

  if (matchWithMin) {
    closeHour = parseInt(matchWithMin[1], 10);
    closeMin = parseInt(matchWithMin[2], 10);
    const ampm = matchWithMin[3].toUpperCase();
    if (ampm === 'PM' && closeHour < 12) closeHour += 12;
    if (ampm === 'AM' && closeHour === 12) closeHour = 0;
    formattedTime = `${matchWithMin[1]}:${matchWithMin[2]} ${ampm}`;
  } else if (matchWithoutMin) {
    closeHour = parseInt(matchWithoutMin[1], 10);
    const ampm = matchWithoutMin[2].toUpperCase();
    if (ampm === 'PM' && closeHour < 12) closeHour += 12;
    if (ampm === 'AM' && closeHour === 12) closeHour = 0;
    formattedTime = `${matchWithoutMin[1]}:00 ${ampm}`;
  }

  const now = new Date();
  const currentTotalMin = now.getHours() * 60 + now.getMinutes();
  const closeTotalMin = closeHour * 60 + closeMin;
  const openTotalMin = 8 * 60; // 8:00 AM standard morning opening

  const isClosed = currentTotalMin >= closeTotalMin || currentTotalMin < openTotalMin;

  if (isClosed) {
    return {
      isOpen: false,
      statusText: 'Closed • Opens 8:00 AM',
      emergencyNote: emergencyAvailable ? '24/7 Emergency Active' : null,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
    };
  }

  return {
    isOpen: true,
    statusText: `Open • Closes ${formattedTime}`,
    emergencyNote: emergencyAvailable ? '24/7 Emergency Active' : null,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
}
