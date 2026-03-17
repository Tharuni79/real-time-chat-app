import React, { useEffect, useRef, useState } from "react";
import API from "./api";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [chatUser, setChatUser] = useState(localStorage.getItem("username") || "");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchMessages();
    }

    socket.on("receive_message", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [token]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await API.get("/messages");
      setMessages(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const register = async () => {
    try {
      await API.post("/register", { username, password });
      alert("Registered successfully");
    } catch (err) {
      alert("Register failed");
    }
  };

  const login = async () => {
    try {
      const res = await API.post("/login", { username, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", username);

      setToken(res.data.token);
      setChatUser(username);

      alert("Login successful");
    } catch (err) {
      alert("Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    setToken("");
    setChatUser("");
    setMessages([]);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send_message", {
      username: chatUser,
      text: message,
    });

    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // 🔐 Login UI
  if (!token) {
    return (
      <div className="page">
        <div className="auth-card">
          <h1 className="app-title">Chat App</h1>
          <p className="subtitle">Login or create an account</p>

          <input
            className="chat-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="chat-input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="button-row">
            <button className="primary-btn" onClick={register}>
              Register
            </button>
            <button className="secondary-btn" onClick={login}>
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 💬 Chat UI
  return (
    <div className="page">
      <div className="chat-card">
        <div className="chat-header">
          <div>
            <h1 className="chat-title">Real-Time Chat</h1>
            <p className="chat-subtitle">Welcome, {chatUser}</p>
          </div>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="messages-box">
          {messages.length === 0 ? (
            <p className="empty-text">No messages yet</p>
          ) : (
            messages.map((msg, index) => {
              const isOwn = msg.username === chatUser;

              return (
                <div
                  key={index}
                  className={`message-row ${isOwn ? "own" : "other"}`}
                >
                  <div
                    className={`message-bubble ${
                      isOwn ? "own-bubble" : "other-bubble"
                    }`}
                  >
                    <div className="message-user">{msg.username}</div>
                    <div className="message-text">{msg.text}</div>
                    <div className="message-time">
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString()
                        : ""}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef}></div>
        </div>

        <div className="message-input-row">
          <input
            className="message-input"
            placeholder="Type message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="send-btn" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;