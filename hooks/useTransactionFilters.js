import { useState, useMemo } from 'react';

const useTransactionFilters = (transactions) => {
  const [filter, setFilter] = useState({ 
    types: ['all'], 
    dateRange: 'all',
    amountRange: 'all',
    status: 'all',
    search: ''
  });
  
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filtered transactions for export and other functions
  const filteredTransactions = useMemo(() => {
    let transactionsToDisplay = transactions;
    
    // Filter by type
    if (!filter.types.includes('all')) {
      transactionsToDisplay = transactionsToDisplay.filter(tx => filter.types.includes(tx.type));
    }
    
    // Filter by search
    if (filter.search.trim()) {
      const searchTerm = filter.search.toLowerCase();
      transactionsToDisplay = transactionsToDisplay.filter(tx => 
        tx.details.toLowerCase().includes(searchTerm) ||
        (tx.from && tx.from.toLowerCase().includes(searchTerm)) ||
        (tx.to && tx.to.toLowerCase().includes(searchTerm)) ||
        (tx.merchant && tx.merchant.toLowerCase().includes(searchTerm)) ||
        tx.reference.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by status
    if (filter.status !== 'all') {
      transactionsToDisplay = transactionsToDisplay.filter(tx => tx.status === filter.status);
    }
    
    // Filter by date range
    if (filter.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      
      transactionsToDisplay = transactionsToDisplay.filter(tx => {
        const txDate = new Date(tx.date);
        switch (filter.dateRange) {
          case 'today':
            return txDate >= today;
          case 'yesterday':
            return txDate >= yesterday && txDate < today;
          case 'week':
            return txDate >= weekAgo;
          case 'month':
            return txDate >= monthAgo;
          default:
            return true;
        }
      });
    }
    
    // Filter by amount range
    if (filter.amountRange !== 'all') {
      transactionsToDisplay = transactionsToDisplay.filter(tx => {
        const amount = parseFloat(tx.amount);
        switch (filter.amountRange) {
          case 'small':
            return amount <= 50;
          case 'medium':
            return amount > 50 && amount <= 200;
          case 'large':
            return amount > 200;
          default:
            return true;
        }
      });
    }
    
    // Sort transactions
    transactionsToDisplay.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.date) - new Date(a.date);
          break;
        case 'amount':
          comparison = parseFloat(b.amount) - parseFloat(a.amount);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = new Date(b.date) - new Date(a.date);
      }
      
      return sortOrder === 'asc' ? -comparison : comparison;
    });
    
    return transactionsToDisplay;
  }, [transactions, filter, sortBy, sortOrder]);

  // Grouped transactions for display
  const groupedTransactions = useMemo(() => {
    const groups = {};
    filteredTransactions.forEach(tx => {
      const dateKey = new Date(tx.date).toISOString().slice(0, 10); // YYYY-MM-DD
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });
    
    // Sort each group by time descending
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => new Date(b.date) - new Date(a.date));
    });
    
    // Return groups sorted by date descending
    return Object.fromEntries(
      Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]))
    );
  }, [filteredTransactions]);

  const handleFilterSelect = (type) => {
    setFilter(prev => {
      let newTypes;
      if (type === 'all') {
        // If "All" is selected, clear other selections
        newTypes = ['all'];
      } else {
        // Remove 'all' if it exists and toggle the selected type
        newTypes = prev.types.filter(t => t !== 'all');
        if (prev.types.includes(type)) {
          // Remove the type if already selected
          newTypes = newTypes.filter(t => t !== type);
        } else {
          // Add the type if not selected
          newTypes.push(type);
        }
        // If no types selected, default to 'all'
        if (newTypes.length === 0) {
          newTypes = ['all'];
        }
      }
      return { ...prev, types: newTypes };
    });
  };

  const handleDateRangeSelect = (range) => {
    setFilter(prev => ({ ...prev, dateRange: range }));
  };

  const handleAmountRangeSelect = (range) => {
    setFilter(prev => ({ ...prev, amountRange: range }));
  };

  const handleStatusSelect = (status) => {
    setFilter(prev => ({ ...prev, status }));
  };

  const handleSearchChange = (text) => {
    setFilter(prev => ({ ...prev, search: text }));
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setFilter({ 
      types: ['all'], 
      dateRange: 'all',
      amountRange: 'all',
      status: 'all',
      search: ''
    });
  };

  const getTransactionCount = (type) => {
    if (type === 'all') return transactions.length;
    return transactions.filter(tx => tx.type === type).length;
  };

  const getStatusCount = (status) => {
    if (status === 'all') return transactions.length;
    return transactions.filter(tx => tx.status === status).length;
  };

  const getFilterPreviewText = () => {
    const activeFilters = [];
    
    if (!filter.types.includes('all')) {
      const typeLabels = filter.types.map(type => {
        const filterLabels = {
          sent: 'Sent',
          received: 'Received',
          deposit: 'Deposits',
          withdrawal: 'Withdrawals',
          pay_in_store: 'In-Store'
        };
        return filterLabels[type] || type;
      });
      activeFilters.push(`Types: ${typeLabels.join(', ')}`);
    }
    
    if (filter.dateRange !== 'all') {
      const dateLabels = {
        today: 'Today',
        yesterday: 'Yesterday', 
        week: 'This Week',
        month: 'This Month'
      };
      activeFilters.push(`Date: ${dateLabels[filter.dateRange]}`);
    }
    
    if (filter.amountRange !== 'all') {
      const amountLabels = {
        small: '≤ $50',
        medium: '$51-$200',
        large: '> $200'
      };
      activeFilters.push(`Amount: ${amountLabels[filter.amountRange]}`);
    }
    
    if (filter.status !== 'all') {
      activeFilters.push(`Status: ${filter.status}`);
    }
    
    if (filter.search.trim()) {
      activeFilters.push(`Search: "${filter.search}"`);
    }
    
    return activeFilters.length > 0 ? activeFilters.join(' • ') : 'All transactions';
  };

  return {
    filter,
    setFilter,
    sortBy,
    sortOrder,
    filteredTransactions,
    groupedTransactions,
    handleFilterSelect,
    handleDateRangeSelect,
    handleAmountRangeSelect,
    handleStatusSelect,
    handleSearchChange,
    handleSortChange,
    resetFilters,
    getTransactionCount,
    getStatusCount,
    getFilterPreviewText,
  };
};

export default useTransactionFilters; 