import fetch from 'node-fetch'

export default async function loadFromUri(cid: string): Promise<Buffer> {
  const res = await fetch(`https://ipfs.io/ipfs/${cid}`);
  return res.buffer();
}