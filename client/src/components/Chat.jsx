import React, { useEffect, useState , useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Users, MessageSquare } from 'lucide-react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000', { withCredentials: true });

function convertTimestampToTime(isoString) {

        const date = new Date(isoString);
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const amPm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12; // Convert 0 (midnight) or 12 (noon) to 12-hour format
        return `${hours}:${minutes} ${amPm}`;
    }
    

const Chat = () => {
    const [userId, setUserId] = useState(null);
    const [activeChat, setActiveChat] = useState(null);
    const [activeTab, setActiveTab] = useState("direct");
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [activeRoom, setActiveRoom] = useState(null);
    const [chatRooms, setChatRooms] = useState([]);
    const [directMessages, setDirectMessages] = useState([]);
    const [receiverID, setReceiverID] = useState(null);
    const [currentChatroomId, setCurrentChatroomId] = useState(null);
    const [currentUsername, setCurrentUsername] = useState('');

    const scrollRef = useRef(null); // Ref for the scrollable container

    useEffect(() => {
        const scrollToBottom = () => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
        };

        scrollToBottom();
        // Set up a short delay to ensure scrolling after render
        const timeoutId = setTimeout(scrollToBottom, 100);

        return () => clearTimeout(timeoutId);
    }, [messages, activeChat]);


    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/v1/user/getuserinfo', { withCredentials: true });
                const id = response.data.userId;
                setUserId(id);
                setCurrentUsername(response.data.username);
                socket.emit('register', id);
                toast.success("User registered with socket server successfully");
            } catch (error) {
                toast.error("Failed to fetch user information");
            }
        };

        fetchUserInfo();
    }, []);

    useEffect(() => {
        const fetchChatData = async () => {
            try {
                const chatroomsResponse = await axios.get('http://localhost:3000/api/v1/chatrooms/getUserChatrooms', { withCredentials: true });
                setChatRooms(chatroomsResponse.data.chatrooms || []);
                toast.success("Chat rooms loaded successfully");
            } catch (error) {
                toast.error("Failed to load chat rooms");
            }

            try {
                const friendsResponse = await axios.get('http://localhost:3000/api/v1/friends/getfriends', { withCredentials: true });
                setDirectMessages(friendsResponse.data.friendsList || []);
                toast.success("Friends list loaded successfully");
            } catch (error) {
                toast.error("Failed to load friends list");
            }
        };

        fetchChatData();
    }, []);

    useEffect(() => {
        socket.on("receiveRoomMessage", (data) => {
            console.log("ahskjsasnka : Received room message:", data);
            setMessages((prev) => [...prev, data]);
            console.log("Messages:", messages);
        });

        socket.on("receivePrivateMessage", (data) => {
            console.log("Received private message hadi:", data);
            setMessages((prev) => [...prev, data]);
            console.log("Messages:", messages);
        });

        socket.on("disconnect", () => {
            toast.error("Disconnected from the server");
        });

        return () => {
            socket.off("receiveRoomMessage");
            socket.off("receivePrivateMessage");
            socket.off("disconnect");
        };
    }, []);

    const handleChatClick = async (chatId, chatName, isRoom, friendId) => {
        setActiveChat(chatName);
        if(friendId){
            setReceiverID(friendId);
        }
        setCurrentChatroomId(chatId);
        setActiveRoom(chatName);
        console.log("Chat ID:", chatId);
        console.log("Chat room:", chatName);

        if (isRoom) {
            setActiveRoom(chatName);
            socket.emit("joinRoom", chatId);
        } else {
            setActiveRoom(null);
        }

        try {
            const response = await axios.get(`http://localhost:3000/api/v1/message/getFullChat/${chatId}`, { withCredentials: true });
            setMessages(response.data);
            // Scroll to the bottom after loading messages
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        } catch (error) {
            toast.error("Failed to load messages");
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
    
        // Format the timestamp to HH:mm:ss
        const now = new Date();
        const timestamp = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    
        const messageData = {
            content: newMessage,
            timestamp: timestamp, // Correctly formatted timestamp
        };
    
        console.log("Sending message:", messageData);
        
        if (activeRoom) {
            console.log("Inside active room: " ,currentChatroomId);
            socket.emit("sendRoomMessage", { room: activeRoom, message: newMessage, chatroomId: currentChatroomId, Sender_Name: currentUsername });
        } else {
            socket.emit("sendPrivateMessage", { recipientId: receiverID, message: newMessage, Sender_Name: currentUsername });
        }
    
        try {
            const response = await axios.post(`http://localhost:3000/api/v1/message/sendMessage/${currentChatroomId}`, messageData, { withCredentials: true });
            toast.success("Message sent successfully");
            console.log("Response:", response.data);
        } catch (error) {
            console.error("Error sending message:", error.response?.data || error.message);
            toast.error("Failed to save message");
        }
    
        setNewMessage("");
    };


    const handleLeaveChatRoom = async () => {
        if (!currentChatroomId) return;
    
        try {
            // Send the DELETE request to the backend
            const response = await axios.delete(`http://localhost:3000/api/v1/chatrooms/leaveChatroom/${currentChatroomId}`, { withCredentials: true });
            console.log("Successfully left the chatroom:", response.data);
    
            // Remove the chatroom from the state
            setChatRooms((prevRooms) => prevRooms.filter((room) => room.id !== currentChatroomId));
    
            // Clear the active chat and messages state
            setActiveChat(null);
            setMessages([]);
            setActiveRoom(null);
            setCurrentChatroomId(null);
    
            // Inform the user
            toast.success("You have left the chatroom successfully.");
    
            // Optionally, you can emit the event for the socket server to handle the disconnection
            socket.emit("leaveRoom", currentChatroomId);
    
        } catch (error) {
            console.error("Error leaving chatroom:", error);
            toast.error("Failed to leave the chatroom.");
        }
    };
    


    return (
        <div className="h-full bg-gradient-to-br from-white to-gray-100 text-gray-800 p-4 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 border-b-2 border-blue-500 pb-2">Chat</h2>
            <AnimatePresence>
                {!activeChat ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2 bg-blue-50 rounded-t-lg">
                                <TabsTrigger value="direct" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white py-2">Direct Messages</TabsTrigger>
                                <TabsTrigger value="rooms" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white py-2">Chat Rooms</TabsTrigger>
                            </TabsList>
                            <TabsContent value="direct">
                                <ScrollArea className="h-[calc(100vh-200px)] bg-white rounded-b-lg shadow-inner">
                                    {directMessages?.length > 0 ? (
                                        directMessages.map((chat) => (
                                            <div
                                                key={chat.id}
                                                className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-300 transition-colors duration-200"
                                                onClick={() => handleChatClick(chat.chatroom_id, chat.chatroomName, false , chat.friendId)}
                                            >
                                                <div className="flex items-center">
                                                    <MessageSquare className="mr-3 text-blue-500" />
                                                    <div className="flex-grow">
                                                        <h3 className="font-semibold text-gray-900">{chat.name}</h3>
                                                        <p className="text-sm text-gray-600">
                                                            {chat.lastSender === "-" ? "" : `${chat.lastSender}: `}
                                                            {chat.lastMessage}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center">No direct messages found.</p>
                                    )}
                                </ScrollArea>
                            </TabsContent>
                            <TabsContent value="rooms">
                                <ScrollArea className="h-[calc(100vh-200px)] bg-white rounded-b-lg shadow-inner">
                                    {chatRooms?.length > 0 ? (
                                        chatRooms.map((room) => (
                                            <div
                                                key={room.id}
                                                className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-300 transition-colors duration-200"
                                                onClick={() => handleChatClick(room.id, room.name, true)}
                                            >
                                                <div className="flex items-center">
                                                    <Users className="mr-3 text-green-500" />
                                                    <div className="flex-grow">
                                                        <h3 className="font-semibold text-gray-900">{room.name}</h3>
                                                        <p className="text-sm text-gray-600">
                                                            {room.lastSender === "-" ? "" : `${room.lastSender}: `}
                                                            {room.lastMessage}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center">No chat rooms found.</p>
                                    )}
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed inset-0 bg-gradient-to-br from-white to-gray-100 p-4 z-50"
                    >
                        <div className="flex justify-between items-center mb-4 border-b-2 border-blue-500 pb-2">
                            <h3 className="text-xl font-bold text-gray-900">{activeChat}</h3>
                            <div>
                                {activeTab === 'rooms' && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleLeaveChatRoom}
                                        className="mr-2"
                                    >
                                        Leave Room
                                    </Button>
                                )}
                                <Button variant="outline" size="icon" onClick={() => setActiveChat(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div
                            className="h-[calc(100vh-200px)] mb-4 bg-white rounded-lg shadow-inner p-4 overflow-y-auto"
                            ref={scrollRef}
                        >
                            {messages.map((message, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`mb-4 ${message.Sender_Name === currentUsername ? "text-right" : "text-left"}`}
                                >
                                    <div
                                        className={`inline-block p-3 rounded-lg ${
                                            message.Sender_Name === currentUsername
                                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                                : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800"
                                        }`}
                                    >
                                        <p className="font-semibold">{(message.Sender_Name === currentUsername)?'You':message.Sender_Name}</p>
                                        <p>{message.Content}</p>
                                        <div className="text-xs mt-1">{convertTimestampToTime(message.Timestamp)}</div>
                                    </div>
                                </motion.div>
                            ))}
                            <div style={{ float: "left", clear: "both" }} />
                        </div>
                        <div className="flex items-center">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-grow mr-2"
                            />
                            <Button onClick={sendMessage} size="icon" className="bg-slate-900 hover:bg-slate-800 text-white">
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Chat;

