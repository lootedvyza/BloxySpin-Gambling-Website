import { useState, useEffect, useContext, useRef } from "react";
import toast from "react-hot-toast";
import SocketContext from "../../utils/socket";
import { getauth } from "../../utils/getauth";
import Tip from "../tip/tip.jsx";
import { api } from "../../config.js";
import Giveaways from "./giveaway.jsx";
import { getrole } from "../../utils/getrole";
import "./picker.css";
import { Message } from "./Message";
import { ChatInput } from "./ChatInput";
import { memo } from "react";
import { RulesIcon } from "@/assets/icons/RulesIcon";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  // const [online, setOnline] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [canSend, setCanSend] = useState(true);
  const socket = useContext(SocketContext);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${api}/chat/latest`, { method: "POST" });
        if (response.ok) {
          const data = await response.json();
          setMessages(
            data.messages.map((msg) => {
              const { name, color, image } = getrole(msg.rank, msg.level);
              return {
                ...msg,
                rankImage: image,
                roleName: name,
                usernameColor: color,
              };
            }),
          );
        } else {
          toast.error("Failed to load messages!");
        }
      } catch {
        toast.error("Failed to load messages!");
      }
    };

    fetchMessages();

    const handleSocketMessage = (msg) => {
      const { name, color, image } = getrole(msg.rank, msg.level);
      setMessages((prevMessages) =>
        [
          ...prevMessages,
          { ...msg, rankImage: image, roleName: name, usernameColor: color },
        ].slice(-30),
      );
    };

    socket.on("MESSAGE", handleSocketMessage);
    socket.on("ONLINE_UPDATE", setOnlineCount);

    return () => {
      socket.off("MESSAGE", handleSocketMessage);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("ONLINE_UPDATE");
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages]);

  const sendMessage = async () => {
    if (!canSend || !message.trim()) return toast.error("Enter a message!");

    setCanSend(false);
    setMessage("");

    try {
      const response = await fetch(`${api}/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getauth()}`,
        },
        body: JSON.stringify({ msgcontent: message }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.message);
      }
    } catch {
      toast.error("Could not send your message!");
    }

    setTimeout(() => setCanSend(true), 2000);
  };

  return (
  <div className="box-border flex h-full min-w-0 flex-grow flex-col lg:py-0 py-4 [--px:1.25rem]">
      <Giveaways />

      <Messages messages={messages} messagesEndRef={messagesEndRef} />

      <div className="relative mt-auto px-[--px] pt-4">
        <ChatInput
          {...{
            canSend,
            message,
            sendMessage,
            setMessage,
          }}
        />

        <div className="mt-2 flex items-center gap-2">
          <div className="contents select-none">
            <span className="block aspect-square w-2.5 rounded-full bg-current text-[#3AFF4E] shadow-[0_0_5.5px_currentColor]" />
            <span className="text-sm font-medium text-white">
              {onlineCount}
            </span>
          </div>

          <button
            className="group ml-auto cursor-pointer border-none bg-transparent text-[#292F45] transition-colors hover:text-[#606D9B] [&>svg]:w-4"
            aria-label="Chat Rules"
          >
            <RulesIcon />
          </button>
        </div>
      </div>
      <Tip />
    </div>
  );
}

/**
 * @type {import("react").NamedExoticComponent<{messages: unknown[], messagesEndRef: import("react").RefObject<HTMLSpanElement>}>}
 */
const Messages = memo(({ messages, messagesEndRef }) => {
  return (
    <div className="grow overflow-y-auto" style={{ scrollBehavior: "auto" }}>
      <div className="relative flex flex-col gap-3.5 px-[--px]">
        {messages.map((msg, index) => (
          <Message key={index} msg={msg} />
        ))}
        <span className="absolute bottom-0" ref={messagesEndRef} />
      </div>
    </div>
  );
});
