const LivroObra = require('../models/LivroObra');

async function main() {
    try {
        const resultado = await LivroObra.atualizarCapasFaltantes();
        console.log(`Total de livros verificados: ${resultado.total}`);
        console.log(`Capas atualizadas: ${resultado.atualizados}`);
        if (resultado.total === 0) {
            console.log('Nenhum livro com capa em branco ou ausente foi encontrado.');
        }
    } catch (error) {
        console.error('Erro ao atualizar capas dos livros:', error.message || error);
        process.exit(1);
    }
}

main();
