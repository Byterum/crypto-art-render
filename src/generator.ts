import { MasterConfig, Attribute, Layer, LayerStates, LayerOption, KEY_STATES, IntProperty, KEY_FIXED_POS, PositionType, KEY_RELATIVE_POS, KEY_ROTATION, KEY_ORBIT_ROTATION, KEY_SCALE, KEY_MIRROR, MirrorType, KEY_VISIBLE, Color, KEY_WIDTH, KEY_HEIGHT, KEY_ANCHOR, ValueOnChain, KEY_TOKEN_ID, KEY_LEVER_ID } from "./master_config";
import { TokenId, LeverId, ChainAPI, Token } from "./blockchain/datatype";

type cid = string;
type LayerId = string;

/**
 * Generator is used to generate standard master config, upload to 
 * ipfs network and get cid in one.
 */
export default class Generator {

  private config: MasterConfig;
  // mapping token-id => max lever num
  private tokenLeverNum: Map<TokenId, number>;

  constructor() {
    this.tokenLeverNum = new Map<TokenId, number>();
  }

  /**
   * Init basic master config.
   * @param name Artwork name
   * @param desc Artwork description
   * @param image Artwork image IPFS cid
   */
  initialize(name: string, desc: string, image: cid) {
    this.config = {
      name,
      description: desc,
      image,
      attributes: []
    }
  }

  get masterConfig(): MasterConfig {
    return this.config;
  }

  setConfig(config: MasterConfig) {
    this.config = config;
  }

  setAttributes(attrs: Array<Attribute>) {
    this.config.attributes = attrs;
  }

  addAttributes(attrs: Array<Attribute>) {
    this.config.attributes = this.config.attributes.concat(attrs);
  }

  setLayout(type: string, version: number, layers: Array<Layer> = []) {
    this.config.layout = {
      type,
      version,
      layers
    }
  }

  /**
   * Add a layer with multiple states.
   * @param config Master config
   * @param layerId Layer id
   * @param states Layer states controlled by layer token
   */
  addStatesLayer(layerId: string, states: LayerStates) {
    if (this.config.layout) {
      if (!this.config.layout.layers) {
        this.config.layout.layers = [];
      }
      this.config.layout.layers.push({
        id: layerId,
        states,
      });
    }
  }

  /**
   * Add a layer with pure state.
   * @param config Master config
   * @param layerId Layer id
   * @param body Layer optional params follow `LayerOption`
   */
  addPureLayer(layerId: string, body?: LayerOption) {
    if (this.config.layout) {
      if (!this.config.layout.layers) {
        this.config.layout.layers = [];
      }
      this.config.layout.layers.push({
        id: layerId,
        ...body
      })
    }
  }

  /**
   * Append muliple options to `layer.states.options`
   * @param config Master config
   * @param layerId Layer id
   * @param opts Array of layer option
   */
  addStatesOptions(layerId: string, opts: Array<LayerOption> = []) {
    if (this.config.layout) {
      const layer = this.config.layout.layers.find(layer => layer.id === layerId);
      if (KEY_STATES in layer) {
        return;
      }
      if (!layer[KEY_STATES].options) {
        layer[KEY_STATES].options = opts;
      } else {
        layer[KEY_STATES].options.push(...opts);
      }
    }
  }

  /* ============ layer setter =========== */

  /**
   * Set fixed position for a given layer
   * @param layer 
   * @param val 
   * @param index Index of `layer.states.options`
   */
  setFixedPosition(layerId: LayerId, val: PositionType, index?: number) {
    let layer: Layer = this.config.layout.layers.find(l => l.id === layerId);
    if (index !== undefined) {
      // states layer
      layer = layer[KEY_STATES].options[index] as Layer;
    }
    layer[KEY_FIXED_POS] = val;
  }

  /**
   * Set relative position for a given layer
   * @param layerId 
   * @param val 
   */
  setRelativePosition(layerId: LayerId, val: PositionType, index?: number) {
    let layer: Layer = this.config.layout.layers.find(l => l.id === layerId);
    if (index !== undefined) {
      // states layer
      layer = layer[KEY_STATES].options[index] as Layer;
    }
    layer[KEY_RELATIVE_POS] = val;
  }

  /**
   * Set fixed rotaton degree for a given layer
   * @param layerId
   * @param val 
   */
  setFixedRotation(layerId: LayerId, val: IntProperty, index?: number) {
    let layer: Layer = this.config.layout.layers.find(l => l.id === layerId);
    if (index !== undefined && index >= 0) {
      // states layer
      layer = layer[KEY_STATES].options[index] as Layer;
    }
    layer[KEY_ROTATION] = val;
  }

  /**
   * Set orbit rotation degree for a given layer
   * @param layerId 
   * @param val 
   */
  setOrbitRotation(layerId: LayerId, val: IntProperty, index?: number) {
    let layer: Layer = this.config.layout.layers.find(l => l.id === layerId);
    if (index !== undefined && index >= 0) {
      // states layer
      layer = layer[KEY_STATES].options[index] as Layer;
    }
    layer[KEY_ORBIT_ROTATION] = val;
  }

