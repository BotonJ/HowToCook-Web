import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/Home';
import { RecipeDetail } from './pages/RecipeDetail';
import { About } from './pages/About';
import { Credits } from './pages/Credits';

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
    path: "/recipe/:recipeId",
    element: <RecipeDetail />,
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
