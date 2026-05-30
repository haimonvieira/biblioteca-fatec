-- Supabase / PostgreSQL schema for biblioteca_fatec
-- Use o SQL Editor do Supabase ou `supabase db query < supabase-schema.sql`.

-- =========================
-- 0. helper: updated_at trigger
-- =========================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- 1. ALUNOS
-- =========================

CREATE TABLE public.alunos (
    id bigserial PRIMARY KEY,
    nome varchar(150) NOT NULL,
    ra varchar(50) NOT NULL UNIQUE,
    email varchar(150) UNIQUE,
    curso varchar(100),
    foto_url varchar(255),
    codigo_rfid_nfc varchar(100) UNIQUE,
    codigo_qr varchar(100) UNIQUE,
    situacao_matricula text NOT NULL DEFAULT 'ativa',
    status text NOT NULL DEFAULT 'ativo',
    penalizado_ate timestamptz NULL,
    codigo_carteira varchar(100) UNIQUE NULL,
    carteira_ativa boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT alunos_situacao_check CHECK (situacao_matricula IN ('ativa', 'trancada', 'cancelada', 'concluida')),
    CONSTRAINT alunos_status_check CHECK (status IN ('ativo', 'bloqueado', 'penalizado'))
);

CREATE TRIGGER alunos_set_updated_at
BEFORE UPDATE ON public.alunos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- 2. CATEGORIAS DOS LIVROS
-- =========================

