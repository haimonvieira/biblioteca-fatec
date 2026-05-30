const Aluno = require('../models/Aluno');
const LivroObra = require('../models/LivroObra');
const Reserva = require('../models/Reserva');
const Emprestimo = require('../models/Emprestimo');
const Ocorrencia = require('../models/Ocorrencia');
const Acesso = require('../models/Acesso');

function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function buildStatusClass(status) {
    if (!status) return 'status-default';
    if (status.includes('ativa') || status.includes('ativo') || status.includes('disponivel') || status.includes('autorizado')) return 'status-success';
    if (status.includes('cancelada') || status.includes('negado') || status.includes('bloqueado') || status.includes('atrasado')) return 'status-danger';
    if (status.includes('expirada') || status.includes('resolvida')) return 'status-warning';
    return 'status-default';
}

async function redirectToBiblioteca(req, res) {
    res.redirect('/app/biblioteca');
}

async function biblioteca(req, res) {
    try {
        const livros = await LivroObra.listarAcervo();
        return res.render('pages/biblioteca', {
            title: 'Biblioteca / Acervo',
            active: 'biblioteca',
            livros
        });
    } catch (error) {
        return res.render('pages/error', {
            title: 'Erro - Biblioteca',
            mensagem: 'Não foi possível carregar o acervo.',
            detalhes: error.message
        });
    }
}

async function detalhesLivro(req, res) {
    try {
        const { id } = req.params;
        const livro = await LivroObra.buscarDetalhes(id);

        if (!livro) {
            return res.render('pages/error', {
                title: 'Livro não encontrado',
                mensagem: 'O livro solicitado não foi encontrado.',
                detalhes: null
            });
        }

        const exemplares = await LivroObra.listarExemplares(id);

        return res.render('pages/detalhesLivro', {
            title: `Detalhes - ${livro.titulo}`,
            active: 'biblioteca',
            livro,
            exemplares,
            buildStatusClass,
            mensagem: null,
            erro: null
        });
    } catch (error) {
        return res.render('pages/error', {
            title: 'Erro - Detalhes do Livro',
            mensagem: 'Não foi possível carregar os detalhes do livro.',
            detalhes: error.message
        });
    }
}

async function criarReserva(req, res) {
    try {
        const { codigo_nfc_aluno, livro_id } = req.body;

        if (!codigo_nfc_aluno || !livro_id) {
            return res.render('pages/error', {
                title: 'Reserva inválida',
                mensagem: 'Código NFC/RFID e ID do livro são obrigatórios para reservar.',
                detalhes: null
            });
        }

        const aluno = await Aluno.buscarPorNFC(codigo_nfc_aluno.trim());

        if (!aluno) {
            return res.render('pages/error', {
                title: 'Aluno não encontrado',
                mensagem: 'O aluno não foi encontrado pelo código NFC/RFID informado.',
                detalhes: null
            });
        }

        if (aluno.situacao_matricula !== 'ativa' || aluno.status !== 'ativo') {
            return res.render('pages/error', {
                title: 'Aluno não autorizado',
                mensagem: 'O aluno não está autorizado a fazer reservas.',
                detalhes: `Situação: ${aluno.situacao_matricula} / Status: ${aluno.status}`
            });
        }

        const livro = await LivroObra.buscarDetalhes(livro_id);

        if (!livro) {
            return res.render('pages/error', {
                title: 'Livro não encontrado',
                mensagem: 'O livro não foi encontrado para reserva.',
                detalhes: null
            });
        }

        const reservaExistente = await Reserva.buscarReservaAtivaDoAlunoParaLivro(aluno.id, livro.id);

        if (reservaExistente) {
            return res.render('pages/error', {
                title: 'Reserva existente',
                mensagem: 'Este aluno já possui uma reserva ativa para este livro.',
                detalhes: null
            });
        }

        if ((livro.disponiveis || 0) <= 0) {
            return res.render('pages/error', {
                title: 'Sem exemplares disponíveis',
                mensagem: 'Não há exemplares disponíveis para reserva no momento.',
                detalhes: null
            });
        }

        const reservaId = await Reserva.criarReserva(aluno.id, livro.id, 2);
        const validade = formatDateTime(new Date(Date.now() + 2 * 60 * 60 * 1000));

        return res.render('pages/reservaConfirmada', {
            title: 'Reserva Confirmada',
            active: 'biblioteca',
            reserva: {
                id: reservaId,
                validade,
                aluno: {
                    id: aluno.id,
                    nome: aluno.nome,
                    ra: aluno.ra
                },
                livro: {
                    id: livro.id,
                    titulo: livro.titulo,
                    autor: livro.autor
                }
            }
        });
    } catch (error) {
        return res.render('pages/error', {
            title: 'Erro ao criar reserva',
            mensagem: 'Houve um problema ao registrar a reserva.',
            detalhes: error.message
        });
    }
}

