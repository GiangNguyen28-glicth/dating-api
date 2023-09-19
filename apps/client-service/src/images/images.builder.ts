import { encode } from 'blurhash';
import { createCanvas, loadImage, Image } from 'canvas';
import { getPlaiceholder } from 'plaiceholder';

export const getImageData = (image: Image) => {
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  const dataURL = canvas.toDataURL('image/png');
  return dataURL;
};

export const encodeImageToBlurhash = async (imageUrl: string) => {
  const buffer = await fetch(imageUrl).then(async res => Buffer.from(await res.arrayBuffer()));
  const { color } = await getPlaiceholder(buffer);

  // return encode(imageData.data, imageData.width, imageData.height, 4, 4);
};
