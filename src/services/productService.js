import prisma from "../prisma/client.js";

export async function getProducts() {
  return await prisma.product.findMany();
}

export async function createProduct(data) {
  return await prisma.product.create({
    data,
  });
}