import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, {verifyRequest} from "@shopify/koa-shopify-auth";
import Shopify, {ApiVersion} from "@shopify/shopify-api";
import Koa from "koa";
import Router from "koa-router";
import {createReadStream} from 'fs';
import serve from "koa-static";
import compress from "koa-compress";
import staticCache from "koa-static-cache";
import * as zlib from "zlib";
import * as path from "path";

dotenv.config();

const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https:\/\//, ""),
  API_VERSION: ApiVersion.October20,
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

const ACTIVE_SHOPIFY_SHOPS = {};


const server = new Koa();
const router = new Router();
server.keys = [Shopify.Context.API_SECRET_KEY];
server.use(compress({
  // threshold: 2048,
  gzip: {
    flush: zlib.constants.Z_SYNC_FLUSH
  },
  deflate: {
    flush: zlib.constants.Z_SYNC_FLUSH,
  },
  br: false // disable brotli
}))

server.use(staticCache(path.join(__dirname, '../static'), {
  maxAge: 365 * 24 * 60 * 60
}))


console.log("=============")
server.use(async (ctx, next) => {
  console.log(ctx)
  ctx.redirect(
    `https://${ctx.request.url.split("=")[1]}/admin/oauth/authorize?client_id=c214e210172e7b984776f132df74873a&scope=write_orders&redirect_uri=https://9d01-212-8-50-171.ngrok.io/auth/callback`
  )
  // ctx.redirect("https://some.some.example.asd")
})
//
// server.use(
//   createShopifyAuth({
//     async afterAuth(ctx) {
//       // Access token and shop available in ctx.state.shopify
//       // console.log(ctx)
//       // console.log("================")
//       // console.log(ctx.state)
//       const {shop, accessToken, scope} = ctx.state.shopify;
//       const host = ctx.query.host;
//       ACTIVE_SHOPIFY_SHOPS[shop] = scope;
//
//       const response = await Shopify.Webhooks.Registry.register({
//         shop,
//         accessToken,
//         path: "/webhooks",
//         topic: "APP_UNINSTALLED",
//         webhookHandler: async (topic, shop, body) =>
//           delete ACTIVE_SHOPIFY_SHOPS[shop],
//       });
//
//       if (!response.success) {
//         console.log(
//           `Failed to register APP_UNINSTALLED webhook: ${response.result}`
//         );
//       }
//
//       // Redirect to app with shop parameter upon auth
//       ctx.redirect(`/?shop=${shop}&host=${host}`);
//     },
//   })
// );

// server.use( ctx => {
//   console.log(ctx)
// })

server.use(serve(__dirname + '/../static'))

router.get("/9d01-212-8-50-171.ngrok.io", ctx => {
  console.log(ctx)
})
router.post('/auth/callback', ctx => {
  console.log(ctx)
  console.log(ctx.state)
})

router.post('/auth', ctx => {
  console.log(ctx)
  console.log(ctx.state)
})

router.post("/webhooks", async (ctx) => {
  try {
    await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
    console.log(`Webhook processed, returned status code 200`);
  } catch (error) {
    console.log(`Failed to process webhook: ${error}`);
  }
});

router.post(
  "/graphql",
  verifyRequest({returnHeader: true}),
  async (ctx, next) => {
    await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
  }
);

router.get("(.*)", async (ctx) => {
  const shop = ctx.query.shop;
  // console.log(ctx)
  // This shop hasn't been seen yet, go through OAuth to create a session
  if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
    ctx.redirect(`/auth?shop=${shop}`);
  } else {
    ctx.type = 'html';
    ctx.body = createReadStream(__dirname + '/../static/index.html');
  }
});

server.use(router.allowedMethods());
server.use(router.routes());
server.listen(port, () => {
  console.log(`> Ready on http://localhost:${port}`);
});



// {
//   async afterAuth(ctx) {
//   // Access token and shop available in ctx.state.shopify
//   // console.log(ctx)
//   // console.log("================")
//   // console.log(ctx.state)
//   const {shop, accessToken, scope} = ctx.state.shopify;
//   const host = ctx.query.host;
//   ACTIVE_SHOPIFY_SHOPS[shop] = scope;
//
//   const response = await Shopify.Webhooks.Registry.register({
//     shop,
//     accessToken,
//     path: "/webhooks",
//     topic: "APP_UNINSTALLED",
//     webhookHandler: async (topic, shop, body) =>
//       delete ACTIVE_SHOPIFY_SHOPS[shop],
//   });
//
//   if (!response.success) {
//     console.log(
//       `Failed to register APP_UNINSTALLED webhook: ${response.result}`
//     );
//   }
//
//   // Redirect to app with shop parameter upon auth
//   ctx.redirect(`/?shop=${shop}&host=${host}`);
// },
// }
