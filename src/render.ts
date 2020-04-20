import { TokenId, Platform, ChainAPI, Token, LeverId, TokenSingleLever } from "./blockchain/datatype";
import { MasterConfig, KEY_STATES, KEY_TOKEN_ID, KEY_LEVER_ID, Layer, KEY_VISIBLE, ValueOnChain, KEY_WIDTH, KEY_HEIGHT, KEY_SCALE, KEY_FIXED_POS, KEY_ROTATION, KEY_MIRROR, KEY_ANCHOR, KEY_RELATIVE_POS, KEY_ORBIT_ROTATION, KEY_COLOR, Color } from "./master_config";
import Jimp from 'jimp';
import { NftURI } from "nft-resolver";
import { Loader } from "./loader/interface";
import { sha3_256 } from 'js-sha3';

interface Logger {
  error(msg: any, ...args: any[]): void;
  warn(msg: any, ...args: any[]): void;
  info(msg: any, ...args: any[]): void;
  debug(msg: any, ...args: any[]): void;
}

// RenderMap is used to cache the value controlled by layer token 
// of an image, and provides utilities to get hash of the current state.
class RenderMap {
  cacheToken: Map<TokenId, Map<LeverId, number>>;

  constructor() {
    this.cacheToken = new Map<TokenId, Map<LeverId, number>>();
  }

  set(tokenId: TokenId, leverId: LeverId, val: number) {
    let leverMap = this.cacheToken.get(tokenId);
    if (!leverMap) {
      leverMap = new Map<LeverId, number>();
      this.cacheToken.set(tokenId, leverMap);
    }

    leverMap.set(leverId, val);
  }

  get(tokenId: TokenId, leverId: LeverId): number {
    const leverMap = this.cacheToken.get(tokenId);
    if (!leverMap) return 0;
    return leverMap.get(leverId) || 0;
  }

  hash(): string {
    let str = '';
    for (let [tokenId, levelMap] of this.cacheToken.entries()) {
      str += tokenId;
      levelMap = levelMap as Map<LeverId, number>;
      for (let [levelId, val] of levelMap.entries()) {
        str += `${levelId}:${val};`;
      }
    }
    return sha3_256(str).slice(0, 12);
  }
}

/**
 * Artwork render.
 */
export class Render {
  api: ChainAPI;
  bc: Platform;
  loader: Loader;
  logger: Logger;

  // master token id => render map
  renderMap: Map<TokenId, RenderMap>;

  constructor(loader: Loader, api: ChainAPI, logger: Logger = console, platform: Platform = Platform.EOS) {
    this.bc = platform;
    this.api = api;
    this.loader = loader;
    this.renderMap = new Map<TokenId, RenderMap>();
    this.logger = logger;
  }

  /**
   * Load master config and return data json.
   * @param contract 
   * @param masterId 
   */
  public async loadMasterConfig(contract: string, masterId: TokenId): Promise<MasterConfig> {
    const masterToken = await this.api.getToken(contract, masterId);
    if (!masterToken) {
      throw new Error(`master config for ${masterId} not found`);
    }
    if (masterToken.symbol !== 'ART') {
      throw new Error('invalid token symbol, expected \'ART\'');
    }

    // this.logger.debug(`Load token ${masterToken.id} from contract success`);
    const resolvedUri = new NftURI(masterToken.uri);
    const cid = resolvedUri.getParam('ipfs');
    if (!cid) {
      throw new Error('IPFS cid not found');
    }

    // load master config
    const masterConfig = await this.loader.loadFromUri(cid);
    return JSON.parse(masterConfig.toString()) as MasterConfig;
  }

  /**
   * Render master image as base64 string with format `image/png`.
   * @param contract 
   * @param masterId 
   */
  public async renderMaster(contract: string, masterId: TokenId): Promise<Jimp> {
    const config = await this.loadMasterConfig(contract, masterId);
    return await this.loadImageFromIPFS(config.image);
  }

