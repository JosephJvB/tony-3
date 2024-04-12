import {
  CopyObjectCommand,
  CopyObjectRequest,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

const client = new S3Client()

export const putFile = async (filePath: string, contents: string) => {
  const putFileCmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: filePath,
    Body: contents,
  })

  await client.send(putFileCmd)
}

export const copyFile = async (
  source: string,
  destination: {
    bucket: string
    key: string
  },
  params: Partial<CopyObjectRequest> = {}
) => {
  const copyFileCmd = new CopyObjectCommand({
    CopySource: source,
    Bucket: destination.bucket,
    Key: destination.key,
    ...params,
  })

  await client.send(copyFileCmd)
}
