import chatstyle from "./mobilechat.module.css";
import Chat from "./Chat";

export default function MobileChat() {
  return (
    <div className={chatstyle.chat}>
      <Chat />
    </div>
  );
}
