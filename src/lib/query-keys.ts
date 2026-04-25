export const QueryKeys = {
  // Global / Dashboard
  DASHBOARD: ['dashboard'] as const,
  RBAC: (userId?: string, tenantId?: string) => ['rbac', userId, tenantId] as const,

  // Módulo Alunos
  ALUNOS: {
    ROOT: ['alunos'] as const,
    LIST: (tenantId?: string, isProfessor?: boolean, funcionarioId?: string) => 
      ['alunos', tenantId, isProfessor ? funcionarioId : 'all'] as const,
    DETAIL: (id: string, tenantId?: string) => ['alunos', id, tenantId] as const,
    ATIVOS: (tenantId?: string, isProfessor?: boolean, funcionarioId?: string) => 
      ['alunos', 'ativos', tenantId, isProfessor ? funcionarioId : 'all'] as const,
  },
  
  OVERRIDES: {
    ALUNO: (alunoId: string, tenantId?: string) => ['overrides', alunoId, tenantId] as const,
  },
  STAGING: {
    PENDENTES: (tenantId?: string) => ['staging', 'pendentes', tenantId] as const,
  },

  // Módulo Acadêmico / Turmas
  TURMAS: {
    ROOT: ['turmas'] as const,
    LIST: (tenantId?: string, isProfessor?: boolean, funcionarioId?: string) => 
      ['turmas', tenantId, isProfessor ? funcionarioId : 'all'] as const,
    DETAIL: (id: string, tenantId?: string) => ['turmas', id, tenantId] as const,
    ALUNO: (alunoId: string, tenantId?: string) => ['turmas_aluno', alunoId, tenantId] as const,
    
    ROOT_ACADEMICO: ['academico'] as const,
    ROOT_AVALIACOES_CONFIG: ['avaliacoes_config'] as const,
    AVALIACOES: (turmaId: string, disciplinaId: string, bimestre: number) => ['avaliacoes_config', turmaId, disciplinaId, bimestre] as const,
    NOTAS: (avaliacaoId: string) => ['avaliacoes_notas', avaliacaoId] as const,
    ROOT_BOLETIM: ['boletim_v2'] as const,
    BOLETIM: (alunoId: string) => ['boletim_v2', 'aluno', alunoId] as const,
    BOLETIM_TURMA: (turmaId: string, bimestre: number) => ['boletim_v2', 'turma', turmaId, bimestre] as const,
    FECHAMENTO: (tenantId: string, turmaId: string, bimestre: number) => ['fechamento_bimestre', tenantId, turmaId, bimestre] as const,
    
    ROOT_DISCIPLINAS: ['disciplinas'] as const,
    DISCIPLINAS: (tenantId: string, etapa?: string) => ['disciplinas', tenantId, etapa] as const,
    DISCIPLINAS_TURMA: (turmaId: string) => ['disciplinas_turma', turmaId] as const,
    ROOT_CATALOGO: ['disciplinas-catalogo'] as const,
    CATALOGO_DISCIPLINAS: (tenantId: string) => ['disciplinas-catalogo', tenantId] as const,
    
    ROOT_ATRIBUICOES: ['atribuicoes'] as const,
    ATRIBUICOES: (tenantId?: string, turmaId?: string) => ['atribuicoes', tenantId, turmaId] as const,
    
    ROOT_GRADE_HORARIA: ['grade_horaria'] as const,
    GRADE_HORARIA: (tenantId?: string, turmaId?: string) => ['grade_horaria', tenantId, turmaId] as const,
    
    PROFESSORES: (tenantId?: string) => ['professores-turma', tenantId] as const,
    ALUNOS_COUNT: (turmaId: string | string[]) => ['turma_alunos_count', turmaId] as const,
    ALUNOS: (turmaId: string) => ['alunos', turmaId] as const,
  },

  // Módulo Portal do Aluno/Responsável
  PORTAL: {
    ROOT: ['portal'] as const,
    DASHBOARD: (alunoId: string, tenantId?: string | null, turmaId?: string | null) => ['portal', 'dashboard', alunoId, tenantId, turmaId] as const,
    VINCULOS: (responsavelId: string) => ['portal', 'vinculos', responsavelId] as const,
    COBRANCAS: (alunoId: string) => ['portal', 'cobrancas', alunoId] as const,
    BOLETINS: (alunoId: string, tenantId?: string | null) => ['portal', 'boletins', alunoId, tenantId] as const,
    FREQUENCIA: (alunoId: string, tenantId?: string | null, mes?: string) => ['portal', 'frequencia', alunoId, tenantId, mes] as const,
  },

  // Módulo Admin / Marketplace
  ADMIN: {
    STATS: ['admin', 'stats'] as const,
    PLANOS: ['admin', 'planos'] as const,
    MODULOS: ['admin', 'modulos'] as const,
    ESCOLAS: ['admin', 'escolas'] as const,
    PLANO_MODULOS: (planoId?: string) => ['admin', 'plano-modulos', planoId] as const,
  },
  
  MARKETPLACE: {
    CATEGORIAS: ['marketplace_categorias'] as const,
    LOJISTAS: ['marketplace_lojistas'] as const,
    PROFISSIONAIS: ['marketplace_profissionais'] as const,
  }
} as const;