CREATE TABLE public.categorias (
    id bigserial PRIMARY KEY,
    nome varchar(100) NOT NULL UNIQUE,
    descricao text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- 3. LIVROS
-- =========================

CREATE TABLE public.livros (
    id bigserial PRIMARY KEY,
    titulo varchar(255) NOT NULL,
    autor varchar(150),
    editora varchar(150),
    ano_publicacao smallint,
    isbn varchar(50),
    categoria_id bigint NULL,
    descricao text,
    capa_url varchar(255),
    codigo_rfid varchar(100) NOT NULL UNIQUE,
    codigo_interno varchar(100) UNIQUE,
    localizacao varchar(150),
    status text NOT NULL DEFAULT 'disponivel',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT livros_status_check CHECK (status IN ('disponivel', 'reservado', 'emprestado', 'bloqueado', 'extraviado', 'manutencao')),
    CONSTRAINT fk_livros_categoria FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL
);

CREATE TRIGGER livros_set_updated_at
BEFORE UPDATE ON public.livros
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.exemplares (
    id bigserial PRIMARY KEY,
    livro_id bigint NOT NULL,
    codigo_rfid varchar(100) NOT NULL UNIQUE,
    codigo_interno varchar(100) UNIQUE,
    localizacao varchar(150),
    status text NOT NULL DEFAULT 'disponivel',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT exemplares_status_check CHECK (status IN ('disponivel', 'reservado', 'emprestado', 'bloqueado', 'extraviado', 'manutencao')),
    CONSTRAINT fk_exemplares_livro FOREIGN KEY (livro_id) REFERENCES public.livros(id) ON DELETE CASCADE
);

CREATE TRIGGER exemplares_set_updated_at
BEFORE UPDATE ON public.exemplares
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- 4. RESERVAS
-- =========================

CREATE TABLE public.reservas (
    id bigserial PRIMARY KEY,
    aluno_id bigint NOT NULL,
    livro_id bigint NOT NULL,
    status text NOT NULL DEFAULT 'ativa',
    data_reserva timestamptz NOT NULL DEFAULT now(),
    expira_em timestamptz NOT NULL,
    data_cancelamento timestamptz NULL,
    data_retirada timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT reservas_status_check CHECK (status IN ('ativa', 'expirada', 'cancelada', 'retirada', 'finalizada')),
    CONSTRAINT fk_reservas_aluno FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservas_livro FOREIGN KEY (livro_id) REFERENCES public.livros(id) ON DELETE CASCADE
);

CREATE TRIGGER reservas_set_updated_at
BEFORE UPDATE ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- 5. EMPRÉSTIMOS
-- =========================

CREATE TABLE public.emprestimos (
    id bigserial PRIMARY KEY,
    aluno_id bigint NOT NULL,
    livro_id bigint NOT NULL,
    reserva_id bigint NULL,
    exemplar_id bigint NULL,
    data_retirada timestamptz NOT NULL DEFAULT now(),
    data_prevista_devolucao timestamptz NOT NULL,
    data_devolucao timestamptz NULL,
    status text NOT NULL DEFAULT 'ativo',
    foto_validacao_url varchar(255),
    validacao_facial_status text NOT NULL DEFAULT 'nao_realizada',
    confianca_facial numeric(5,2) NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT emprestimos_status_check CHECK (status IN ('ativo', 'devolvido', 'atrasado', 'cancelado', 'extraviado')),
    CONSTRAINT emprestimos_validacao_check CHECK (validacao_facial_status IN ('nao_realizada', 'aprovada', 'reprovada')),
    CONSTRAINT fk_emprestimos_aluno FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE,
    CONSTRAINT fk_emprestimos_livro FOREIGN KEY (livro_id) REFERENCES public.livros(id) ON DELETE CASCADE,
    CONSTRAINT fk_emprestimos_reserva FOREIGN KEY (reserva_id) REFERENCES public.reservas(id) ON DELETE SET NULL,
    CONSTRAINT fk_emprestimos_exemplar FOREIGN KEY (exemplar_id) REFERENCES public.exemplares(id) ON DELETE CASCADE
);

CREATE TRIGGER emprestimos_set_updated_at
BEFORE UPDATE ON public.emprestimos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- 6. PENALIDADES
-- =========================

CREATE TABLE public.penalidades (
    id bigserial PRIMARY KEY,
    aluno_id bigint NOT NULL,
    motivo varchar(255) NOT NULL,
    descricao text,
    data_inicio timestamptz NOT NULL DEFAULT now(),
    data_fim timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'ativa',
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT penalidades_status_check CHECK (status IN ('ativa', 'encerrada', 'cancelada')),
    CONSTRAINT fk_penalidades_aluno FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE
);

-- =========================
-- 7. ACESSOS À BIBLIOTECA
-- =========================

CREATE TABLE public.acessos_biblioteca (
    id bigserial PRIMARY KEY,
    aluno_id bigint NOT NULL,
    tipo text NOT NULL,
    metodo_identificacao text NOT NULL DEFAULT 'rfid_nfc',
    status text NOT NULL DEFAULT 'autorizado',
    data_hora timestamptz NOT NULL DEFAULT now(),
    observacao text,
    CONSTRAINT acessos_tipo_check CHECK (tipo IN ('entrada', 'saida')),
    CONSTRAINT acessos_metodo_check CHECK (metodo_identificacao IN ('rfid_nfc', 'qr_code', 'manual', 'emergencia')),
    CONSTRAINT acessos_status_check CHECK (status IN ('autorizado', 'negado', 'emergencia')),
    CONSTRAINT fk_acessos_aluno FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE
);

-- =========================
-- 8. SESSÕES DENTRO DA BIBLIOTECA
-- =========================

CREATE TABLE public.sessoes_biblioteca (
    id bigserial PRIMARY KEY,
    aluno_id bigint NOT NULL,
    entrada_em timestamptz NOT NULL DEFAULT now(),
    saida_em timestamptz NULL,
    status text NOT NULL DEFAULT 'dentro',
    observacao text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT sessoes_status_check CHECK (status IN ('dentro', 'saiu', 'bloqueado_saida', 'saida_emergencia')),
    CONSTRAINT fk_sessoes_aluno FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE
);

CREATE TRIGGER sessoes_biblioteca_set_updated_at
BEFORE UPDATE ON public.sessoes_biblioteca
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- 9. LEITURAS RFID
-- =========================

CREATE TABLE public.leituras_rfid (
    id bigserial PRIMARY KEY,
    codigo_lido varchar(100) NOT NULL,
    tipo text NOT NULL DEFAULT 'desconhecido',
    origem text NOT NULL,
    aluno_id bigint NULL,
    livro_id bigint NULL,
    resultado text NOT NULL DEFAULT 'encontrado',
    data_hora timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT leituras_tipo_check CHECK (tipo IN ('aluno', 'livro', 'desconhecido')),
    CONSTRAINT leituras_origem_check CHECK (origem IN ('porta_entrada', 'porta_saida', 'totem_emprestimo', 'totem_devolucao', 'inventario')),
    CONSTRAINT leituras_resultado_check CHECK (resultado IN ('encontrado', 'nao_encontrado', 'erro')),
    CONSTRAINT fk_leituras_aluno FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE SET NULL,
    CONSTRAINT fk_leituras_livro FOREIGN KEY (livro_id) REFERENCES public.livros(id) ON DELETE SET NULL
);

-- =========================
-- 10. EVENTOS DA PORTA / FECHADURA
-- =========================

CREATE TABLE public.eventos_porta (
    id bigserial PRIMARY KEY,
    aluno_id bigint NULL,
    tipo_evento text NOT NULL,
    status_porta text NOT NULL,
    motivo text,
    data_hora timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT eventos_tipo_check CHECK (tipo_evento IN ('abertura_entrada', 'abertura_saida', 'acesso_negado', 'saida_bloqueada', 'emergencia', 'falha_sistema')),
    CONSTRAINT eventos_status_check CHECK (status_porta IN ('aberta', 'fechada', 'travada', 'destravada')),
    CONSTRAINT fk_eventos_porta_aluno FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE SET NULL
);

-- =========================
-- 11. VALIDAÇÕES FACIAIS
-- =========================

CREATE TABLE public.validacoes_faciais (
    id bigserial PRIMARY KEY,
    aluno_id bigint NOT NULL,
    contexto text NOT NULL DEFAULT 'totem_emprestimo',
    foto_capturada_url varchar(255),
    foto_referencia_url varchar(255),
    resultado text NOT NULL,
    confianca numeric(5,2) NULL,
    data_hora timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT validacoes_contexto_check CHECK (contexto IN ('entrada', 'totem_emprestimo', 'saida', 'divergencia')),
    CONSTRAINT validacoes_resultado_check CHECK (resultado IN ('aprovada', 'reprovada', 'erro')),
    CONSTRAINT fk_validacoes_aluno FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE
);

-- =========================
-- 12. ALERTAS DO SISTEMA
-- =========================

CREATE TABLE public.alertas (
    id bigserial PRIMARY KEY,
    aluno_id bigint NULL,
    livro_id bigint NULL,
    emprestimo_id bigint NULL,
    tipo text NOT NULL,
    mensagem text NOT NULL,
    status text NOT NULL DEFAULT 'novo',
    data_hora timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT alertas_tipo_check CHECK (tipo IN ('emprestimo_aprovado', 'emprestimo_negado', 'devolucao_registrada', 'saida_autorizada', 'saida_bloqueada', 'possivel_livro_nao_registrado', 'penalidade_aplicada', 'emergencia')),
    CONSTRAINT alertas_status_check CHECK (status IN ('novo', 'visualizado', 'resolvido')),
    CONSTRAINT fk_alertas_aluno FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE SET NULL,
    CONSTRAINT fk_alertas_livro FOREIGN KEY (livro_id) REFERENCES public.livros(id) ON DELETE SET NULL,
    CONSTRAINT fk_alertas_emprestimo FOREIGN KEY (emprestimo_id) REFERENCES public.emprestimos(id) ON DELETE SET NULL
);

-- =========================
-- 13. OCORRÊNCIAS
-- =========================

CREATE TABLE public.ocorrencias (
    id bigserial PRIMARY KEY,
    aluno_id bigint NULL,
    livro_id bigint NULL,
    tipo text NOT NULL,
    descricao text NOT NULL,
    status text NOT NULL DEFAULT 'aberta',
    data_hora timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ocorrencias_tipo_check CHECK (tipo IN ('tentativa_retirada_livro_reservado', 'tentativa_saida_sem_registro', 'divergencia_rosto', 'livro_nao_identificado', 'saida_emergencia', 'outro')),
    CONSTRAINT ocorrencias_status_check CHECK (status IN ('aberta', 'em_analise', 'resolvida', 'cancelada')),
    CONSTRAINT fk_ocorrencias_aluno FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE SET NULL,
    CONSTRAINT fk_ocorrencias_livro FOREIGN KEY (livro_id) REFERENCES public.livros(id) ON DELETE SET NULL
);

-- =========================
-- 14. INVENTÁRIOS
-- =========================

CREATE TABLE public.inventarios (
    id bigserial PRIMARY KEY,
    iniciado_por varchar(150),
    data_inicio timestamptz NOT NULL DEFAULT now(),
    data_fim timestamptz NULL,
    status text NOT NULL DEFAULT 'em_andamento',
    total_livros_cadastrados int NOT NULL DEFAULT 0,
    total_livros_lidos int NOT NULL DEFAULT 0,
    total_livros_ausentes int NOT NULL DEFAULT 0,
    total_divergencias int NOT NULL DEFAULT 0,
    observacao text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT inventarios_status_check CHECK (status IN ('em_andamento', 'finalizado', 'cancelado'))
);

-- =========================
-- 15. ITENS DO INVENTÁRIO
-- =========================

CREATE TABLE public.inventario_itens (
    id bigserial PRIMARY KEY,
    inventario_id bigint NOT NULL,
    livro_id bigint NULL,
    codigo_rfid_lido varchar(100),
    status text NOT NULL,
    local_esperado varchar(150),
    local_encontrado varchar(150),
    data_hora timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT inventario_itens_status_check CHECK (status IN ('encontrado', 'ausente', 'emprestado', 'fora_do_local', 'nao_cadastrado')),
    CONSTRAINT fk_inventario_itens_inventario FOREIGN KEY (inventario_id) REFERENCES public.inventarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventario_itens_livro FOREIGN KEY (livro_id) REFERENCES public.livros(id) ON DELETE SET NULL
);

-- =========================
-- 16. RLS
-- =========================
-- O backend deste projeto acessa o banco por conexao Postgres server-side.
-- Sem policies publicas, anon/authenticated nao conseguem ler/gravar via Data API.

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exemplares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emprestimos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acessos_biblioteca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes_biblioteca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leituras_rfid ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_porta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validacoes_faciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_itens ENABLE ROW LEVEL SECURITY;

-- =========================
-- DADOS INICIAIS
-- =========================

INSERT INTO public.categorias (nome, descricao) VALUES
('Programação', 'Livros sobre lógica, linguagens e desenvolvimento de software'),
('Banco de Dados', 'Livros sobre SQL, modelagem e bancos relacionais'),
('Redes', 'Livros sobre redes de computadores'),
('Engenharia de Software', 'Livros sobre análise, projeto e qualidade de software');

INSERT INTO public.alunos (
    nome, ra, email, curso, foto_url, codigo_rfid_nfc, codigo_qr, situacao_matricula, status
) VALUES
(
    'Haimon Cugler Vieira',
    '123456',
    'haimon.vieira@aluno.cps.sp.gov.br',
    'DSM',
    '/uploads/alunos/haimon.jpg',
    'FATEC-ALUNO-123456',
    'ALUNO-QR-001',
    'ativa',
    'ativo'
),
(
    'Wagner',
    '654321',
    'wagner@aluno.cps.sp.gov.br',
    'DSM',
    '/uploads/alunos/wagner.jpg',
    'FATEC-ALUNO-654321',
    'ALUNO-QR-002',
    'ativa',
    'ativo'
);

INSERT INTO public.livros (
    titulo, autor, editora, ano_publicacao, isbn, categoria_id, descricao, capa_url, codigo_rfid, codigo_interno, localizacao, status
) VALUES
(
    'Java para Iniciantes',
    'Carlos Silva',
    'Editora Tech',
    2022,
    '9780000000011',
    1,
    'Livro introdutório sobre Java.',
    'https://covers.openlibrary.org/b/isbn/9780134685991-L.jpg',
    'FATEC-BIB-LIVRO-001',
    'LIVRO-001',
    'Estante 2, Prateleira B',
    'disponivel'
),
(
    'Python Essencial',
    'Ana Souza',
    'Editora Código',
    2021,
    '9780000000022',
    1,
    'Conceitos básicos e intermediários de Python.',
    'https://covers.openlibrary.org/b/isbn/9781593279288-L.jpg',
    'FATEC-BIB-LIVRO-002',
    'LIVRO-002',
    'Estante 2, Prateleira C',
    'disponivel'
),
(
    'Banco de Dados Básico',
    'Marcos Lima',
    'Editora Dados',
    2020,
    '9780000000033',
    2,
    'Introdução a modelagem e SQL.',
    'https://covers.openlibrary.org/b/isbn/9780133970777-L.jpg',
    'FATEC-BIB-LIVRO-003',
    'LIVRO-003',
    'Estante 3, Prateleira A',
    'disponivel'
);

INSERT INTO public.exemplares (
    livro_id, codigo_rfid, codigo_interno, localizacao, status
) VALUES
(1, 'FATEC-BIB-EX-001', 'JAVA-EX-001', 'Estante 2, Prateleira B', 'disponivel'),
(1, 'FATEC-BIB-EX-002', 'JAVA-EX-002', 'Estante 2, Prateleira B', 'disponivel'),
(1, 'FATEC-BIB-EX-003', 'JAVA-EX-003', 'Estante 2, Prateleira B', 'disponivel');

-- Se precisar consultar depois:
-- SELECT * FROM public.alunos WHERE codigo_carteira = 'FATEC-ALUNO-123456';
-- SELECT id, titulo, status FROM public.livros WHERE codigo_rfid = 'FATEC-BIB-LIVRO-001';

-- Exemplares adicionais
INSERT INTO public.exemplares (
    livro_id, codigo_rfid, codigo_interno, localizacao, status
) VALUES
(1, 'FATEC-BIB-EX-014', 'JAVA-EX-014', 'Estante 2, Prateleira B', 'disponivel'),
(1, 'FATEC-BIB-EX-015', 'JAVA-EX-015', 'Estante 2, Prateleira B', 'disponivel');
