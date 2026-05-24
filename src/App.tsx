import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/Home';
import { RecipeDetail } from './pages/RecipeDetail';
import { About } from './pages/About';
import { Credits } from './pages/Credits';
import { useRouteError } from 'react-router-dom';

function ErrorBoundary() {
  const error = useRouteError();
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', textAlign: 'center' }}>
      <h1>出错了</h1>
      <p>页面加载异常，请<a href="/">返回首页</a></p>
      {import.meta.env.DEV && (
        <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left', background: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
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
    path: "/credits",
    element: <Credits />,
    errorElement: <ErrorBoundary />,
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;