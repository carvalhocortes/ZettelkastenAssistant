const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const expirationTime = 60 // seconds

const bucketName = process.env.FILES_BUCKET
const accessKeyId = process.env.ACCESS_KEY_ID
const secretAccessKey = process.env.SECRET_ACCESS_KEY
const region = process.env.REGION

const generatePreSignedUrl = async (fileKey) => {
  const s3Client = new S3Client({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    region
  })
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey
  })
  return getSignedUrl(s3Client, command, { expiresIn: expirationTime })
}

module.exports = {
  generatePreSignedUrl
}
