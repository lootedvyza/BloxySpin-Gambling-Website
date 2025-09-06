import { formatLargeNumber } from "@/utils/value";
import Profile from "../popup/profile";
import CoinflipStyles from "./coinfliplayout.module.css";
import { useModal } from "@/utils/ModalContext";
import LoginModal from "../popup/login";
import JoinMatch from "./Join/joincoinflip";
import View from "./View/view";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trails, Heads } from "../../assets/exports.jsx";
import { WalletIcon } from "@/assets/icons/WalletIcon";
import QuestionMarkIcon from "@/assets/images/question-mark.svg";
import { useCallback } from "react";
import { memo } from "react";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} CoinflipRowProps
 * @property {unknown} flip
 * @property {object} countdowns
 * @property {unknown} setSelectedFlip
 * @property {unknown} userData
 */

/** @type {import("react").FC<CoinflipRowProps>} */
export const CoinflipRow = ({
  countdowns,
  flip,
  setSelectedFlip,
  userData,
}) => {
  const { setModalState } = useModal();

  const handleViewFlip = useCallback(() => {
    setTimeout(() => {
      setSelectedFlip(flip);
      setModalState(
        <View coinflip={flip} onClose={() => setSelectedFlip(null)} />,
      );
    }, 0);
  }, [flip]);

  return (
    <div className="grid grid-cols-1 items-center gap-2 rounded-lg border border-solid border-[#252839] bg-[#1C1F2E] py-3 pl-6 pr-2.5 xl:grid-cols-[repeat(5,auto)] [&>*]:min-w-0">
      <div className="flex items-center gap-3 justify-self-center xl:justify-self-start">
        <Player
          imgUrl={flip.PlayerOne.thumbnail}
          userid={flip.PlayerOne.id}
          choice={flip.PlayerOne.coin}
          status={
            flip.PlayerTwo && !countdowns[flip._id]
              ? flip.winner === flip.PlayerOne.id
                ? "winner"
                : "loser"
              : "pending"
          }
        />

        <strong className="text-lg font-bold text-[#B0B8C1]">VS</strong>

        <Player
          imgUrl={flip.PlayerTwo?.thumbnail ?? QuestionMarkIcon}
          choice={flip.PlayerOne.coin === "heads" ? "tails" : "heads"}
          userid={flip.PlayerTwo?.id}
          status={
            flip.PlayerTwo && !countdowns[flip._id]
              ? flip.winner === flip.PlayerTwo.id
                ? "winner"
                : "loser"
              : "pending"
          }
        />
      </div>

      <ItemsCell
        itemsA={flip.PlayerOne.items}
        itemsB={flip.PlayerTwo?.items ?? []}
      />

      <ValueCell
        value={flip.requirements.static}
        min={flip.requirements.min}
        max={flip.requirements.max}
      />

      <CoinCountDown
        countdown={countdowns[flip._id]}
        winner={flip.winnercoin}
        max={3}
      />

      <div className="flex justify-center gap-2 justify-self-center xl:ml-auto xl:flex-col xl:justify-self-end">
        {flip.active && (
          <button
            onClick={() => {
              if (userData) {
                setModalState(
                  <JoinMatch
                    coinflip={flip}
                    onJoin={setSelectedFlip}
                    onClose={() => setSelectedFlip(null)}
                  />,
                );
              } else {
                setModalState(<LoginModal />);
              }
            }}
            disabled={!!flip.PlayerTwo || userData?.userid === flip.creatorid}
            className="min-w-24 cursor-pointer rounded-lg border-none bg-[#0276FF] py-1.5 text-center text-base font-semibold text-black transition-colors hover:bg-[#076BDE] active:bg-[#0276FF] disabled:cursor-not-allowed disabled:opacity-80"
          >
            Join
          </button>
        )}
        <button
          onClick={handleViewFlip}
          className="min-w-24 cursor-pointer rounded-lg border-none bg-[#2A2E44] py-1.5 text-center text-base font-semibold text-white transition-colors hover:opacity-80 active:opacity-100"
          type="button"
        >
          View
        </button>
      </div>
    </div>
  );
};

/** @type {import("react").FC<{value: string, min:string, max: string}>} */
const ValueCell = ({ max, min, value }) => {
  return (
    <div className="w-32 place-self-center text-center font-bold">
      <p className="inline-flex items-center gap-2 text-[1.375rem] leading-normal text-white">
        <WalletIcon className="w-5 text-[#0276FF]" />
        <span>{formatLargeNumber(value)}</span>
      </p>

      <p className="text-sm leading-normal text-[#CCC]">{`${formatLargeNumber(min)} - ${formatLargeNumber(max)}`}</p>
    </div>
  );
};

