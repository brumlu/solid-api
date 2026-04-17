export const Permissions = Object.freeze({
  // Permissões de Usuário/Default
  USER_READ: 'USER_READ', // Default
  USER_UPDATE: 'USER_UPDATE', // Default (permitido apenas mudar suas próprias informações middleware: isOwnerOrAdmin)
  USER_DELETE: 'USER_DELETE', // Default (o mesmo que o user_update, só que para deletar a própria conta)
 
 
  // Permissões Administrativas
  ADMIN_ACCESS: 'ADMIN_ACCESS',
  USER_CREATE: 'USER_CREATE',
});

export default Permissions;