const Koa = require('koa');
const app = new Koa();
const json = require('koa-json');
const onerror = require('koa-onerror');
const koaBody = require('koa-body'); // 请求体JSON解析
const bodyparser = require('koa-bodyparser');
const logger = require('koa-logger');
const cors = require('koa-cors'); // 跨域
// const zlib = require('zlib')
const compress = require('koa-compress');
const convert = require('koa-convert');
const config = require('./config/config');
const index = require('./routes/index');

// error handler
onerror(app);
app.use(convert(cors()));
app.use(koaBody({ multipart: true }));
// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))
app.use(json());
app.use(logger());
// eslint-disable-next-line
app.use(require('koa-static')(__dirname + '/' + config.staticDir));
app.use(compress({
  filter: function (contentType) {
    return /json/i.test(contentType)
  },
  threshold: 2048,
  flush: require('zlib').Z_SYNC_FLUSH
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// routes
app.use(index.routes(), index.allowedMethods());

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app;
