import dayjs from 'dayjs'

export function getDateFromDateTime(yourDate: string) {
  if (!yourDate) return null
  return yourDate.split('T')[0]
}

export function formatDateFromDateTime(yourDate: string, shortDate?: boolean) {
  if (!yourDate) return null
  return dayjs(getDateFromDateTime(yourDate)).format(shortDate ? 'MM/DD/YYYY' : 'MMMM DD, YYYY')
}

export function getDateTimeFromValue(yourDateTime: string) {
  if (!yourDateTime) return null
  // Ensure the datetime string is in the correct format for datetime-local input
  return yourDateTime.slice(0, 16) // YYYY-MM-DDTHH:MM
}

export function formatDateTimeFromValue(yourDateTime: string, shortFormat?: boolean) {
  if (!yourDateTime) return null
  return dayjs(yourDateTime).format(shortFormat ? 'MM/DD/YYYY h:mm A' : 'MMMM DD, YYYY h:mm A')
}
