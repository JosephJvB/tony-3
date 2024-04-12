import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

const client = new SSMClient()

export const SSM_PARAMS = {
  GOOGLE_CLIENT_EMAIL: '',
  GOOGLE_PRIVATE_KEY: '',
  SPOTIFY_CLIENT_ID: '',
  SPOTIFY_SECRET: '',
  SPOTIFY_REFRESH_TOKEN: '',
  YOUTUBE_API_KEY: '',
}
export type PARAM_KEYS = keyof typeof SSM_PARAMS

export const loadSsmParams = async () => {
  const keys = Object.keys(SSM_PARAMS) as PARAM_KEYS[]
  await Promise.all(
    keys.map(async (k) => {
      const paramName = process.env[`${k}_SSM`] // this is jank!
      SSM_PARAMS[k] = await getSsmParameter(paramName as string)
    })
  )
}

export const getSsmParameter = async (paramName: string) => {
  const cmd = new GetParameterCommand({
    Name: paramName,
  })

  const result = await client.send(cmd)

  if (!result.Parameter?.Value) {
    throw new Error(`Failed to find ssm parameter "${paramName}"`)
  }

  return result.Parameter.Value
}
