import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/mockBackend';

const AdminLogin = ({ onSuccess }) => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
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

      // Direct login success
      if (response.token) {
        // Store token for mock backend role checks
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('admin_auth_token', response.token);
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('auth_token', response.token);
        }
      }

      toast({ title: 'Welcome Admin', description: 'Access granted' });
      setLoading(false);
      if (onSuccess) onSuccess(response.user);

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

          <div className="flex items-center justify-between">
            <Button type="submit" className="gap-2" disabled={loading}>
              {loading ? 'Checking...' : 'Sign In'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