async function minhasReservas(req, res) {
    try {
        const { aluno_id } = req.params;
        const reservas = await Reserva.listarReservasPorAluno(aluno_id);

        return res.render('pages/minhasReservas', {
            title: 'Minhas Reservas',
            active: 'reservas',
            aluno_id,
            reservas,
            formatDateTime,
            buildStatusClass
        });
    } catch (error) {
        return res.render('pages/error', {
            title: 'Erro - Minhas Reservas',
            mensagem: 'Não foi possível carregar as reservas do aluno.',
            detalhes: error.message
        });
    }
}

async function cancelarReserva(req, res) {
    try {
        const { reserva_id, aluno_id } = req.body;
        await Reserva.cancelarReserva(reserva_id);
        return res.redirect(`/app/reservas/${aluno_id}`);
    } catch (error) {
        return res.render('pages/error', {
            title: 'Erro ao cancelar reserva',
            mensagem: 'Não foi possível cancelar a reserva.',
            detalhes: error.message
        });
    }
}

async function emprestimosAluno(req, res) {
    try {
        const { aluno_id } = req.params;
        const emprestimos = await Emprestimo.listarPorAluno(aluno_id);

        return res.render('pages/emprestimosAluno', {
            title: 'Empréstimos do Aluno',
            active: 'emprestimos',
            aluno_id,
            emprestimos,
            formatDateTime,
            buildStatusClass
        });
    } catch (error) {
        return res.render('pages/error', {
            title: 'Erro - Empréstimos',
            mensagem: 'Não foi possível carregar os empréstimos do aluno.',
            detalhes: error.message
        });
    }
}

async function painelVigilante(req, res) {
    try {
        const acessosAluno = req.query.aluno_id ? await Acesso.listarAcessosPorAluno(req.query.aluno_id) : null;
        const ocorrencias = await Ocorrencia.listarTodas();
        const emprestimosAtivos = await Emprestimo.listarAtivos();

        return res.render('pages/painelVigilante', {
            title: 'Painel do Vigilante',
            active: 'vigilante',
            ocorrencias,
            emprestimosAtivos,
            acessosAluno,
            alunoBusca: req.query.aluno_id || '' ,
            formatDateTime,
            buildStatusClass
        });
    } catch (error) {
        return res.render('pages/error', {
            title: 'Erro - Painel Vigilante',
            mensagem: 'Não foi possível carregar o painel do vigilante.',
            detalhes: error.message
        });
    }
}

async function monitorEstacao(req, res) {
    return res.render('pages/monitorEstacao', {
        title: 'Monitor da Estação RFID/NFC',
        active: 'monitor'
    });
}

module.exports = {
    redirectToBiblioteca,
    biblioteca,
    detalhesLivro,
    criarReserva,
    minhasReservas,
    cancelarReserva,
    emprestimosAluno,
    painelVigilante,
    monitorEstacao
};
