import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

const AuthPage = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    booth: '',
    assembly: '',
    password: ''
  });
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone || !formData.password || (!isLogin && (!formData.name || !formData.address || !formData.booth || !formData.assembly))) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // Use phone number to create a dummy email for Supabase auth
    const dummyEmail = `${formData.phone}@vote-master.com`;

    let result;
    if (isLogin) {
      result = await login(dummyEmail, formData.password);
    } else {
      result = await register(dummyEmail, formData.password, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        booth: formData.booth,
        assembly: formData.assembly
      });
    }

    setIsLoading(false);

    if (result.success) {
      toast({
        title: isLogin ? "Welcome Back" : "Account Created",
        description: isLogin ? "Successfully logged in" : "Welcome to the platform",
      });
      onLoginSuccess();
    } else {
      toast({
        title: "Authentication Failed",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full overflow-hidden relative"
      >
        {/* Decorative header */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600" />

        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-blue-50 rounded-full mb-4">
            {isLogin ? (
              <Lock className="w-8 h-8 text-blue-600" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-purple-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            {isLogin ? 'Sign in with your phone number' : 'Fill in your details'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit number"
                className="pl-10"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="booth">Booth Number</Label>
                  <Input
                    id="booth"
                    placeholder="Booth No."
                    value={formData.booth}
                    onChange={(e) => setFormData({ ...formData, booth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assembly">Assembly</Label>
                  <Input
                    id="assembly"
                    placeholder="Assembly"
                    value={formData.assembly}
                    onChange={(e) => setFormData({ ...formData, assembly: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                className="pl-10"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className={`w-full h-14 text-lg font-bold shadow-lg transition-transform transform active:scale-95 ${isLogin
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
              }`}
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-lg font-bold text-black hover:text-blue-700 hover:underline transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;