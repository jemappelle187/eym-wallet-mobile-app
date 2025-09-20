import React, { createContext, useState, useEffect } from 'react';

// Mock Data (can be moved to a separate file if it grows larger)
const initialMockTransactions = [
  { _id: '1', type: 'received', sourceAmount: 50.00, sourceCurrency: 'USD', recipientName: 'John D.', createdAt: new Date('2023-10-20T10:30:00Z'), status: 'completed', details: 'Payment for freelance work' },
  { _id: '2', type: 'sent', sourceAmount: 100.00, sourceCurrency: 'USD', recipientName: 'Jane S.', createdAt: new Date('2023-10-19T14:00:00Z'), status: 'completed', details: 'Birthday gift' },
  { _id: '3', type: 'deposit', sourceAmount: 200.00, sourceCurrency: 'USD', recipientName: 'Self (Credit Card)', createdAt: new Date('2023-10-18T09:15:00Z'), status: 'completed', details: 'Account funding' },
  { _id: '4', type: 'withdrawal', sourceAmount: 75.00, sourceCurrency: 'USD', recipientName: 'Self (Bank Transfer)', createdAt: new Date('2023-10-17T16:45:00Z'), status: 'pending', details: 'Withdrawal to savings' },
  { _id: '5', type: 'received', sourceAmount: 120.50, sourceCurrency: 'EUR', recipientName: 'Alex G.', createdAt: new Date('2023-10-16T11:00:00Z'), status: 'completed', details: 'Project payment' },
  { _id: '6', type: 'sent', sourceAmount: 3000.00, sourceCurrency: 'KES', recipientName: 'Local Shop', createdAt: new Date('2023-10-15T17:20:00Z'), status: 'completed', details: 'Groceries' },
  { _id: '7', type: 'pay_in_store', sourceAmount: 15.00, sourceCurrency: 'USD', recipientName: 'Coffee Place', createdAt: new Date('2023-10-14T08:00:00Z'), status: 'completed', details: 'Morning coffee' },
];


// Create Context
export const TransactionContext = createContext();

// Create Provider Component
export const TransactionProvider = ({ children }) => {
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const fetchTransactionHistory = async () => {
    setIsLoadingTransactions(true);
    console.log('Fetching transaction history...');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Sort by date descending to show recent first
    const sortedTransactions = initialMockTransactions.sort((a, b) => b.createdAt - a.createdAt);
    setTransactions(sortedTransactions);
    setIsLoadingTransactions(false);
    console.log('Transaction history fetched.');
  };

  // Example function to add a new transaction (for future use if needed)
  const addTransaction = (newTransaction) => {
    // This is a mock add, in a real app, this would post to a backend
    // and then potentially refetch or update the local state optimistically.
    const updatedTransaction = {
        _id: Math.random().toString(),
        ...newTransaction,
        createdAt: new Date()
    };
    setTransactions(prevTransactions => [updatedTransaction, ...prevTransactions].sort((a,b) => b.createdAt - a.createdAt));
    console.log('Mock transaction added:', updatedTransaction);
  };


  // Fetch initial history on mount (optional, could be triggered by a screen)
  // For this MVP, HomeScreen will trigger it.
  // useEffect(() => {
  //   fetchTransactionHistory();
  // }, []);

  return (
    <TransactionContext.Provider
      value={{
        isLoadingTransactions,
        transactions,
        fetchTransactionHistory,
        addTransaction, // Expose addTransaction
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
