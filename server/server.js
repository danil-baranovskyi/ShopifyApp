import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import Shopify, {ApiVersion} from "@shopify/shopify-api";
import {createReadStream} from 'fs';
import Koa from "koa";
import Router from "koa-router";
import serve from "koa-static";
import {authMiddleWare} from "./middlewares/createAuthMiddleWare.js";
import jwt from 'jsonwebtoken';
import bodyParser from 'koa-bodyparser';
import axios from "axios";
import * as zlib from "zlib";
import * as path from "path";
import compress from "koa-compress";
import staticCache from "koa-static-cache";
import {Shops} from "./db";

dotenv.config();

const port = parseInt(process.env.PORT, 10) || 8081;

const server = new Koa();
const router = new Router();

server.use(compress({
  gzip: {
    flush: zlib.constants.Z_SYNC_FLUSH
  },
  deflate: {
    flush: zlib.constants.Z_SYNC_FLUSH,
  },
  br: false
}))

server.use(serve(__dirname + "/../static", {defer: true}));

server.use(staticCache(path.join(__dirname, '../static'), {
  maxAge: 365 * 24 * 60 * 60
}))

server.use(authMiddleWare);

router.post("/webhooks", async (ctx) => {
  try {
    await Shops.deleteOne({name: ctx.request.header['x-shopify-shop-domain']});
  } catch (e) {
    ctx.throw(404, "Not Found");
  }
});

router.post("/graphql",
  async (ctx, next) => {
    try {
      const sessionToken = ctx.request.headers.authorization.split(' ')[1]
      const headers = jwt.verify(sessionToken, process.env.SHOPIFY_API_SECRET);
      const shopData = await Shops.findOne({name: headers.dest.split("//")[1]});

      const response = await axios.post(
        `${headers.dest}/admin/api/2021-10/graphql.json`,
        ctx.request.body,
        {
          headers: {
            'X-Shopify-Access-Token': shopData.accessToken
          }
        })
      ctx.body = response.data;
    } catch (e) {
      ctx.throw(404, e)
    }
    await next()
  }
);

router.get("/", async (ctx, next) => {
  console.log("ROUTE '/'")
  // console.log(ctx)
  // await next();
})

router.get("(.*)", async (ctx, next) => {
  const shop = ctx.query.shop;
  const find = await Shops.findOne({name: shop}, null, {});

  console.log(ctx.query)

  if (!find) {
    return ctx.redirect(`/auth?shop=${shop}`);
  }

  ctx.type = 'html';
  ctx.body = createReadStream(__dirname + '/../static/index.html');

  await next()
});
server.use(bodyParser())
server.use(router.allowedMethods());
server.use(router.routes());
server.listen(port, () => {
  console.log(`> Ready on http://localhost:${port}`);
});
