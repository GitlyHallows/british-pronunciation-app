import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAwsEnv } from "@/lib/env";

let s3Client: S3Client | null = null;

function getClient() {
  if (!s3Client) {
    const env = getAwsEnv();
    s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY
      }
    });
  }
  return s3Client;
}

export async function createUploadUrl(params: { key: string; contentType: string }) {
  const env = getAwsEnv();
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: params.key,
    ContentType: params.contentType
  });

  const uploadUrl = await getSignedUrl(getClient(), command, {
    expiresIn: env.AWS_S3_PRESIGN_TTL_SECONDS
  });

  return { uploadUrl, bucket: env.AWS_S3_BUCKET, key: params.key };
}

export async function createDownloadUrl(params: { key: string }) {
  const env = getAwsEnv();
  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: params.key
  });

  const downloadUrl = await getSignedUrl(getClient(), command, {
    expiresIn: env.AWS_S3_PRESIGN_TTL_SECONDS
  });

  return { downloadUrl };
}

export async function deleteObjectFromS3(params: { key: string }) {
  const env = getAwsEnv();
  const command = new DeleteObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: params.key
  });

  await getClient().send(command);
}
