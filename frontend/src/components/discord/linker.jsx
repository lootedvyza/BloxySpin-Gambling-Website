// last updated in like 1999
import { useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useModal } from "../../utils/ModalContext.jsx";
import { api } from "../../config.js";
import { getauth } from "../../utils/getauth.js";
import toast from "react-hot-toast";
import UserContext from "../../utils/user.js";

export default function LinkDiscord() {
  const location = useLocation();
  const { setModalState, setLoading } = useModal();
  const { userData, setUserData } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const linkDiscord = async () => {
      setLoading(true);
      const params = new URLSearchParams(location.search);

      try {
        const response = await fetch(`${api}/me/discord`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getauth()}`,
          },
          body: JSON.stringify({
            code: params.get("code"),
          }),
        });

        const data = await response.json();
        if (response.ok) {
          toast.success("Successfully linked your discord!");
          userData.discordusername = data.username;
          userData.discordid = data.id;
        } else {
          toast.error(data.message || "Could not link your discord!");
        }
      } catch (error) {
        toast.error("Could not link your discord!");
      } finally {
        setLoading(false);
        navigate("/profile");
      }
    };

    linkDiscord();
  }, [location, setLoading]);

  return null;
}
