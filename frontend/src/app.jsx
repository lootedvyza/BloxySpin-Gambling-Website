import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";
import "./index.css";
import { LongLogo } from "./assets/exports.jsx";
import SocketContext from "./utils/socket.js";
import UserContext from "./utils/user.js";
import { ModalProvider, useModal } from "./utils/ModalContext";
import Router from "./router";
import { getauth } from "./utils/getauth.js";
import { api } from "./config.js";
import BannedPage from "./pages/banned.jsx";

function ModalRenderer() {
  const { modalState } = useModal();
  return modalState;
}

export default function App() {
  const [loadingData, setLoadingData] = useState(true);
  const [userData, setUserData] = useState(null);
  const [banned, setBanned] = useState(false);
  const [socket, setSocket] = useState(null);
  const [loadingDone, setLoadingDone] = useState(false);

  useEffect(() => {
    const socketInstance = io(api, {
      auth: {
        token: getauth(),
      },
      transports: ["websocket"],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected: ", socketInstance.id);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error: ", error);
      toast.error("Failed to connect to the server.");
    });

    socketInstance.on("disconnect", (reason) => {
      console.warn("Socket disconnected: ", reason);
      if (reason === "io server disconnect") {
        socketInstance.connect();
      }
    });

    setSocket(socketInstance);

    const fetchUserData = async () => {
      if (!getauth()) {
        setTimeout(() => setLoadingDone(true), 1500);
        setTimeout(() => setLoadingData(false), 1600);
        return;
      }

      try {
        const response = await fetch(`${api}/me`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getauth()}` },
        });

        if (response.status === 403) {
          setBanned(true);
          setTimeout(() => setLoadingDone(true), 1500);
          setTimeout(() => setLoadingData(false), 1600);
          return;
        }

        if (response.status === 200) {
          const data = await response.json();
          setUserData(data.data);
        }
      } catch {
        toast.error("Failed to fetch user data.");
      } finally {
        setTimeout(() => setLoadingDone(true), 1500);
        setTimeout(() => setLoadingData(false), 1600);
      }
    };

    fetchUserData();

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  if (banned) {
    return <BannedPage />;
  }

  return loadingData ? (
    <AnimatePresence>
      <div className={`Loading ${loadingDone ? "slideout" : ""}`} key="loader">
        <img src={LongLogo} alt="Loading Logo" />
      </div>
    </AnimatePresence>
  ) : (
    <UserContext.Provider value={{ userData, setUserData }}>
      <SocketContext.Provider value={socket}>
        <ModalProvider>
          <Toaster
            toastOptions={{
              style: {
                border: "1px solid #181a28",
                padding: "10px",
                color: "#fff",
                background: "#131520",
              },
            }}
          />
          <Router />
          <ModalRenderer />
        </ModalProvider>
      </SocketContext.Provider>
    </UserContext.Provider>
  );
}
