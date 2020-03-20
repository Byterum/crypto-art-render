import { TokenId, Platform, ChainAPI } from "./blockchain/datatype";
import { MasterConfig, KEY_STATES, KEY_TOKEN_ID, KEY_LEVER_ID, Layer, KEY_VISIBLE, ValueOnChain, KEY_WIDTH, KEY_HEIGHT, KEY_SCALE, KEY_FIXED_POS, KEY_ROTATION, KEY_MIRROR, KEY_ANCHOR, KEY_RELATIVE_POS, KEY_ORBIT_ROTATION, KEY_COLOR, Color } from "./master_config";
import EosAPI from "./blockchain/eos";
import loadFromUri from "./loader/ipfs_loader";
import Jimp from 'jimp';
import { NftURI } from "nft-resolver";

export default class Render {
  api: ChainAPI;
  bc: Platform;

  constructor(endpoint: string, platform: Platform = Platform.EOS) {
    this.bc = platform;
    if (platform === Platform.EOS) {
      this.api = new EosAPI(endpoint);
    } else {
      throw new Error('not support ETH');
    }
  }

  /**
   * Render artwork's composite layers and return base64 string as `image/png`.
   * @param contract Contract address
   * @param masterId Master token id
   */
  public async renderCompositeAsBase64(contract: string, masterId: TokenId): Promise<string> {
    const image = await this.render(contract, masterId)
    if (!image) {
      return null;
    }
    return image.getBase64Async(Jimp.MIME_PNG)
  }

  /**
   * Render artwork's composite layers and return buffer as `image/png`.
   * @param contract Contract address
   * @param masterId Master token id
   */
  public async renderCompositeAsBuffer(contract: string, masterId: TokenId): Promise<Buffer> {
    const image = await this.render(contract, masterId);
    if (!image) {
      return null;
    }
    return await image.getBufferAsync(Jimp.MIME_PNG);
  }

  private async loadMasterConfig(contract: string, masterId: TokenId): Promise<MasterConfig> {
    const masterToken = await this.api.getMasterToken(contract, masterId);
    if (masterToken.symbol !== 'ART') {
      throw new Error('invalid token symbol, expected \'ART\'');
    }

    console.log(`Load token ${masterToken.id} from contract success`);
    const resolvedUri = new NftURI(masterToken.uri);
    const cid = resolvedUri.getParam('ipfs');
    if (!cid) {
      throw new Error('IPFS cid not found');
    }

    // load master config
    const masterConfig = await loadFromUri(cid);
    return JSON.parse(masterConfig.toString()) as MasterConfig;
  }

  /**
   * Render master image as base64 string with format `image/png`.
   * @param contract 
   * @param masterId 
   */
  public async renderMaster(contract: string, masterId: TokenId): Promise<string> {
    const masterConfig = await this.loadMasterConfig(contract, masterId);
    const config = JSON.parse(masterConfig.toString()) as MasterConfig;
    const masterImage = await Jimp.read(await loadFromUri(config.image));
    return await masterImage.getBase64Async(Jimp.MIME_PNG);
  }

  /**
   * Render composite layers (without master image) and return Jimp instance.
   * @param contract Contract address
   * @param masterId Master token id
   */
  private async render(contract: string, masterId: TokenId): Promise<Jimp> {
    const config = await this.loadMasterConfig(contract, masterId);
    const layout = config.layout;
    let finalImage: any;
    if (!layout) {
      throw new Error('image has no layout')
    }

    // load the token URI for the layout
    for (let i = 0; i < layout.layers.length; i++) {
      let layer: Layer = layout.layers[i];
      console.log(process.memoryUsage().rss / 1024 / 1024 + " MB");
      console.log(`rendering layer [${i + 1}] with layer-id ${layer.id}`);

      // layer['states]
      if (KEY_STATES in layer) {
        const states = layer[KEY_STATES];
        const optionIndex = await this.readValueFromChain(contract, states);
        layer = states.options[optionIndex] as Layer;
      }

      // layer['visible']
      if (KEY_VISIBLE in layer) {
        const isVisible = (await this.readValueFromChain(contract, layer[KEY_VISIBLE])) === 1;
        if (!isVisible) {
          console.log('layer is not visible');
          continue;
        }
      }

      let tmpLayerImg: Jimp;
      if (!layer.uri) {
        // if have no uri, create a empty image canvas
        tmpLayerImg = new Jimp(layer[KEY_WIDTH], layer[KEY_HEIGHT]);
      } else {
        // layer uri is usually cid and load from IPFS
        tmpLayerImg = await Jimp.read(await loadFromUri(layer.uri));
      }

      if (finalImage === undefined) {
        // if is the first layer
        finalImage = tmpLayerImg;

        // set this for future layers that might be anchored to the base image
        layer.active = true;
        layer.finalCenterX = tmpLayerImg.bitmap.width / 2;
        layer.finalCenterY = tmpLayerImg.bitmap.height / 2;
      } else {
        // render current layer over the previous layer
        finalImage = await this.renderLayer(contract, finalImage, layout.layers, layer, tmpLayerImg);
      }
    }

    return finalImage;
  }

  // load current value the token controls or just return integer value in object
  private async readValueFromChain(contract: string, value: ValueOnChain | number) {
    if (typeof value === 'object') {
      const params = value as ValueOnChain
      if (this.bc === Platform.EOS) {
        const rtnVal = await this.api.getCurrValueByLeverId(contract, params[KEY_LEVER_ID], params[KEY_TOKEN_ID]);
        return rtnVal;
      } else if (this.bc === Platform.ETH) {
        throw new Error('Not support ethereum');
      } else {
        throw new Error('Unsupport blockchain platform');
      }
    } else {
      return value;
    }
  }

