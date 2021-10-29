import axios from "axios";
import dotenv from "dotenv";
import {Shops} from "../db";
import pick from "lodash/pick";
import crypto from "crypto";
import * as qs from "query-string";

dotenv.config();

export const authMiddleWare = async (ctx, next) => {
  try {
    const {shop, code, hmac} = ctx.query;
    const find = await Shops.findOne({name: shop});
    const toHmac = qs.stringify(pick(ctx.query, ['host', 'shop', 'timestamp', 'session', 'locale']))

    const genHmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(toHmac)
      .digest('hex')

    if (hmac !== undefined && hmac !== genHmac) {
      return ctx.throw(404, "Not Found")
    }

    if (!find && !code && shop) {
      return ctx.redirect(`https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=read_products,write_orders,read_customers,read_products&redirect_uri=${process.env.HOST}/auth/callback&state=007&grant_options[]=per-user`)
    }

    if (code) {
      const resp = await axios.post(`https://${shop}/admin/oauth/access_token`,
        {
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code
        })

      const {access_token} = resp.data;

      await Shops.create({
        name: shop,
        accessToken: access_token,
      })

      await axios.post(`https://${shop}/admin/api/2021-10/webhooks.json`, {
        "webhook": {
          "topic": "app\/uninstalled",
          "address": `${process.env.HOST}/webhooks`,
          "format": "json",
          "fields": ["id", "note"]
        }
      }, {
        headers: {
          "X-Shopify-Access-Token": access_token
        }
      })

      return ctx.redirect(`https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`);
    }
  } catch (e) {
    ctx.throw(404, "Not Found");
  }
  await next();
}
