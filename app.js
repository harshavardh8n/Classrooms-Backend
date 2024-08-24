const express = require("express")
const app = express();
const mainRouter = require("./router/mainrouter")
const cors = require("cors")


app.use(cors());

app.use(express.json())

app.use("/api",mainRouter)

app.get("/",(req,res)=>{
    res.send("Works")
})

const PORT = process.env.PORT || 8000

app.listen(PORT,()=>{
    console.log(`Server runnig on ${PORT}`);
})