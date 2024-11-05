import Header from '../components/Header'
import Home from './pages/Home';
import ForexPair from './pages/ForexPair';
//import { BrowserRouter, Routes, Route, Outlet} from 'react-router-dom';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Models from './pages/Models';

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
                }
            ]
        }
    ])


  return(
    <RouterProvider router={BrowserRoutes} />
  )
}