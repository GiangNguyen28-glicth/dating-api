// eslint-disable-next-line @typescript-eslint/no-var-requires
const getPlaiceholder = (...args) =>
  import('plaiceholder').then(({ default: getPlaiceholder }) => getPlaiceholder(...args));

export const encodeImageToBlurhash = async (imageUrl: string) => {
  const buffer = await fetch(imageUrl).then(async res => Buffer.from(await res.arrayBuffer()));
  const { base64 } = await getPlaiceholder(buffer);
  return base64;
  // return encode(imageData.data, imageData.width, imageData.height, 4, 4);
};
