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
  // mapping relative-layer-token-id => max lever num
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

  /**
   * Set multiple attributes of basic config info.
   * @param attrs Artwork attributes
   */
  setAttributes(attrs: Array<Attribute>) {
    this.config.attributes = attrs;
  }

  /**
   * Append a list of attributes to the config.
   * @param attrs Artwork attributes
   */
  addAttributes(attrs: Array<Attribute>) {
    this.config.attributes = this.config.attributes.concat(attrs);
  }

  /**
   * Set layout of artwork.
   * @param type Layout type name
   * @param version Layout version
   * @param layers Layers the layout holds. Default empty array.
   */
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
   * @param layerId Layer id 
   * @param val Position coordinate
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
   * @param layerId Layer id
   * @param val Positoin coordiante
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
   * @param layerId Layer id
   * @param val Current value
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
   * @param layerId Layer id
   * @param val Current value
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
   * @param layerId Layer id
   * @param val Current value
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
   * @param layerId Layer id
   * @param val Current value
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
   * @param layerId Layer id
   * @param val Current value
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
   * @param layerId Layer id
   * @param color Color scheme type
   * @param val Current color value
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
   * @param layer Layer id
   * @param val Current value
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
   * @param layer Layer id
   * @param val Current value
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
   * @param api Chain api instance
   * @param contract Art contract address
   * @param artist Artist of artwork
   * @param issuer Issuer of tokens
   * @param cid Master config cid of artwork
   */
  async mintArtwork(api: ChainAPI, contract: string, artist: string, issuer: string, configCid: string) {
    this.collectTokens();
    try {
      const tokens = Array.from(this.tokenLeverNum.keys());
      await api.mintArtwork(contract, issuer, artist, configCid, tokens.map(_ => issuer))
    } catch (e) {
      throw new Error(`failed to mint artwork on chain: ${e.message}`);
    }
  }

  /**
   * Setup token on chain.
   * @param api Chain api instance
   * @param contract Art contract address
   * @param tokenHolder Token holder address
   * @param masterId  Master token id
   * @param relativeTokenId  Layer token id relate to the master token id
   * @param minValues Minimum values
   * @param maxValues Maximum values
   * @param currValues Current values
   */
  async setuptoken(api: ChainAPI, contract: string, tokenHolder: string, masterId: TokenId, relativeTokenId: TokenId, minValues: number[], maxValues: number[], currValues: number[]) {
    this.collectTokens();
    if (minValues.length !== maxValues.length || maxValues.length !== currValues.length) {
      throw new Error('min, max, curr values should have equal length');
    }

    const maxLeverNum = this.tokenLeverNum.get(relativeTokenId);
    if (maxLeverNum === undefined) {
      throw new Error(`token ${relativeTokenId} not found in master config`);
    }

    if (minValues.length < maxLeverNum) {
      throw new Error(`lever num passed in should be no lower than the one collected from master config`);
    }
    try {
      await api.setuptoken(contract, tokenHolder, masterId + relativeTokenId, minValues, maxValues, currValues);
    } catch (e) {
      throw new Error(`failed to setup token on chain: ${e.message}`);
    }
  }

  /**
   * Update token on chain.
   * @param api Chain api instance
   * @param contract Art contract address
   * @param tokenHolder Token holder address
   * @param masterId Master token id
   * @param relativeTokenId Layer token id relate to the master token id
   * @param levers List of lever id
   * @param newValues List of new value corresponding to the lever id at the same index of `levers`
   */
  async updatetoken(api: ChainAPI, contract: string, tokenHolder: string, masterId: TokenId, relativeTokenId: TokenId, levers: number[], newValues: number[]) {
    try {
      await api.updatetoken(contract, tokenHolder, masterId + relativeTokenId, levers, newValues);
    } catch (e) {
      throw new Error(`failed to update token at levers ${levers} with new values ${newValues}: ${e.message}`);
    }
  }

  /**
   * Return the next available master token id.
   * @param api Chain API
   * @param contract Contract account
   */
  async availableTokenId(api: ChainAPI, contract: string): Promise<TokenId> {
    return await api.getAvailableTokenId(contract);
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
        const oldLeverNum = this.tokenLeverNum.get(tokenId);
        if (leverId >= oldLeverNum || oldLeverNum === undefined) {
          this.tokenLeverNum.set(tokenId, leverId + 1);
        }
      } else {
        for (let key in object) {
          this.collectLayerToken(object[key]);
        }
      }
    }
  }

  getLeverNum(tokenId: TokenId) {
    return this.tokenLeverNum.get(tokenId);
  }
}