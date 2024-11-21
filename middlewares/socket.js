const jwt = require("jsonwebtoken");

const socketAuthentication = (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            throw new Error("Authentication error: token is required");
        }
        const user = jwt.verify(token, "mox");

        if (!user._id || !user.username || !user.email) {
            throw new Error("Invalid user payload");
        }

        socket.user = user;
        next();
    } catch (error) {
        console.error("Socket authentication error:", error);
        const err = error instanceof Error ? error : new Error("Authentication failed");
        next(err);
    }
};

module.exports = socketAuthentication;
