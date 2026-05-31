import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/Home';
import { RecipeDetail } from './pages/RecipeDetail';
import { CollectionPage } from './pages/CollectionPage';
import { About } from './pages/About';
import { Credits } from './pages/Credits';
import { Tips } from './pages/Tips';
import { TipDetail } from './pages/TipDetail';
import { Explore } from './pages/Explore';
import { useRouteError } from 'react-router-dom';
import { PwaInstallButton } from './components/PwaInstallButton';
import { TurnstileProvider } from './components/TurnstileProvider';
import { LangProvider } from './lib/i18n';

function ErrorBoundary() {
  const error = useRouteError();
  const isEn = window.location.pathname.startsWith('/en');
  const homeHref = isEn ? '/en/' : '/';
  return (
    <div className="p-8 text-center font-system-ui">
      <h1>{isEn ? 'Page Not Found' : '页面未找到'}</h1>
      <p>{isEn ? 'Something went wrong.' : '页面加载异常，请'} <a href={homeHref}>{isEn ? 'Back to Home' : '返回首页'}</a></p>
      {import.meta.env.DEV && (
        <pre className="whitespace-pre-wrap text-left bg-gray-100 p-4 rounded-lg mt-4">
          {error instanceof Error ? error.stack : String(error)}
        </pre>
      )}
    </div>
  );
}

/** Layout wrapper that provides language context based on URL. */
function LocalizedLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <TurnstileProvider>
        {children}
        <PwaInstallButton />
      </TurnstileProvider>
    </LangProvider>
  );
}

function RootLayout() {
  return (
    <LocalizedLayout>
      <Home />
    </LocalizedLayout>
  );
}

function RecipeDetailLayout() {
  return (
    <LocalizedLayout>
      <RecipeDetail />
    </LocalizedLayout>
  );
}

function CollectionLayout() {
  return (
    <LocalizedLayout>
      <CollectionPage />
    </LocalizedLayout>
  );
}

function AboutLayout() {
  return (
    <LocalizedLayout>
      <About />
    </LocalizedLayout>
  );
}

function TipsLayout() {
  return (
    <LocalizedLayout>
      <Tips />
    </LocalizedLayout>
  );
}

function TipDetailLayout() {
  return (
    <LocalizedLayout>
      <TipDetail />
    </LocalizedLayout>
  );
}

function ExploreLayout() {
  return (
    <LocalizedLayout>
      <Explore />
    </LocalizedLayout>
  );
}

function CreditsLayout() {
  return (
    <LocalizedLayout>
      <Credits />
    </LocalizedLayout>
  );
}

const routeConfig = [
  { path: '/', element: <RootLayout />, errorElement: <ErrorBoundary /> },
  { path: '/category/:categoryId', element: <RootLayout />, errorElement: <ErrorBoundary /> },
  { path: '/recipe/*', element: <RecipeDetailLayout />, errorElement: <ErrorBoundary /> },
  { path: '/collection/:collectionId', element: <CollectionLayout />, errorElement: <ErrorBoundary /> },
  { path: '/about', element: <AboutLayout />, errorElement: <ErrorBoundary /> },
  { path: '/academy', element: <TipsLayout />, errorElement: <ErrorBoundary /> },
  { path: '/academy/:slug', element: <TipDetailLayout />, errorElement: <ErrorBoundary /> },
  { path: '/explore', element: <ExploreLayout />, errorElement: <ErrorBoundary /> },
  { path: '/credits', element: <CreditsLayout />, errorElement: <ErrorBoundary /> },
];

// Generate /en/ prefixed routes for English
const enRoutes = routeConfig.map((route) => ({
  ...route,
  path: `/en${route.path}`,
}));

const router = createBrowserRouter([...routeConfig, ...enRoutes]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
