import { useState } from 'react';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

export function useAuthForm({ signUp }) {
  const strings = useStrings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clearFeedback = () => {
    setError('');
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearFeedback();
    setSubmitting(true);

    const result = signUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setError(result.error.message);
    } else if (signUp && !result.data.session) {
      setMessage(strings.toasts.authForm.accountCreated);
    }
    setSubmitting(false);
  };

  return {
    email,
    error,
    handleSubmit,
    message,
    password,
    setEmail,
    setPassword,
    submitting,
  };
}
