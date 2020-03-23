# crypto-art-render

Magic render of crypto art.

## Update

- Allow artwork with only 1 master layer.
- `anchor` always be type of `string`, not controlled by tokens any more.

## Master Config

Master config define **the rule of rendering** for the artwork.

A typical config data structure is shown below:

- **name** - Artwork name.
- **description** - Artwork description.
- **image** - URI of artwork master.
- **attributes** - List of basic meta info.
  - trait_type - Attribute key name Like `Artist` or `Layer Count`.
  - value - Attribute value string.
- **layout** - Layout of layers.

### IntProperty

This type tells the property can be controlled by **layer token** or just a pure integer.

In typescript, we define: 

```javascript
type IntProperty = {
  "token-id":number;
  "lever-id":number;
} | number;
```

- token-id - Control layer token id on chain.
- lever-id - Lever index of values  from a layer token.

### LayerOption

A layer option defines an option of a layer that token holder can choose.

- **uri** - Layer resource URI, usually IPFS Cid of image.
- **label** - Layer label.
- **anchor** - optional. Anchor point id.
- **fixed-position** - optional. Fix position of layer at the artwork.
  - x (IntProperty) 
  - y (IntProperty)  
- **relative-position** - optional. Relative position of layer **with the coordinate of** the anchor layer.
  - x (IntProperty)
  - y (IntProperty)
- **fixed-rotation **(IntProperty) - optional. Fix rotation degree.

- **orbit-rotation** (IntPropery) - optional. Orbit rotation degree around the anchor provided by the layer.
- **mirror** (IntPropery) - optional. Mirror transition. Value result will only be `0`  or  `1`.
- **visible** (IntPropery) - optional. Is layer visible. Value result will only be `0` or  `1`.
- **finalCenterX** (number) - Not pre-defined. Final center coordinate x of layer. This property will be filled during rendering process.
- **finalCenterY** (number) - Not pre-defined. Final center coordinate y of layer. This property will be filled during rendering process.
- **active** (boolean) - Not pre-defined. Tell the layer can be used as anchor point or not.
- **color** - Color scheme of layer
  - red (IntProperty)
  - green (IntProperty)
  - blue (IntProperty)
  - alpha (IntProperty)
  - hue (IntProperty)

### Layer

**Inherit from LayerOption**, with more fields like:

- **id** - Required. Layer id
- **states** - Optional. Multiple state options of layer.
  - options `Array<LayerOption>` - list of layer option
  - token-id - Token that control the value of option index.
  - lever-id - Lever index of values



Please see a typical [master config example](master_example.json).

## Usage

### Generator

Module `generator` is used to generate artwokr config, define and fill necessary fields more easily.

Check out the [API]("./docs/classes/_generator_.generator.html").

**Initialize empty config**

```javascript
import { Generator } from "crypto-art-render";

const generator = new Generator();
// Initialize master config with basic info
generator.intialize(
  "name",
  "desc",
  "QmX71QqNunRjE3Sdj78vDGrDyeT3dEMp9xrrQPSx5JCBTQ"
);

// Set attributes
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