  /**
   * Set scale factor for a given layer
   * @param layerId 
   * @param val 
   */
  setScale(layerId: LayerId, val: IntProperty, index?: number) {
    let layer: Layer = this.config.layout.layers.find(l => l.id === layerId);
    if (index !== undefined && index >= 0) {
      // states layer
      layer = layer[KEY_STATES].options[index] as Layer;
    }
    layer[KEY_SCALE] = val;
  }

  /**
   * Set mirror transition for a given layer
   * @param layerId 
   * @param val 
   */
  setMirror(layerId: LayerId, val: MirrorType, index?: number) {
    let layer: Layer = this.config.layout.layers.find(l => l.id === layerId);
    if (index !== undefined && index >= 0) {
      // states layer
      layer = layer[KEY_STATES].options[index] as Layer;
    }
    layer[KEY_MIRROR] = val;
  }

  /**
   * Set visible status for a given layer
   * @param layerId 
   * @param val 
   */
  setVisible(layerId: LayerId, val: IntProperty, index?: number) {
    let layer: Layer = this.config.layout.layers.find(l => l.id === layerId);
    if (index !== undefined && index >= 0) {
      // states layer
      layer = layer[KEY_STATES].options[index] as Layer;
    }
    layer[KEY_VISIBLE] = val;
  }

  /**
   * Set color scheme for a given layer
   * @param layerId 
   * @param color 
   * @param val 
   */
  setColor(layerId: LayerId, color: Color, val: IntProperty, index?: number) {
    let layer: Layer = this.config.layout.layers.find(l => l.id === layerId);
    if (index !== undefined && index >= 0) {
      // states layer
      layer = layer[KEY_STATES].options[index] as Layer;
    }
    layer[color] = val;
  }


  /**
   * Set width property for a given layer
   * @param layer 
   * @param val 
   */
  setWidth(layerId: LayerId, val: IntProperty, index?: number) {
    let layer: Layer = this.config.layout.layers.find(l => l.id === layerId);
    if (index !== undefined && index >= 0) {
      // states layer
      layer = layer[KEY_STATES].options[index] as Layer;
    }
    layer[KEY_WIDTH] = val;
  }

  /**
   * Set height property for a given layer
   * @param layer 
   * @param val 
   */
  setHeight(layerId: LayerId, val: IntProperty, index?: number) {
    let layer: Layer = this.config.layout.layers.find(l => l.id === layerId);
    if (index !== undefined && index >= 0) {
      // states layer
      layer = layer[KEY_STATES].options[index] as Layer;
    }
    layer[KEY_HEIGHT] = val;
  }

  /**
   * Set anchor point for a given layer.
   * @param layerId Layer need to anchor
   * @param val Layer id anchored by given layer
   */
  setAnchor(layerId: LayerId, anchoredLayerId: string, index?: number) {
    let layer: Layer = this.config.layout.layers.find(l => l.id === layerId);
    if (index !== undefined && index >= 0) {
      // states layer
      layer = layer[KEY_STATES].options[index] as Layer;
    }
    layer[KEY_ANCHOR] = anchoredLayerId;
  }

  /**
   * Mint artwork to artist on chain. All posible layer tokens will be 
   * issued to given issuer at first.
   * @param contract Art asset contract address
   * @param api Chain api instance
   */
  async mintArtwork(api: ChainAPI, contract: string, artist: string, uri: string, issuer: string) {
    this.collectTokens();

    try {
      const tokens = Array.from(this.tokenLeverNum.keys());
      await api.mintArtwork(contract, artist, uri, tokens.map(_ => issuer))
    } catch (e) {
      throw new Error(`failed to mint artwork on chain: ${e.message}`);
    }
  }

  async setuptoken(api: ChainAPI, contract: string, tokenHolder: string, tokenId: TokenId, minValues: number[], maxValues: number[], currValues: number[]) {
    this.collectTokens();
    if (minValues.length !== maxValues.length || maxValues.length !== currValues.length) {
      throw new Error('min, max, curr values should have equal length');
    }

    const maxLeverNum = this.tokenLeverNum.get(tokenId);
    if (maxLeverNum === undefined) {
      throw new Error(`token ${tokenId} not found in master config`);
    }

    if (minValues.length < maxLeverNum) {
      throw new Error(`lever num passed in should be no lower than the one collected from master config`);
    }
    try {
      await api.setuptoken(contract, tokenHolder, tokenId, minValues, maxValues, currValues);
    } catch (e) {
      throw new Error(`failed to setup token on chain: ${e.message}`);
    }
  }

  /**
   * Collect layer token and its maximum lever num.
   */
  private collectTokens() {
    // collect all layer tokens
    if (this.config.layout) {
      this.config.layout.layers.forEach(layer => {
        this.collectLayerToken(layer);
      })
    }
  }

  private collectLayerToken(object: any) {
    if (typeof object === 'object') {
      if (KEY_TOKEN_ID in object) {
        const tokenId = object[KEY_TOKEN_ID];
        const leverId = object[KEY_LEVER_ID];
        if ('options' in object) {
          this.tokenLeverNum.set(tokenId, object.options.length);
        } else {
          const oldLeverNum = this.tokenLeverNum.get(tokenId);
          if (leverId >= oldLeverNum || oldLeverNum === undefined) {
            this.tokenLeverNum.set(tokenId, leverId + 1);
          }
        }
      } else {
        for (let key in object) {
          this.collectLayerToken(object[key]);
        }
      }
    }
  }
}