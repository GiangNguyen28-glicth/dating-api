import fetch from 'node-fetch';
import { getPlaiceholder } from 'plaiceholder';
import * as fs from 'fs';
export const encodeImageToBlurhash = async (imageUrl: string) => {
  const buffer = await fetch(imageUrl).then(async res => Buffer.from(await res.arrayBuffer()));
  const { base64 } = await getPlaiceholder(buffer, { size: 64 });
  fs.writeFileSync('data.txt', base64);
  return base64;
};
setTimeout(async () => {
  await encodeImageToBlurhash(
    'https://res.cloudinary.com/giangnguyen/image/upload/e_blur:800/v1693355344/v7mmkxdaeqivm9qcohfh.jpg',
  );
});
