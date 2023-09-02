import { encode } from 'blurhash';
import { createCanvas, loadImage, Image } from 'canvas';

export const getImageData = (image: Image) => {
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  const dataURL = canvas.toDataURL('image/png');
  return dataURL;
};

export const encodeImageToBlurhash = async imageUrl => {
  const image = await loadImage(imageUrl);
  const imageData = getImageData(image);
  return imageData;
  // return encode(imageData.data, imageData.width, imageData.height, 4, 4);
};
