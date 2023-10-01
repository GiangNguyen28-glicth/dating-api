import { Injectable } from '@nestjs/common';
import axios from 'axios';
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

  async convertUrlImageToBase64(imageUrl: string): Promise<string> {
    try {
      const transformImageUrl = await v2.image(imageUrl, {
        transformation: [
          {
            effect: 'blur:500',
            width: 100,
            height: 100,
          },
        ],
      });
      const response = await axios.get(transformImageUrl, { responseType: 'arraybuffer' });
      if (response.status === 200) {
        const contentType = response.headers['content-type'];
        const data = Buffer.from(response.data, 'binary').toString('base64');
        const base64Image = `data:${contentType};base64,${data}`;
        return base64Image;
      } else {
        console.error('Failed to fetch the image:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error:', error.message);
      return null;
    }
  }
}
