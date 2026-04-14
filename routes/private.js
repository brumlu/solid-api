import express from 'express';
import bcrypt from 'bcrypt';
import prisma from "../src/lib/prisma.js";
import auth from '../middlewares/auth.js';
import checkPermission from '../middlewares/checkPermission.js';
import isOwnerOrAdmin from '../middlewares/isOwnerOrAdmin.js';
import { Permissions } from '../src/constants/permissions.js';

const router = express.Router();

/**
 * 1. LISTAR USUÁRIOS
 * Apenas quem tem permissão de leitura.
 * Remover dados de data e roles
 */
router.get('/listar-usuarios', auth, checkPermission(Permissions.USER_READ), async (req, res) => {
    try { 
        const users = await prisma.users.findMany({ 
            include: { 
                role: {
                    select: { name: true, description: true }
                } 
            },
            omit: { password: true } 
        });
        res.status(200).json({ message: 'Lista de usuários', users });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar usuários' });
    }
});

/**
 * 2. ATUALIZAR DADOS BÁSICOS
 * O próprio usuário ou um Admin podem alterar nome/email.
 */
router.patch('/atualizar-usuario/:id', auth, isOwnerOrAdmin, async (req, res) => {
    try {
        await prisma.users.update({
            where: { id: parseInt(req.params.id) },
            data: {
                name: req.body.name,
                email: req.body.email
            }
        });
        res.status(200).json({ message: 'Usuário atualizado com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar usuário', error: error.message });
    }
});

/**
 * 3. ATUALIZAR SENHA
 * O próprio usuário ou um Admin.
 */
router.patch('/atualizar-senha/:id', auth, isOwnerOrAdmin, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await prisma.users.update({
            where: { id: parseInt(req.params.id) },
            data: { password: hashedPassword }
        });
        res.status(200).json({ message: 'Senha atualizada com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar senha', error: error.message });
    }
});

/**
 * 4. DELETAR USUÁRIO
 * Apenas quem tem a permissão específica de deleção.
 */
router.delete('/deletar-usuario/:id', auth, checkPermission(Permissions.USER_DELETE), async (req, res) => {
    try {
        await prisma.users.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.status(200).json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar usuário', error: error.message });
    }
});

/**
 * 5. ALTERAR CARGO (ADMIN TOOL)
 * Aqui deve se enviar o 'roleId' no corpo da requisição.
 */
router.patch('/admin/alterar-privilegio/:id', auth, checkPermission(Permissions.ADMIN_ACCESS), async (req, res) => {
    const { roleId } = req.body;

    if (!roleId) {
        return res.status(400).json({ message: "O roleId é obrigatório para esta operação." });
    }

    try {
        await prisma.users.update({
            where: { id: parseInt(req.params.id) },
            data: { roleId: parseInt(roleId) } 
        });
        res.status(200).json({ message: "Cargo do usuário alterado com sucesso." });
    } catch (error) {
        res.status(500).json({ message: "Erro ao alterar cargo", error: error.message });
    }
});

/**
 * 6. SETUP INICIAL INTERNO
 * Rota para se dar o cargo de ADMIN sem precisar de token.
 */
router.patch('/internal/setup-admin/:id', async (req, res) => {
    const MASTER_KEY = "123"; 
    const providedKey = req.headers['x-master-key'];

    if (providedKey !== MASTER_KEY) {
        return res.status(403).json({ message: "Acesso negado: Chave mestra incorreta." });
    }

    try {
        // Busca o registro do cargo ADMIN no banco (que foi criado via Seed)
        const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });

        if (!adminRole) {
            return res.status(404).json({ message: "Erro: O cargo 'ADMIN' ainda não foi criado no banco. Rode o Seed primeiro." });
        }

        await prisma.users.update({
            where: { id: parseInt(req.params.id) },
            data: { roleId: adminRole.id }
        });

        res.status(200).json({ message: "Promoção realizada! Você agora é um administrador do sistema." });
    } catch (error) {
        res.status(500).json({ message: "Erro no setup interno", error: error.message });
    }
});

export default router;