const express = require("express");
const router = express.Router()
const zod = require("zod");
const jwt =require("jsonwebtoken")
const JWT_SECRET = require("../config");
const { Student, Classroom, Teacher } = require("../db");
const studentmiddleware = require("../middlewares/studentmiddleware");


const signinSchema = zod.object({
    email:zod.string().email(),
    password:zod.string()
})


router.post("/signin",async(req,res)=>{

    const {email,password} = req.body;
    const resp = signinSchema.safeParse(req.body);
    if(!resp){
        return res.status(400).json({mssg:"Invalid inputs"});
    }
    const student = await Student.findOne({email:email,password:password})
    if(!student){
        return res.status(404).json({mssg:"student not found"});
    }

    const studentId = student._id;
    const token1 = jwt.sign({studentId}, JWT_SECRET);

    console.log(studentId);
    return res.status(201).json({ message: "Student logged in successfully", token: token1 });


})


router.get("/myclass",studentmiddleware,async(req,res)=>{
    const student = await Student.findOne({_id:req.studentId})
    if(!student){
        return res.status(404).json({mssg:"Student authorization problem"});
    }

    const teacher = await Teacher.findOne({_id:student.teacherId})
    const classroom = await Classroom.findOne({_id:teacher.classroomId})
    if(!(teacher || classroom)){
        return res.status(400).json({mssg:"Error fetching classroom"})

    }

    const Students = await Student.find({teacherId:teacher._id})

    res.status(200).json({
        classroomName:classroom.name,
        start_time:classroom.start_time,
        end_time:classroom.end_time,
        Teacher:{email:teacher.email,name:teacher.name},Students:Students.map(student=>(
       {email: student.email,
       name: student.name}
    ))})
})


module.exports = router