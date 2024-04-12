import { YoutubeTrack } from './youtubeStringUtil'

export const SPOTIFY_ID_LENGTH = 22
export const SPOTIFY_DOMAIN = 'open.spotify.com'
export const PLAYLIST_NAME_PREFIX = "TONY'S TOP TRACKS "

const FEATURE_PREFIXES = [
  ' ft. ',
  ' ft ',
  ' feat. ',
  ' feat ',
  ' prod. ',
  ' prod ',
]

export const idToUri = (id: string, type: 'track') => {
  if (id.length !== SPOTIFY_ID_LENGTH) {
    throw new Error(`invalid spotify id ${JSON.stringify({ id })}`)
  }

  return `spotify:${type}:${id}`
}

// https://open.spotify.com/track/1nxudYVyc5RLm8LrSMzeTa?si=-G3WGzRgTDq8OuRa688FMg
// https://open.spotify.com/album/3BFHembK3fNseQR5kAEE2I
export const extractSpotifyId = (link: string, type: 'album' | 'track') => {
  if (!link) {
    return null
  }

  let url: URL | null = null

  try {
    url = new URL(link)
  } catch {}

  if (url === null) {
    return null
  }

  if (url.host !== SPOTIFY_DOMAIN) {
    return null
  }

  const [urlType, id] = url.pathname.split('/').slice(1)

  if (urlType !== type) {
    return null
  }

  if (id.length !== SPOTIFY_ID_LENGTH) {
    throw new Error(`failed to parse trackId ${JSON.stringify({ link, id })}`)
  }

  return id
}

export const getYearFromPlaylistName = (name: string) => {
  if (!name.startsWith(PLAYLIST_NAME_PREFIX)) {
    return null
  }

  let year: number | null = null

  try {
    year = parseInt(name.replace(PLAYLIST_NAME_PREFIX, ''))
  } catch {}

  return year
}

export const normalizeArtistName = (track: YoutubeTrack) => {
  let normalized = track.artist
    .replace(/ & /g, ' ')
    .replace(/ and /g, ' ')
    .replace(/, /g, ' ')
    .replace(/ \/ /gi, ' ')
    .replace(/ \+ /gi, ' ')
    .replace(/ x /gi, ' ')
    .replace(/"/g, '')
    .replace(/'/g, '')

  return normalized
}

export const normalizeTrackName = (track: YoutubeTrack) => {
  let normalized = track.name
    .replace(/"/g, '')
    .replace(/'/g, '')
    // probably need to review these replacements
    // likely ["/", ",", "&"] in trackname means tony's linked multiple tracks
    .replace(/\//g, '')
    .replace(/\\/g, '')
  // // https://stackoverflow.com/questions/4292468/javascript-regex-remove-text-between-parentheses#answer-4292483
  // .replace(/ *\([^)]*\)*/g, '')

  // prefer this:
  const openParensIdx = normalized.indexOf('(')
  const closeParensIdx = normalized.lastIndexOf(')')
  if (openParensIdx !== -1 && closeParensIdx !== -1) {
    const first = normalized.substring(0, openParensIdx).trim()
    const second = normalized.substring(closeParensIdx + 1)
    normalized = first + second
  }

  FEATURE_PREFIXES.forEach((pref) => {
    const ftIdx = normalized.toLowerCase().indexOf(pref)
    if (ftIdx !== -1) {
      normalized = normalized.substring(0, ftIdx)
    }
  })

  return normalized
}

export const normalizeYear = (track: YoutubeTrack) => {
  // widen search by omitting year
  return undefined
}

export const normalizeLink = (track: YoutubeTrack) => {
  // widen search by omitting link
  return ''
}