  /**
 * Render artwork's composite layers and return base64 string as `image/png`.
 * @param contract Contract address
 * @param masterId Master token id
 */
  public async renderComposite(contract: string, masterId: TokenId): Promise<Jimp> {
    return await this.render(contract, masterId)
  }

  private async loadImageFromIPFS(cid: string): Promise<Jimp> {
    const buffer = await this.loader.loadFromUri(cid)
    return await Jimp.read(buffer);
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

    let start;
    // load the token URI for the layout
    for (let i = 0; i < layout.layers.length; i++) {
      let layer: Layer = layout.layers[i];
      this.logger.debug(process.memoryUsage().rss / 1024 / 1024 + " MB");
      this.logger.debug(`rendering layer [${i + 1}] with layer-id ${layer.id}`);

      if (i !== 0) {
        this.logger.debug(`cost time ${Date.now() - start}ms`);
      }
      start = Date.now();

      // layer['states]
      if (KEY_STATES in layer) {
        const states = layer[KEY_STATES];
        const optionIndex = await this.readValueFromChain(contract, masterId, states);
        layer = states.options[optionIndex] as Layer;
      }

      // layer['visible']
      if (KEY_VISIBLE in layer) {
        const isVisible = (await this.readValueFromChain(contract, masterId, layer[KEY_VISIBLE])) === 1;
        if (!isVisible) {
          continue;
        }
      }

      let tmpLayerImg: Jimp;
      if (!layer.uri) {
        // if have no uri, create a empty image canvas
        tmpLayerImg = new Jimp(layer[KEY_WIDTH], layer[KEY_HEIGHT]);
      } else {
        // layer uri is usually cid and load from IPFS
        tmpLayerImg = await this.loadImageFromIPFS(layer.uri);
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
        finalImage = await this.renderLayer(contract, finalImage, layout.layers, layer, tmpLayerImg, masterId);
      }
    }

    return finalImage;
  }

