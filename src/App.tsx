import { lazy, Suspense, Component, type ReactNode, type ErrorInfo } from 'react';
import { createBrowserRouter, RouterProvider, useRouteError, Link } from 'react-router-dom';
import { PwaInstallButton } from './components/PwaInstallButton';
import { LangProvider, useI18n } from './lib/i18n';

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const RecipeDetail = lazy(() => import('./pages/RecipeDetail').then(m => ({ default: m.RecipeDetail })));
const CollectionPage = lazy(() => import('./pages/CollectionPage').then(m => ({ default: m.CollectionPage })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Credits = lazy(() => import('./pages/Credits').then(m => ({ default: m.Credits })));
const Tips = lazy(() => import('./pages/Tips').then(m => ({ default: m.Tips })));
const TipDetail = lazy(() => import('./pages/TipDetail').then(m => ({ default: m.TipDetail })));
const Explore = lazy(() => import('./pages/Explore').then(m => ({ default: m.Explore })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const IngredientPage = lazy(() => import('./pages/IngredientPage').then(m => ({ default: m.IngredientPage })));

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

interface LazyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class LazyErrorBoundary extends Component<
  { children: ReactNode },
  LazyErrorBoundaryState
> {
  state: LazyErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[LazyLoad] chunk load failed:', error, info);
    // Version-skew recovery: a lazy chunk fails to load when a new deploy
    // ships while the user has an old tab open (old SW/page requests a hash
    // the new deployment serves differently, or the CDN edge hasn't
    // propagated it). Auto-reload ONCE to pick up the fresh deployment.
    // One attempt per session (sessionStorage flag) — if the reload doesn't
    // fix it, the error UI below remains as the manual-recovery fallback.
    const isChunkLoadFail =
      /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
        error.message,
      );
    if (isChunkLoadFail && !sessionStorage.getItem('htc-chunk-reload')) {
      sessionStorage.setItem('htc-chunk-reload', '1');
      window.location.reload();
      return;
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center font-system-ui">
          <h1 className="text-2xl font-bold mb-4">页面加载失败</h1>
          <p className="text-on-surface-variant mb-6">
            页面加载出错，请刷新重试。
          </p>
          <a href="/" className="text-primary hover:underline">返回首页</a>
        </div>
      );
    }
    return this.props.children;
  }
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </LazyErrorBoundary>
  );
}

function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="p-8 text-center font-system-ui">
      <h1 className="text-2xl font-bold mb-4">{t.error.notFound}</h1>
      <p className="text-on-surface-variant mb-6">
        <Link to="/" className="text-primary hover:underline">{t.error.backHome}</Link>
      </p>
    </div>
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
  { path: '/search', element: <LazyPage><SearchPage /></LazyPage>, errorElement: <ErrorBoundary /> },
  { path: '/explore', element: <LazyPage><Explore /></LazyPage>, errorElement: <ErrorBoundary /> },
  { path: '/ingredient/:name', element: <LazyPage><IngredientPage /></LazyPage>, errorElement: <ErrorBoundary /> },
  { path: '/credits', element: <LazyPage><Credits /></LazyPage>, errorElement: <ErrorBoundary /> },
  { path: '*', element: <NotFoundPage /> },
]);

function App() {
  return (
    <LangProvider>
      <RouterProvider router={router} />
      <PwaInstallButton />
    </LangProvider>
  );
}

export default App;
