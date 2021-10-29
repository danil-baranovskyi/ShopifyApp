import mongoose from "mongoose";

const Schema = mongoose.Schema;

const shop = new Schema({
  name: { type : String },
  accessToken: { type : String }
});

mongoose.connect("mongodb://localhost:27017/shops",
  {useUnifiedTopology: true, useNewUrlParser: true},
  err => {
    if (err) console.log(err);
  });

export const Shops = mongoose.model("Shops", shop);
