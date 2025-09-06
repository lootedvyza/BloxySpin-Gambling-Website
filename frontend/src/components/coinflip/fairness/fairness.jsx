import React, { useEffect, useState, useContext } from "react";
import ViewStyles from "./fairness.module.css";
import toast from "react-hot-toast";
import { FiCopy } from "react-icons/fi";

export default function Fairness({ coinflip, onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const [updatedCoinflip, setUpdatedCoinflip] = useState(coinflip);

  useEffect(() => {
    if (coinflip) {
      setUpdatedCoinflip(coinflip);
    } else {
      toast.error("Coinflip data not found!");
    }
  }, [coinflip]);

  const copyToClipboard = (label, text) => {
    if (!text) {
      toast.error("The game did not end yet");
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  if (!updatedCoinflip) return null;

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const FairnessField = ({ label, value }) => (
    <div className={ViewStyles.section}>
      <span className={ViewStyles.sectionTitle}>{label}</span>
      <div className={ViewStyles.inputHolder}>
        <span className={ViewStyles.valueText}>{value || "  "}</span>
        <FiCopy
          className={ViewStyles.copyIcon}
          onClick={() => copyToClipboard(label, value)}
          aria-label={`Copy ${label}`}
        />
      </div>
    </div>
  );

  return (
    <div
      className={ViewStyles.blurbg}
      onClick={() => closeModal()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`${ViewStyles.modalbgfair} ${isClosing ? ViewStyles.shrinkOut : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={ViewStyles.closeButton} onClick={() => closeModal()}>
          &times;
        </button>
        <h1 className={ViewStyles.header}>Coinflip Fairness</h1>

        <FairnessField label="Game ID" value={updatedCoinflip._id} />
        <FairnessField label="Random Seed" value={updatedCoinflip.randomSeed} />
        <FairnessField
          label="Hashed Server Seed"
          value={updatedCoinflip.serverSeedHash}
        />
      </div>
    </div>
  );
}
