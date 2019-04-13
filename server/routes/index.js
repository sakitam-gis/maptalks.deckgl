const router = require('koa-router')();
const axios = require('axios');

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

router.get('/osm', async (ctx, next) => {
  ctx.compress = true
  // console.log(ctx.url)
  // const url = ctx.url.replace('/osm', '');
  const { x, y, z } = ctx.query;
  // https://a.data.osmbuildings.org/0.2/ph2apjye/tile/15/17606/10746.json
  const data = await axios.get(`https://${getRandom()}.data.osmbuildings.org/0.2/ph2apjye/tile/${z}/${x}/${y}.json`, {
    headers: {
      'Origin': 'https://osmbuildings.org',
      // 'Access-Control-Allow-Origin': 'https://osmbuildings.org',
      'Server': 'OSM Buildings',
      'Pragma': 'cache'
    }
  }).then(res => res.data);
  ctx.status = 200;
  ctx.body = data;
});

module.exports = router;
