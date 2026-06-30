import * as productService from "../services/productService.js";

export async function getProducts(req, res) {
  const products = await productService.getProducts();
  res.json(products);
}

export async function createProduct(req, res) {
  const product = await productService.createProduct(req.body);
  res.json(product);
}


export async function updateProduct(req, res) {
  const { id } = req.params; // pega o ID da URL (ex: /products/1)
  const product = await productService.updateProduct(id, req.body);
  res.json(product);
}

// função para deletar
export async function deleteProduct(req, res) {
  const { id } = req.params;
  await productService.deleteProduct(id);
  res.status(204).send(); // retorna "sem conteúdo" para confirmar a exclusão
}