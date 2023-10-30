import { Injectable } from '@nestjs/common';
import { v2 } from 'cloudinary';
import fetch from 'node-fetch';
import { getPlaiceholder } from 'plaiceholder';

@Injectable()
export class ImageService {
  async transformImage(url: string, user_id: string): Promise<string> {
    const result = await v2.uploader.upload(url, {
      public_id: `BLUR_IMAGE_${user_id}`,
      unique_filename: true,
      overwrite: true,
      type: 'private',
      transformation: {
        effect: 'blur:1000',
        height: 500,
        width: 500,
      },
    });
    return result.url;
  }

  async encodeImageToBlurhash(imageUrl: string): Promise<string> {
    const buffer = await fetch(imageUrl).then(async res => Buffer.from(await res.arrayBuffer()));
    const { base64 } = await getPlaiceholder(buffer, { size: 4 });
    return base64;
  }
}
