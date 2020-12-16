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

module.exports = router;
