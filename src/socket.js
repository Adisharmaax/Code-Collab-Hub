import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempt: 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
    };

    // Assuming you have set a REACT_APP_BACKEND_URL environment variable
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000'; // Default to port 4000 if REACT_APP_BACKEND_URL is not set

    return io(backendUrl, options);
};
