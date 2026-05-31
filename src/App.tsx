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
import { LangProvider, useT } from './lib/i18n';

function ErrorBoundary() {
  const error = useRouteError();
  const t = useT();
  return (
    <div className="p-8 text-center font-system-ui">
      <h1>{t.common.notFound}</h1>
      <p>{t.error.generic}，<a href="/">{t.common.backHome}</a></p>
      {import.meta.env.DEV && (
        <pre className="whitespace-pre-wrap text-left bg-gray-100 p-4 rounded-lg mt-4">
          {error instanceof Error ? error.stack : String(error)}
        </pre>
      )}
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/category/:categoryId",
    element: <Home />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/recipe/*",
    element: <RecipeDetail />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/collection/:collectionId",
    element: <CollectionPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/about",
    element: <About />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/academy",
    element: <Tips />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/academy/:slug",
    element: <TipDetail />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/explore",
    element: <Explore />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/credits",
    element: <Credits />,
    errorElement: <ErrorBoundary />,
  },
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
