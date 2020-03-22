import { MasterConfig } from '../src/master_config';
import * as fs from 'fs';
import Render from '../src/render';
import Generator from '../src/generator';
import IpfsLoader from '../src/loader/ipfs_loader';
import EosAPI from '../src/blockchain/eos';
import Jimp from 'jimp';

// Have generate master token 0
describe('test artwork render', () => {
  let exampleConfig: MasterConfig;
  let gen: Generator;
  let render: Render;
  // you should start ipfs local endpoint first
  const localIPFSEndpoint = 'http://127.0.0.1:8080'
  const masterId = 0;
  const cid = 'QmQRYre2kUKd3VW13CeY6zowwyK8RwXqbJxkjzpVS6cyrc';
  const contract = 'cryptoart';
  beforeAll(async () => {
    exampleConfig = JSON.parse(fs.readFileSync('test/config_example/example1.json').toString());
    gen = new Generator();
    render = new Render(new IpfsLoader({ endpoint: localIPFSEndpoint }));

    // mint artwork
    const api = new EosAPI();
    gen.setConfig(exampleConfig);
    try {
      const minValues = [0, 0, -360];
      const maxValues = [3, 1800, 360];
      const currValues = [0, 0, 0];
      const master = await api.getMasterToken(contract, masterId);
      if (master) return;
      await gen.mintArtwork(api, contract, 'eosio', 'eosio', cid);
      await gen.setuptoken(api, contract, 'eosio', masterId, 1, minValues, maxValues, currValues);
      await gen.setuptoken(api, contract, 'eosio', masterId, 2, [0], [1], [0]);
    } catch (e) {
      console.warn('Skip: tokens has been setup')
    }
  })

  it('render master layer of artwork by master token 0', async () => {
    const image = await render.renderMaster(contract, masterId);
    if (image.getWidth() > 3000) {
      image.resize(720, Jimp.AUTO);
    }
    await image.writeAsync('test/output/master-test.png');
  })

  it('render composite layer of artwork by master token 0', async () => {
    const image = await render.renderComposite(contract, masterId);
    if (image.getWidth() > 3000) {
      image.resize(720, Jimp.AUTO);
    }
    await image.writeAsync('test/output/composite-test.png');
  })
})