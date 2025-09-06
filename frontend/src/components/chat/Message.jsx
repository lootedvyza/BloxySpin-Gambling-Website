import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar } from "../ui/avatar";
import { useModal } from "@/utils/ModalContext";
import Profile from "../popup/profile";

/**
 * @typedef {Object} ChatMessage
 * @property {string} thumbnail
 * @property {string} timestamp
 * @property {string} [rankImage]
 * @property {string} [roleName]
 * @property {string} [usernameColor]
 * @property {string} userid
 */

/**
 * @typedef {Object} MessageProps
 * @property {ChatMessage} msg
 */

/** @type {import("react").FC<MessageProps>} */
export const Message = ({ msg }) => {
  const { setModalState } = useModal();

  return (
    <div className="flex gap-3 rounded-[1.375rem]  border border-solid border-[#252839] bg-[#1C1F2E] p-3">
      <div>
        <Avatar
          imgUrl={msg?.thumbnail}
          level={msg.level}

          onClick={() => setModalState(() => <Profile userid={msg?.userid} />)}
        />
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center leading-6">
          <span
            className="w-max text-xs font-bold"
            style={{ color: msg.usernameColor || "#68749C" }}
          >
            <span className="font-medium">@</span>
            {msg.username || "Unkown User"}
          </span>

          {msg.rankImage ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger className="inline h-4 w-4 border-0 border-transparent bg-transparent">
                  <img
                    src={msg.rankImage}
                    className="ml-1 h-full w-full bg-transparent"
                    alt="Rank Icon"
                  />
                </TooltipTrigger>
                <TooltipContent className="bg-[#171925] border border-solid border-[#252839] rounded-[5px] p-2s px-3">
                  <p className="text-white">{msg.roleName || "User "}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}

          <span className="ml-auto text-[0.625rem] font-medium text-[#454D71]">
            {msg.timestamp}
          </span>
        </div>

        <p className="text-xs font-medium text-[#A6B2D3] [overflow-wrap:anywhere]">
          {msg.content}
        </p>
      </div>
    </div>
  );
};
