import { MISSING_TRACKS_LINK } from './googleSheets'
import { SSM_PARAMS } from './ssm'

export const SPOTIFY_JVB_USERID = 'xnmacgqaaa6a1xi7uy2k1fe7w'
export const SPOTIFY_ID_LENGTH = 22
export const SPOTIFY_DOMAIN = 'open.spotify.com'
export const SPOTIFY_REQUIRED_SCOPES = [
  'playlist-modify-private',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ')
export const PLAYLIST_NAME_PREFIX = "TONY'S TOP TRACKS "
export const PLAYLIST_DESCRIPTION = `missing tracks list: ${MISSING_TRACKS_LINK}`

export const API_BASE_URL = 'https://api.spotify.com/v1'
export const ACCOUNTS_BASE_URL = 'https://accounts.spotify.com/api'

const FEATURE_PREFIXES = [
  ' ft. ',
  ' ft ',
  ' feat. ',
  ' feat ',
  ' prod. ',
  ' prod ',
]

export type SpotifySearchParams = {
  // album, artist, track, year, upc, tag:hipster, tag:new, isrc, genre
  q: string
  type: 'track' | 'album'
  limit: number
}
export type SearchResults<T> = {
  tracks: {
    href: string
    items: T[]
  }
}
export type SpotifyTrack = {
  id: string
  uri: string
  href: string
  name: string
  artists: SpotifyArtist[]
}
export type SpotifyArtist = {
  id: string
  uri: string
  href: string
  name: string
}
export type PlaylistItem = {
  added_at: string
  track: SpotifyTrack
}
export type SpotifyPlaylist = {
  id: string
  name: string
  description: string
  public: boolean
  collaborative: boolean
  tracks: {
    total: number
    items: PlaylistItem[]
  }
}
export type PaginatedResponse<T> = {
  items: T[]
  next?: string
}

let BASIC_TOKEN: string | undefined
let ACCESS_TOKEN: string | undefined

export const setBasicToken = async () => {
  if (!BASIC_TOKEN) {
    const res = await requestBasicToken()
    BASIC_TOKEN = res.access_token
  }
}

export const requestBasicToken = async () => {
  const res = await fetch(`${ACCOUNTS_BASE_URL}/token`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SSM_PARAMS.SPOTIFY_CLIENT_ID,
      client_secret: SSM_PARAMS.SPOTIFY_SECRET,
    }),
  })
  const data: { access_token: string } = await res.json()

  if (!res.ok) {
    throw new Error(
      ['requestBasicToken failed', JSON.stringify(data)].join('\n')
    )
  }

  return data
}

export const setAccessToken = async () => {
  if (!ACCESS_TOKEN) {
    const res = await requestAccessToken()
    ACCESS_TOKEN = res.access_token
  }
}

export const requestAccessToken = async () => {
  const basicAuth = Buffer.from(
    `${SSM_PARAMS.SPOTIFY_CLIENT_ID}:${SSM_PARAMS.SPOTIFY_SECRET}`
  ).toString('base64')

  const res = await fetch(`${ACCOUNTS_BASE_URL}/token`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SSM_PARAMS.SPOTIFY_REFRESH_TOKEN,
    }),
  })

  const data: { access_token: string } = await res.json()
  if (!res.ok) {
    throw new Error(
      ['requestAccessToken failed', JSON.stringify(data)].join('\n')
    )
  }

  return data
}

export const getTracks = async (trackIds: string[]) => {
  const searchParams = new URLSearchParams({
    ids: trackIds.join(','),
  }).toString()

  const res = await fetch(`${API_BASE_URL}/tracks?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${BASIC_TOKEN}`,
    },
  })
  const data: {
    tracks: SpotifyTrack[]
  } = await res.json()

  if (!res.ok) {
    throw new Error(['getTracks failed', JSON.stringify(data)].join('\n'))
  }

  return data
}

