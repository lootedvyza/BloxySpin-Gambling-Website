/**
 * @typedef {Object} BannerSlide
 * @property {string} imgSmall
 * @property {string} imgLarge
 * @property {import("react").ReactNode} [title]
 * @property {import("react").ReactNode} [description]
 * @property {import("react").ReactNode} [button]
 * @property {string} [className]
 */

import Profile from "@/components/popup/profile";
import { Banner } from "./components";
import Deposit from "@/components/popup/deposit";
import LoginModal from "@/components/popup/login";
import { useNavigate } from "react-router-dom";

/** @type {BannerSlide[]} */
export const banners = [
  {
    title: <Banner.Title>Claim your welcome offer today!</Banner.Title>,
    description: (
      <Banner.Description className="md:my-4">
        +50% Bonus up to $7.5$ and 3 Free Items!
      </Banner.Description>
    ),
    button: (
      <Banner.Button
        action={(setModalState, userData) => {
          setModalState(userData ? <Deposit /> : <LoginModal />);
        }}
      >
        Sign Up Now!
      </Banner.Button>
    ),
    imgLarge: "/banner/1.png",
    imgSmall: "/banner/1.png",
    className: "[&_img]:[filter:brightness(0.5)]",
  },
  {
    title: <Banner.Title>🎉 a new gamemode is out!</Banner.Title>,
    description: (
      <Banner.Description className="md:my-4">
        Play jackpot, our new fun gamemode today!🔥
      </Banner.Description>
    ),
    button: (
      <Banner.Button
        action={() => {
          const navigate = useNavigate();
          navigate("/jackpot");
        }}
      >
        Play Now!
      </Banner.Button>
    ),
    imgLarge: "/banner/2.png",
    imgSmall: "/banner/2.png",
    className: "[&_img]:[filter:brightness(0.7)]",
  },
];
