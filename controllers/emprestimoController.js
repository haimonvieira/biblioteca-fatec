const Aluno = require("../models/Aluno");
const Livro = require("../models/Livro");
const Reserva = require("../models/Reserva");
const Exemplar = require("../models/Exemplar");
const Emprestimo = require("../models/Emprestimo");

async function registrarEmprestimo(req, res) {
  try {
    console.log("BODY RECEBIDO:", req.body);

    const { codigo_nfc_aluno, codigo_rfid_exemplar } = req.body;

    if (!codigo_nfc_aluno || !codigo_rfid_exemplar) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Código do aluno e código do exemplar são obrigatórios.",
        recebido: req.body,
      });
    }

    const aluno = await Aluno.buscarPorNFC(codigo_nfc_aluno.trim());

    if (!aluno) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Aluno não encontrado pelo NFC/RFID.",
      });
    }

    if (aluno.situacao_matricula !== "ativa") {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Aluno sem matrícula ativa.",
      });
    }

    if (aluno.status !== "ativo") {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Aluno bloqueado ou penalizado.",
      });
    }

    const exemplar = await Exemplar.buscarPorRFID(codigo_rfid_exemplar.trim());

    if (!exemplar) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Exemplar não encontrado pelo RFID/NFC.",
      });
    }

    const emprestimoAtivo = await Emprestimo.buscarEmprestimoAtivoPorExemplar(
      exemplar.exemplar_id,
    );

    if (emprestimoAtivo) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Este exemplar já possui um empréstimo ativo.",
      });
    }

    if (exemplar.status_exemplar === "bloqueado") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Este exemplar está bloqueado para empréstimo.",
      });
    }

    if (exemplar.status_exemplar === "emprestado") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Este exemplar já está emprestado.",
      });
    }

    let reservaId = null;

    const reservaAtivaDoLivro = await Reserva.buscarReservaAtivaDoLivro(
      exemplar.livro_id,
    );

    if (reservaAtivaDoLivro && reservaAtivaDoLivro.aluno_id !== aluno.id) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Este livro está reservado para outro aluno.",
      });
    }

    if (reservaAtivaDoLivro && reservaAtivaDoLivro.aluno_id === aluno.id) {
      reservaId = reservaAtivaDoLivro.id;
    }

    if (
      exemplar.status_exemplar !== "disponivel" &&
      exemplar.status_exemplar !== "reservado"
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: `Exemplar não pode ser emprestado. Status atual: ${exemplar.status_exemplar}`,
      });
    }

    const emprestimoId = await Emprestimo.criarEmprestimo(
      aluno.id,
      exemplar.livro_id,
      exemplar.exemplar_id,
      reservaId,
    );

    await Exemplar.atualizarStatus(exemplar.exemplar_id, "emprestado");

    if (reservaId) {
      await Reserva.marcarComoRetirada(reservaId);
    }

    return res.json({
      sucesso: true,
      mensagem: "Empréstimo registrado com sucesso.",
      emprestimo: {
        id: emprestimoId,
        aluno: {
          id: aluno.id,
          nome: aluno.nome,
          ra: aluno.ra,
        },
        livro: {
          id: exemplar.livro_id,
          titulo: exemplar.titulo,
          autor: exemplar.autor,
        },
        exemplar: {
          id: exemplar.exemplar_id,
          codigo_rfid: exemplar.codigo_rfid,
          localizacao: exemplar.localizacao,
        },
        data_prevista_devolucao: "7 dias a partir de hoje",
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao registrar empréstimo.",
      erro: error.message,
    });
  }
}

async function listarEmprestimosAluno(req, res) {
    try {
        const { aluno_id } = req.params;

        const emprestimos = await Emprestimo.listarPorAluno(aluno_id);

        return res.json({
            sucesso: true,
            emprestimos
        });
    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar empréstimos do aluno.',
            erro: error.message
        });
    }
}

async function listarEmprestimosAtivos(req, res) {
    try {
        const emprestimos = await Emprestimo.listarAtivos();

        return res.json({
            sucesso: true,
            emprestimos
        });
    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar empréstimos ativos.',
            erro: error.message
        });
    }
}

module.exports = {
    registrarEmprestimo,
    listarEmprestimosAluno,
    listarEmprestimosAtivos
};
