import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/mockBackend';

const AdminLogin = ({ onSuccess }) => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [otp, setOtp] = useState('');
  const [phase, setPhase] = useState('credentials'); // 'credentials' | 'otp'
  const [loading, setLoading] = useState(false);
  const [showMockOtp, setShowMockOtp] = useState(false);
  const [mockOtpValue, setMockOtpValue] = useState('');
  const OTP_SERVER = import.meta.env.VITE_OTP_API_URL;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (phase === 'credentials') {
        const response = await api.auth.login(form.username, form.password);
        if (!response || !response.user) {
          toast({ title: 'Login Failed', description: 'Invalid credentials', variant: 'destructive' });
          setLoading(false);
          return;
        }
        if (response.user.role !== 'admin') {
          toast({ title: 'Access Denied', description: 'You are not authorized to access the admin dashboard', variant: 'destructive' });
          setLoading(false);
          return;
        }

        // Send OTP to admin email (mock or via server)
        try {
          // reset any previously shown mock OTP
          setShowMockOtp(false);
          setMockOtpValue('');

          const res = await api.auth.sendOtp(form.username);

          // Determine whether a mock OTP exists (sessionStorage or returned by backend)
          let mockCode = null;
          try {
            mockCode = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`otp_${form.username}`) : null;
          } catch (e) {
            mockCode = null;
          }

          if ((!mockCode || mockCode === 'null') && res && res.otp) mockCode = res.otp;

          // Only show the mock OTP in the UI when we are in pure local mock mode
          // (no OTP server configured) AND a mock code was actually generated.
          const shouldShowMock = !OTP_SERVER && Boolean(mockCode);
          setShowMockOtp(shouldShowMock);
          if (shouldShowMock) setMockOtpValue(mockCode || '');

          // Notify the user appropriately. When an OTP server is configured, don't reveal the code.
          if (OTP_SERVER) {
            toast({ title: 'OTP Sent', description: 'A one-time code was sent to the admin email. Check your inbox.' });
          } else {
            toast({ title: 'OTP Sent', description: mockCode ? `Mock OTP: ${mockCode}` : 'A one-time code was sent (mock).' });
          }

          setPhase('otp');
        } catch (err) {
          toast({ title: 'OTP Error', description: err.message || 'Failed to send OTP', variant: 'destructive' });
        }
        setLoading(false);
        return;
      }

      // OTP verification phase
      if (phase === 'otp') {
        try {
          const result = await api.auth.verifyOtp(form.username, otp);
          if (!result || !result.user) throw new Error('OTP verification failed');

          // Store admin token into sessionStorage so mock backend recognizes admin role
          if (typeof sessionStorage !== 'undefined' && result.token) {
            sessionStorage.setItem('admin_auth_token', result.token);
          }
          toast({ title: 'Welcome Admin', description: 'Access granted' });
          setLoading(false);
          if (onSuccess) onSuccess(result.user);
          return;
        } catch (err) {
          toast({ title: 'OTP Failed', description: err.message || 'Invalid code', variant: 'destructive' });
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Unexpected error', variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {phase === 'credentials' && (
            <>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border rounded"
                  placeholder="admin@gmail.com"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border rounded"
                  placeholder="Password"
                />
              </div>
            </>
          )}

          {phase === 'otp' && (
            <div>
              <label className="text-sm text-gray-600">One-time code (OTP)</label>
              <input
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full mt-1 p-2 border rounded"
                placeholder="Enter the 6-digit code"
              />
                <p className="text-xs text-gray-500 mt-2">An OTP was sent to the admin email. Check your inbox.</p>
                {/* Developer convenience: show the mock OTP on screen only when a mock code actually exists and we are in mock mode */}
                {showMockOtp && (
                  <p className="text-sm text-gray-700 mt-2">Mock OTP (dev): <strong>{mockOtpValue}</strong></p>
                )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button type="submit" className="gap-2" disabled={loading}>
              {loading ? (phase === 'credentials' ? 'Checking...' : 'Verifying...') : (phase === 'credentials' ? 'Send OTP' : 'Verify OTP')}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
