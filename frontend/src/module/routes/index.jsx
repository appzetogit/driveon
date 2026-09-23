import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import ModuleTestPage from '../pages/ModuleTestPage';

/**
 * Routes configuration for module
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/module-test',
    element: <ModuleTestPage />,
  },
]);

export default router;

