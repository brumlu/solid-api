import Permissions from '../../../model/constants/permissions.js'
import prisma from '../../../infra/database/prisma.js';

const isOwnerOrAdmin = async (req, res, next) => {
    const user = req.user;
    const { id } = req.params;

    if (!user?.id || !id) {
        return res.status(403).json({ message: "ID não identificado." });
    }

    try {
        const isAdmin = user.permissions?.includes(Permissions.ADMIN_ACCESS);
        if (isAdmin) return next();

        // Identifica se a rota é de usuário ou de outro recurso (ex: endereço)
        // Se a URL contiver 'addresses', busca na tabela Address.
        // Se não, assume que o ID na URL é do próprio Usuário.
        const isAddressRoute = req.baseUrl.includes('addresses') || req.path.includes('addresses');

        if (isAddressRoute) {
            const address = await prisma.address.findUnique({ where: { id } });
            if (!address) return res.status(404).json({ message: "Endereço não encontrado." });

            if (String(address.userId) === String(user.id)) return next();
        } else {
            // Rota de Usuário (/users/:id, /delete-user/:id, etc)
            // Aqui comparamos o ID da URL diretamente com o ID do token
            if (String(id) === String(user.id)) return next();
        }

        return res.status(403).json({ message: "Acesso negado." });
    } catch (error) {
        return res.status(500).json({ message: "Erro interno na autorização." });
    }
};

export default isOwnerOrAdmin;