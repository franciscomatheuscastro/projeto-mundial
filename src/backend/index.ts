import salvarUsuario from "./usuario/salvarUsuario";
import obterTodos from "./usuario/obterTodos";
import obterPorId from "./usuario/obterPorId";
import excluirUsuario from "./usuario/excluirUsuario";

import salvarCliente from "./cliente/salvarCliente";
import obterTodosClientes from "./cliente/obterTodos";
import obterClientePorId from "./cliente/obterPorId";

import salvarModeloPesquisa from "./modeloPesquisa/salvarModeloPesquisa";
import obterTodosModelosPesquisa from "./modeloPesquisa/obterTodos";
import obterModeloPesquisaPorId from "./modeloPesquisa/obterPorId";
import adicionarPerguntaModeloPesquisa from "./modeloPesquisa/adicionarPergunta";
import salvarPerguntaModeloPesquisa from "./modeloPesquisa/salvarPergunta";
import excluirPerguntaModeloPesquisa from "./modeloPesquisa/excluirPergunta";
import duplicarModeloPesquisa from "./modeloPesquisa/duplicarModeloPesquisa";

import salvarPesquisa from "./pesquisaCliente/salvarPesquisa";
import obterTodosPesquisasCliente from "./pesquisaCliente/obterTodos";
import obterPesquisaClientePorId from "./pesquisaCliente/obterPorId";
import obterRelatorioPesquisaCliente from "./pesquisaCliente/ObterRelatorio";
import alterarStatusPesquisaCliente from "./pesquisaCliente/alterarStatus";
import obterDadosFormularioPesquisaCliente from "./pesquisaCliente/obterDadosFormulario";

import obterPesquisaPublicaPorToken from "./respostaPesquisa/obterPorToken";
import salvarRespostaPesquisa from "./respostaPesquisa/salvarRespostaPesquisa";

export default class Backend {
  static readonly usuarios = {
    salvar: salvarUsuario,
    obterTodos,
    obterPorId,
    excluir: excluirUsuario,
  };

  static readonly clientes = {
    salvar: salvarCliente,
    obterTodos: obterTodosClientes,
    obterPorId: obterClientePorId,
  };

  static readonly modelosPesquisa = {
    salvar: salvarModeloPesquisa,
    obterTodos: obterTodosModelosPesquisa,
    obterPorId: obterModeloPesquisaPorId,
    adicionarPergunta: adicionarPerguntaModeloPesquisa,
    salvarPergunta: salvarPerguntaModeloPesquisa,
    excluirPergunta: excluirPerguntaModeloPesquisa,
    duplicar: duplicarModeloPesquisa,
  };

  static readonly pesquisasCliente = {
    salvar: salvarPesquisa,
    obterTodos: obterTodosPesquisasCliente,
    obterPorId: obterPesquisaClientePorId,
    obterRelatorio: obterRelatorioPesquisaCliente,
    alterarStatus: alterarStatusPesquisaCliente,
    obterDadosFormulario: obterDadosFormularioPesquisaCliente,
  };

  static readonly respostasPesquisa = {
    obterPorToken: obterPesquisaPublicaPorToken,
    salvar: salvarRespostaPesquisa,
  };

}