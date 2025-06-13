import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { store } from './store';
import { theme } from './styles/theme';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

describe('App Component', () => {
  test('renders without crashing', () => {
    render(
      <AllTheProviders>
        <App />
      </AllTheProviders>
    );
  });

  test('renders loading state initially', () => {
    render(
      <AllTheProviders>
        <App />
      </AllTheProviders>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});