/** @type {import("react").FC<{choice: "heads" | "tails", status: "winner" | "loser" | "pending", imgUrl: string, userid?: string }>} */
const Player = ({ choice, imgUrl, status, userid }) => {
  const { setModalState } = useModal();

  return (
    <div
      className={cn(
        "relative box-border h-14 w-14 flex-[0_0_auto] rounded-full border border-solid border-[#2F3347] bg-[#1A1D2B] transition-colors",
        status === "winner" && "border-2 border-[#0276FF]",
        status === "loser" && "opacity-60",
      )}
    >
      <button
        className={`block h-full w-full overflow-hidden rounded-[inherit] border-none bg-transparent ${userid ? "cursor-pointer" : "cursor-help"}`}
        onClick={() => userid && setModalState(<Profile userid={userid} />)}
      >
        <img
          loading="lazy"
          height={56}
          width={56}
          alt=""
          src={imgUrl}
          className="box-border block w-full object-contain"
        />
      </button>

      <div
        className="absolute right-0 top-0 box-border h-7 w-7 overflow-hidden rounded-full"
        style={{ transform: "translate(25%, -25%)" }}
      >
        <img
          loading="lazy"
          className="block w-full object-contain"
          alt={choice}
          src={choice === "heads" ? Heads : Trails}
        />
      </div>
    </div>
  );
};

/**
 * This is a bit complicated, for "column" alignment in wide screens, this needs to be of a fixed width,
 * but in mobile screens, it is centered, so it can't be of fixed width.
 * @type {import("react").FC<{itemsA: unknown[], itemsB: unknown[]}>} */
const ItemsCell = memo(({ itemsA, itemsB }) => {
  const max = 5;
  const totalCount = itemsA.length + itemsB.length;
  const sorted = [...itemsA, ...itemsB]
    .sort((a, b) => b.itemvalue - a.itemvalue)
    .slice(0, max);

  const shiftPercent = 35.7;

  return (
    <div className="flex justify-self-center xl:grid xl:grid-cols-5 xl:justify-self-start">
      <TooltipProvider delayDuration={0}>
        {sorted.map((item, index) => (
          <Tooltip key={item._id}>
            <TooltipTrigger
              style={{ "--shift": `translate(${index * shiftPercent * -1}%)` }}
              className="relative box-border block h-14 w-14 flex-[0_0_auto] cursor-pointer overflow-hidden rounded-full border-2 border-solid border-[#2F3347] bg-[#1A1D2B] transition-colors hover:border-[#0276FF] xl:[transform:var(--shift)] max-xl:[&+*]:-ml-5"
            >
              <img
                src={item.itemimage}
                alt={item.itemname?.slice(0, 1)}
                className="block h-full w-full max-w-full object-contain"
              />
              {index === max - 1 && totalCount > max && (
                <div
                  style={{
                    backdropFilter: "blur(1px)",
                    background: "rgba(23,25,37,0.8)",
                  }}
                  className="pointer-events-none absolute left-0 top-0 z-[1] box-border grid h-full w-full select-none place-items-center text-white"
                >
                  +{totalCount - max}
                </div>
              )}
            </TooltipTrigger>
            {(index < max - 1 || (index === max - 1 && totalCount <= max)) && (
              <TooltipContent className="rounded-[5px] border border-solid border-[#252839] bg-[#171925] px-3">
                <p className="text-white">{item.itemname || "Unknown Item"}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
});

/**
 * @param {Object} props
 * @param {number} [props.countdown]
 * @param {"heads" | "tails"} [props.winner]
 */
const CoinCountDown = ({ countdown, winner }) => {
  const width = `xl:w-16 ${typeof countdown !== "number" && !winner ? "w-0" : "w-16"}`;

  return (
    <svg
      className={`${width} justify-self-center`}
      viewBox="-50 -50 100 100"
      fill="none"
    >
      {typeof countdown === "number" ? (
        <g>
          <circle
            r="49"
            fill="#171925"
            strokeWidth="2"
            stroke="#0276FF"
            pathLength="100"
            strokeDasharray="100"
            transform="rotate(-90)"
            className={CoinflipStyles.countdown}
          />

          <text
            style={{ fontFamily: "Poppins" }}
            className="text-2xl font-bold leading-none"
            fill="white"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {countdown}
          </text>
        </g>
      ) : winner ? (
        <image
          x="-50"
          y="-50"
          width="100"
          height="100"
          href={winner === "heads" ? Heads : Trails}
          className={CoinflipStyles["winner-coin"]}
        />
      ) : null}
    </svg>
  );
};
