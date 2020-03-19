import { MasterConfig, Attribute, Layer, LayerStates, LayerOption, KEY_STATES, IntProperty, KEY_FIXED_POS, PositionType, KEY_RELATIVE_POS, KEY_ROTATION, KEY_ORBIT_ROTATION, KEY_SCALE, KEY_MIRROR, MirrorType, KEY_VISIBLE, Color, KEY_WIDTH, KEY_HEIGHT, KEY_ANCHOR } from "./master_config";

type cid = string;

/**
 * Generator is used to generate standard master config, upload to 
 * ipfs network and get cid in one.
 */
export default class Generator {

  /**
   * Init basic master config.
   * @param name Artwork name
   * @param desc Artwork description
   * @param image Artwork image IPFS cid
   */
  static initialize(name: string, desc: string, image: cid): MasterConfig {
    return {
      name,
      description: desc,
      image,
      attributes: []
    }
  }

  static setAttributes(config: MasterConfig, attrs: Array<Attribute>) {
    config.attributes = attrs;
  }

  static addAttributes(config: MasterConfig, attrs: Array<Attribute>) {
    config.attributes = config.attributes.concat(attrs);
  }

  static setLayout(config: MasterConfig, type: string, version: number, layers: Array<Layer> = []) {
    config.layout = {
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
  static addStatesLayer(config: MasterConfig, layerId: string, states: LayerStates) {
    if (config.layout) {
      config.layout.layers.push({
        id: layerId,
        states,
      });
    }
  }

  /**
   * Add a layer with single state.
   * @param config Master config
   * @param layerId Layer id
   * @param body Layer optional params follow `LayerOption`
   */
  static addSingleLayer(config: MasterConfig, layerId: string, body?: LayerOption) {
    if (config.layout) {
      config.layout.layers.push({
        id: layerId,
        ...body
      })
    }
  }

  /**
   * Append muliple options to `layer.states.optioins`
   * @param config Master config
   * @param layerId Layer id
   * @param opts Array of layer option
   */
  static addStatesOptions(config: MasterConfig, layerId: string, opts: Array<LayerOption> = []) {
    if (config.layout) {
      const layer = config.layout.layers.find(layer => layer.id === layerId);
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
   */
  static setFixedPosition(layer: Layer, val: PositionType) {
    layer[KEY_FIXED_POS] = val;
  }

  /**
   * Set relative position for a given layer
   * @param layer 
   * @param val 
   */
  static setRelativePosition(layer: Layer, val: PositionType) {
    layer[KEY_RELATIVE_POS] = val;
  }

  /**
   * Set fixed rotaton degree for a given layer
   * @param layer 
   * @param val 
   */
  static setFixedRotation(layer: Layer, val: IntProperty) {
    layer[KEY_ROTATION] = val;
  }

  /**
   * Set orbit rotation degree for a given layer
   * @param layer 
   * @param val 
   */
  static setOrbitRotation(layer: Layer, val: IntProperty) {
    layer[KEY_ORBIT_ROTATION] = val;
  }

  /**
   * Set scale factor for a given layer
   * @param layer 
   * @param val 
   */
  static setScale(layer: Layer, val: IntProperty) {
    layer[KEY_SCALE] = val;
  }

  /**
   * Set mirror transition for a given layer
   * @param layer 
   * @param val 
   */
  static setMirror(layer: Layer, val: MirrorType) {
    layer[KEY_MIRROR] = val;
  }

  /**
   * Set visible status for a given layer
   * @param layer 
   * @param val 
   */
  static setVisible(layer: Layer, val: IntProperty) {
    layer[KEY_VISIBLE] = val;
  }

  /**
   * Set color scheme for a given layer
   * @param layer 
   * @param color 
   * @param val 
   */
  static setColor(layer: Layer, color: Color, val: IntProperty) {
    layer[color] = val;
  }


  /**
   * Set width property for a given layer
   * @param layer 
   * @param val 
   */
  static setWidth(layer: Layer, val: IntProperty) {
    layer[KEY_WIDTH] = val;
  }

  /**
   * Set height property for a given layer
   * @param layer 
   * @param val 
   */
  static setHeight(layer: Layer, val: IntProperty) {
    layer[KEY_HEIGHT] = val;
  }

  /**
   * Set anchor point for a given layer.
   * @param layer Layer need to anchor
   * @param val Layer id anchored by given layer
   */
  static setAnchor(layer: Layer, anchoredLayerId: string) {
    layer[KEY_ANCHOR] = anchoredLayerId;
  }
}