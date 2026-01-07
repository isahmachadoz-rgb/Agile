
export const validations = {
  // Verifica se o texto não está vazio
  isValidString: (str) => typeof str === 'string' && str.trim().length > 0,
  
  // Valida se a quantidade é um número inteiro >= 0
  isValidQuantity: (qty) => {
    const n = parseInt(qty);
    return !isNaN(n) && Number.isInteger(n) && n >= 0;
  },
  
  // Valida se o preço é um número >= 0 (aceita vírgula)
  isValidPrice: (price) => {
    const cleanPrice = price.toString().replace(',', '.');
    const p = parseFloat(cleanPrice);
    return !isNaN(p) && p >= 0;
  },

  // Converte preço digitado para número float
  formatPrice: (price) => parseFloat(price.toString().replace(',', '.'))
};
