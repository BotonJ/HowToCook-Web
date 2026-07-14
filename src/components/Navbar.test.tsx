import { renderWithProviders } from '@/test-utils';
import { screen, fireEvent } from '@testing-library/react';
import { Navbar } from './Navbar';

describe('Navbar', () => {
  beforeEach(() => {
    // Ensure zh is the default language for consistent test output
    localStorage.setItem('htc-lang', 'zh');
  });

  it('renders without crashing', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('displays navigation links (academy, about, credits)', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText('烹饪学院')).toBeInTheDocument();
    expect(screen.getByText('关于')).toBeInTheDocument();
    expect(screen.getByText('致谢')).toBeInTheDocument();
  });

  it('hides the /explore nav link (decision #10: route kept, nav entry removed)', () => {
    renderWithProviders(<Navbar />);
    // The 风味工作台 nav link should no longer appear in the navbar.
    expect(screen.queryByText('风味工作台')).not.toBeInTheDocument();
  });

  it('displays search icon link to /search', () => {
    renderWithProviders(<Navbar />);
    const searchLink = screen.getByRole('link', { name: '搜索' });
    expect(searchLink).toBeInTheDocument();
    expect(searchLink).toHaveAttribute('href', '/search');
  });

  it('displays language toggle button showing EN for zh locale', () => {
    renderWithProviders(<Navbar />);
    // In zh locale, button should show "EN" (hidden md:inline)
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('toggles language when language switch button is clicked', () => {
    renderWithProviders(<Navbar />);
    // Initially in zh — button shows "EN"
    expect(screen.getByText('EN')).toBeInTheDocument();

    // Click the language toggle button
    const langButton = screen.getByText('EN').closest('button')!;
    fireEvent.click(langButton);

    // After toggle, should be in en — button shows "中"
    expect(screen.getByText('中')).toBeInTheDocument();
  });

  it('navigation links have correct hrefs', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText('烹饪学院').closest('a')).toHaveAttribute('href', '/academy');
    expect(screen.getByText('关于').closest('a')).toHaveAttribute('href', '/about');
    expect(screen.getByText('致谢').closest('a')).toHaveAttribute('href', '/credits');
  });

  it('displays GitHub link', () => {
    renderWithProviders(<Navbar />);
    const githubLink = screen.getByRole('link', { name: /view source code on github/i });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/BotonJ/HowToCook-Web');
  });
});
