import { SSM_PARAMS } from '../aws/ssm'

export const YOUTUBE_PLAYIST_ID = 'PLP4CSgl7K7or84AAhr7zlLNpghEnKWu2c'

const BASE_URL = 'https://www.googleapis.com/youtube/v3'

export type YoutubeVideo = {
  id: string
  snippet: {
    publishedAt: string
    title: string
    description: string
    channelId: string
    videoOwnerChannelId: string
  }
  status: {
    privacyStatus: 'public' | 'private'
  }
}
export type ApiResponse<T> = {
  nextPageToken?: string
  prevPageToken?: string
  items: T[]
}
export type ApiQuery = {
  key: string
}
export type YoutubePlaylistItemQuery = ApiQuery & {
  playlistId: string
  part: string
  maxResults: number
  pageToken?: string
}

export const getYoutubePlaylistItems = async () => {
  const allItems: YoutubeVideo[] = []
  let pageToken: string | undefined

  do {
    if (pageToken) {
      await new Promise((r) => setTimeout(r, 300))
    }

    const params: YoutubePlaylistItemQuery = {
      key: SSM_PARAMS.YOUTUBE_API_KEY,
      playlistId: YOUTUBE_PLAYIST_ID,
      part: 'snippet,status',
      maxResults: 50,
      ...(!!pageToken && { pageToken }),
    }

    const urlSearchParams = new URLSearchParams(
      params as Record<string, any>
    ).toString()

    const res = await fetch(`${BASE_URL}/playlistItems?${urlSearchParams}`)
    const data: ApiResponse<YoutubeVideo> = await res.json()

    if (!res.ok) {
      throw new Error(
        ['Failed to fetch youtube playlist items:', JSON.stringify(data)].join(
          '\n'
        )
      )
    }

    allItems.push(...data.items)
    pageToken = data.nextPageToken
  } while (!!pageToken)

  return allItems
}
