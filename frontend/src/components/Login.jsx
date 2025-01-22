import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
} from '@mui/material';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            ログイン
          </Typography>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              type="email"
            />
            <TextField
              fullWidth
              label="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              type="password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
            >
              ログイン
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}; 