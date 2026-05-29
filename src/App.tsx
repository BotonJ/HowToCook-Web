import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/Home';
import { RecipeDetail } from './pages/RecipeDetail';
import { About } from './pages/About';
import { Credits } from './pages/Credits';
import { Tips } from './pages/Tips';
import { TipDetail } from './pages/TipDetail';
import { useRouteError } from 'react-router-dom';
import { PwaInstallButton } from './components/PwaInstallButton';

function ErrorBoundary() {
  const error = useRouteError();
  return (
    <div className="p-8 text-center font-system-ui">
      <h1>出错了</h1>
      <p>页面加载异常，请<a href="/">返回首页</a></p>
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
    path: "/credits",
    element: <Credits />,
    errorElement: <ErrorBoundary />,
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <PwaInstallButton />
    </>
  );
}

export default App;