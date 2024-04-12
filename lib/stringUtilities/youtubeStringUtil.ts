import { extractSpotifyId } from '../externalAPI/spotify'
import { YoutubeVideo } from '../externalAPI/youtube'

export type YoutubeTrackProps = {
  name: string
  artist: string
  link: string
}

export type YoutubeTrack = YoutubeTrackProps & {
  id: string
  year: number
  videoPublishedDate: string
  spotifyId: string | null
}

export const BEST_TRACK_PREFIXES = ['!!!BEST', '!!BEST', '!BEST']
export const RAW_REVIEW_TITLES = [
  'MIXTAPE',
  'EP',
  'ALBUM',
  'TRACK',
  'COMPILATION',
]

// The following methods should have lots of tests
// They are parsing the YT description, which is really volatile human inputted yadda yadda
export const getTracksFromVideo = (v: YoutubeVideo) => {
  const sections = v.snippet.description
    .replace(/–/g, '-')
    .replace(/\r/g, '')
    .replace(/\n \n/g, '\n\n')
    .split('\n\n\n')
    .map((s) => s.split('\n\n').map((l) => l.trim()))

  const bestTrackList =
    sections
      .find((s) => !!BEST_TRACK_PREFIXES.find((pref) => s[0].startsWith(pref)))
      ?.slice(1) ?? []

  if (!bestTrackList?.length) {
    console.error('failed to find bestTrackList', {
      id: v.id,
      title: v.snippet.title,
    })
  }

  const year = new Date(v.snippet.publishedAt).getFullYear()

  return bestTrackList
    .map((l) => getYoutubeTrackProps(l))
    .map((t) => ({
      id: [t.artist, t.name, year].join('__'),
      ...t,
      year,
      videoPublishedDate: v.snippet.publishedAt,
      spotifyId: extractSpotifyId(t.link, 'track'),
    }))
}

export const getYoutubeTrackProps = (line: string) => {
  const lineSplit = line.split('\n').map((s) => s.trim())

  const [youtubeTrack, link] = lineSplit

  const [artist, name] = youtubeTrack.split(' - ')

  return {
    name: name?.trim() ?? '',
    artist: artist?.trim() ?? '',
    link: link?.trim() ?? '',
  }
}

export const isWeeklyTracksVideo = (v: YoutubeVideo) => {
  if (v.snippet.channelId !== v.snippet.videoOwnerChannelId) {
    return false
  }
  if (v.status.privacyStatus === 'private') {
    return false
  }
  // playlist is "Weekly Track Roundup / Raw Reviews"
  // skip raw reviews
  const reviewTitle = RAW_REVIEW_TITLES.find((rt) =>
    v.snippet.title.includes(rt)
  )
  if (!!reviewTitle) {
    return false
  }

  return true
}
