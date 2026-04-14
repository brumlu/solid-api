import jwt from 'jsonwebtoken';

/**
 * Middleware de Autenticação
 * Responsável por verificar a validade do token JWT e 
 * disponibilizar os dados do usuário e suas permissões para o restante da aplicação.
 */

const auth = (req, res, next) => {
    // Recupera o token do header Authorization (padrão 'Bearer <token>')
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acesso negado: Token não fornecido.' });
    }

    try {
        // Verifica se o segredo do JWT está configurado
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET não definido no ambiente.');
        }

        // Valida a assinatura do token
        const decoded = jwt.verify(token, JWT_SECRET);

        /**
         * Anexa as informações ao objeto de requisição.
         * Com a arquitetura RBAC, o 'decoded' deve conter:
         * - id: ID do usuário no banco
         * - permissions: Array de strings com os nomes das permissões (ex: ['USER_READ', 'ADMIN_ACCESS'])
         */
        req.user = {
            id: decoded.id,
            permissions: decoded.permissions || [] // Garante que seja um array mesmo que vazio
        };

        // Prossegue para o próximo middleware ou controller
        next();

    } catch (err) {
        // Se o token estiver expirado ou a assinatura for inválida
        return res.status(403).json({ message: 'Acesso negado: Token inválido ou expirado.' });
    }
};

export default auth;