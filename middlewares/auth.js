import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const auth = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extrai o token do header (formato "Bearer <token>")

    if (!token) return res.status(401).json({ message: 'Token não fornecido' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET); // Verifica o token
        req.userId = decoded.id; // Armazena o ID do usuário no objeto de requisição para uso futuro
        next(); // Continua para a próxima função de middleware ou rota
    } catch (err) {
        res.status(403).json({ message: 'Token inválido' });
    }
};

export default auth;