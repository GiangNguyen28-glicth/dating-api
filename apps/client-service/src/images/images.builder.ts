import fetch from 'node-fetch';
import { getPlaiceholder } from 'plaiceholder';
import * as fs from 'fs';
export const encodeImageToBlurhash = async (imageUrl: string) => {
  const buffer = await fetch(imageUrl).then(async res => Buffer.from(await res.arrayBuffer()));
  const { base64 } = await getPlaiceholder(buffer, { size: 4 });
  fs.writeFileSync('data.txt', base64);
  return base64;
};
setTimeout(async () => {
  await encodeImageToBlurhash(
    'https://antimatter.vn/wp-content/uploads/2022/10/hinh-nen-gai-xinh-482x600.jpg?fbclid=IwAR2RMNijOyXT2wWzLG0W8vQA93cWT12wCe8fucfJVL2B-qFDVzpSeXrdIXY',
  );
});
