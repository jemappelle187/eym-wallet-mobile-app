#!/usr/bin/env node

// Mock backend server for testing connectivity
// Run with: node mock-backend-server.js

const express = require('express');
const app = express();
const PORT = 4000;

// Middleware
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  console.log('✅ Health check requested');
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Mock Backend Server'
  });
});

// Mock MTN API endpoints
app.get('/v1/momo/status', (req, res) => {
  console.log('📱 MTN API status requested');
  res.json({ status: 'active', service: 'MTN Mobile Money' });
});

app.post('/v1/momo/request-to-pay', (req, res) => {
  console.log('💰 MTN API request-to-pay:', req.body);
  
  // Simulate processing delay
  setTimeout(() => {
    res.json({
      success: true,
      referenceId: 'TXN-' + Date.now(),
      data: {
        amount: req.body.amount,
        currency: req.body.currency,
        status: 'PENDING',
        payee: req.body.payerMsisdn,
        payerMessage: req.body.payerMessage,
        payeeNote: req.body.payeeNote
      },
      message: 'Payment request submitted successfully'
    });
  }, 1000);
});

app.get('/v1/momo/status/:transactionId', (req, res) => {
  console.log('🔍 MTN API status check:', req.params.transactionId);
  
  // Simulate status progression - start with PENDING, then SUCCESSFUL
  const timeSinceStart = Date.now() - parseInt(req.params.transactionId.split('-')[1]);
  let status = 'PENDING';
  
  if (timeSinceStart > 3000) { // After 3 seconds, show SUCCESSFUL
    status = 'SUCCESSFUL';
  } else if (timeSinceStart > 1500) { // After 1.5 seconds, show PROCESSING
    status = 'PROCESSING';
  }
  
  res.json({
    success: true,
    transactionId: req.params.transactionId,
    status: status,
    message: `Transaction is ${status.toLowerCase()}`
  });
});

// Circle API auto-conversion endpoint
app.post('/v1/deposits/webhook', (req, res) => {
  console.log('🔄 Circle API auto-conversion request:', req.body);
  
  const { userId, currency, amount, reference } = req.body;
  
  // Simulate auto-conversion logic
  let targetCurrency = 'USDC';
  let conversionRate = 1;
  
  if (currency === 'EUR') {
    targetCurrency = 'EURC';
    conversionRate = 1; // 1:1 conversion
  } else if (currency === 'USD') {
    targetCurrency = 'USDC';
    conversionRate = 1; // 1:1 conversion
  } else if (currency === 'GHS') {
    targetCurrency = 'USDC';
    conversionRate = 0.08; // GHS to USDC rate
  } else {
    targetCurrency = 'USDC';
    conversionRate = 0.5; // Default rate for other currencies
  }
  
  const convertedAmount = (parseFloat(amount) * conversionRate).toFixed(2);
  
  // Simulate processing delay
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        status: 'converted',
        from: {
          currency: currency,
          amount: amount
        },
        to: {
          currency: targetCurrency,
          amount: convertedAmount
        },
        fx: {
          rate: conversionRate,
          timestamp: new Date().toISOString()
        },
        reference: reference,
        userId: userId
      },
      message: `Successfully converted ${amount} ${currency} to ${convertedAmount} ${targetCurrency}`
    });
  }, 1000);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mock backend server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`💰 MTN API: http://localhost:${PORT}/v1/momo/request-to-pay`);
  console.log('Press Ctrl+C to stop');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down mock backend server...');
  process.exit(0);
});
