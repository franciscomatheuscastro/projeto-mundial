export interface ColaboradorCliente {
  id?: string;
  nome: string;
  email: string;
  senha?: string;
  telefone?: string | null;
  setor?: string | null;
  cargo?: string | null;
  ativo?: boolean;
  podeVerDenuncias?: boolean;
  podeTratarDenuncias?: boolean;
}

export interface ColaboradorClienteSalvo {
  id: string;
  clienteId: string;
  usuarioId: string | null;

  nome: string;
  email: string | null;
  telefone: string | null;
  setor: string | null;
  cargo: string | null;
  ativo: boolean;

  podeVerDenuncias: boolean;
  podeTratarDenuncias: boolean;

  criadoEm: Date;
  atualizadoEm: Date;
}