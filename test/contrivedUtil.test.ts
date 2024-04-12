import { addTwoNumbers } from '../lib/contrivedUtil'

describe('addTwoNumbers', () => {
  it('can add 2 and 3', () => {
    const result = addTwoNumbers(2, 3)
    expect(result).toBe(5)
  })

  it('can add -5 and 10', () => {
    const result = addTwoNumbers(-5, 10)
    expect(result).toBe(5)
  })

  it('can add 0 and 0', () => {
    const result = addTwoNumbers(0, 0)
    expect(result).toBe(0)
  })

  it('can add 100 and -100', () => {
    const result = addTwoNumbers(100, -100)
    expect(result).toBe(0)
  })
})
