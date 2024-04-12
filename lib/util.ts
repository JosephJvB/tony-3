export const getS3FriendlyDate = (date: Date) => {
  // input "17/11/2023, 12:44:00"
  // output "17.11.2023-12:44:00"
  return date
    .toLocaleString()
    .replace(/\//g, '.')
    .replace(/ /g, '')
    .replace(',', '-')
}
