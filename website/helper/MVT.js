import PBF from 'pbf';
import WKT from 'ol/format/WKT';

/**
 * @classdesc
 * Feature format for reading data in the Mapbox MVT format.
 * @param {Options=} opt_options Options.
 * @api
 */
class MVT {
  constructor (optOptions) {
    const options = optOptions || {};

    /**
     * @private
     * @type {string|undefined}
     */
    this.geometryName_ = options.geometryName;

    /**
     * @private
     * @type {string}
     */
    this.layerName_ = options.layerName ? options.layerName : 'layer';

    /**
     * @private
     * @type {Array<string>}
     */
    this.layers_ = options.layers ? options.layers : null;

    /**
     * @private
     */
    this.extent_ = null;
  }

  /**
   * 空间信息读取
   * @param pbf
   * @param feature
   * @param flatCoordinates
   * @param ends
   * @private
   */
  readRawGeometry_ (pbf, feature, flatCoordinates, ends) {
    pbf.pos = feature.geometry;
    const end = pbf.readVarint() + pbf.pos;
    let cmd = 1;
    let length = 0;
    let x = 0;
    let y = 0;
    let coordsLen = 0;
    let currentEnd = 0;

    while (pbf.pos < end) {
      if (!length) {
        const cmdLen = pbf.readVarint();
        cmd = cmdLen & 0x7;
        length = cmdLen >> 3;
      }

      length--;

      if (cmd === 1 || cmd === 2) {
        x += pbf.readSVarint();
        y += pbf.readSVarint();

        if (cmd === 1) { // moveTo
          if (coordsLen > currentEnd) {
            ends.push(coordsLen);
            currentEnd = coordsLen;
          }
        }

        flatCoordinates.push(x, y);
        coordsLen += 2;
      } else if (cmd === 7) {
        if (coordsLen > currentEnd) {
          // close polygon
          flatCoordinates.push(
            flatCoordinates[currentEnd], flatCoordinates[currentEnd + 1]);
          coordsLen += 2;
        }
      } else {}
    }

    if (coordsLen > currentEnd) {
      ends.push(coordsLen);
      currentEnd = coordsLen;
    }
  }

  /**
   * 创建要素
   * @param pbf
   * @param rawFeature
   * @param optOptions
   * @returns {*}
   * @private
   */
  createFeature_ (pbf, rawFeature, optOptions) {
    const type = rawFeature.type;
    if (type === 0) {
      return null;
    }

    // const id = rawFeature.id;
    const values = rawFeature.properties;
    values[this.layerName_] = rawFeature.layer.name;

    const flatCoordinates = [];
    const ends = [];
    this.readRawGeometry_(pbf, rawFeature, flatCoordinates, ends);

    // const geometryType = getGeometryType(type, ends.length);
    // feature = new RenderFeature(geometryType, flatCoordinates, ends, values, id);
    return {
      coordinates: (new WKT()).readGeometry(values.wkt).getCoordinates(),
      properties: values
    };
  }

  readFeatures (source) {
    const layers = this.layers_;
    const pbf = new PBF((source));
    const pbfLayers = pbf.readFields(layersPBFReader, {});
    const features = [];
    for (const name in pbfLayers) {
      if (layers && layers.indexOf(name) === -1) {
        continue;
      }
      const pbfLayer = pbfLayers[name];
      for (let i = 0, ii = pbfLayer.length; i < ii; ++i) {
        const rawFeature = readRawFeature(pbf, pbfLayer, i);
        features.push(this.createFeature_(pbf, rawFeature));
      }
      this.extent_ = pbfLayer ? [0, 0, pbfLayer.extent, pbfLayer.extent] : null;
    }
    return features;
  }
}

/**
 * 图层组解析回调
 * @param tag
 * @param layers
 * @param pbf
 */
function layersPBFReader (tag, layers, pbf) {
  if (tag === 3) {
    const layer = {
      keys: [],
      values: [],
      features: []
    };
    const end = pbf.readVarint() + pbf.pos;
    pbf.readFields(layerPBFReader, layer, end);
    layer.length = layer.features.length;
    if (layer.length) {
      layers[layer.name] = layer;
    }
  }
}

/**
 * 图层解析回调
 * @param tag
 * @param layer
 * @param pbf
 */
function layerPBFReader (tag, layer, pbf) {
  if (tag === 15) {
    layer.version = pbf.readVarint();
  } else if (tag === 1) {
    layer.name = pbf.readString();
  } else if (tag === 5) {
    layer.extent = pbf.readVarint();
  } else if (tag === 2) {
    layer.features.push(pbf.pos);
  } else if (tag === 3) {
    layer.keys.push(pbf.readString());
  } else if (tag === 4) {
    let value = null;
    const end = pbf.readVarint() + pbf.pos;
    while (pbf.pos < end) {
      tag = pbf.readVarint() >> 3;
      value = tag === 1 ? pbf.readString()
        : tag === 2 ? pbf.readFloat()
          : tag === 3 ? pbf.readDouble()
            : tag === 4 ? pbf.readVarint64()
              : tag === 5 ? pbf.readVarint()
                : tag === 6 ? pbf.readSVarint()
                  : tag === 7 ? pbf.readBoolean() : null;
    }
    layer.values.push(value);
  }
}

/**
 * 要素解析
 * @param tag
 * @param feature
 * @param pbf
 */
function featurePBFReader (tag, feature, pbf) {
  if (tag === 1) {
    feature.id = pbf.readVarint();
  } else if (tag === 2) {
    const end = pbf.readVarint() + pbf.pos;
    while (pbf.pos < end) {
      const key = feature.layer.keys[pbf.readVarint()];
      const value = feature.layer.values[pbf.readVarint()];
      feature.properties[key] = value;
    }
  } else if (tag === 3) {
    feature.type = pbf.readVarint();
  } else if (tag === 4) {
    feature.geometry = pbf.pos;
  }
}

/**
 * 获取渲染后的要素
 * @param pbf
 * @param layer
 * @param i
 * @returns {{layer: *, type: number, properties: {}}}
 */
function readRawFeature (pbf, layer, i) {
  pbf.pos = layer.features[i];
  const end = pbf.readVarint() + pbf.pos;
  const feature = {
    layer: layer,
    type: 0,
    properties: {}
  };
  pbf.readFields(featurePBFReader, feature, end);
  return feature;
}

/**
 * 获取空间信息类型
 * @param type
 * @param numEnds
 * @returns {}
 */
function getGeometryType (type, numEnds) {
  let geometryType;
  if (type === 1) {
    geometryType = numEnds === 1
      ? 'Point' : 'MultiPoint';
  } else if (type === 2) {
    geometryType = numEnds === 1
      ? 'LineString'
      : 'MultiLineString';
  } else if (type === 3) {
    geometryType = 'Polygon';
  }
  return geometryType;
}

export {
  getGeometryType
}

export default MVT;
