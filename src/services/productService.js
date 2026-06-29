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

// Excluir um produto
export async function deleteProduct(id) {

  await prisma.movement.deleteMany({
    where: {
      productId: Number(id)
    }
  });

  return await prisma.product.delete({
    where: { id: Number(id) },
  });
}