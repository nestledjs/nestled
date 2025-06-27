import dayjs from 'dayjs'

export function getDateFromDateTime(yourDate: string) {
  if (!yourDate) return null
  return yourDate.split('T')[0]
}
export function formatDateFromDateTime(yourDate: string, shortDate?: boolean) {
  if (!yourDate) return null
  return dayjs(getDateFromDateTime(yourDate)).format(shortDate ? 'MM/DD/YYYY' : 'MMMM DD, YYYY')
}
