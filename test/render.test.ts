import { MasterConfig } from '../src/master_config';
import * as fs from 'fs';
import Render from '../src/render';
import Generator from '../src/generator';
import loadFromUri from '../src/loader/ipfs_loader';

// Have generate master token 0
describe('test artwork render', () => {
  let config: MasterConfig;
  let gen: Generator;
  let render: Render;
  const masterId = 0;
  const cid = 'Qmaje8byBxmFTHDjCvDYLy1NPZkUX1Etx1agDw5HxNqtef';
  beforeAll(() => {
    config = JSON.parse(fs.readFileSync('test/config_example/example1.json').toString());
    gen = new Generator();
    render = new Render();
  })
  test('load ipfs artwork Qmaje8byBxmFTHDjCvDYLy1NPZkUX1Etx1agDw5HxNqtef', async () => {
    config = await loadFromUri()
  })
})