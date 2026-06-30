import prisma from "../prisma/client.js";

export async function getProducts() {
  return await prisma.product.findMany();
}

export async function createProduct(data) {
  return await prisma.product.create({
    data,
  });
}

export async function updateProduct(id, data) {
  return await prisma.product.update({
    where: { id: Number(id) }, 
    data,
  });
}

// excluir um produto com cascata automática com o DB
export async function deleteProduct(id) {
 
  return await prisma.product.delete({
    where: { id: Number(id) },
  });
}