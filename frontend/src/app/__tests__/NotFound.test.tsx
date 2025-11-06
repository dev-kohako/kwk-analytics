import { render, screen } from '@testing-library/react';
import NotFound from '../not-found';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

describe('NotFound Page', () => {
  it('renders the 404 message', () => {
    render(<NotFound />);
    expect(
      screen.getByRole('heading', { name: /página não encontrada/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/A página que você está tentando acessar/i)
    ).toBeInTheDocument();
  });

  it('has a back to home button', () => {
    render(<NotFound />);
    const button = screen.getByRole('link', { name: /voltar para o início/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href', '/');
  });
});
