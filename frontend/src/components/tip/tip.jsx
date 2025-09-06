import React, { useEffect, useState, useContext } from "react";
import SocketContext from "../../utils/socket";
import UserContext from "../../utils/user.js";
import { useModal } from "../../utils/ModalContext.jsx";
import toast from "react-hot-toast";

export default function TipMain() {
  const { setModalState } = useModal();
  const socket = useContext(SocketContext);
  const { userData, setUserData } = useContext(UserContext);

  useEffect(() => {
    const handleTip = (tipData) => {
      toast.success(
        `${tipData.from} has tipped you items worth ${tipData.value} R$!`,
        {
          duration: 5000,
        },
      );
    };

    socket.on("TIP", handleTip);

    return () => {
      socket.off("TIP", handleTip);
    };
  }, [socket]);

  if (!userData || !userData.userid) {
    return null;
  }

  return null;
}
