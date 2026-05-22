import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    // Agora recuperamos o token diretamente do cookie-parser
    // O nome do cookie deve ser o mesmo que você definiu no res.cookie do login
    const token = req.cookies.api_token;

    if (!token) {
        return res.status(401).json({ message: 'Acesso negado: Sessão não encontrada ou expirada.' });
    }

    try {
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET não definido no ambiente.');
        }

        // Valida a assinatura do token contido no cookie
        const decoded = jwt.verify(token, JWT_SECRET);

        /**
         * Anexa as informações ao objeto de requisição para os middlewares de RBAC.
         */
        req.user = {
            id: decoded.id,
            // Mantendo a lógica de permissões que você já utiliza
            permissions: decoded.permissions || [] 
        };

        next();

    } catch (err) {
        // Se o token for inválido ou expirar, é uma boa prática limpar o cookie do navegador
        res.clearCookie('api_token');
        return res.status(403).json({ message: 'Acesso negado: Token inválido ou expirado.' });
    }
};

export default auth;