import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, User, ArrowRight, Github, Chrome } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';

export function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const { signInWithGoogle, signInWithEmail, signUpWithEmail, error, loading } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLogin) {
            await signInWithEmail(email, password);
        } else {
            await signUpWithEmail(email, password, name);
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Animated background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-light/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-brand-soft/5 rounded-full blur-[80px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[440px] z-10"
            >
                {/* Logo Section */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-accent-primary to-accent-hover mb-6 shadow-2xl shadow-accent-primary/30 animate-float"
                    >
                        <Sparkles size={40} className="text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Supercharge Your AI</h1>
                    <p className="text-dark-300 font-medium opacity-80">Experience the future of intelligent assistance</p>
                </div>

                <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
                    {/* Glassmorphism highlight */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                    <form onSubmit={handleSubmit} className="space-y-5 relative">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2"
                                >
                                    <label className="text-sm font-medium text-dark-300 ml-1">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 group-focus-within:text-accent-primary transition-colors" size={18} />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="John Doe"
                                            required={!isLogin}
                                            className="w-full bg-dark-900/50 border border-dark-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-dark-600 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all outline-none"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-dark-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 group-focus-within:text-accent-primary transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    required
                                    className="w-full bg-dark-900/50 border border-dark-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-dark-600 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-dark-300">Password</label>
                                {isLogin && (
                                    <button type="button" className="text-xs text-accent-primary hover:underline">Forgot?</button>
                                )}
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 group-focus-within:text-accent-primary transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-dark-900/50 border border-dark-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-dark-600 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20"
                            >
                                {error}
                            </motion.p>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full py-3 rounded-xl shadow-lg shadow-accent-primary/20"
                            loading={loading}
                            rightIcon={<ArrowRight size={18} />}
                        >
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </Button>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dark-700"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-dark-800/50 px-2 text-dark-500">Or continue with</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => signInWithGoogle()}
                                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-dark-900/50 border border-dark-700 rounded-xl text-sm font-medium text-dark-100 hover:bg-dark-700 transition-colors"
                            >
                                <Chrome size={18} className="text-red-400" />
                                Google
                            </button>
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-dark-900/50 border border-dark-700 rounded-xl text-sm font-medium text-dark-100 hover:bg-dark-700 transition-colors"
                            >
                                <Github size={18} />
                                GitHub
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-dark-400 text-sm">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-accent-primary font-semibold hover:underline"
                            >
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
