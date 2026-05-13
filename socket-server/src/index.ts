import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"


//creates express app and http server
const app = express()
const httpServer = createServer(app)


//creates server with cors->allows next.js app to conncet from diff url
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
    },
})

//health check endpoint->render knows if server is alive
app.get("/health", (req, res) => {
    res.json({ status: "ok" })
})


// io.on("connection") with the 4 events
// Handle WebSocket connections
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`)

    //user opens a board -> join that project's room
    socket.on("join:board", (data: {projectId: string}) => {
        socket.join(`project:${data.projectId}`)
        console.log(`${socket.id} joined project:${data.projectId}`)
    })

    //user moves a task -> broadcast to everyone in the same room
    socket.on("task:moved", (data: { projectId: string; taskId: string; newStatus: string }) => {
        socket.to(`project:${data.projectId}`).emit("task:moved", data)
        console.log(`Task ${data.taskId} moved to ${data.newStatus} in project ${data.projectId}`)
    })

    //user creates a task -> broadcast to everyone in the same room
    socket.on("task:created", (data: { projectId: string }) => {
        socket.to(`project:${data.projectId}`).emit("task:created", data)
        console.log(`New task created in project ${data.projectId}`)
    })

    // user disconnects -> Socket.io automatically removes them from all rooms
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`)
    })
})



const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`)
})

