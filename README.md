# crypto-art-render

Magic render of crypto art.

## Update

- Allow artwork with only 1 master layer.
- `anchor` always be type of `string`, not controlled by tokens any more.

## Master Config

TODO

## Usage

### Generator

Module `generator` is used to generate artwokr config, define and fill necessary fields more easily.

Check out the [API]("./docs/classes/_generator_.generator.html").

**Initialize empty config**

```javascript
import { Generator } from "crypto-art-render";

const generator = new Generator();
generator.intialize(
  "name",
  "desc",
  "QmX71QqNunRjE3Sdj78vDGrDyeT3dEMp9xrrQPSx5JCBTQ"
);

generator.setAttributes([
  {
    [KEY_TRAIT_TYPE]: "Artist",
    value: "LowesYang"
  },
  {
    [KEY_TRAIT_TYPE]: "Artist",
    value: "YYH"
  },
  {
    [KEY_TRAIT_TYPE]: "Layer Count",
    value: "4"
  }
]);

// Set fields in master config
generator.setLayout("layer id", 1);
generator.addStatesLayer("layer id", states);
generator.addPureLayer("layer id", layerbody);

console.log(generator.masterConfig); // see `test/config_example/example1.json`

const eosApi = new EosAPI();
// Initialize artwork on chain
// Add config file init by `generator` to IPFS node.
const configCid = "QmQRYre2kUKd3VW13CeY6zowwyK8RwXqbJxkjzpVS6cyrc";
generator.mintwork(eosApi, "contract", "artist", "issuer");

// say master id is 1, layer token relative id is 1
// the real layer token id on chaini is 1 + 1 = 2
// Setup token on chain
generator.setuptoken(eosApi, "contract", "eosio", 1, 1, [0], [256], [144]);

// Update token on chain
generator.updatetoken(eosApi, "contract", "eosio", 1, 1, [0], [145]);
```

### Render

Module `Render` is used to render image from master config.

Check out the [API]("./docs/classes/_render_.render.html").

```javascript
import { Render, IpfsLoader } from "crypto-art-render";

// Initialize render with ipfs loader, interacting with local IPFS node
const render = new Render(
  new IpfsLoader({ endpoint: "http://127.0.0.1:8080" })
);

const masterTokenId = 0;
const masterImage = await render.renderMaster("contract", masterTokenId);
const compositeImage = await render.renderComposite("contract", masterTokenId);

// Interact with result folloing the API of [Jimp](https://github.com/oliver-moran/jimp/tree/master/packages/jimp)

await masterImage.writeAsync("master.png");
await compositeImage.writeAsync("composite.png");
```

## Test

1. Start a local IPFS node with http endpoint listening on `8080`.
2. Add all files in `test/config_example` to local IPFS network.
3. Start a local EOSIO network with http endpoint listening on `8888`;
4. Run `npm run test`
