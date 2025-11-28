// @ts-ignore
const postersContext = require.context('../../backend/assets/posters', false, /\.jpg$/);

const posterMap: Record<string, any> = {};

postersContext.keys().forEach((key: string) => {
  const fileName = key.replace('./', '');
  const id = fileName.replace('.jpg', '');
  posterMap[id] = postersContext(key);
});

export const getPosterById = (id: number | string): any => {
  return posterMap[String(id)];
};

export default posterMap;
