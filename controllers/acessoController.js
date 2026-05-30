const Aluno = require('../models/Aluno');
const Acesso = require('../models/Acesso');
const SessaoBiblioteca = require('../models/SessaoBiblioteca');
const Ocorrencia = require('../models/Ocorrencia');

async function registrarEntrada(req, res) {
    try {
        console.log('BODY ENTRADA:', req.body);

        const { codigo_nfc_aluno } = req.body;

        if (!codigo_nfc_aluno) {
            return res.status(400).json({
                sucesso: false,
                autorizado: false,
                abrir_porta: false,
                mensagem: 'Código NFC/RFID do aluno é obrigatório.',
                recebido: req.body
            });
        }

        const aluno = await Aluno.buscarPorNFC(codigo_nfc_aluno.trim());

        if (!aluno) {
            await Acesso.registrarEventoPorta({
                tipoEvento: 'acesso_negado',
                statusPorta: 'fechada',
                motivo: `NFC/RFID não cadastrado: ${codigo_nfc_aluno}`
            });

            return res.status(404).json({
                sucesso: false,
                autorizado: false,
                abrir_porta: false,
                mensagem: 'Aluno não cadastrado para este NFC/RFID.'
            });
        }

        if (aluno.situacao_matricula !== 'ativa') {
            await Acesso.registrarAcesso({
                alunoId: aluno.id,
                tipo: 'entrada',
                metodo: 'rfid_nfc',
                status: 'negado',
                observacao: 'Aluno sem matrícula ativa.'
            });

            await Acesso.registrarEventoPorta({
                alunoId: aluno.id,
                tipoEvento: 'acesso_negado',
                statusPorta: 'fechada',
                motivo: 'Aluno sem matrícula ativa.'
            });

            return res.status(403).json({
                sucesso: false,
                autorizado: false,
                abrir_porta: false,
                mensagem: 'Aluno sem matrícula ativa.',
                aluno: {
                    id: aluno.id,
                    nome: aluno.nome,
                    ra: aluno.ra
                }
            });
        }

        if (aluno.status !== 'ativo') {
            await Acesso.registrarAcesso({
                alunoId: aluno.id,
                tipo: 'entrada',
                metodo: 'rfid_nfc',
                status: 'negado',
                observacao: `Aluno com status ${aluno.status}.`
            });

            await Acesso.registrarEventoPorta({
                alunoId: aluno.id,
                tipoEvento: 'acesso_negado',
                statusPorta: 'fechada',
                motivo: `Aluno com status ${aluno.status}.`
            });

            return res.status(403).json({
                sucesso: false,
                autorizado: false,
                abrir_porta: false,
                mensagem: 'Aluno bloqueado ou penalizado.',
                aluno: {
                    id: aluno.id,
                    nome: aluno.nome,
                    ra: aluno.ra,
                    status: aluno.status
                }
            });
        }

        const sessaoAtiva = await SessaoBiblioteca.buscarSessaoAtivaPorAluno(aluno.id);

        if (sessaoAtiva) {
            return res.json({
                sucesso: true,
                autorizado: true,
                abrir_porta: true,
                mensagem: 'Aluno já possui sessão ativa. Entrada liberada novamente.',
                aluno: {
                    id: aluno.id,
                    nome: aluno.nome,
                    ra: aluno.ra,
                    curso: aluno.curso,
                    foto_url: aluno.foto_url
                },
                sessao: sessaoAtiva
            });
        }

        await Acesso.registrarAcesso({
            alunoId: aluno.id,
            tipo: 'entrada',
            metodo: 'rfid_nfc',
            status: 'autorizado',
            observacao: 'Entrada autorizada por NFC/RFID.'
        });

        const sessaoId = await SessaoBiblioteca.criarSessao(aluno.id);

        await Acesso.registrarEventoPorta({
            alunoId: aluno.id,
            tipoEvento: 'abertura_entrada',
            statusPorta: 'destravada',
            motivo: 'Entrada autorizada.'
        });

        return res.json({
            sucesso: true,
            autorizado: true,
            abrir_porta: true,
            mensagem: 'Entrada autorizada. Porta liberada.',
            aluno: {
                id: aluno.id,
                nome: aluno.nome,
                ra: aluno.ra,
                curso: aluno.curso,
                foto_url: aluno.foto_url
            },
            sessao: {
                id: sessaoId,
                status: 'dentro'
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            sucesso: false,
            autorizado: false,
            abrir_porta: false,
            mensagem: 'Erro ao registrar entrada.',
            erro: error.message
        });
    }
}

async function registrarSaida(req, res) {
    try {
        console.log('BODY SAÍDA:', req.body);

        const { codigo_nfc_aluno, camera_detectou_livro } = req.body;

        if (!codigo_nfc_aluno) {
            return res.status(400).json({
                sucesso: false,
                autorizado: false,
                abrir_porta: false,
                mensagem: 'Código NFC/RFID do aluno é obrigatório.',
                recebido: req.body
            });
        }

        const aluno = await Aluno.buscarPorNFC(codigo_nfc_aluno.trim());

        if (!aluno) {
            await Acesso.registrarEventoPorta({
                tipoEvento: 'acesso_negado',
                statusPorta: 'fechada',
                motivo: `Tentativa de saída com NFC/RFID não cadastrado: ${codigo_nfc_aluno}`
            });

            return res.status(404).json({
                sucesso: false,
                autorizado: false,
                abrir_porta: false,
                mensagem: 'Aluno não cadastrado para este NFC/RFID.'
            });
        }

        const sessaoAtiva = await SessaoBiblioteca.buscarSessaoAtivaPorAluno(aluno.id);

        if (!sessaoAtiva) {
            await Acesso.registrarAcesso({
                alunoId: aluno.id,
                tipo: 'saida',
                metodo: 'rfid_nfc',
                status: 'negado',
                observacao: 'Aluno tentou sair sem sessão ativa.'
            });

            await Acesso.registrarEventoPorta({
                alunoId: aluno.id,
                tipoEvento: 'saida_bloqueada',
                statusPorta: 'fechada',
                motivo: 'Aluno não possui sessão ativa dentro da biblioteca.'
            });

            return res.status(400).json({
                sucesso: false,
                autorizado: false,
                abrir_porta: false,
                mensagem: 'Não existe sessão ativa para este aluno dentro da biblioteca.',
                aluno: {
                    id: aluno.id,
                    nome: aluno.nome,
                    ra: aluno.ra
                }
            });
        }

        if (camera_detectou_livro === true) {
            await Acesso.registrarAcesso({
                alunoId: aluno.id,
                tipo: 'saida',
                metodo: 'rfid_nfc',
                status: 'negado',
                observacao: 'Câmera detectou possível livro não registrado.'
            });

            await Acesso.registrarEventoPorta({
                alunoId: aluno.id,
                tipoEvento: 'saida_bloqueada',
                statusPorta: 'fechada',
                motivo: 'Possível livro não registrado detectado pela câmera.'
            });

            return res.status(403).json({
                sucesso: false,
                autorizado: false,
                abrir_porta: false,
                mensagem: 'Possível livro não registrado detectado. Volte ao totem para registrar o empréstimo ou devolver o livro.',
                aluno: {
                    id: aluno.id,
                    nome: aluno.nome,
                    ra: aluno.ra
                }
            });
        }

        await Acesso.registrarAcesso({
            alunoId: aluno.id,
            tipo: 'saida',
            metodo: 'rfid_nfc',
            status: 'autorizado',
            observacao: 'Saída autorizada por NFC/RFID.'
        });

        await SessaoBiblioteca.encerrarSessao(aluno.id, 'saiu');

        await Acesso.registrarEventoPorta({
            alunoId: aluno.id,
            tipoEvento: 'abertura_saida',
            statusPorta: 'destravada',
            motivo: 'Saída autorizada.'
        });

        return res.json({
            sucesso: true,
            autorizado: true,
            abrir_porta: true,
            mensagem: 'Saída autorizada. Porta liberada.',
            aluno: {
                id: aluno.id,
                nome: aluno.nome,
                ra: aluno.ra,
                curso: aluno.curso,
                foto_url: aluno.foto_url
            },
            sessao: {
                status: 'saiu'
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            sucesso: false,
            autorizado: false,
            abrir_porta: false,
            mensagem: 'Erro ao registrar saída.',
            erro: error.message
        });
    }
}

async function registrarEmergencia(req, res) {
    try {
        console.log('BODY EMERGÊNCIA:', req.body);

        const { codigo_nfc_aluno, motivo } = req.body;

        let aluno = null;
        let alunoId = null;

        if (codigo_nfc_aluno) {
            aluno = await Aluno.buscarPorNFC(codigo_nfc_aluno.trim());

            if (aluno) {
                alunoId = aluno.id;
            }
        }

        const descricaoEmergencia = motivo || 'Botão de emergência acionado.';

        if (alunoId) {
            await Acesso.registrarAcesso({
                alunoId,
                tipo: 'saida',
                metodo: 'emergencia',
                status: 'emergencia',
                observacao: descricaoEmergencia
            });

            await SessaoBiblioteca.encerrarSessao(alunoId, 'saida_emergencia');
        }

        await Acesso.registrarEventoPorta({
            alunoId,
            tipoEvento: 'emergencia',
            statusPorta: 'destravada',
            motivo: descricaoEmergencia
        });

        await Ocorrencia.registrarOcorrencia({
            alunoId,
            tipo: 'saida_emergencia',
            descricao: descricaoEmergencia
        });

        return res.json({
            sucesso: true,
            autorizado: true,
            abrir_porta: true,
            emergencia: true,
            mensagem: 'Emergência registrada. Porta liberada por segurança.',
            aluno: aluno
                ? {
                    id: aluno.id,
                    nome: aluno.nome,
                    ra: aluno.ra
                }
                : null
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            sucesso: false,
            autorizado: false,
            abrir_porta: false,
            emergencia: true,
            mensagem: 'Erro ao registrar emergência.',
            erro: error.message
        });
    }
}

async function statusSessaoAluno(req, res) {
    try {
        const { aluno_id } = req.params;

        const sessaoAtiva = await SessaoBiblioteca.buscarSessaoAtivaPorAluno(aluno_id);
        const ultimaSessao = await SessaoBiblioteca.buscarUltimaSessaoPorAluno(aluno_id);

        return res.json({
            sucesso: true,
            dentro_biblioteca: !!sessaoAtiva,
            sessao_ativa: sessaoAtiva,
            ultima_sessao: ultimaSessao
        });
    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar sessão do aluno.',
            erro: error.message
        });
    }
}

async function historicoAcessosAluno(req, res) {
    try {
        const { aluno_id } = req.params;

        const acessos = await Acesso.listarAcessosPorAluno(aluno_id);

        return res.json({
            sucesso: true,
            acessos
        });
    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar acessos do aluno.',
            erro: error.message
        });
    }
}

module.exports = {
    registrarEntrada,
    registrarSaida,
    registrarEmergencia,
    statusSessaoAluno,
    historicoAcessosAluno
};