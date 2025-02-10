import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const PaymentService = {
  // Initialize payment
  initializePayment: async (orderId: string, amount: number, method: 'card' | 'cod' | 'upi') => {
    try {
      const response = await axios.post(`${API_URL}/payment/initialize`, {
        orderId,
        amount,
        method
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify UPI payment
  verifyUpiPayment: async (transactionId: string) => {
    try {
      const response = await axios.post(`${API_URL}/payment/verify-upi`, {
        transactionId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 