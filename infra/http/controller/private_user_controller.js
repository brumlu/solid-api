export class PrivateUserController {
  constructor(useCases, masterKey) {
    this.useCases = useCases;
    this.masterKey = masterKey;
  }

  async listar(req, res) {
    try {
      const users = await this.useCases.listUsers.execute();
      return res.status(200).json({ message: 'Lista de usuários', users });
    } catch (err) {
      return res.status(500).json({ message: 'Erro ao listar usuários' });
    }
  }

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { name, email } = req.body;
      await this.useCases.updateUser.execute(id, { name, email });
      return res.status(200).json({ message: 'Usuário atualizado com sucesso' });
    } catch (err) {
      return res.status(500).json({ message: 'Erro ao atualizar' });
    }
  }

  async atualizarSenha(req, res) {
    try {
      const { password } = req.body;
      if (!password) return res.status(400).json({ message: 'A nova senha é obrigatória.' });

      await this.useCases.updatePassword.execute(req.params.id, password);
      return res.status(200).json({ message: 'Senha atualizada com sucesso' });
    } catch (err) {
      return res.status(500).json({ message: 'Erro ao atualizar senha' });
    }
  }

  async deletar(req, res) {
    try {
      await this.useCases.deleteUser.execute(req.params.id);
      return res.status(200).json({ message: 'Deletado com sucesso' });
    } catch (err) {
      return res.status(500).json({ message: 'Erro ao deletar' });
    }
  }

  /**
   * NOVO MÉTODO: Alterar Cargo (Admin Tool)
   * Agora a lógica que estava no routes.js mora aqui.
   */
  async alterarCargo(req, res) {
    try {
      const { id } = req.params;
      const { roleId } = req.body;

      if (!roleId) {
        return res.status(400).json({ message: "O roleId é obrigatório para esta operação." });
      }

      await this.useCases.changeRole.execute(id, roleId);
      return res.status(200).json({ message: "Cargo do usuário alterado com sucesso." });
    } catch (err) {
      return res.status(500).json({ message: "Erro ao alterar cargo", error: err.message });
    }
  }

  async setupAdmin(req, res) {
    try {
      // Usa a chave injetada em vez de process.env
      if (req.headers['x-master-key'] !== this.masterKey) {
        return res.status(403).json({ message: "Acesso negado." });
      }
      
      await this.useCases.changeRole.promoteToAdmin(req.params.id);
      return res.status(200).json({ message: "Promovido a Admin" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}