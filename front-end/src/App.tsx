import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import { fetchProfile } from './store/slices/authSlice';

const App = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(fetchProfile());
    }
  }, [dispatch, token]);

  return (
    <Routes>
      <Route
        path="/auth"
        element={token ? <Navigate to="/" replace /> : <AuthPage />}
      />
      <Route
        path="/*"
        element={token ? <DashboardPage /> : <Navigate to="/auth" replace />}
      />
    </Routes>
  );
};

export default App;

