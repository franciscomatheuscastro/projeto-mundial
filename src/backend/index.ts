import salvarUsuario from "./usuario/salvarUsuario";
import obterTodos from "./usuario/obterTodos";
import obterPorId from "./usuario/obterPorId";
import excluirUsuario from "./usuario/excluirUsuario";

import salvarCliente from "./cliente/salvarCliente";
import obterTodosClientes from "./cliente/obterTodos";
import obterClientePorId from "./cliente/obterPorId";
import excluirCliente from "./cliente/excluirCliente";

import salvarModeloPesquisa from "./modeloPesquisa/salvarModeloPesquisa";
import obterTodosModelosPesquisa from "./modeloPesquisa/obterTodos";
import obterModeloPesquisaPorId from "./modeloPesquisa/obterPorId";
import adicionarPerguntaModeloPesquisa from "./modeloPesquisa/adicionarPergunta";
import salvarPerguntaModeloPesquisa from "./modeloPesquisa/salvarPergunta";
import excluirPerguntaModeloPesquisa from "./modeloPesquisa/excluirPergunta";
import duplicarModeloPesquisa from "./modeloPesquisa/duplicarModeloPesquisa";
import excluirModeloPesquisa from "./modeloPesquisa/excluirModeloPesquisa";

import excluirPesquisaCliente from "./pesquisaCliente/excluirPesquisa";
import salvarPesquisa from "./pesquisaCliente/salvarPesquisa";
import obterTodosPesquisasCliente from "./pesquisaCliente/obterTodos";
import obterPesquisaClientePorId from "./pesquisaCliente/obterPorId";
import obterRelatorioPesquisaCliente from "./pesquisaCliente/ObterRelatorio";
import alterarStatusPesquisaCliente from "./pesquisaCliente/alterarStatus";
import obterDadosFormularioPesquisaCliente from "./pesquisaCliente/obterDadosFormulario";
import obterMinhasPesquisasCliente from "./pesquisaCliente/obterMinhas";
import obterMinhaPesquisaClientePorId from "./pesquisaCliente/obterMinhaPorId";
import obterMeuRelatorioPesquisaCliente from "./pesquisaCliente/obterMeuRelatorio";

import obterPesquisaPublicaPorToken from "./respostaPesquisa/obterPorToken";
import salvarRespostaPesquisa from "./respostaPesquisa/salvarRespostaPesquisa";

import salvarPlanoAcao from "./planoAcao/salvarPlanoAcao";
import obterTodosPlanosAcao from "./planoAcao/obterTodos";
import obterPlanoAcaoPorId from "./planoAcao/obterPorId";
import obterPlanosAcaoPorPesquisa from "./planoAcao/obterPorPesquisa";
import excluirPlanoAcao from "./planoAcao/excluirPlanoAcao";
import obterMeusPlanosAcao from "./planoAcao/obterMeus";
import obterMeuPlanoAcaoPorId from "./planoAcao/obterMeuPorId";

import salvarAgendamento from "./agendamento/salvarAgendamento";
import obterTodosAgendamentos from "./agendamento/obterTodos";
import obterAgendamentoPorId from "./agendamento/obterPorId";
import excluirAgendamento from "./agendamento/excluirAgendamento";
import obterMeusAgendamentos from "./agendamento/obterMeus";
import obterMeuAgendamentoPorId from "./agendamento/obterMeuPorId";

import criarDenunciaPublica from "./denuncia/criarDenunciaPublica";
import consultarDenunciaPublica from "./denuncia/consultarDenunciaPublica";
import obterTodosDenuncias from "./denuncia/obterTodos";
import obterDenunciaPorId from "./denuncia/obterPorId";
import obterDenunciasPorCliente from "./denuncia/obterPorCliente";
import salvarDenuncia from "./denuncia/salvarDenuncia";
import adicionarTratativaDenuncia from "./denuncia/adicionarTratativa";
import obterMinhasDenuncias from "./denuncia/obterMinhasDenuncias";
import obterMinhaDenunciaPorId from "./denuncia/obterMinhaDenunciaPorId";
import salvarMinhaDenuncia from "./denuncia/salvarMinhaDenuncia";
import adicionarMinhaTratativa from "./denuncia/adicionarMinhaTratativa";

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
    excluir: excluirCliente,
  };

  static readonly modelosPesquisa = {
    salvar: salvarModeloPesquisa,
    obterTodos: obterTodosModelosPesquisa,
    obterPorId: obterModeloPesquisaPorId,
    adicionarPergunta: adicionarPerguntaModeloPesquisa,
    salvarPergunta: salvarPerguntaModeloPesquisa,
    excluirPergunta: excluirPerguntaModeloPesquisa,
    duplicar: duplicarModeloPesquisa,
    excluir: excluirModeloPesquisa,
  };

  static readonly pesquisasCliente = {
    salvar: salvarPesquisa,
    obterTodos: obterTodosPesquisasCliente,
    obterPorId: obterPesquisaClientePorId,
    obterRelatorio: obterRelatorioPesquisaCliente,
    alterarStatus: alterarStatusPesquisaCliente,
    obterDadosFormulario: obterDadosFormularioPesquisaCliente,
    excluir: excluirPesquisaCliente,

    obterMinhas: obterMinhasPesquisasCliente,
    obterMinhaPorId: obterMinhaPesquisaClientePorId,
    obterMeuRelatorio: obterMeuRelatorioPesquisaCliente,
  };

  static readonly respostasPesquisa = {
    obterPorToken: obterPesquisaPublicaPorToken,
    salvar: salvarRespostaPesquisa,
  };

  static readonly planosAcao = {
    salvar: salvarPlanoAcao,
    obterTodos: obterTodosPlanosAcao,
    obterPorId: obterPlanoAcaoPorId,
    obterPorPesquisa: obterPlanosAcaoPorPesquisa,
    excluir: excluirPlanoAcao,

    obterMeus: obterMeusPlanosAcao,
    obterMeuPorId: obterMeuPlanoAcaoPorId,
  };

  static readonly agendamentos = {
    salvar: salvarAgendamento,
    obterTodos: obterTodosAgendamentos,
    obterPorId: obterAgendamentoPorId,
    excluir: excluirAgendamento,

    obterMeus: obterMeusAgendamentos,
    obterMeuPorId: obterMeuAgendamentoPorId,
  };

  static readonly denuncias = {
    criarPublica: criarDenunciaPublica,
    consultarPublica: consultarDenunciaPublica,
    obterTodos: obterTodosDenuncias,
    obterPorId: obterDenunciaPorId,
    obterPorCliente: obterDenunciasPorCliente,
    salvar: salvarDenuncia,
    adicionarTratativa: adicionarTratativaDenuncia,

    obterMinhas: obterMinhasDenuncias,
    obterMinhaPorId: obterMinhaDenunciaPorId,
    salvarMinha: salvarMinhaDenuncia,
    adicionarMinhaTratativa,
  };
    

}