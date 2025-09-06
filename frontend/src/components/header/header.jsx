import React, { useContext, useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Undefinded } from "../../assets/exports.jsx";
import UserContext from "../../utils/user.js";
import InventoryModal from "../popup/inventory.jsx";
import GiveawayModal from "../popup/giveaway.jsx";
import { useModal } from "../../utils/ModalContext";
import SocketContext from "../../utils/socket.js";
import toast from "react-hot-toast";
import Leaderboard from "@/components/popup/leaderboard";
import { HomeIcon } from "@/assets/icons/HomeIcon";
import { MarketPlaceIcon } from "@/assets/icons/MarketPlaceIcon";
import { LeaderboardIcon } from "@/assets/icons/LeaderboardIcon";
import { WalletIcon } from "@/assets/icons/WalletIcon";
import { PlusIcon } from "@/assets/icons/PlusIcon";
import { GiftIcon } from "@/assets/icons/GiftIcon";
import { Avatar } from "../ui/avatar";
import { NotificationIcon } from "@/assets/icons/NotificationIcon";
import { LogOutIcon } from "@/assets/icons/LogOutIcon";
import { cn } from "@/lib/utils";
import { formatLargeNumber } from "@/utils/value";
import LoginModal from "../popup/login";
import { FaSignInAlt } from "react-icons/fa";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserIcon } from "lucide-react"; // Import user icon for profile
import { GiftIcon as GiveawayIcon } from "lucide-react"; // Import gift icon for giveaway
import { Package } from "lucide-react"; // Import package icon for inventory
import { ShieldAlert } from "lucide-react"; // Import shield icon for admin

