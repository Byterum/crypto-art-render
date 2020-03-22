import { MasterConfig, KEY_TRAIT_TYPE, KEY_FIXED_POS, KEY_STATES } from "../src/master_config"
import Generator from "../src/generator";
import * as fs from 'fs';
import EosAPI from "../src/blockchain/eos";
import { ChainAPI } from "../src/blockchain/datatype";
import { NftURI } from "nft-resolver";


describe('test artwork generator', () => {
  let generator: Generator;
  let exampleConfig: MasterConfig;
  let api = new EosAPI();
  const cid = 'QmQRYre2kUKd3VW13CeY6zowwyK8RwXqbJxkjzpVS6cyrc';
  beforeAll(async () => {
    generator = new Generator();
    exampleConfig = JSON.parse(fs.readFileSync('test/config_example/example1.json').toString()) as MasterConfig;
  })
  it('generate basic master config', () => {
    generator.initialize('test', 'test', cid);
    const basic = generator.masterConfig;
    expect(basic.name).toBe('test');
    expect(basic.description).toBe('test');
    expect(basic.image).toBe(cid);
  })

  it('add atributes in need', () => {
    const expected = [{
      [KEY_TRAIT_TYPE]: 'Artist',
      value: 'LowesYang'
    }, {
      [KEY_TRAIT_TYPE]: 'Artist',
      value: 'YYH'
    }, {
      [KEY_TRAIT_TYPE]: 'Layer Count',
      value: "4"
    }]
    generator.addAttributes(expected);

    expect(exampleConfig.attributes).toEqual(expected);
  })


  it('add layer `Background`', () => {
    generator.setLayout('layered_static', 1);
    const layerStates = {
      options: [
        {
          uri: "QmRoCMEQgSd6QQo9iA2HdDzwSuqoJ3TLEEzNrRdXm7cKYo",
          label: "Classic"
        },
        {
          uri: "QmXuz6bWxYuB1atjpYt1WJsiT2yfnJ38qHDXWur65fXAsR",
          label: "Light Oscillations"
        },
        {
          uri: "QmcmdZjGHTkkir2oe9wDTXQycKmujGUfDxL6B4Do8e9HyP",
          label: "Dark Oscillations",
          "fixed-position": {
            x: {
              "token-id": 9,
              "lever-id": 1
            },
            y: 300
          }
        },
        {
          uri: "Qme8YVzNDjjFxNgwkgSK8RgXJHvQumEx24DgU6SyVZ7kYy",
          label: "Electro Tiles",
          "fixed-rotaton": 100
        }
      ],
      "token-id": 1,
      "lever-id": 0
    }
    generator.addStatesLayer('Background', layerStates);
    const layer = generator.masterConfig.layout.layers[0];
    expect(layer.id).toBe('Background');
    expect(layer[KEY_STATES]).toEqual(layerStates)
  })

  it('add layer `andrew`', () => {
    const pureLayer = {
      uri: 'QmfSv545gdo6cjxscBvtyetZDCzEEESpnybBS76VY1BjXk',
      "fixed-position": {
        x: 2355,
        y: 1365
      }
    }

    generator.addPureLayer('andrew', pureLayer);
    expect(generator.masterConfig.layout.layers[1]).toEqual({ id: 'andrew', ...pureLayer });
  })

  it('add layer `andrew-feet`', () => {
    const pureLayer = {
      anchor: 'andrew',
      uri: 'QmX42RUqYXHrN8SD194BbGpxPzm7GGcPvAaB15rxohrCgU',
      "relative-position": {
        x: 100,
        y: 670
      },
      "orbit-rotation": {
        "token-id": 1,
        "lever-id": 1
      }
    }

    generator.addPureLayer('andrew-feet', pureLayer);
    expect(generator.masterConfig.layout.layers[2]).toEqual({ id: 'andrew-feet', ...pureLayer });
  })

  it('add layer `visible-test`', () => {
    const stateLayer = {
      options: [
        {
          label: 'Classic',
          width: 100,
          height: 100,
          visible: 0
        }
      ],
      "token-id": 2,
      "lever-id": 0
    }

    generator.addStatesLayer('visible-test', stateLayer);
    const layer = generator.masterConfig.layout.layers[3];
    expect(layer.id).toBe('visible-test');
    expect(layer[KEY_STATES]).toEqual(stateLayer);
  })

  it('modify fix-position property for pure layer `andrew`', () => {
    generator.setFixedPosition('andrew', { x: 1, y: 1 });
    expect(generator.masterConfig.layout.layers.find(l => l.id === 'andrew')[KEY_FIXED_POS]).toEqual({ x: 1, y: 1 });
  })

  it('modify fix-position property for states layer `Background`', () => {
    generator.setFixedPosition('Background', { x: 1, y: 1 }, 2);
    expect(generator.masterConfig.layout.layers.find(l => l.id === 'Background')[KEY_STATES].options[2][KEY_FIXED_POS]).toEqual({ x: 1, y: 1 })
  })

  describe('initialize artwork on chain', () => {
    let contract = 'cryptoart'
    let masterId;

    beforeAll(() => {
      generator.setConfig(exampleConfig);
    })

    it('mint artwork on chain', async () => {
      masterId = await generator.availableTokenId(api, contract);
      await generator.mintArtwork(api, contract, 'eosio', 'eosio', cid);
      const token = await api.getMasterToken(contract, masterId);
      expect(token.id).toBe(masterId);
      const reslovedUri = new NftURI(token.uri);
      expect(reslovedUri.getParam('ipfs')).toBe(cid);
      expect(token.symbol).toBe('ART');
    })

    it('setup layer token with wrong lever num', async () => {
      try {
        const minValues = [0, 0];
        const maxValues = [3, 1800];
        const currValues = [0, 0];
        await generator.setuptoken(api, contract, 'eosio', masterId, 1, minValues, maxValues, currValues);
        expect(false).toBe(true);
      } catch (e) {
        expect(true).toBe(true);
      }
    })

    it('setup layer token on chain', async () => {
      const minValues = [0, 0, -360];
      const maxValues = [3, 1800, 360];
      const currValues = [0, 0, 0];
      await generator.setuptoken(api, contract, 'eosio', masterId, 1, minValues, maxValues, currValues);
    })

    it('update layer token lever on chain', async () => {
      await generator.updatetoken(api, contract, 'eosio', masterId, 1, [0], [3]);
    })
  })
})