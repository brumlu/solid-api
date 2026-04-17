export class User {
  constructor({ id, name, email, password, roleId, createdAt }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.roleId = roleId;
    this.createdAt = createdAt;

    if (!email.includes('@')) {
      throw new Error("Email inválido");
    }
  }

  // Ocultar a senha ao retornar dados
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}