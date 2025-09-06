import styles from "./mobilehome.module.css";
import { useModal } from "../../utils/ModalContext.jsx";

import {
  FaStore,
  FaQuestionCircle,
  FaDice,
  FaTrophy,
  FaShieldAlt,
  FaFileContract,
} from "react-icons/fa";
import toast from "react-hot-toast";
import VeryFairness from "../coinflip/fairness/verifyfairness";
import Leaderboard from "./leaderboard";

export default function MobileHome({ navigate, location }) {
  const { setModalState } = useModal();

  const handleNavigate = (path) => {
    setModalState(null);
    navigate(path);
  };

  return (
    <div className={styles.mobilehome}>
      <a
        className={`${styles.navItem} ${location.pathname === "/coinflip" ? styles.active : ""}`}
        onClick={() => handleNavigate("/coinflip")}
      >
        <svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 576 512"
          height="1.6rem"
          width="1.6rem"
        >
          <path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"></path>
        </svg>
        Coinflip
      </a>

      <a
        className={`${styles.navItem} ${location.pathname === "/jackpot" ? styles.active : ""}`}
        onClick={() => handleNavigate("/jackpot")}
      >
        <svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 576 512"
          height="1.6rem"
          width="1.6rem"
        >
          <path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"></path>
        </svg>
        Jackpot
      </a>

      <a
        href="https://discord.gg/5gAJ8mBh"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.navItem}
      >
        <FaQuestionCircle className={styles.icon} />
        Support
      </a>

      <a
        className={styles.navItem}
        onClick={() => setModalState(<VeryFairness />)}
      >
        <FaDice className={styles.icon} />
        Provably Fair
      </a>

      <div
        className={styles.navItem}
        onClick={() => setModalState(<Leaderboard />)}
      >
        <FaTrophy className={styles.icon} />
        Leaderboard
      </div>

      <a
        href="https://discord.gg/5gAJ8mBh"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.navItem}
      >
        <FaShieldAlt className={styles.icon} />
        Privacy Policy
      </a>

      <a
        onClick={() => handleNavigate("/terms")}
        className={`${styles.navItem} ${location.pathname === "/terms" ? styles.active : ""}`}
      >
        <FaFileContract className={styles.icon} />
        Terms of Service
      </a>
    </div>
  );
}
