import { Share } from 'react-native';

export const generateCSVData = (transactions) => {
  const headers = ['Date', 'Type', 'Amount', 'Currency', 'Status', 'From', 'To', 'Reference', 'Details', 'Fee'];
  const rows = transactions.map(tx => [
    new Date(tx.date).toLocaleDateString(),
    tx.type,
    tx.amount,
    tx.currency,
    tx.status,
    tx.from || '',
    tx.to || '',
    tx.reference,
    tx.details || '',
    tx.fee || '0.00'
  ]);
  
  return [headers, ...rows];
};

export const generatePDFData = (transactions) => {
  return {
    title: 'Transaction History',
    subtitle: 'All transactions',
    transactions: transactions.map(tx => ({
      date: new Date(tx.date).toLocaleDateString(),
      type: tx.type,
      amount: `${tx.currency} ${tx.amount}`,
      status: tx.status,
      details: tx.details || '',
      fee: tx.fee || '0.00'
    }))
  };
};

export const exportToCSV = async (transactions, filterPreviewText) => {
  const data = generateCSVData(transactions);
  const csvContent = data.map(row => row.join(',')).join('\n');
  const fileName = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
  
  // Add metadata header
  const metadata = [
    `Transaction History Export`,
    `Generated: ${new Date().toLocaleString()}`,
    `Total Transactions: ${transactions.length}`,
    `Filters Applied: ${filterPreviewText}`,
    ``
  ].join('\n');
  
  const fullContent = metadata + csvContent;
  
  await Share.share({
    message: fullContent,
    title: fileName,
  });
};

export const exportToPDF = async (transactions, filterPreviewText) => {
  const data = generatePDFData(transactions);
  const pdfContent = [
    `TRANSACTION HISTORY`,
    `Generated: ${new Date().toLocaleString()}`,
    `Total Transactions: ${data.transactions.length}`,
    data.subtitle ? `Filters: ${filterPreviewText}` : '',
    ``,
    ...data.transactions.map(tx => 
      `${tx.date} - ${tx.type.toUpperCase()} - ${tx.amount} (${tx.status})${tx.fee !== '0.00' ? ` - Fee: ${tx.fee}` : ''}\n${tx.details}`
    )
  ].join('\n');
  
  await Share.share({
    message: pdfContent,
    title: 'Transaction History.pdf',
  });
};

export const exportToJSON = async (transactions, filterPreviewText) => {
  const jsonData = {
    exportInfo: {
      title: 'Transaction History',
      generated: new Date().toISOString(),
      totalTransactions: transactions.length,
      filtersApplied: filterPreviewText,
    },
    transactions: transactions.map(tx => ({
      id: tx.id,
      date: tx.date,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      from: tx.from,
      to: tx.to,
      reference: tx.reference,
      details: tx.details,
      fee: tx.fee,
      method: tx.method,
      merchant: tx.merchant,
    }))
  };
  
  const jsonContent = JSON.stringify(jsonData, null, 2);
  const fileName = `transactions_${new Date().toISOString().split('T')[0]}.json`;
  
  await Share.share({
    message: jsonContent,
    title: fileName,
  });
};

export const exportSummary = async (transactions, filterPreviewText) => {
  const summary = {
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0),
    byType: transactions.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1;
      return acc;
    }, {}),
    byStatus: transactions.reduce((acc, tx) => {
      acc[tx.status] = (acc[tx.status] || 0) + 1;
      return acc;
    }, {}),
    byCurrency: transactions.reduce((acc, tx) => {
      acc[tx.currency] = (acc[tx.currency] || 0) + parseFloat(tx.amount);
      return acc;
    }, {}),
    filtersApplied: filterPreviewText,
    generated: new Date().toLocaleString(),
  };
  
  const summaryContent = [
    'TRANSACTION SUMMARY',
    `Generated: ${summary.generated}`,
    `Total Transactions: ${summary.totalTransactions}`,
    `Total Amount: $${summary.totalAmount.toFixed(2)}`,
    `Filters: ${summary.filtersApplied}`,
    '',
    'BY TYPE:',
    ...Object.entries(summary.byType).map(([type, count]) => `  ${type}: ${count}`),
    '',
    'BY STATUS:',
    ...Object.entries(summary.byStatus).map(([status, count]) => `  ${status}: ${count}`),
    '',
    'BY CURRENCY:',
    ...Object.entries(summary.byCurrency).map(([currency, amount]) => `  ${currency}: $${amount.toFixed(2)}`),
  ].join('\n');
  
  await Share.share({
    message: summaryContent,
    title: 'Transaction Summary.txt',
  });
}; 