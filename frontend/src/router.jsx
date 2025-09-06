import { RouterProvider, createBrowserRouter, Outlet, Navigate } from "react-router-dom";
import Alert from "./components/small/alert.jsx";
import { Home as H } from "@/components/Home/Home";
import CF from "@/components/coinflip/layout";
import Jackpot from "@/components/jackpot/layout";
import Account from "@/components/account/account";
import Toss from "@/components/tos/tos";
import DiscordLinked from "@/components/discord/linker.jsx";
import Header from "@/components/header/header.jsx";
import { SideNav } from "@/components/SideNav/SideNav.jsx";
import Chat from "@/components/chat/Chat.jsx";
import Footer from "@/components/footer/footer.jsx";
import { useLocation, useNavigate } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();

  return (
    <>
      <Header />
      
      <main className="flex h-full min-h-0 flex-1 overflow-hidden">
        <div className="box-border hidden h-full flex-[0_0_auto] lg:block">
          <SideNav />
        </div>
        
        <div
          className="box-border flex-[1_1_auto] overflow-y-auto rounded-t-[1.25rem] border border-solid border-[#252839] border-b-transparent [&::-webkit-scrollbar]:hidden"
          style={{
            background:
              "linear-gradient(rgba(28, 31, 46, 0.98), rgba(28, 31, 46, 0.98)), url(background.png) no-repeat rgba(28, 31, 46, 1)",
            backgroundBlendMode: "luminosity",
            backgroundAttachment: "fixed",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <div className="main-container" key={location.key}>
          {/*<div className="p-2">
            <Alert alert={{ show: true }} />
          </div>*/}
            <Outlet />
          </div>
        </div>
        
        <aside className="box-border hidden h-full flex-[0_0_min(22rem,calc(15rem+10vw))] pb-4 lg:block">
          <Chat />
        </aside>
      </main>
      
      <Footer />
    </>
  );
};

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <H /> },
      { path: "/coinflip", element: <CF /> },
      { path: "/jackpot", element: <Jackpot /> },
      { path: "/profile", element: <Account /> },
      { path: "/terms", element: <Toss /> },
      { path: "/discord/linked", element: <DiscordLinked /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
    errorElement: <Navigate to="/" replace />,
  },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
