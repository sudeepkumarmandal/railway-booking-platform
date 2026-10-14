import React, { useState, useEffect } from 'react';

const PaymentModal = ({ bookingPayload, walletBalance, onClose, onPaymentSuccess }) => {
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('Connecting to IRCTC server...');
  const [paymentError, setPaymentError] = useState('');

  const total = bookingPayload.fareBreakdown.totalFare;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          alert('Booking session expired. Please reselect your train.');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const handlePay = (method) => {
    if (isProcessing) return;
    if (method === 'WALLET' && walletBalance < total) {
      alert('Insufficient wallet balance!');
      return;
    }

    setPaymentError('');
    setIsProcessing(true);
    const steps = [
      'Locking berths with IRCTC CRIS engine...',
      'Verifying payment authentication...',
      'Allocating Coach & Seat numbers...',
      'Generating 10-Digit PNR & E-Ticket...'
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setProcessStep(steps[current++]);
      } else {
        clearInterval(interval);
        Promise.resolve(onPaymentSuccess(method))
          .catch((error) => {
            setPaymentError(error.message || 'Payment failed. Please try again.');
          })
          .finally(() => setIsProcessing(false));
      }
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Demo payment</div>
              <div className="text-[10px] text-slate-400">No real payment is processed</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
              ⏱️ {formatTime(secondsLeft)}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              aria-label="Close payment"
              className="rounded-lg px-2 py-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
          <div className="text-xs text-slate-500 uppercase font-semibold">Total Amount Payable</div>
          <div className="text-3xl font-black text-slate-900 mt-1">₹{total.toFixed(2)}</div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          
          {/* Rail Wallet */}
          <button
            type="button"
            onClick={() => handlePay('WALLET')}
            disabled={walletBalance < total || isProcessing}
            className={`w-full p-3.5 rounded-xl border-2 flex items-center justify-between font-semibold text-xs transition-all ${
              walletBalance >= total
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 cursor-pointer'
                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>💳</span>
              <span>Pay with BharatRail Wallet</span>
            </div>
            <span className="bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">1-Click</span>
          </button>

          {/* UPI */}
          <div className="border rounded-xl p-3 bg-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>📱</span> UPI (GPay, PhonePe, Paytm, BHIM)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-slate-100 border rounded flex items-center justify-center font-mono text-[9px] text-center p-1 text-slate-400">
                [QR CODE]
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  defaultValue="traveler@upi"
                  disabled={isProcessing}
                  className="w-full p-2 border rounded text-xs mb-1"
                />
                <button
                  type="button"
                  onClick={() => handlePay('UPI')}
                  disabled={isProcessing}
                  className="w-full py-1.5 bg-sky-600 text-white rounded text-xs font-bold hover:bg-sky-700"
                >
                  Verify & Pay
                </button>
              </div>
            </div>
          </div>

          {/* Card */}
          <button
            type="button"
            onClick={() => handlePay('CARD')}
            disabled={isProcessing}
            className="w-full p-3 rounded-xl border hover:bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700 disabled:opacity-60"
          >
            <span className="flex items-center gap-2">
              <span>💳</span> Credit / Debit Card (Visa, RuPay, Mastercard)
            </span>
            <span>➔</span>
          </button>

        </div>

        {paymentError && (
          <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {paymentError}
          </p>
        )}

        {/* Security Info */}
        <div className="flex justify-between items-center text-[11px] text-slate-400 border-t pt-3">
          <span>🛡️ 256-Bit SSL Encrypted</span>
          <span>PCI-DSS Level 1 Certified</span>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h4 className="font-bold text-base text-slate-900">Confirming Your Reservation...</h4>
            <p className="text-xs text-slate-500 mt-2">{processStep}</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentModal;
