import EmojiPicker from "emoji-picker-react";
import { useEffect, useState, useRef, useContext } from "react";
import { FaSmile } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import UserContext from "../../utils/user.js";
import chatstyle from "./chat.module.css";
import { useCallback } from "react";
import { forwardRef } from "react";

/**
 * @typedef {Object} ChatInputProps
 * @property {string} message
 * @property {import("react").Dispatch<import("react").SetStateAction<string>>} setMessage
 * @property {boolean} canSend
 * @property {() => Promise<void>} sendMessage
 */

/** @type {import("react").FC<ChatInputProps>} */
export const ChatInput = ({ canSend, message, setMessage, sendMessage }) => {
  const { userData } = useContext(UserContext);
  const isLoggedIn = !!userData?.userid;

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const emojiPickerTriggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !emojiPickerTriggerRef.current?.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEmojiClick = useCallback((emojiObject) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
  }, []);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={isLoggedIn ? "Say Something ..." : "Login to chat"}
        className="box-border w-full rounded-[0.5rem] bg-[#1C1F2E] py-3.5 pl-4 pr-20 text-xs font-bold text-[#A6B2D3] placeholder:text-[#68749C] outline-none  border border-solid border-[#252839]"
        value={message}
        disabled={!isLoggedIn || !canSend}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && canSend && sendMessage()}
      />
      <div
        className="absolute flex items-center gap-1"
        style={{
          top: "50%",
          transform: "translateY(-50%)",
          right: "0.5rem",
        }}
      >
        <InputButton
          aria-label="Emoji Picker"
          onClick={() => {
            // patch
            const picker = emojiPickerRef.current;
            if (picker) {
              picker.style.animationDuration = "";
            }
            setShowEmojiPicker((prev) => !prev);
          }}
          ref={emojiPickerTriggerRef}
        >
          <FaSmile />
        </InputButton>

        <InputButton
          aria-label="Send"
          onClick={sendMessage}
          disabled={!canSend}
        >
          <MdSend />
        </InputButton>
      </div>

      <div
        className={`${showEmojiPicker ? chatstyle.pickerShown : chatstyle.pickerHidden} ${chatstyle.emojiPicker}`}
        ref={emojiPickerRef}
        style={{ animationDuration: "0s" }}
      >
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          skinTonesDisabled={true}
          autoFocusSearch={false}
          className={chatstyle.picker}
          theme="dark"
          previewConfig={{
            showPreview: true,
          }}
        />
      </div>
    </div>
  );
};

/** @type {import("react").FC<{children: import("react").ReactNode, "aria-label": string, onClick: () => void, disabled?: boolean}>} */
const InputButton = forwardRef((props, ref) => {
  return (
    <button
      className="inline-grid aspect-square w-[1.75rem] flex-shrink-0 cursor-pointer place-content-center bg-transparent transition-colors hover:bg-[#292F45] active:bg-transparent [&:hover>svg]:fill-[#606D9B] [&>svg]:fill-[#3A3F57] [&>svg]:transition-all  border border-solid border-[#252839] rounded" 
      ref={ref}
      {...props}
    />
  );
});
