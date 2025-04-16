import Header from './Header'
import Home from './pages/Home';
import ForexPair from './pages/ForexPair';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Models from './pages/Models';
import Prediction from './pages/Prediction';
import Results from './pages/Results'
import Charts from './pages/Pages';



export default function Router(){
  const Layout = () => {
    return(
      <>
        <Header />
        <Outlet />
      </>
    )
  }
      const BrowserRoutes = createBrowserRouter([
        {
            path: "/",
            element: <Layout />,
            children: [
                {
                    path: "/",
                    element: <Home />
                },
                {
                    path: "/forex-pair",
                    element: <ForexPair />
                },
                {
                  path: "/models",
                  element: <Models />
                },
                {
                  path: "/prediction",
                  element: <Prediction />
                },
                {
                  path: "/results",
                  element: <Results />
                },
                {
                  path: "/charts",
                  element: <Charts />
                }
            ]
        }
    ])


  return(
    <RouterProvider router={BrowserRoutes} />
  )
}