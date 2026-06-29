import express from 'express';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer'; 

const router = express.Router();
const prisma = new PrismaClient();

// caixa de testes do mailtrap
// Selecione "Nodemailer" na aba "SMTP Settings" dentro da sua Inbox do Mailtrap e copie o user e pass de lá
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "c396b4e3b2629b", 
    pass: "a3a49a3b7799ed"   
  }
});

// 1. ROTA DE CADASTRO
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) return res.status(400).json({ error: "E-mail já cadastrado." });

    const newUser = await prisma.user.create({ data: { name, email, password } });
    res.status(201).json({ message: "Usuário criado com sucesso!", user: newUser });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar usuário." });
  }
});

// 2. ROTA DE LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.password === password) {
      res.status(200).json({ message: "Login autorizado!", user: { name: user.name, email: user.email } });
    } else {
      res.status(401).json({ error: "E-mail ou senha incorretos." });
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao fazer login." });
  }
});

// 3. ROTA DE ESQUECI A SENHA (Com proteção contra Enumeração de Usuários)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  // Mensagem neutra de segurança
  const mensagemNeutra = "Se o e-mail digitado estiver cadastrado em nosso sistema, você receberá um código de recuperação em instantes.";

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    // SE NÃO EXISTIR: Retornamos sucesso, mas não fazemos nada no banco.
    if (!user) {
      return res.status(200).json({ message: mensagemNeutra });
    }

    // SE EXISTIR: Continua o fluxo normal de geração de código
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 30 * 1000); // Expira em 30 segundos

    await prisma.user.update({
      where: { email },
      data: { resetCode, resetCodeExpires }
    });

    // DISPARO DO E-MAIL PARA A CAIXA DE TESTES
    await transporter.sendMail({
      from: '"WMS IFSC - Sistema" <sistema@wmsifsc.local>',
      to: email,
      subject: "Recuperação de Senha - WMS IFSC",
      text: `Olá! Seu código de recuperação é: ${resetCode}. Ele expira em 30 segundos.`
    });

    // Retornamos exatamente a MESMA mensagem neutra
    return res.status(200).json({ message: mensagemNeutra });
  } catch (error) {
    console.error("Erro no Mailtrap ou Banco de Dados:", error);
    return res.status(500).json({ error: "Erro ao processar a solicitação." });
  }
});

// 4. ROTA DE REDEFINIR SENHA
router.put('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    // se o usuário não existir  será dado um erro genérico de código
    //  para não revelar que o e-mail não existe no banco.
    if (!user) {
      return res.status(400).json({ error: "Código de recuperação inválido ou expirado." });
    }
    
    // CORREÇÃO: Forçamos ambos a serem String (texto) e usamos o .trim() para limpar espaços extras
    if (String(user.resetCode).trim() !== String(code).trim()) {
      return res.status(400).json({ error: "Código de recuperação inválido." });
    }
    
    if (user.resetCodeExpires < new Date()) {
      return res.status(400).json({ error: "O código expirou." });
    }

    await prisma.user.update({
      where: { email },
      data: { password: newPassword, resetCode: null, resetCodeExpires: null }
    });

    return res.status(200).json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao redefinir a senha." });
  }
});

export default router;