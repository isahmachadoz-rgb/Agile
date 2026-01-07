
import fs from 'fs';
import path from 'path';

// Define o caminho do arquivo de dados
const DATA_PATH = path.join(process.cwd(), 'data', 'produtos.json');

export const fileHandler = {
  /**
   * Lê os produtos do arquivo JSON. Se não existir, cria um novo.
   */
  read: () => {
    try {
      if (!fs.existsSync(DATA_PATH)) {
        // Cria a pasta data se não existir
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_PATH, JSON.stringify([]));
        return [];
      }
      const data = fs.readFileSync(DATA_PATH, 'utf8');
      return JSON.parse(data || '[]');
    } catch (error) {
      console.error('Erro ao ler arquivo de dados:', error.message);
      return [];
    }
  },

  /**
   * Grava a lista de produtos no arquivo JSON.
   */
  write: (data) => {
    try {
      fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Erro ao salvar arquivo de dados:', error.message);
      return false;
    }
  }
};
