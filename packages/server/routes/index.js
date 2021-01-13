const router = require('koa-router')();
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

function writeFile (filePath, basePath, data) {
  fs.writeJsonSync(path.join(basePath, filePath), data, err => {
    if (err) return console.error(err);
  });
}

router.get('/', async (ctx, next) => {
  ctx.status = 200;
  ctx.body = {
    code: 0,
    success: true,
    message: 'success',
    data: 'success'
  }
});

function getUrl(template, properties) {
  if (!template || !template.length) {
    return null;
  }
  if (Array.isArray(template)) {
    const index = Math.abs(properties.x + properties.y) % template.length;
    template = template[index];
  }

  const { x, y, z } = properties;
  return template
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{z}', String(z))
    .replace('{-y}', String(Math.pow(2, z) - y - 1));
}

const getRandom = function (subdomain = ['a', 'b', 'c']) {
  const r = Math.random() * 2;
  let re = Math.round(r);
  re = Math.max(Math.min(re, 2), 0);
  return subdomain[re];
};

router.get('/osm/:z/:x/:y', async (ctx, next) => {
  ctx.compress = true
  // console.log(ctx.url)
  // const url = ctx.url.replace('/osm', '');
  let { x, y, z } = ctx.params;
  y = y.split('.')[0];

  const base = path.resolve(__dirname, `../public/tiles/${z}/${x}`)
  const uri = path.resolve(__dirname, `../public/tiles/${z}/${x}/${y}.json`)

  if (fs.existsSync(uri)) {
    const d = fs.readJsonSync(uri);
    ctx.status = 200;
    ctx.body = d;
  } else {
    // https://a.data.osmbuildings.org/0.2/ph2apjye/tile/15/17606/10746.json
    const data = await axios.get(`https://${getRandom()}.data.osmbuildings.org/0.2/ph2apjye/tile/${z}/${x}/${y}.json`, {
      headers: {
        'Origin': 'https://osmbuildings.org',
        // 'Access-Control-Allow-Origin': 'https://osmbuildings.org',
        'Server': 'OSM Buildings',
        'Pragma': 'cache'
      }
    }).then(res => res.data);

    fs.ensureDirSync(base);
    fs.writeJsonSync(uri, data, err => {
      if (err) return console.error(err);
    });

    ctx.status = 200;
    ctx.body = data;
  }
});

const mapbox_service = {
  urlTemplate: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.webp?sku=101XzrMiclXn4&access_token=pk.eyJ1Ijoic21pbGVmZGQiLCJhIjoiY2tnN2Iybm91MDIzajJ5bHM1N3o5YzgybiJ9.KI0dCXX1rAfcLO1iwGKwHg`,
  terrainTiles: [
    `https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=pk.eyJ1Ijoic21pbGVmZGQiLCJhIjoiY2tnN2Iybm91MDIzajJ5bHM1N3o5YzgybiJ9.KI0dCXX1rAfcLO1iwGKwHg`,
    `https://b.tiles.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=pk.eyJ1Ijoic21pbGVmZGQiLCJhIjoiY2tnN2Iybm91MDIzajJ5bHM1N3o5YzgybiJ9.KI0dCXX1rAfcLO1iwGKwHg`,
    `https://c.tiles.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=pk.eyJ1Ijoic21pbGVmZGQiLCJhIjoiY2tnN2Iybm91MDIzajJ5bHM1N3o5YzgybiJ9.KI0dCXX1rAfcLO1iwGKwHg`,
    `https://d.tiles.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=pk.eyJ1Ijoic21pbGVmZGQiLCJhIjoiY2tnN2Iybm91MDIzajJ5bHM1N3o5YzgybiJ9.KI0dCXX1rAfcLO1iwGKwHg`,
  ],
}

router.get('/mapbox-satellite/:z/:x/:y', async (ctx, next) => {
  // ctx.compress = true
  let { x, y, z } = ctx.params;
  y = y.split('.')[0];

  const base = path.resolve(__dirname, `../public/mapbox-satellite/${z}/${x}`)
  const uri = path.resolve(__dirname, `../public/mapbox-satellite/${z}/${x}/${y}.webp`)

  if (fs.existsSync(uri)) {
    const d = fs.readFileSync(uri);
    ctx.status = 200;
    ctx.type = 'webp';
    ctx.length = Buffer.byteLength(d);
    ctx.body = d;
  } else {
    const data = await axios.get(getUrl(mapbox_service.urlTemplate, {
      x,
      y,
      z,
    }), {
      headers: {},
      responseType: 'arraybuffer',
    }).then(res => res.data);

    fs.ensureDirSync(base);
    fs.writeFileSync(uri, data, err => {
      if (err) return console.error(err);
    });

    ctx.status = 200;
    ctx.type = 'webp';
    ctx.length = Buffer.byteLength(data);
    ctx.body = data;
  }
});

router.get('/mapbox-terrain/:z/:x/:y', async (ctx, next) => {
  let { x, y, z } = ctx.params;
  y = y.split('.')[0];

  const base = path.resolve(__dirname, `../public/mapbox-terrain/${z}/${x}`)
  const uri = path.resolve(__dirname, `../public/mapbox-terrain/${z}/${x}/${y}.png`)

  if (fs.existsSync(uri)) {
    const d = fs.readFileSync(uri);
    ctx.status = 200;
    ctx.type = 'image/png';
    ctx.length = Buffer.byteLength(d);
    ctx.body = d;
  } else {
    const data = await axios.get(getUrl(mapbox_service.terrainTiles, {
      x,
      y,
      z,
    }), {
      headers: {},
      responseType: 'arraybuffer',
    }).then(res => res.data);

    fs.ensureDirSync(base);
    fs.writeFileSync(uri, data, err => {
      if (err) return console.error(err);
    });

    ctx.status = 200;
    ctx.type = 'image/png';
    ctx.length = Buffer.byteLength(data);
    ctx.body = data;
  }
});

module.exports = router;
