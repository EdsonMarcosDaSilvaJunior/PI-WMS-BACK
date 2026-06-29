import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// listar pedidos
router.get('/', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        product: true // Traz o nome e estoque do produto junto com o pedido
      },
      orderBy: {
        id: 'asc'
      }
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar pedidos." });
  }
});

// ADICIONADO: criar novo pedido
router.post('/', async (req, res) => {
  const { customerName, quantity, productId } = req.body;

  try {
    const newOrder = await prisma.order.create({
      data: {
        customerName: customerName,
        quantity: parseInt(quantity),   // Garante que vai como número inteiro para o banco
        status: "Pendente",             // Status inicial automático
        productId: parseInt(productId)  // Converte o ID do produto para número inteiro
      },
      include: {
        product: true // Já traz os dados do produto para preencher a linha da tabela na hora
      }
    });
    
    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Erro ao criar pedido no banco:", error);
    res.status(500).json({ error: "Erro interno ao criar pedido." });
  }
});

// atualizar status do pedido
router.patch('/:id/separar', async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { product: true } // Precisamos saber o estoque atual
    });

    // Validações de segurança
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
    if (order.status === "Separado") return res.status(400).json({ error: "Este pedido já foi separado." });
    if (order.product.stock < order.quantity) return res.status(400).json({ error: "Estoque insuficiente para separar este pedido." });

    const [updatedOrder, stockUpdate, movementRecord] = await prisma.$transaction([
      
      prisma.order.update({
        where: { id: parseInt(id) },
        data: { status: "Separado" }
      }),
      
      // estoque atual - quantidade pedida
      prisma.product.update({
        where: { id: order.productId },
        data: { stock: order.product.stock - order.quantity }
      }),
      
      // salva no histórico de movimentação 
      prisma.movement.create({
        data: {
          type: "saida", // registro de saída
          quantity: order.quantity,
          productId: order.productId
        }
      })
    ]);

    res.status(200).json({ message: "Pedido separado e estoque baixado com sucesso!", order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno ao separar pedido." });
  }
});

export default router;