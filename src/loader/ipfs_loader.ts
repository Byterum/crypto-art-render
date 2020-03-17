import fetch from 'node-fetch'

export default async function loadFromUri(uri: string): Promise<Buffer> {
  const res = await fetch(uri);
  return res.buffer();
}