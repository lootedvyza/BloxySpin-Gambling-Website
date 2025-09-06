import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { useModal } from "../../utils/ModalContext";
import UserContext from "../../utils/user.js";
import CoinflipStyles from "./coinfliplayout.module.css";
import CreateMatch from "./Create/createcoinflip.jsx";
import SocketContext from "../../utils/socket.js";
import View from "./View/view.jsx";
import toast from "react-hot-toast";
import LoginModal from "../popup/login.jsx";
import { api, alert } from "../../config.js";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import History from "./history/history";
import { CoinflipRow } from "./CoinflipRow";
import { WalletIcon } from "@/assets/icons/WalletIcon";
import { formatLargeNumber } from "@/utils/value";
import { Link } from "react-router-dom";

export default function Coinflip() {
  const { setModalState } = useModal();
  const [coinflips, setCoinflips] = useState([]);
  const [selectedFlip, setSelectedFlip] = useState(null);
  const { userData } = useContext(UserContext);
  const socket = useContext(SocketContext);
  const [sortCriteria, setSortCriteria] = useState("high");
  const [gameFilter, setGameFilter] = useState("all");

  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns((prev) => {
        const newCountdowns = {};
        Object.entries(prev).forEach(([flipId, count]) => {
          if (count > 1) {
            newCountdowns[flipId] = count - 1;
          }
        });
        return newCountdowns;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchFlips();
  }, [sortCriteria, gameFilter]);

  const totalGames = coinflips.length;

  /** @type {number} */
  const totalItems = useMemo(
    () =>
      coinflips.reduce(
        (sum, flip) =>
          sum +
          flip.PlayerOne.items.length +
          (flip.PlayerTwo?.items?.length ?? 0),
        0,
      ),
    [coinflips],
  );

  /** @type {number} */
  const totalValue = useMemo(
    () =>
      coinflips.reduce((sum, flip) => sum + (flip.requirements.static || 0), 0),
    [coinflips],
  );

  const sortCoinflips = useCallback(
    (flips) => {
      return flips.sort((a, b) =>
        sortCriteria === "high"
          ? (b.requirements.static || 0) - (a.requirements.static || 0)
          : (a.requirements.static || 0) - (b.requirements.static || 0),
      );
    },
    [sortCriteria],
  );

  const fetchFlips = useCallback(async () => {
    try {
      const response = await fetch(`${api}/coinflips/flips`);
      if (!response.ok) throw new Error("Failed to fetch coinflips");
      const data = await response.json();
      const filteredCoinflips = data.data.filter(
        (flip) => gameFilter === "all" || flip.game === gameFilter,
      );
      setCoinflips(sortCoinflips(filteredCoinflips));
    } catch {
      toast.error(`error w/ fetching flips :sob:`);
    }
  }, [gameFilter, sortCoinflips]);

  useEffect(() => {
    socket.on("NEW_COINFLIP", (newCoinflip) => {
      setCoinflips((prev) => {
        const updatedFlips = [newCoinflip, ...prev];
        return sortCoinflips(updatedFlips);
      });
    });

    socket.on("COINFLIP_UPDATE", (updatedFlip) => {
      setCoinflips((prev) => {
        const existingFlip = prev.find((f) => f._id === updatedFlip._id);

        if (updatedFlip.winnercoin && !existingFlip?.winnercoin) {
          setCountdowns((prev) => ({ ...prev, [updatedFlip._id]: 3 }));
        }

        if (selectedFlip?._id === updatedFlip._id) {
          setSelectedFlip(updatedFlip);
          setModalState(
            <View
              coinflip={updatedFlip}
              onClose={() => setSelectedFlip(null)}
            />,
          );
        }

        const updatedFlips = prev.map((flip) =>
          flip._id === updatedFlip._id ? updatedFlip : flip,
        );
        return sortCoinflips(updatedFlips);
      });
    });

    socket.on("COINFLIP_CANCEL", (data) => {
      setCoinflips((prev) => {
        const updatedFlips = prev.filter((flip) => flip._id !== data._id);
        return sortCoinflips(updatedFlips);
      });
      setCountdowns((prev) => {
        const newCountdowns = { ...prev };
        delete newCountdowns[data._id];
        return newCountdowns;
      });
    });

    return () => {
      socket.off("NEW_COINFLIP");
      socket.off("COINFLIP_UPDATE");
      socket.off("COINFLIP_CANCEL");
    };
  }, [socket, sortCoinflips, selectedFlip]);

  return (
    <div className="box-border p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[repeat(3,calc((100%-2*0.5rem)/3))]">
        <StatCard title="Rooms" value={totalGames.toLocaleString()} />
        <StatCard
          title="Value"
          value={
            <>
              <WalletIcon className="w-5 text-[#0276FF]" />{" "}
              {formatLargeNumber(totalValue)}
            </>
          }
        />
        <StatCard title="Items" value={totalItems.toLocaleString()} />
      </div>

      <div className="my-2.5 flex items-center gap-2.5">
        <div className="mr-auto flex gap-2.5">
          <button
            onClick={() => {
              setModalState(null);
              setTimeout(() => {
                setModalState(
                  userData ? (
                    <CreateMatch
                      onCreate={(flip) => setSelectedFlip(flip)}
                      onClose={() => setSelectedFlip(null)}
                    />
                  ) : (
                    <LoginModal />
                  ),
                );
              });
            }}
            className="min-w-24 cursor-pointer rounded-lg border-none bg-[#0276FF] p-2.5 text-center text-base font-semibold text-black transition-colors hover:bg-[#076BDE] active:bg-[#0276FF] disabled:cursor-not-allowed disabled:opacity-80"
          >
            Create
          </button>
          <button
            className="min-w-24 cursor-pointer rounded-lg border-none bg-[#2A2E44] p-2.5 text-center text-base font-semibold text-white transition-colors hover:opacity-80 active:opacity-100"
            onClick={() => {
              setSelectedFlip(null);
              setModalState(userData ? <History /> : <LoginModal />);
            }}
          >
            History
          </button>
        </div>

        <div className="hidden sm:contents">
          <Select
            onValueChange={(value) => setSortCriteria(value)}
            value={sortCriteria}
          >
            <SelectTrigger className={CoinflipStyles.selector}>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent
            className="bg-[#1C1F2D] border border-solid border-[#252839] rounded-lg p-1  hover:text-white mt-1"
            >
              <SelectItem
                className={`${CoinflipStyles.selectItem} ${sortCriteria === "high" ? CoinflipStyles.selected : ""}`}
                value="high"
              >
                Highest to Lowest
              </SelectItem>
              <SelectItem
                className={`${CoinflipStyles.selectItem} ${sortCriteria === "low" ? CoinflipStyles.selected : ""}`}
                value="low"
              >
                Lowest to Highest
              </SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={setGameFilter} value={gameFilter}>
            <SelectTrigger className={CoinflipStyles.selector}>
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent
            className="bg-[#1C1F2D] border border-solid border-[#252839] rounded-lg p-1  hover:text-white mt-1"
            >
              <SelectItem
                className={`${CoinflipStyles.selectItem} ${gameFilter === "all" ? CoinflipStyles.selected : ""}`}
                value="all"
              >
                All Games
              </SelectItem>
              <SelectItem
                className={`${CoinflipStyles.selectItem} ${gameFilter === "MM2" ? CoinflipStyles.selected : ""}`}
                value="MM2"
              >
                MM2
              </SelectItem>
              <SelectItem
                className={`${CoinflipStyles.selectItem} ${gameFilter === "PS99" ? CoinflipStyles.selected : ""}`}
                value="PS99"
              >
                PS99
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {coinflips.map((flip) => (
          <CoinflipRow
            key={flip._id}
            countdowns={countdowns}
            flip={flip}
            userData={userData}
            setSelectedFlip={setSelectedFlip}
          />
        ))}
      </div>
    </div>
  );
}



/** @type {import("react").FC<{value: import("react").ReactNode, title: string}>} */
const StatCard = ({ title, value }) => {
  return (
    <div className="rounded-md border border-solid border-[#252839] px-3 pb-3 pt-2 text-sm font-bold text-[#6B7280]">
      <strong className="flex items-center gap-1 text-xl text-white">
        {value}
      </strong>
      <p>{title}</p>
    </div>
  );
};
