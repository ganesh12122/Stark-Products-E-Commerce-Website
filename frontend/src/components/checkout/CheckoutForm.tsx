import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { PaymentService } from '../../services/PaymentService';

interface CheckoutFormProps {
  amount: number;
  orderId: string;
}

const CheckoutForm = ({ amount, orderId }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'upi'>('card');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (paymentMethod === 'card' && stripe && elements) {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) throw new Error('Card element not found');

        const { error, paymentMethod: stripePaymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });

        if (error) {
          throw new Error(error.message);
        }

        await PaymentService.initializePayment(orderId, amount, 'card');
      } else if (paymentMethod === 'upi') {
        if (!upiId) {
          throw new Error('Please enter UPI ID');
        }
        await PaymentService.initializePayment(orderId, amount, 'upi');
      } else if (paymentMethod === 'cod') {
        await PaymentService.initializePayment(orderId, amount, 'cod');
      }

      // Redirect to success page
      window.location.href = `/order/success/${orderId}`;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod('card')}
              className="mr-2"
            />
            Credit/Debit Card
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              value="upi"
              checked={paymentMethod === 'upi'}
              onChange={(e) => setPaymentMethod('upi')}
              className="mr-2"
            />
            UPI Payment
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              value="cod"
              checked={paymentMethod === 'cod'}
              onChange={(e) => setPaymentMethod('cod')}
              className="mr-2"
            />
            Cash on Delivery
          </label>
        </div>
      </div>

      {paymentMethod === 'card' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="border rounded-md p-3">
            <CardElement options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }} />
          </div>
        </div>
      )}

      {paymentMethod === 'upi' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            UPI ID
          </label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="Enter your UPI ID"
            className="w-full border rounded-md p-2"
          />
        </div>
      )}

      {error && (
        <div className="mb-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-blue-600 text-white py-2 rounded-lg ${
          loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
        }`}
      >
        {loading ? 'Processing...' : `Pay ${amount.toFixed(2)} USD`}
      </button>
    </form>
  );
};

export default CheckoutForm; 