  // load current value the token controls or just return integer value in object
  private async readValueFromChain(contract: string, masterId: TokenId, value: ValueOnChain | number) {
    let renderMap = this.renderMap.get(masterId);
    if (!renderMap) {
      renderMap = new RenderMap();
      this.renderMap.set(masterId, renderMap);
    }
    if (typeof value === 'object') {
      const params = value as ValueOnChain
      if (this.bc === Platform.EOS) {
        // token id from config is a relative id to master token id
        const tokenId = masterId + params[KEY_TOKEN_ID];
        const leverId = params[KEY_LEVER_ID];
        const val = await this.api.getCurrValueByLeverId(contract, leverId, tokenId);
        renderMap.set(tokenId, leverId, val);
        return val || 0;
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
  private async renderLayer(contract: string, currImage: Jimp, layers: Array<Layer>, currLayer: Layer, layerImage: Jimp, masterId: TokenId): Promise<Jimp> {
    let bitmapWidth = layerImage.bitmap.width;
    let bitmapHeight = layerImage.bitmap.height;

    // apply `scale` property to layer image
    if (KEY_SCALE in currLayer) {
      const scaleX = await this.readValueFromChain(contract, masterId, currLayer[KEY_SCALE]['x']);
      const scaleY = await this.readValueFromChain(contract, masterId, currLayer[KEY_SCALE]['y']);
      if (scaleX === 0 || scaleY === 0) {
        this.logger.debug("scale X or Y is 0 -- returning currentImage.");
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
      const degree = await this.readValueFromChain(contract, masterId, currLayer[KEY_ROTATION]);
      layerImage.rotate(degree, true);
      // adjust for the new width and height based on the rotation
      bitmapWidth = layerImage.bitmap.width;
      bitmapHeight = layerImage.bitmap.height;
    }

    // apply `mirror` property to layer image
    if (KEY_MIRROR in currLayer) {
      const isMirrorX = (await this.readValueFromChain(contract, masterId, currLayer[KEY_SCALE]['x'])) === 1;
      const isMirrorY = (await this.readValueFromChain(contract, masterId, currLayer[KEY_SCALE]['y'])) === 1;
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
      x = await this.readValueFromChain(contract, masterId, currLayer[KEY_FIXED_POS]['x']);
      y = await this.readValueFromChain(contract, masterId, currLayer[KEY_FIXED_POS]['y']);
    } else {
      // apply `relative position` property to layer image
      if (KEY_RELATIVE_POS in currLayer) {
        relativeX = await this.readValueFromChain(contract, masterId, currLayer[KEY_RELATIVE_POS]['x']);
        relativeY = await this.readValueFromChain(contract, masterId, currLayer[KEY_RELATIVE_POS]['y']);
      }

      if (KEY_ORBIT_ROTATION in currLayer) {
        const degree = await this.readValueFromChain(contract, masterId, currLayer[KEY_ORBIT_ROTATION]);
        this.logger.debug(`orbit ${degree} degree around anchor (${x},${y})`);
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

    const compositeOptions = {} as any;

    // apply `color` property to layer
    if (KEY_COLOR in currLayer) {
      const color = currLayer[KEY_COLOR];
      if (Color.R in color) {
        const red = await this.readValueFromChain(contract, masterId, color[Color.R]);
        layerImage.color([
          {
            apply: 'red',
            params: [red]
          }
        ])
      }

      if (Color.G in color) {
        const green = await this.readValueFromChain(contract, masterId, color[Color.R]);
        layerImage.color([
          {
            apply: 'green',
            params: [green]
          }
        ])
      }

      if (Color.B in color) {
        const blue = await this.readValueFromChain(contract, masterId, color[Color.B]);
        layerImage.color([
          {
            apply: 'blue',
            params: [blue]
          }
        ])
      }

      if (Color.HUE in color) {
        const hue = await this.readValueFromChain(contract, masterId, color[Color.HUE]);
        layerImage.color([
          {
            apply: 'hue',
            params: [hue]
          }
        ])
      }

      if (Color.ALPHA in color) {
        const alpha = await this.readValueFromChain(contract, masterId, color[Color.ALPHA]);
        layerImage.opacity(alpha / 100);
      }



      if (Color.MULTIPLY in color) {
        const shouldMultiply = (await this.readValueFromChain(contract, masterId, color[Color.MULTIPLY])) > 0;
        if (shouldMultiply) {
          compositeOptions.mode = Jimp.BLEND_MULTIPLY;
          if (Color.OPACITY in color) {
            const opacity = await this.readValueFromChain(contract, masterId, color[Color.OPACITY]);
            compositeOptions.opacitySource = opacity / 100;
          }
        }
      } else if (Color.LIGHTEN in color) {
        const shouldMultiply = (await this.readValueFromChain(contract, masterId, color[Color.LIGHTEN])) > 0;
        if (shouldMultiply) {
          compositeOptions.mode = Jimp.BLEND_LIGHTEN;
          if (Color.OPACITY in color) {
            const opacity = await this.readValueFromChain(contract, masterId, color[Color.OPACITY]);
            compositeOptions.opacitySource = opacity / 100;
          }
        }
      } else if (Color.OVERLAY in color) {
        const shouldMultiply = (await this.readValueFromChain(contract, masterId, color[Color.OVERLAY])) > 0;
        if (shouldMultiply) {
          compositeOptions.mode = Jimp.BLEND_OVERLAY;
          if (Color.OPACITY in color) {
            const opacity = await this.readValueFromChain(contract, masterId, color[Color.OPACITY]);
            compositeOptions.opacitySource = opacity / 100;
          }
        }
      }
    }
    return currImage.composite(layerImage, x, y, compositeOptions);
  }

  /**
   * Returns master token id of 
   * @param masterId 
   */
  public currentState(masterId: TokenId): string {
    const renderMap = this.renderMap.get(masterId);
    if (!renderMap) return '';
    return renderMap.hash();
  }
}