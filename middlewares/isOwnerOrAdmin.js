import Permissions from '../src/constants/permissions.js'

const isOwnerOrAdmin = (req, res, next) => {
    const user = req.user;
    const { id } = req.params;

    const isOwner = String(user.id) === String(id);
    const isAdmin = user.permissions.includes(Permissions.ADMIN_ACCESS);

    if (isOwner || isAdmin) {
        return next();
    }

    return res.status(403).json({ 
        message: "Acesso negado: Você não tem permissão para alterar estes dados." 
    });
};

export default isOwnerOrAdmin;