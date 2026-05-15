import { createContext, useContext, useEffect, useState } from "react";
import useAuthStore from "./useAuthStore";
import io from "socket.io-client";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuthStore();
  const currentUser = user?.user;

  useEffect(() => {
    if (currentUser) {
      const newSocket = io(`${BASE_URL}/`, {
        query: { userId: currentUser._id },
      });

      setSocket(newSocket);

      return () => newSocket.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [currentUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};