import salvarUsuario from "./usuario/salvarUsuario";
import obterTodos from "./usuario/obterTodos";
import obterPorId from "./usuario/obterPorId";
import excluirUsuario from "./usuario/excluirUsuario";

export default class Backend {
  static readonly usuarios = {
    salvar: salvarUsuario,
    obterTodos,
    obterPorId,
    excluir: excluirUsuario,
  };
}