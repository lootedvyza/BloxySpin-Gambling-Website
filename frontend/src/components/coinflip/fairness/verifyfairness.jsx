import React, { useState } from "react";
import ViewStyles from "./veryfairness.module.css";
import toast from "react-hot-toast";
import sha256 from "crypto-js/sha256";
import { useModal } from "../../../utils/ModalContext";

export default function VeryFairness() {
  const [randomSeed, setRandomSeed] = useState("");
  const [serverSeedHash, setServerSeedHash] = useState("");
  const [starterValue, setStarterValue] = useState("");
  const [joinerValue, setJoinerValue] = useState("");
  const [result, setResult] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const { setModalState } = useModal();

  const normalizeNumber = (value) => {
    return parseFloat(value.replace(/,/g, ""));
  };

  const validateFairness = async () => {
    if (!randomSeed || !serverSeedHash || !starterValue || !joinerValue) {
      toast.error("Some fields are missing!");
      return;
    }

    try {
      const normalizedResult = await getResult(serverSeedHash, randomSeed);
      const { side } = getSide(normalizedResult, starterValue, joinerValue);
      setResult({ normalizedResult, side });
    } catch (error) {
      toast.error("Error calculating hash");
      console.error(error);
    }
  };

  const getResult = async (serverSeedHash, randomSeed) => {
    const mod = `${serverSeedHash}-${randomSeed}`;

    if (window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(mod);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const decimalResult = parseInt(hashHex.substring(0, 8), 16);
      const maxValue = Math.pow(16, 8);
      return decimalResult / maxValue;
    } else {
      const hashHex = sha256(mod).toString();
      const decimalResult = parseInt(hashHex.substring(0, 8), 16);
      const maxValue = Math.pow(16, 8);
      return decimalResult / maxValue;
    }
  };

  const getSide = (normalizedResult, starterValue, joinerValue) => {
    const totalValue =
      normalizeNumber(starterValue) + normalizeNumber(joinerValue);
    const starterChance = normalizeNumber(starterValue) / totalValue;
    return {
      side: normalizedResult < starterChance ? "heads" : "tails",
    };
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setModalState(null);
    }, 200);
  };

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
        <button
          className={ViewStyles.closeButton}
          onClick={() => closeModal(false)}
        >
          &times;
        </button>
        <h1 className={ViewStyles.header}>Coinflip Fairness</h1>
        <p></p>
        <div className={ViewStyles.section}>
          <span className={ViewStyles.sectionTitle}>Random Seed</span>
          <div className={ViewStyles.inputHolder}>
            <input
              type="text"
              value={randomSeed}
              onChange={(e) => setRandomSeed(e.target.value)}
              className={ViewStyles.valueText}
            />
          </div>
        </div>

        <div className={ViewStyles.section}>
          <span className={ViewStyles.sectionTitle}>Server Seed Hash</span>
          <div className={ViewStyles.inputHolder}>
            <input
              type="text"
              value={serverSeedHash}
              onChange={(e) => setServerSeedHash(e.target.value)}
              className={ViewStyles.valueText}
            />
          </div>
        </div>

        <div className={ViewStyles.inputGroup}>
          <div className={ViewStyles.section}>
            <span className={ViewStyles.sectionTitle}>Starter Value</span>
            <div className={ViewStyles.inputHolder}>
              <input
                type="text"
                value={starterValue}
                onChange={(e) => setStarterValue(e.target.value)}
                className={ViewStyles.valueText}
              />
            </div>
          </div>

          <div className={ViewStyles.section}>
            <span className={ViewStyles.sectionTitle}>Joiner Value</span>
            <div className={ViewStyles.inputHolder}>
              <input
                type="text"
                value={joinerValue}
                onChange={(e) => setJoinerValue(e.target.value)}
                className={ViewStyles.valueText}
              />
            </div>
          </div>
        </div>

        {result && (
          <div className={ViewStyles.resultSection}>
            <div className={ViewStyles.sectionTitle}>Result:</div>
            <div className={ViewStyles.resultText}>
              Coinflip Result: {result.normalizedResult.toFixed(6)}
              <br />
              Winner Side: {result.side}
            </div>
          </div>
        )}

        <div className={ViewStyles.buttonContainer}>
          <button
            className={`${ViewStyles.button} button`}
            onClick={validateFairness}
          >
            Validate Fairness
          </button>
          <span
            className={ViewStyles.showCodeLink}
            onClick={() => setShowCode(!showCode)}
          >
            {showCode ? "Hide Code" : "Show Code"}
          </span>
        </div>

        {showCode && (
          <pre className={ViewStyles.codeBlock}>
            {`async function generateFairResult(serverSeedHash, randomSeed) {
  const inputData = new TextEncoder().encode(\`\${serverSeedHash}-\${randomSeed}\`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', inputData);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return parseInt(hashHex.slice(0, 8), 16) / Math.pow(16, 8);
}

function decideWinner(normalizedValue, starterContribution, joinerContribution) {
  return normalizedValue < starterContribution / (starterContribution + joinerContribution) 
    ? 'heads' 
    : 'tails';
}

const serverSeedHash = 'f5454f1fad54e0tefd9bb534b0a41a014f20c698815454dd2be10da8a3f5454072b';
const randomSeed = '542b97359455e14341a545456433f0154790f2e7deb';
const starterValue = 55;
const joinerValue =  23;

generateFairResult(serverSeedHash, randomSeed)
  .then(normalizedResult => {
    console.log(\`Normalized Result (0-1 Float): \${normalizedResult}\`);
    console.log(\`Winning Side: \${decideWinner(normalizedResult, starterValue, joinerValue)}\`);
  })
  .catch(console.error);
`}
          </pre>
        )}
      </div>
    </div>
  );
}
