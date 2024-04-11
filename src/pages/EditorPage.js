import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
import spinner from "../spinner.svg";
import { initSocket } from "../socket";
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";
import Axios from "axios";




const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();
  const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(false);

   // State variable to set users input
   const [userInput, setUserInput] = useState("");

   // State variable to set users output
   const [userOutput, setUserOutput] = useState("");

   const [userLang, setUserLang] = useState("python");



  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      // Listening for joined event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room.`);
            console.log(`${username} joined`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      // Listening for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };
    init();
    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
    };
  }, []);

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard");
    } catch (err) {
      toast.error("Could not copy the Room ID");
      console.error(err);
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }

  // Function to clear the output screen
  function clearOutput() {
    setUserOutput("");
  }


  // Function to call the compile endpoint
  function compile() {

    setLoading(true);
    if (codeRef === ``) {
      return;
    }

    console.log(codeRef)

    // Post request to compile endpoint
    Axios.post(`http://localhost:4000/compile`, {
      code: codeRef.current,
      language: userLang,
      input: userInput,
    })
      .then((res) => {
        console.log(res.data.output)
        setUserOutput(res.data.output);
      })
      .then(() => {
        setLoading(false);
      });
  }





  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
        <div className="logo" style={{ width: '100%', height: 'auto' }}>
  <img className="logoImage" src="/code-collab-hub.png" alt="logo" style={{ maxWidth: '100%', maxHeight: '100%' }} />
</div>
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        <button className="btn copyBtn" onClick={copyRoomId}>
          Copy ROOM ID
        </button>
        <button className="btn leaveBtn" onClick={leaveRoom}>
          Leave
        </button>
      </div>
      <div className="editorWrap">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => {
            codeRef.current = code;
          }}
        />
        {/* <button className="run-btn" onClick={() => {console.log(codeRef)}}>Run</button> */}
      </div>


      <div className="right-container">
          <div className="input-wrapper">
          <h4 style= {{color: "white"}}>Input:</h4>
<div className="input-box" style={{ width: '100%', height: '200px' }}>
  <textarea
    id="code-inp"
    onChange={(e) => setUserInput(e.target.value)}
    style={{ width: '100%', height: '100%', boxSizing: 'border-box', backgroundColor: "#d4cdcd"}}
  ></textarea>
</div>
          </div>

          <div className="output-wrapper">
            <h4 style= {{color: "white"}}>Output:</h4>
            {loading ? (
              <div className="spinner-box">
                <img src={spinner} alt="Loading..." />
              </div>
            ) : (
              <div className="output-box">
                <pre>{userOutput}</pre>
                <button
                  onClick={() => {
                    compile();
                  }}
                  className="clear-btn"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>


    </div>
  );
};

export default EditorPage;
