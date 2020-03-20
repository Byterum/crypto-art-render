import render from '../src/render';
import { MasterConfig } from '../src/master_config';
import * as fs from 'fs';
import Render from '../src/render';
import Generator from '../src/generator';

describe('test artwork render', () => {
  let config: MasterConfig;
  let gen: Generator;
  let render: Render;
  beforeAll(() => {
    config = JSON.parse(fs.readFileSync('./config_example/example1.json').toString());
    gen = new Generator();
    render = new Render();
  })
  test('render ipfs artwork Qmaje8byBxmFTHDjCvDYLy1NPZkUX1Etx1agDw5HxNqtef', async () => {

  })
})