import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid work or organization email"),
  password: z.string().min(6, "Password must contain at least 6 characters"),
});

/**
 * Premium LoginForm Component with Zod Schema Validation & Shake animation on error.
 * @param {object} props
 * @param {function} props.onSuccess
 */
export const LoginForm = ({ onSuccess }) => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await login({ email: data.email, password: data.password });
      toast.success("Identity verified. Welcome to Command Console.");
      if (onSuccess) onSuccess(false);
    } catch (err) {
      let message = "Authentication rejected: Check your credentials.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        message = "Invalid organization email or password.";
      } else if (err.code === 'auth/too-many-requests') {
        message = "Too many failed attempts. Access temporarily restricted.";
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
      <Input
        label="Organization Email"
        placeholder="admin@gaitauth.ai"
        type="email"
        icon={Mail}
        error={errors.email?.message}
        {...register('email')}
      />
      
      <Input
        label="Security Passkey"
        placeholder="••••••••••••"
        type={showPassword ? "text" : "password"}
        icon={Lock}
        error={errors.password?.message}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="text-[--text-muted] hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        {...register('password')}
      />

      <div className="flex items-center justify-between text-xs pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none text-[--text-secondary] hover:text-[--text-primary]">
          <input type="checkbox" className="rounded bg-[--bg-elevated] border-[--border-strong] text-[--accent-indigo] focus:ring-[--accent-indigo]" defaultChecked />
          <span>Keep session vault unlocked</span>
        </label>
        <a href="#reset" onClick={(e) => { e.preventDefault(); toast("Please contact your Perimeter IT Admin for passkey retrieval."); }} className="text-[--accent-indigo] hover:underline">
          Forgot Passkey?
        </a>
      </div>

      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          type="submit"
          disabled={isSubmitting}
          icon={ArrowRight}
          className="w-full font-semibold shadow-[0_0_25px_rgba(255,255,255,0.2)]"
        >
          {isSubmitting ? "Decrypting Biometric Key..." : "Access Command Hub"}
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;
