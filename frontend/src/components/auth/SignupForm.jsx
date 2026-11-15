import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Lock, Mail, User, Building, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

const signupSchema = z.object({
  name: z.string().min(2, "Administrator full name is required"),
  organization: z.string().min(2, "Organization perimeter name is required"),
  email: z.string().min(1, "Email is required").email("Please provide a corporate email"),
  password: z.string().min(8, "Password passkey must contain at least 8 cryptographic characters"),
});

/**
 * Premium SignupForm Component with Zod validation.
 * @param {object} props
 * @param {function} props.onSuccess
 */
export const SignupForm = ({ onSuccess }) => {
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      organization: '',
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await signup({ name: data.name, organization: data.organization, email: data.email, password: data.password });
      toast.success("Organization root perimeter initialized.");
      if (onSuccess) onSuccess(true);
    } catch (err) {
      let message = "Error creating perimeter. Please retry.";
      if (err.code === 'auth/email-already-in-use') {
        message = "This corporate email is already registered. Please sign in.";
      } else if (err.code === 'auth/weak-password') {
        message = "Password is too weak. Please use at least 8 characters.";
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 w-full">
      <Input
        label="Full Name"
        placeholder="Dr. Evelyn Reed"
        icon={User}
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Organization / Perimeter Title"
        placeholder="GaitAuth Security Lab"
        icon={Building}
        error={errors.organization?.message}
        {...register('organization')}
      />

      <Input
        label="Corporate Email"
        placeholder="e.reed@securitylab.org"
        type="email"
        icon={Mail}
        error={errors.email?.message}
        {...register('email')}
      />
      
      <Input
        label="Master Key (Password)"
        placeholder="••••••••••••••••"
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

      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          type="submit"
          disabled={isSubmitting}
          icon={ArrowRight}
          className="w-full font-semibold shadow-[0_0_25px_rgba(255,255,255,0.2)]"
        >
          {isSubmitting ? "Generating Vault Root Key..." : "Initialize New Organization"}
        </Button>
      </div>
    </form>
  );
};

export default SignupForm;
