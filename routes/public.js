import express from 'express';
import prisma from "../src/lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const router = express.Router();

router.post('/cadastro', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.users.create({
      data: {
        email,
        name,
        password: hashedPassword,
        // Vincula o usuário na Role ALUNO por padrão
        role: {
          connect: { name: 'ALUNO' } 
        }
      },
    });

    res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao cadastrar usuário', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.users.findUnique({
      where: { email },
      include: { 
        role: { include: { permissions: true } } 
      }
    });

    // Validar se usuário existe e senha bate
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Extrair permissões com segurança
    const userPermissions = user.role?.permissions.map(p => p.name) || [];

    const token = jwt.sign(
        { 
            id: user.id, 
            permissions: userPermissions 
        }, 
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
        );

        // Retornar o token JWT para o cliente e salvar no localStorage no front futuramente
        return res.status(200).send(token);
        
    }catch (err) {
        res.status(500).json({ message: 'Erro ao fazer login', err: err.message });
    }
    });

export default router;