/**
 * Mobie2Text テスト
 *
 * Run tests: npm test
 * Watch mode: npm test -- --watch
 * Coverage: npm test -- --coverage
 */

import { describe, it, expect } from 'vitest'

describe('YouTube URL Parser', () => {
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  it('should extract ID from standard YouTube URL', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ')
  })

  it('should extract ID from short YouTube URL', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ'
    expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ')
  })

  it('should extract ID from embed URL', () => {
    const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ')
  })

  it('should extract ID from shorts URL', () => {
    const url = 'https://www.youtube.com/shorts/abc123xyz'
    expect(extractYouTubeId(url)).toBe('abc123xyz')
  })

  it('should return null for invalid URL', () => {
    expect(extractYouTubeId('https://example.com')).toBeNull()
    expect(extractYouTubeId('not a url')).toBeNull()
  })
})

describe('Environment', () => {
  it('should have Node.js environment', () => {
    expect(typeof process).toBe('object')
    expect(process.env).toBeDefined()
  })
})