export default function Header() {
  const { userData, setUserData } = useContext(UserContext);
  const { setModalState } = useModal();
  const [balance, setBalance] = useState("0");
  const [profileImage, setProfileImage] = useState(
    userData?.thumbnail || Undefinded,
  );
  const [level, setLevel] = useState(userData?.level || 0);
  const socket = useContext(SocketContext);
  const Navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (userData) {
      setBalance(userData.value);
      setProfileImage(userData.thumbnail || Undefinded);
      setLevel(userData.level || 0);
    }
  }, [userData]);

  useEffect(() => {
    if (socket?.connected) {
      const handleUpdate = (data) => {
        setUserData(data);
        setBalance(data.value);
        setProfileImage(data.thumbnail || "Undefined");
        setLevel(data.level || 0);
      };

      socket.on("UPDATE_ME", handleUpdate);

      return () => {
        socket.off("UPDATE_ME", handleUpdate);
        socket.off("UPDATE_STATS");
      };
    }
  }, [socket, setUserData]);

  const handleLogout = () => {
    const userData = localStorage.getItem("bloxyspin");
    if (!userData) {
      toast.error("You are not logged in!");
      return;
    }
    localStorage.removeItem("bloxyspin");
    toast.success("Successfully logged out!");
    setUserData(null);
  };

  return (
<header className="box-border flex h-[var(--header-height)] items-center px-4 md:px-6">
      <NavLink to="/">
        <picture>
          <source srcSet="./logo-2x.webp" media="(min-width: 1024px)" />
          <img
            alt="BloxySpin logo"
            height={90}
            width={288}
            src="./logo.webp"
            className="block aspect-auto h-auto w-[clamp(5rem,calc(2.5rem+10vw),10rem)]"
          />
        </picture>
      </NavLink>

      <nav className="ml-12 hidden items-center gap-9 xl:flex">
        <Link 
          icon={<HomeIcon />} 
          href="/" 
          label="Home" 
          isLink 
          isActive={location.pathname === "/"}
        />

        <Link
          icon={<MarketPlaceIcon />}
          label="Trades"
          isLink
          isActive={location.pathname === "/trades"}
        />

        <Link
          icon={<LeaderboardIcon />}
          onClick={() => setModalState(<Leaderboard />)}
          label="Leaderboard"
        />
      </nav>

      {userData ? (
        <>
          <Wallet balance={balance} />
          <div className="contents">
            <button
              type="button"
              disabled
              className="ml-auto hidden cursor-pointer items-center gap-1.5 rounded-[14px] border-none bg-[#0276FF] p-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#076BDE] active:bg-[#0276FF] disabled:cursor-not-allowed disabled:opacity-80 sm:inline-flex sm:p-2.5"
            >
              <span className="box-border h-6 w-6 rounded-full bg-white p-1">
                <GiftIcon className="w-full text-[#0276FF]" />
              </span>
              <span>Rewards</span>
            </button>

            <hr
              className="mx-2 box-border hidden h-1/2 w-px flex-[0_0_auto] sm:mx-4 sm:block"
              style={{ border: "none", background: "#333A46" }}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer">
                  <Avatar
                    imgUrl={profileImage}
                    level={level}
                    className="h-10 w-10 sm:h-14 sm:w-14"
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1C1F2D] border border-solid border-[#252839] rounded-lg p-1 w-48 hover:text-white mt-1">
                <DropdownMenuItem 
                  className="flex items-center gap-2 px-3 py-2.5 text-white hover:bg-[#2a2e44] cursor-pointer rounded-md"
                  onClick={() => {
                    Navigate("/profile");
                  }}
                >
                  <UserIcon className="h-4 w-4 text-[#0276FF]" />
                  <span>Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="flex items-center gap-2 px-3 py-2.5 text-white hover:bg-[#2a2e44] cursor-pointer rounded-md"
                  onClick={() => {
                    setModalState(<GiveawayModal />);
                  }}
                >
                  <GiveawayIcon className="h-4 w-4 text-[#0276FF]" />
                  <span>Create Giveaway</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="flex items-center gap-2 px-3 py-2.5 text-white hover:bg-[#2a2e44] cursor-pointer rounded-md"
                  onClick={() => {
                    setModalState(<InventoryModal />);
                  }}
                >
                  <Package className="h-4 w-4 text-[#0276FF]" />
                  <span>Inventory</span>
                </DropdownMenuItem>
                
                {userData?.rank === "OWNER" && (
                  <DropdownMenuItem 
                    className="flex items-center gap-2 px-3 py-2.5 text-white hover:bg-[#2a2e44] cursor-pointer rounded-md"
                    onClick={() => {
                      Navigate("/admin");
                    }}
                  >
                    <ShieldAlert className="h-4 w-4 text-[#0276FF]" />
                    <span>Admin</span>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator className="my-1 h-px bg-[#252839]" />
                
                <DropdownMenuItem 
                  className="logoutbtn flex items-center gap-2 px-3 py-2.5 text-[#FF4757] cursor-pointer rounded-md"
                  onClick={handleLogout}

                >
                  <LogOutIcon className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden md:contents">
              <IconButton label="Notifcations" className="ml-5 mr-4" disabled>
                <NotificationIcon />
              </IconButton>

              <IconButton label="Logout" onClick={handleLogout}>
                <LogOutIcon />
              </IconButton>
            </div>
          </div>
        </>
      ) : (
        <button
          onClick={() => {
            setModalState(null);
            setTimeout(() => setModalState(<LoginModal navigate={Navigate} />));
          }}
          className="ml-auto cursor-pointer items-center gap-1.5 rounded-lg border-none bg-[#0276FF] text-sm font-semibold text-black transition-colors hover:bg-[#076BDE] active:bg-[#0276FF] inline-flex p-3"
        >
          <FaSignInAlt /> LOGIN
        </button>
      )}
    </header>
  );
}

/**
 *
 * @type {import("react").FC<{
 *   label: string, 
 *   icon: import("react").ReactNode, 
 *   isActive?: boolean
 * } & ({isLink: true, href: string} | {isLink?: false, onClick: () => void})>} */
const Link = (props) => {
  const styles = cn(
    "inline-flex items-center transition-colors bg-transparent cursor-pointer border-none shadow-none gap-2 text-sm font-semibold no-underline [&>svg]:w-5 [&>svg]:h-6",
    props.isActive
      ? "text-[#0276FF]"
      : "text-[#42496B]"
  );

  return props.isLink ? (
    <NavLink to={props.href} className={styles}>
      {props.icon} <span className={props.isActive ? "text-white" : "text-[#42496B]"}>{props.label}</span>
    </NavLink>
  ) : (
    <button type="button" className={styles} onClick={props.onClick}>
      {props.icon} <span className={props.isActive ? "text-white" : "text-[#42496B]"}>{props.label}</span>
    </button>
  );
};


/** @type {import("react").FC<{balance: string}>} */
const Wallet = ({ balance }) => {
  const { setModalState } = useModal();

  return (
    <div className="mx-auto flex rounded-lg border border-solid border-[#393C49] bg-[#1C1F2D] text-xs font-semibold text-white sm:rounded-[14px] sm:text-sm">
      <div className="inline-flex w-full items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2">
        <WalletIcon className="w-3 text-[#0276FF] sm:w-5" />
        <span className="">{formatLargeNumber(balance)}</span>
      </div>
      <button
        type="button"
        className="inline-flex cursor-pointer items-center gap-1 rounded-[inherit] border-none bg-[#0276FF] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#076BDE] active:bg-[#0276FF] sm:px-5 sm:py-2.5 sm:text-sm"
        onClick={() => setModalState(<InventoryModal />)}
      >
        <PlusIcon className="w-3 sm:w-5" /> <span>Wallet</span>
      </button>
    </div>
  );
};

/** @type {import("react").FC<{label: string, children: import("react").ReactNode, onClick: () => void, disabled?: boolean, className?: string}>} */
const IconButton = ({ children, label, onClick, disabled, className }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      className={cn(
        "box-border h-10 w-10 flex-[0_0_auto] cursor-pointer rounded-[14px] border border-solid border-[#393C49] bg-transparent p-2 text-white transition-colors hover:bg-[#2a2e44] disabled:cursor-not-allowed disabled:text-[#4F546A] [&>svg]:w-full",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};