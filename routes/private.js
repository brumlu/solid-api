import express from 'express';
import bcrypt from 'bcrypt';
import prisma from "../src/lib/prisma.js";

const router = express.Router();

router.get('/listar-usuarios', async (req, res) => {

    try { 
        const users = await prisma.users.findMany({ omit: {password: true} });
        res.status(200).json({ message: 'Lista de usuários', users});
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar usuários' });
    }
});

router.patch('/atualizar-usuario/:id', async (req, res) => {
    try{
        await prisma.users.update({
            where: { 
                id: parseInt(req.params.id)
            },
            data: {
                name: req.body.name,
                email: req.body.email,
            }
        });
    const jsonSucess = JSON.stringify({ message: 'Usuário atualizado com sucesso' });
        res.status(200).json({ ...req.body, ...JSON.parse(jsonSucess) });
    }catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar usuário', error: error.message });
    }
});

router.patch('/atualizar-senha/:id', async (req, res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await prisma.users.update({
            where: { 
                id: parseInt(req.params.id)
            },
            data: {
                password: hashedPassword
            }
        });
        res.status(200).json({ message: 'Senha atualizada com sucesso' });
    }catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar senha', error: error.message });
    }
});

router.delete('/deletar-usuario/:id', async (req, res) => {
    try{
        await prisma.users.delete({
            where: { 
                id: parseInt(req.params.id)
            }
        });
        res.status(200).json({ message: 'Usuário deletado com sucesso' });
    }catch (error) {
        res.status(500).json({ message: 'Erro ao deletar usuário', error: error.message });
    }
});


export default router;