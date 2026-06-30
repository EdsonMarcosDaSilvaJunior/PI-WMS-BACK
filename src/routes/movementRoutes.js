import express from "express";
import { PrismaClient } from '@prisma/client';
import { createMovement } from "../controllers/movementController.js";

const router = express.Router();
const prisma = new PrismaClient();

//registrar uma nova movimentação (POST)
router.post("/", createMovement);
// listar todo o histórico de movimentações (GET)
router.get('/', async (req, res) => {
  try {
    const movements = await prisma.movement.findMany({
      include: {
        product: true // traz dados do produto relacionado 
      },
      orderBy: {
        id: 'desc' // mostra as movimentações mais recentes primeiro
      }
    });
    
    res.status(200).json(movements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar o histórico de movimentações" });
  }
});

export default router;