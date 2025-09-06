import React, { useEffect, useRef, useState, useContext } from "react";
import Confetti from "react-confetti";
import ViewStyles from "./view.module.css";
import toast from "react-hot-toast";
import { useModal } from "../../../utils/ModalContext";
import {
  RedVideo,
  BlueVideo,
  LongLogo,
  Bobux,
  Undefinded,
  Heads,
  Trails,
  WhiteLogo,
} from "../../../assets/exports.jsx";
import { getauth } from "../../../utils/getauth.js";
import SocketContext from "../../../utils/socket.js";
import UserContext from "../../../utils/user.js";
import { api } from "../../../config.js";
import Profile from "../../popup/profile.jsx";
import Fairness from "../fairness/fairness";
import { formatLargeNumber } from "@/utils/value";

export default function View({ coinflip, onClose }) {
  const { setModalState, modalState } = useModal();
  const [showFairness, setShowFairness] = useState(false);
  const { setLoading } = useModal();
  const [updatedCoinflip, setUpdatedCoinflip] = useState(coinflip);
  const [isWinnerVisible, setIsWinnerVisible] = useState(false);
  const { userData, setUserData } = useContext(UserContext);
  const socket = useContext(SocketContext);
  const blueVideoRef = useRef(null);
  const redVideoRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [cancel, setCancel] = useState(false);

  useEffect(() => {
    if (coinflip) {
      setUpdatedCoinflip(coinflip);
    }
  }, [coinflip]);

  useEffect(() => {
    if (updatedCoinflip?.winner) {
      const timer = setTimeout(() => {
        setIsWinnerVisible(true);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [updatedCoinflip]);

  if (!updatedCoinflip) {
    toast.error("Coinflip data not found!");
    return null;
  }

  const calculateTotalValue = (items) => {
    return items?.reduce((total, item) => total + item.itemvalue, 0) || 0;
  };

  const playerOneTotal = calculateTotalValue(updatedCoinflip.PlayerOne?.items);
  const playerTwoTotal = calculateTotalValue(updatedCoinflip.PlayerTwo?.items);
  const totalValue = playerOneTotal + playerTwoTotal;
  const playerOneChance =
    totalValue === 0 ? 0 : (playerOneTotal / totalValue) * 100;
  const playerTwoChance =
    totalValue === 0 ? 0 : (playerTwoTotal / totalValue) * 100;

  const closeModal = () => {
    if (showFairness) return;
    setIsClosing(true);
    setTimeout(() => {
      setModalState(null);
      onClose();
    }, 200);
  };

  const handleCancel = async () => {
    setCancel(true);
    try {
      const response = await fetch(`${api}/coinflips/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${getauth()}`,
        },
        body: JSON.stringify({ coinflipid: coinflip._id }),
      });

      const data = await response.json();

      if (response.ok) {
        closeModal();
        setTimeout(() => {
          onClose();
        }, 500);
        toast.success("Coinflip canceled!");
      } else {
        setCancel(false);
        toast.error(data.message || "Something went wrong...");
      }
    } catch (error) {
      setCancel(false);
      toast.error("Something went wrong...");
    }
  };

  useEffect(() => {
    if (blueVideoRef.current) {
      blueVideoRef.current.load();
    }
    if (redVideoRef.current) {
      redVideoRef.current.load();
    }
  }, []);

  return (
    <div className={ViewStyles.blurbg} onClick={closeModal}>
      <div
        className={`${ViewStyles.modalbackgroundview} ${isClosing ? ViewStyles.shrinkOut : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={ViewStyles.header}>
          <img
            src={WhiteLogo}
            alt="bloxyspin logo"
            className={ViewStyles.logo}
          />
          <button className={ViewStyles.closeButton} onClick={closeModal}>
            &times;
          </button>
        </div>

        <div className={ViewStyles.players}>
          <div className={ViewStyles.player}>
            <div className={ViewStyles.avatarWrapper}>
              <img
                src={updatedCoinflip.PlayerOne?.thumbnail || ""}
                onClick={() =>
                  updatedCoinflip.PlayerOne?.id &&
                  setModalState(
                    <Profile userid={updatedCoinflip.PlayerOne?.id} />,
                  )
                }
                alt={updatedCoinflip.PlayerOne?.username || "Unknown"}
                className={`${ViewStyles.avatar} ${
                  isWinnerVisible &&
                  updatedCoinflip.winner === updatedCoinflip.PlayerOne?.id
                    ? ViewStyles.winner
                    : ""
                }`}
              />
              {updatedCoinflip.PlayerOne?.coin && (
                <div className={ViewStyles.coin}>
                  <img
                    src={
                      updatedCoinflip.PlayerOne.coin === "heads"
                        ? Heads
                        : Trails
                    }
                    alt="coin"
                  />
                </div>
              )}
            </div>
            <h3 className={ViewStyles.username}>
              {updatedCoinflip.PlayerOne?.username || "Unknown"}
            </h3>
          </div>

          <div className={ViewStyles.gameinfo}>
            {updatedCoinflip.winnercoin === "heads" ? (
              <video
                ref={blueVideoRef}
                autoPlay
                muted
                playsInline
                webkit-playsinline
                preload="auto"
              >
                <source src={BlueVideo} type="video/mp4" />
              </video>
            ) : updatedCoinflip.winnercoin === "trails" ? (
              <video
                ref={redVideoRef}
                autoPlay
                muted
                playsInline
                webkit-playsinline
                preload="auto"
              >
                <source src={RedVideo} type="video/mp4" />
              </video>
            ) : (
              <p className={ViewStyles.vs}>Vs</p>
            )}
          </div>

          <div className={ViewStyles.player}>
            {updatedCoinflip.PlayerTwo ? (
              <>
                <div className={ViewStyles.avatarWrapper}>
                  <img
                    src={updatedCoinflip.PlayerTwo?.thumbnail || Undefinded}
                    alt={updatedCoinflip.PlayerTwo?.username || "Unknown"}
                    className={`${ViewStyles.avatar} ${
                      isWinnerVisible &&
                      updatedCoinflip.winner === updatedCoinflip.PlayerTwo?.id
                        ? ViewStyles.winner
                        : ""
                    }`}
                    onClick={() =>
                      updatedCoinflip.PlayerTwo?.id &&
                      setModalState(
                        <Profile userid={updatedCoinflip.PlayerTwo?.id} />,
                      )
                    }
                  />
                  {updatedCoinflip.PlayerTwo?.coin && (
                    <div className={ViewStyles.coin}>
                      <img
                        src={
                          updatedCoinflip.PlayerTwo.coin === "trails"
                            ? Trails
                            : Heads
                        }
                        alt="Player Two Coin"
                      />
                    </div>
                  )}
                </div>
                <h3 className={ViewStyles.username}>
                  {updatedCoinflip.PlayerTwo?.username || "Waiting..."}
                </h3>
              </>
            ) : (
              <>
                <div className={ViewStyles.avatarWrapper}>
                  <div className={ViewStyles.avatar}></div>
                </div>
                <h3 className={ViewStyles.username}>Waiting...</h3>
              </>
            )}
          </div>
        </div>

        <div className={ViewStyles.gameid}>
          <div className={ViewStyles.gameidholder}>
            <svg
              className={ViewStyles.hashtag}
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 448 512"
              height="1em"
              width="1em"
            >
              <path d="M181.3 32.4c17.4 2.9 29.2 19.4 26.3 36.8L197.8 128h95.1l11.5-69.3c2.9-17.4 19.4-29.2 36.8-26.3s29.2 19.4 26.3 36.8L357.8 128H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H347.1L325.8 320H384c17.7 0 32 14.3 32 32s-14.3 32-32 32H315.1l-11.5 69.3c-2.9 17.4-19.4 29.2-36.8 26.3s-29.2-19.4-26.3-36.8l9.8-58.7H155.1l-11.5 69.3c-2.9 17.4-19.4 29.2-36.8 26.3s-29.2-19.4-26.3-36.8L90.2 384H32c-17.7 0-32-14.3-32-32s14.3-32 32-32h68.9l21.3-128H64c-17.7 0-32-14.3-32-32s14.3-32 32-32h68.9l11.5-69.3c2.9-17.4 19.4-29.2 36.8-26.3zM187.1 192L165.8 320h95.1l21.3-128H187.1z"></path>
            </svg>
            <p
              className={ViewStyles.gameidtag}
              onClick={() => setShowFairness(true)}
            >
              {updatedCoinflip._id}
            </p>
          </div>
        </div>

        <div className={ViewStyles.items}>
          <div className={ViewStyles.playerItems}>
            <div className={ViewStyles.totalValueContainer}>
              <div className={ViewStyles.item}>
                <img src={Bobux} alt="bobux" className={ViewStyles.bobux} />
                <p className={ViewStyles.pcvalue}>
                  R${playerOneTotal.toLocaleString()}
                </p>
                <p className={ViewStyles.mobilevalue}>
                  {formatLargeNumber(playerOneTotal)}
                </p>
                <p className={ViewStyles.chance}>
                  {!updatedCoinflip.PlayerTwo
                    ? "100.00%"
                    : `${playerOneChance.toFixed(2)}%`}
                </p>
              </div>
            </div>
            {updatedCoinflip.PlayerOne?.items?.map((item, index) => (
              <div className={ViewStyles.item} key={index}>
                <div className={ViewStyles.itemImageWrapper}>
                  <img
                    src={item.itemimage}
                    alt={item.name}
                    className={ViewStyles.normalItemImage}
                    loading="eager"
                  />
                  <img
                    src={item.itemimage}
                    alt={item.name}
                    className={ViewStyles.bluredimages}
                    loading="eager"
                  />
                </div>
                <div className={ViewStyles.itemDetails}>
                  <p className={ViewStyles.itemName}>{item.itemname}</p>
                  <p className={ViewStyles.itemValue}>
                    R${formatLargeNumber(item.itemvalue)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className={ViewStyles.playerItems}>
            <div className={ViewStyles.totalValueContainer}>
              <div className={ViewStyles.item}>
                <img src={Bobux} alt="bobux" className={ViewStyles.bobux} />
                <p className={ViewStyles.pcvalue}>
                  R${playerTwoTotal.toLocaleString()}
                </p>
                <p className={ViewStyles.mobilevalue}>
                  {formatLargeNumber(playerTwoTotal)}
                </p>
                <p className={ViewStyles.chance}>
                  {updatedCoinflip.PlayerTwo
                    ? `${playerTwoChance.toFixed(2)}%`
                    : "0.00%"}
                </p>
              </div>
            </div>
            {updatedCoinflip.PlayerTwo?.items?.map((item, index) => (
              <div className={ViewStyles.item} key={index}>
                <div className={ViewStyles.itemImageWrapper}>
                  <img
                    src={item.itemimage}
                    alt={item.name}
                    className={ViewStyles.normalItemImage}
                    loading="eager"
                  />
                  <img
                    src={item.itemimage}
                    alt={item.name}
                    className={ViewStyles.bluredimages}
                    loading="eager"
                  />
                </div>
                <div className={ViewStyles.itemDetails}>
                  <p className={ViewStyles.itemName}>{item.itemname}</p>
                  <p className={ViewStyles.itemValue}>
                    R${formatLargeNumber(item.itemvalue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {userData?.userid === updatedCoinflip.PlayerOne?.id &&
          !updatedCoinflip.winner && (
            <div className={ViewStyles.cancelButtonContainer}>
              <button
                className={`${ViewStyles.cancelButton} button`}
                onClick={handleCancel}
                disabled={cancel}
              >
                {cancel && (
                  <div className={ViewStyles.loaderWrapperSmall}>
                    <div className={ViewStyles.loaderSmall}></div>
                  </div>
                )}
                Cancel
              </button>
            </div>
          )}
      </div>

      {showFairness && (
        <Fairness
          coinflip={updatedCoinflip}
          onClose={() => setShowFairness(false)}
        />
      )}
    </div>
  );
}