  // render a single layer
  private async renderLayer(contract: string, currImage: Jimp, layers: Array<Layer>, currLayer: Layer, layerImage: Jimp): Promise<Jimp> {
    let bitmapWidth = layerImage.bitmap.width;
    let bitmapHeight = layerImage.bitmap.height;

    // apply `scale` property to layer image
    if (KEY_SCALE in currLayer) {
      const scaleX = await this.readValueFromChain(contract, currLayer[KEY_SCALE]['x']);
      const scaleY = await this.readValueFromChain(contract, currLayer[KEY_SCALE]['y']);
      if (scaleX === 0 || scaleY === 0) {
        console.log("scale X or Y is 0 -- returning currentImage.");
        return currImage;
      }
      // calculate the new width
      bitmapWidth = layerImage.bitmap.width * scaleX;
      bitmapHeight = layerImage.bitmap.height * scaleY;
      // resize the image
      layerImage.resize(bitmapWidth, bitmapHeight);
    }

    // apply `rotation` property to layer image
    if (KEY_ROTATION in currLayer) {
      const degree = await this.readValueFromChain(contract, currLayer[KEY_ROTATION]);
      layerImage.rotate(degree, true);
      // adjust for the new width and height based on the rotation
      bitmapWidth = layerImage.bitmap.width;
      bitmapHeight = layerImage.bitmap.height;
    }

    // apply `mirror` property to layer image
    if (KEY_MIRROR in currLayer) {
      const isMirrorX = (await this.readValueFromChain(contract, currLayer[KEY_SCALE]['x'])) === 1;
      const isMirrorY = (await this.readValueFromChain(contract, currLayer[KEY_SCALE]['y'])) === 1;
      layerImage.mirror(isMirrorX, isMirrorY);
    }

    let x = 0, y = 0;
    // get `anchor` point for below `relative position` and `orbit rotation`.
    // `anchor` means the active layer which id = anchor
    if (KEY_ANCHOR in currLayer) {
      const anchorLayerId = currLayer[KEY_ANCHOR];
      let anchorLayer;
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (layer.id === anchorLayerId) {
          if (KEY_STATES in layer) {
            // only use **active** layer as anchor
            const result = layer[KEY_STATES].options.find(opt => !!opt.active);
            if (result) {
              anchorLayer = result;
              break;
            }
          } else {
            anchorLayer = layer;
          }
        }
      }
      if (!anchorLayer) {
        throw new Error('anchor layer not found');
      }

      x = anchorLayer.finalCenterX;
      y = anchorLayer.finalCenterY;
    }

    let relativeX, relativeY;
    // apply `position` property to layer image
    if (KEY_FIXED_POS in currLayer) {
      x = await this.readValueFromChain(contract, currLayer[KEY_FIXED_POS]['x']);
      y = await this.readValueFromChain(contract, currLayer[KEY_FIXED_POS]['y']);
    } else {
      // apply `relative position` property to layer image
      if (KEY_RELATIVE_POS in currLayer) {
        relativeX = await this.readValueFromChain(contract, currLayer[KEY_RELATIVE_POS]['x']);
        relativeY = await this.readValueFromChain(contract, currLayer[KEY_RELATIVE_POS]['y']);
      }

      if (KEY_ORBIT_ROTATION in currLayer) {
        const degree = await this.readValueFromChain(contract, currLayer[KEY_ORBIT_ROTATION]);
        console.log(`orbit ${degree} degree around anchor (${x},${y})`);
        const rad = (-degree * Math.PI) / 180;

        // calculate the new relative position
        const newRelativeX = Math.round(relativeX * Math.cos(rad) - relativeY * Math.sin(rad));
        const newRelativeY = Math.round(relativeY * Math.cos(rad) + relativeX * Math.sin(rad));

        relativeX = newRelativeX;
        relativeY = newRelativeY;
      }

      x += relativeX;
      y += relativeY;
    }
    currLayer.finalCenterX = x;
    currLayer.finalCenterY = y;
    // set this to be true so that any subsequent layers that are anchored to this can tell which layer was active (for multi state layers)
    currLayer.active = true;

    // offset x and y so that layers are drawn at the center of their image
    x -= bitmapWidth / 2;
    y -= bitmapHeight / 2;

    // apply `color` property to layer
    if (KEY_COLOR in currLayer) {
      const color = currLayer[KEY_COLOR];
      if (Color.R in color) {
        const red = await this.readValueFromChain(contract, color[Color.R]);
        layerImage.color([
          {
            apply: 'red',
            params: [red]
          }
        ])
      }

      if (Color.G in color) {
        const green = await this.readValueFromChain(contract, color[Color.R]);
        layerImage.color([
          {
            apply: 'green',
            params: [green]
          }
        ])
      }

      if (Color.B in color) {
        const blue = await this.readValueFromChain(contract, color[Color.B]);
        layerImage.color([
          {
            apply: 'blue',
            params: [blue]
          }
        ])
      }

      if (Color.HUE in color) {
        const hue = await this.readValueFromChain(contract, color[Color.HUE]);
        layerImage.color([
          {
            apply: 'hue',
            params: [hue]
          }
        ])
      }

      if (Color.ALPHA in color) {
        const alpha = await this.readValueFromChain(contract, color[Color.ALPHA]);
        layerImage.opacity(alpha / 100);
      }
    }

    return currImage.composite(layerImage, x, y);
  }
}