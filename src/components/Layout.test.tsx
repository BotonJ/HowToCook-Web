import { renderWithProviders } from '@/test-utils';
import { screen } from '@testing-library/react';
import { Layout } from './Layout';

// ScrollRestoration requires a data router (createBrowserRouter / createMemoryRouter),
// but renderWithProviders uses plain MemoryRouter. Mock it as a no-op.
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, ScrollRestoration: () => null };
});

describe('Layout', () => {
  beforeEach(() => {
    localStorage.setItem('htc-lang', 'zh');
  });

  it('renders without crashing', () => {
    renderWithProviders(<Layout><div>child</div></Layout>);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderWithProviders(
      <Layout>
        <p>Hello, HowToCook!</p>
      </Layout>,
    );
    expect(screen.getByText('Hello, HowToCook!')).toBeInTheDocument();
  });

  it('renders the Navbar', () => {
    renderWithProviders(<Layout><div>child</div></Layout>);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('做饭指北')).toBeInTheDocument();
  });

  it('displays footer text with current year', () => {
    renderWithProviders(<Layout><div>child</div></Layout>);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${year} HowToCook`))).toBeInTheDocument();
    expect(screen.getByText(/Open Source Project/)).toBeInTheDocument();
  });

  it('displays "Skip to content" link', () => {
    renderWithProviders(<Layout><div>child</div></Layout>);
    const skipLink = screen.getByRole('link', { name: /skip to content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });
});
