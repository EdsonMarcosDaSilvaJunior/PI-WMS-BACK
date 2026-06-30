import express from 'express';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer'; 

const router = express.Router();
const prisma = new PrismaClient();

// caixa de testes do mailtrap
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "c396b4e3b2629b", 
    pass: "a3a49a3b7799ed"   
  }
});

// rota de cadastro
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

// rota de login
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

// rota de esqueci a senha
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  // mensagem de segurança neutra
  const mensagemNeutra = "Se o e-mail digitado estiver cadastrado em nosso sistema, você receberá um código de recuperação em instantes.";

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    // caso não exista retorna sucesso, mas não faz nada no banco
    if (!user) {
      return res.status(200).json({ message: mensagemNeutra });
    }

    // caso exista, continua o fluxo normal de geração de código
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 30 * 1000); // Expira em 30 segundos

    await prisma.user.update({
      where: { email },
      data: { resetCode, resetCodeExpires }
    });

    // envia e-mail para caixa de testes
    await transporter.sendMail({
      from: '"WMS IFSC - Sistema" <sistema@wmsifsc.local>',
      to: email,
      subject: "Recuperação de Senha - WMS IFSC",
      text: `Olá! Seu código de recuperação é: ${resetCode}. Ele expira em 30 segundos.`
    });

    // retornamos exatamente a mesma mensagem neutra
    return res.status(200).json({ message: mensagemNeutra });
  } catch (error) {
    console.error("Erro no Mailtrap ou Banco de Dados:", error);
    return res.status(500).json({ error: "Erro ao processar a solicitação." });
  }
});

// rota de redefinir senha
router.put('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    // se o usuário não existir  será dado um erro genérico de código
    //  para não revelar que o e-mail não existe no banco.
    if (!user) {
      return res.status(400).json({ error: "Código de recuperação inválido ou expirado." });
    }
    
    // força ambos a serem string e usam o .trim() para limpar espaços extras
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