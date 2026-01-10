import express from "express"
import cors from "cors"
const app = express()

//middlewares basic cofiguration
app.use(express.json({limit: "60kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))

//cors configurations
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials:true,
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders:["Content-Type", "Authorization"],
}))


//import the routes
import healthRouter from "./routes/heathcheck.routes.js";

app.use("/api", healthRouter);


app.get("/", (req,res) =>{
    res.send("welcome to basecamp")
})

export default app;