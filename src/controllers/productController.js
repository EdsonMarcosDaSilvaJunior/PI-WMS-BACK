import * as productService from "../services/productService.js";

export async function getProducts(req, res) {
  const products = await productService.getProducts();
  res.json(products);
}

export async function createProduct(req, res) {
  const product = await productService.createProduct(req.body);
  res.json(product);
}