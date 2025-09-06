import { NavLink as NL } from "react-router-dom";
import toast from "react-hot-toast";
import { CoinFlipIcon } from "@/assets/icons/CoinFlipIcon";
import { DiscordIcon } from "@/assets/icons/DiscordIcon";
import { TwitterIcon } from "@/assets/icons/TwitterIcon";
import { useEffect, useRef, useState, forwardRef } from "react";
import { useLocation } from "react-router-dom";
import { TelegramIcon } from "@/assets/icons/TelegramIcon";

/** @type {LinkProps[]} */
const navLinks = [
  {
    to: "/coinflip",
    label: "Coinflip",
    icon: <CoinFlipIcon />,
  },
  {
    to: "/jackpot",
    label: "Jackpot",
    icon: <CoinFlipIcon />,
  },
  {
    to: "/upgrader",
    label: "Upgrader",
    icon: <CoinFlipIcon />,
    disabled: true,
  },
];

/** @type {LinkProps[]} */
const socialLinks = [
  {
    icon: <TelegramIcon />, 
    label: "Telegram", 
    to: "https://discord.gg/5gAJ8mBh"
  },
  {
    icon: <DiscordIcon />, 
    label: "Discord", 
    to: "https://discord.gg/5gAJ8mBh"
  },
  {
    icon: <TwitterIcon />, 
    label: "Twitter", 
    to: "https://twitter.com/bloxyspin"
  },
];

export const SideNav = () => {
  const location = useLocation();
  const [lineStyle, setLineStyle] = useState({});
  const itemsRef = useRef({});

  useEffect(() => {
    const activeItem = itemsRef.current[location.pathname];
    if (activeItem) {
      setLineStyle({
        top: activeItem.offsetTop,
        height: activeItem.offsetHeight,
        opacity: 1,
      });
    } else {
      setLineStyle({ opacity: 0 });
    }
  }, [location.pathname]);
  
  return (
    <nav className="box-border items-center flex h-full max-w-100 flex-col py-5 [--px:1.4rem] relative">
<div 
  className="absolute left-0 bg-[#0276FF] w-[4px] transition-all duration-300 rounded-[50px]"
  style={lineStyle}
/>
      <div className="contents *:mb-7">
        {navLinks.map((link) => (
          <NavLink 
            key={link.label} 
            {...link} 
            ref={(el) => (itemsRef.current[link.to] = el)}
          />
        ))}
      </div>
      <div className="contents [&>*+*]:mt-2 first:[&>*]:mt-auto">
        {socialLinks.map((link) => (
          <SocialLink key={link.label} {...link} />
        ))}
      </div>
    </nav>
  );
};

/**
 * @typedef {Object} LinkProps
 * @property {string} to
 * @property {import("react").ReactNode} icon
 * @property {string} label
 * @property {boolean} [disabled]
 */

/** @type {import("react").FC<LinkProps>} */
const NavLinkWithRef = forwardRef(({ to, icon, label, disabled }, ref) => {
  return (
    <NL
      ref={ref}
      to={to}
      onClick={
        disabled
          ? (e) => {
              toast.error("Well, this doesn't work yet!");
              e.preventDefault();
              e.stopPropagation();
            }
          : undefined
      }
      className="box-border w-full border-0 border-l-2 border-solid border-transparent px-[--px] text-center text-[#42496B] no-underline transition-colors [&.active]:border-transparent [&>svg]:inline-block [&>svg]:w-7"
    >
      {icon}
      <span className="mt-2 block text-sm font-medium">{label}</span>
    </NL>
  );
});

/** @type {import("react").FC<Omit<LinkProps, 'disabled'>>} */
const SocialLink = ({ icon, label, to }) => {
  return (
    <a
      target="_blank"
      href={to}
      title={label}
      aria-label={label}
      className="block text-center text-[#42496B] [&>svg]:inline-block [&>svg]:w-6"
    >
      {icon}
    </a>
  );
};

const NavLink = NavLinkWithRef;