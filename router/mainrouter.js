const express = require("express")
const router = express.Router();
const principalRouter = require("./principal")
const studentRouter = require("./student")
const teacherRouter = require("./teacher")

router.use("/principal",principalRouter)
router.use("/student",studentRouter)
router.use("/teacher",teacherRouter)

module.exports = router;