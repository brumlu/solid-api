// middlewares/checkPermission.js
import Permissions from '../src/constants/permissions.js';

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    const userPermissions = req.user?.permissions;

    if (!userPermissions) {
      return res.status(403).json({ 
        message: "Acesso negado: Nenhuma permissão encontrada." 
      });
    }

    // LÓGICA DE SUPER USUÁRIO:
    // Verifica se ele tem a permissão master OU a permissão específica
    const isSuperUser = userPermissions.includes(Permissions.ADMIN_ACCESS);
    const hasSpecificPermission = userPermissions.includes(requiredPermission);

    if (isSuperUser || hasSpecificPermission) {
      return next(); // Acesso liberado
    }

    // Se não for super usuário nem tiver a permissão específica
    return res.status(403).json({ 
      message: `Acesso negado: Requer privilégio [${requiredPermission}] ou [ADMIN_ACCESS].` 
    });
  };
};

export default checkPermission;