import React, { useState, useContext } from "react";
import loginstyles from "./login.module.css";
import toast from "react-hot-toast";
import { useModal } from "../../utils/ModalContext";
import UserContext from "../../utils/user.js";
import { api } from "../../config.js";
import { Checkbox } from "@/components/ui/checkbox";
import { FiCopy } from "react-icons/fi";

export default function LoginModal({ navigate }) {
  const [username, setUsername] = useState("");
  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState("");
  const { userData, setUserData } = useContext(UserContext);
  const { setModalState } = useModal();
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [agree, setAgree] = useState(false);

  const handleUsernameInput = (e) => setUsername(e.target.value);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => setModalState(null), 200);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!agree) {
      toast.error("You must agree to the terms!");
      return;
    }

    if (step === 1) {
      if (userData) {
        toast.error("You are already logged in!");
        return;
      }
      if (!username || username.length <= 2) {
        toast.error(!username ? "Enter a username!" : "Username is too short!");
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${api}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const data = await response.json();
        if (data.code) {
          setCode(data.code);
          setPhase(data.phase);
          setStep(2);
        } else {
          toast.error("Something went wrong!");
        }
      } catch {
        toast.error("Something went wrong.");
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      setLoading(true);
      try {
        const response = await fetch(`${api}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, code }),
        });
        const data = await response.json();
        if (data.hash) {
          localStorage.setItem("bloxyspin", data.hash);
          const userResponse = await fetch(`${api}/me`, {
            method: "POST",
            headers: { Authorization: `Bearer ${data.hash}` },
          });
          const userData = await userResponse.json();
          if (userData.data) {
            setUserData(userData.data);
            toast.success("Logged in successfully!");
            closeModal();
          } else {
            toast.error("Something went wrong!");
          }
        } else {
          toast.error(data.message || "Unknown error during login.");
        }
      } catch {
        toast.error("Network error or server is unreachable.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={loginstyles.blurbg} onClick={closeModal}>
      <div
        className={`${loginstyles.modalbackgroundlogin} ${
          isClosing ? loginstyles.shrinkOut : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={loginstyles.closeButton} onClick={closeModal}>
          &times;
        </button>

        <h2 className={loginstyles.title}>Welcome to BloxySpin</h2>
        <p className={loginstyles.disclaimer}>
          By logging in, you acknowledge that you are at least 18 years of age,
          that any items you wager are not stolen, and that you agree to our
          Terms of Use.
        </p>

        <form onSubmit={handleLogin} className={loginstyles.form}>
          {step === 1 ? (
            <div className={loginstyles.inputGroup}>
              <label className={loginstyles.label}>Roblox Username</label>
              <div className={loginstyles.inputHolder}>
                <input
                  type="text"
                  placeholder="Enter your roblox username..."
                  value={username}
                  onChange={handleUsernameInput}
                />
              </div>
            </div>
          ) : (
            <div className={loginstyles.inputGroup}>
              <label className={loginstyles.label}>
                Put the phase in your roblox bio
              </label>
              <div className={loginstyles.inputHolder}>
                <input type="text" value={phase} disabled={true} />
                <FiCopy
                  className={loginstyles.copyIcon}
                  onClick={() => {
                    navigator.clipboard.writeText(phase);
                    toast.success("successfuly copid the phase!");
                  }}
                />
              </div>
            </div>
          )}

          <label className={loginstyles.checkboxLabel}>
            <Checkbox
              checked={agree}
              onCheckedChange={(checked) => setAgree(checked)}
              className={loginstyles.checkbox}
            />
            <span className={loginstyles.checkboxText}>
              By checking this box you agree to our{" "}
              <a
                className={loginstyles.tostext}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/terms");
                }}
              >
                terms and service
              </a>
            </span>
          </label>

          <button
            type="submit"
            className={`button ${loginstyles.loginbtn}`}
            disabled={loading}
          >
            {loading && (
              <div className={loginstyles.loaderWrapperSmall}>
                <div className={loginstyles.loaderSmall}></div>
              </div>
            )}
            {step === 1 ? "Login" : "Finish"}
          </button>
        </form>
      </div>
    </div>
  );
}
