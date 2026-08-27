import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dummy",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "dummy",
  },
});

export async function uploadToS3(buffer: Buffer, filename: string, mimeType: string) {
  const bucketName = process.env.AWS_S3_BUCKET_NAME || "gym-trainer-videos";
  // sanitize filename
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.]/g, "_");
  const key = `uploads/${Date.now()}-${cleanFilename}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  // Generate a signed URL for reading the file temporarily (valid for 1 hour)
  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

  return {
    key,
    url: signedUrl,
  };
}
