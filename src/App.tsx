import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/Home';
import { RecipeDetail } from './pages/RecipeDetail';
import { About } from './pages/About';
import { Credits } from './pages/Credits';
import { useRouteError } from 'react-router-dom';

function ErrorBoundary() {
  const error = useRouteError();
  console.error('Route error:', error);
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Route Error</h1>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error)}
      </pre>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/category/:categoryId",
    element: <Home />,
  },
  {
    path: "/recipe/*",
    element: <RecipeDetail />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/credits",
    element: <Credits />,
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;