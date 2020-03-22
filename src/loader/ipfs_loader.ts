import fetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent';

interface LoadOption {
  endpoint: string;
  proxy?: string;
}

const defaultLoadOpts: LoadOption = {
  endpoint: 'https://ipfs.io',
}

export default class IpfsLoader {
  opt: LoadOption;

  constructor(opt?: LoadOption) {
    this.opt = Object.assign({}, defaultLoadOpts, opt || {});
  }

  async loadFromUri(cid: string): Promise<Buffer> {
    let res;
    if (this.opt.proxy) {
      res = await fetch(`${this.opt.endpoint}/ipfs/${cid}`, { agent: new HttpsProxyAgent(this.opt.proxy) });
    } else {
      res = await fetch(`${this.opt.endpoint}/ipfs/${cid}`);
    }
    return await res.buffer();
  }
}