import { render, screen } from '@testing-library/react';
import Loading from '../loading';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

describe('Loading Page', () => {
  it('renders loading spinner and messages', () => {
    render(<Loading />);

    expect(screen.getByRole('heading', { name: /carregando/i })).toBeInTheDocument();
    expect(
      screen.getByText(/aguarde um momento enquanto preparamos os dados/i)
    ).toBeInTheDocument();

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });
});