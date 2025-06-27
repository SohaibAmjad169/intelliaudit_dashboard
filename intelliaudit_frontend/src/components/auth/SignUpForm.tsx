import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { supabase } from '@/clients';
import { Button } from '@shared/actions/Button';
import { Input } from '@components/forms/inputs/Input';

interface SignUpFormData {
  email: string;
  password: string;
}

export default function SignUpForm() {
  const { register, handleSubmit } = useForm<SignUpFormData>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit: SubmitHandler<SignUpFormData> = async (data) => {
    try {
      setError(null);
      setLoading(true);
      const { error } = await supabase.auth.signUp({ email: data.email, password: data.password });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-900/10 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Email
        </label>
        <Input
          id="email"
          type="email"
          {...register('email', { required: true })}
          className="mt-1 block w-full rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 bg-[#2a2b2f] border-gray-600 text-white placeholder-gray-400"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          Password
        </label>
        <Input
          id="password"
          type="password"
          {...register('password', { required: true })}
          className="mt-1 block w-full rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 bg-[#2a2b2f] border-gray-600 text-white placeholder-gray-400"
          required
        />
      </div>
      <Button
        type="submit"
        isLoading={loading}
        disabled={loading}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
      >
        {loading ? 'Signing up...' : 'Sign up'}
      </Button>
    </form>
  );
}