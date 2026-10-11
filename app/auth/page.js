
'use client';

import { useState } from 'react';
import { supabaseBrowser } from '../../lib/supabase';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const supabase = supabaseBrowser();

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage(
          data.session
            ? 'Account created successfully!'
            : 'Account created. Check your email to confirm your account.'
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        window.location.href = '/';
      }
    } catch (error) {
      setMessage(error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      maxWidth: 420,
      margin: '60px auto',
      padding: 24,
      color: '#fff',
      background: '#111',
      borderRadius: 12
    }}>
      <h1>{isSignup ? 'Create your account' : 'Sign in to VYBE'}</h1>

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ display: 'block', width: '100%', padding: 12, margin: '8px 0 16px' }}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          minLength={6}
          required
          style={{ display: 'block', width: '100%', padding: 12, margin: '8px 0 16px' }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 12, cursor: 'pointer' }}
        >
          {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p>{message}</p>

      <button
        type="button"
        onClick={() => {
          setIsSignup(!isSignup);
          setMessage('');
        }}
        style={{ padding: 10, marginTop: 12 }}
      >
        {isSignup
          ? 'Already have an account? Sign in'
          : 'New to VYBE? Create an account'}
      </button>
    </main>
  );
}