export const findTrack = async (
  track: any, // TODO: correct type
  retry = true
): Promise<SearchResults<SpotifyTrack>> => {
  const { name, artist, link, year } = track

  const params: SpotifySearchParams = {
    q: `track:${name} artist:${artist}`,
    type: 'track',
    limit: 1,
  }

  if (year) {
    params.q += ` year:${year}`
  }
  const albumId = extractSpotifyId(link, 'album')
  if (albumId) {
    params.q += ` album:${albumId}`
  }

  const searchParams = new URLSearchParams(
    params as Record<string, any>
  ).toString()
  const res = await fetch(`${API_BASE_URL}/search?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${BASIC_TOKEN}`,
    },
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(['findTrack failed', JSON.stringify(data)].join('\n'))
  }

  if (data.tracks.items.length === 0 && retry) {
    return findTrack(
      {
        ...track,
        // TODO: fix types
        name: normalizeTrackName(track as any),
        artist: normalizeArtistName(track as any),
        year: normalizeYear(track as any) as any,
        link: normalizeLink(track as any),
      },
      false // do not retry again
    )
  }

  return data
}

export const getMyPlaylists = async () => {
  const myPlaylists: SpotifyPlaylist[] = []

  let hasMore = false
  do {
    const searchParams = new URLSearchParams({
      limit: '50',
      offset: myPlaylists.length.toString(),
    }).toString()
    const res = await fetch(`${API_BASE_URL}/me/playlists?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    })

    const data: PaginatedResponse<SpotifyPlaylist> = await res.json()
    if (!res.ok) {
      throw new Error(
        ['getMyPlaylists failed', JSON.stringify(data)].join('\n')
      )
    }

    myPlaylists.push(...data.items)
    hasMore = !!data.next
  } while (hasMore)

  return myPlaylists
}

export const createPlaylist = async (year: number) => {
  const newPlaylist: Omit<SpotifyPlaylist, 'id' | 'tracks'> = {
    name: `${PLAYLIST_NAME_PREFIX}${year}`,
    description: PLAYLIST_DESCRIPTION,
    public: true,
    collaborative: false,
  }

  const res = await fetch(
    `${API_BASE_URL}/users/${SPOTIFY_JVB_USERID}/playlists`,
    {
      method: 'post',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(newPlaylist),
    }
  )
  const data: SpotifyPlaylist = await res.json()

  if (!res.ok) {
    throw new Error(['createPlaylist failed', JSON.stringify(data)].join('\n'))
  }

  return data
}

export const getPlaylistItems = async (playlistId: string) => {
  const playlistItems: PlaylistItem[] = []

  let hasMore = false
  do {
    const searchParams = new URLSearchParams({
      limit: '50',
      offset: playlistItems.length.toString(),
    }).toString
    const res = await fetch(
      `${API_BASE_URL}/playlists/${playlistId}/tracks?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    )

    const data: PaginatedResponse<PlaylistItem> = await res.json()
    if (!res.ok) {
      throw new Error(
        ['getPlaylistItems failed', JSON.stringify(data)].join('\n')
      )
    }

    playlistItems.push(...data.items)
    hasMore = !!data.next
  } while (hasMore)

  return playlistItems
}

export const addPlaylistItems = async (
  playlistId: string,
  trackIds: string[]
) => {
  const trackUris = trackIds.map((id) => idToUri(id, 'track'))

  for (let i = 0; i < trackUris.length; i += 100) {
    const uris = trackUris.slice(i, i + 100)

    const res = await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks`, {
      method: 'post',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ uris }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(
        ['addPlaylistItems failed', JSON.stringify(data)].join('\n')
      )
    }
  }
}

export const updatePlaylistDescription = async (
  playlistId: string,
  description: string
) => {
  await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
    method: 'put',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      description,
    }),
  })
}

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

// TODO: any
export const normalizeArtistName = (track: any) => {
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

// TODO: any
export const normalizeTrackName = (track: any) => {
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

// TODO: any
export const normalizeYear = (track: any) => {
  // widen search by omitting year
  return undefined
}

// TODO: any
export const normalizeLink = (track: any) => {
  // widen search by omitting link
  return ''
}
