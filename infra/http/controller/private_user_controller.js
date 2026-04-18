export class PrivateUserController {
  constructor(useCases, masterKey) {
    this.useCases = useCases;
    this.masterKey = masterKey;

    // Auto-bind de todos os métodos
    this.listar = this.listar.bind(this);
    this.atualizar = this.atualizar.bind(this);
    this.atualizarSenha = this.atualizarSenha.bind(this);
    this.deletar = this.deletar.bind(this);
    this.alterarCargo = this.alterarCargo.bind(this);
    this.setupAdmin = this.setupAdmin.bind(this);
  }

  async listar(req, res) {
    const result = await this.useCases.listUsers.execute();
    
    // Listagem geralmente retorna Right([]) se estiver vazio
    return res.status(200).json({ 
      message: 'Lista de usuários', 
      users: result.value 
    });
  }

  async atualizar(req, res) {
    const { id } = req.params;
    const { name, email } = req.body;

    const result = await this.useCases.updateUser.execute(id, { name, email });

    if (result.isLeft()) throw result.value;

    return res.status(200).json({ message: 'Usuário atualizado com sucesso' });
  }

  async atualizarSenha(req, res) {
    const { password } = req.body;
    const { id } = req.params;

    if (!password) {
      return res.status(400).json({ message: 'A nova senha é obrigatória.' });
    }

    const result = await this.useCases.updatePassword.execute(id, password);

    if (result.isLeft()) throw result.value;

    return res.status(200).json({ message: 'Senha atualizada com sucesso' });
  }

  async deletar(req, res) {
    const result = await this.useCases.deleteUser.execute(req.params.id);

    if (result.isLeft()) throw result.value;

    return res.status(200).json({ message: 'Deletado com sucesso' });
  }

  async alterarCargo(req, res) {
    const { id } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ message: "O roleId é obrigatório." });
    }

    const result = await this.useCases.changeRole.execute(id, roleId);

    if (result.isLeft()) throw result.value;

    return res.status(200).json({ message: "Cargo alterado com sucesso." });
  }

  async setupAdmin(req, res) {
    // Verificação de Master Key (Acesso de SuperAdmin/DevOps)
    if (req.headers['x-master-key'] !== this.masterKey) {
      return res.status(403).json({ message: "Acesso negado." });
    }
    
    const result = await this.useCases.changeRole.promoteToAdmin(req.params.id);

    if (result.isLeft()) throw result.value;

    return res.status(200).json({ message: "Promovido a Admin" });
  }
}