import { getS3FriendlyDate } from '../lib/stringUtilities/s3Date'

describe('s3Date', () => {
  describe('getS3FriendlyDate', () => {
    it('should return a date in the format "17.11.2023-12:44:00"', () => {
      const input = new Date('December 17, 1995 03:24:00')

      const result = getS3FriendlyDate(input)

      expect(result).toBe('17.12.1995-03:24:00')
    })
  })
})
