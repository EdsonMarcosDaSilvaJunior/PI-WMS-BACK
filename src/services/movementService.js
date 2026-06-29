import prisma from "../prisma/client.js";

export async function createMovement(data) {

  const product = await prisma.product.findUnique({
    where: { id: Number(data.productId) }
  });

  if (!product) {
    throw new Error("Produto não encontrado");
  }

  let novoEstoque = product.stock;

  if (data.type === "entrada") {
    novoEstoque += data.quantity;
  }

  if (data.type === "saida") {
    novoEstoque -= data.quantity;
  }

  if (novoEstoque < 0) {
    throw new Error("Estoque insuficiente");
  }

  await prisma.product.update({
    where: { id: Number(data.productId) },
    data: {
      stock: novoEstoque
    }
  });

  return await prisma.movement.create({
    data: {
      type: data.type,
      quantity: data.quantity,
      productId: Number(data.productId)
    }
  });
}