import { Schema, model } from "mongoose";

const productSchema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  thumbnail: { type: String, required: true },
  category: { type: String },
  // stock: { type: Number },
});

export const Product = model("product", productSchema);
