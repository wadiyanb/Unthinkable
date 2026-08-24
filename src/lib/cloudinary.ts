import cloudinary from 'cloudinary'

const cloudinaryV2 = cloudinary.v2

cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function uploadImage(
  file: Buffer | string,
  options: { folder?: string; public_id?: string } = {}
): Promise<{ url: string; publicId: string }> {
  const result = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
    const uploadOptions: cloudinary.UploadApiOptions = {
      folder: options.folder ?? 'society-complaints',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      max_bytes: 5 * 1024 * 1024, // 5MB
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
        { width: 1200, height: 1200, crop: 'limit' },
      ],
      ...options,
    }

    if (typeof file === 'string') {
      cloudinaryV2.uploader.upload(file, uploadOptions, (error, result) => {
        if (error) reject(error)
        else resolve(result!)
      })
    } else {
      const stream = cloudinaryV2.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) reject(error)
        else resolve(result!)
      })
      stream.end(file)
    }
  })

  return {
    url: result.secure_url,
    publicId: result.public_id,
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinaryV2.uploader.destroy(publicId)
}

export default cloudinaryV2
