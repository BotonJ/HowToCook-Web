import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, useRouteError } from 'react-router-dom';
import { PwaInstallButton } from './components/PwaInstallButton';
import { TurnstileProvider } from './components/TurnstileProvider';
import { LangProvider, useI18n } from './lib/i18n';

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const RecipeDetail = lazy(() => import('./pages/RecipeDetail').then(m => ({ default: m.RecipeDetail })));
const CollectionPage = lazy(() => import('./pages/CollectionPage').then(m => ({ default: m.CollectionPage })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Credits = lazy(() => import('./pages/Credits').then(m => ({ default: m.Credits })));
const Tips = lazy(() => import('./pages/Tips').then(m => ({ default: m.Tips })));
const TipDetail = lazy(() => import('./pages/TipDetail').then(m => ({ default: m.TipDetail })));
const Explore = lazy(() => import('./pages/Explore').then(m => ({ default: m.Explore })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorBoundary() {
  const error = useRouteError();
  const { t } = useI18n();
  return (
    <div className="p-8 text-center font-system-ui">
      <h1>{t.error.notFound}</h1>
      <p>{t.error.somethingWrong} <a href="/">{t.error.backHome}</a></p>
      {import.meta.env.DEV && (
        <pre className="whitespace-pre-wrap text-left bg-gray-100 p-4 rounded-lg mt-4">
          {error instanceof Error ? error.stack : String(error)}
        </pre>
      )}
    </div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
}

const router = createBrowserRouter([
  { path: '/', element: <LazyPage><Home /></LazyPage>, errorElement: <ErrorBoundary /> },
  { path: '/category/:categoryId', element: <LazyPage><Home /></LazyPage>, errorElement: <ErrorBoundary /> },
  { path: '/recipe/*', element: <LazyPage><RecipeDetail /></LazyPage>, errorElement: <ErrorBoundary /> },
  { path: '/collection/:collectionId', element: <LazyPage><CollectionPage /></LazyPage>, errorElement: <ErrorBoundary /> },
  { path: '/about', element: <LazyPage><About /></LazyPage>, errorElement: <ErrorBoundary /> },
  { path: '/academy', element: <LazyPage><Tips /></LazyPage>, errorElement: <ErrorBoundary /> },
  { path: '/academy/:slug', element: <LazyPage><TipDetail /></LazyPage>, errorElement: <ErrorBoundary /> },
  { path: '/explore', element: <LazyPage><Explore /></LazyPage>, errorElement: <ErrorBoundary /> },
  { path: '/credits', element: <LazyPage><Credits /></LazyPage>, errorElement: <ErrorBoundary /> },
]);

function App() {
  return (
    <LangProvider>
      <TurnstileProvider>
        <RouterProvider router={router} />
        <PwaInstallButton />
      </TurnstileProvider>
    </LangProvider>
  );
}

export default App;
