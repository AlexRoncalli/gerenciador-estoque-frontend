import * as XLSX from 'xlsx';

// Define o tipo para os dados que a função espera, garantindo que seja um array de objetos.
type DataRow = { [key: string]: any };

/**
 * Exporta um array de dados para um ficheiro .xlsx.
 * @param data O array de objetos a ser exportado.
 * @param fileName O nome do ficheiro a ser gerado (sem a extensão .xlsx).
 * @param headers (Opcional) Um array de strings com os nomes das colunas na ordem desejada.
 */
export const exportToExcel = (data: DataRow[], fileName: string, headers?: string[]): void => {
  // 1. Cria a planilha. Se 'headers' for fornecido, usa-o.
  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers }); // <-- ALTERAÇÃO AQUI


  // 2. Cria um novo "livro de trabalho" (workbook), que é o próprio ficheiro Excel.
  const workbook = XLSX.utils.book_new();

  // 3. Adiciona a nossa planilha ao livro de trabalho, dando um nome para a aba (ex: "Dados").
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');

  // 4. Gera o ficheiro Excel e aciona o download no navegador.
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
