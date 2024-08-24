const express = require("express");
const router = express.Router()
const zod = require("zod");
const { Teacher, Student, Classroom } = require("../db");
const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config");
const teachermiddleware = require("../middlewares/teachermiddleware");


const signinSchema = zod.object({
    email:zod.string().email(),
    password:zod.string()
})


router.post("/signin",async(req,res)=>{
    const {email,password} = req.body;
    const resp = signinSchema.safeParse(req.body);
    if(!resp){
        return res.status(400).json({mssg:"Invalid inputs"})
    }

    const teacher = await Teacher.findOne({email:email,password:password})
    if(!teacher){
        return res.status(404).json({mssg:"User doesn't exist"})
    }

    const teacherId = teacher._id;
    const token1 = jwt.sign({teacherId}, JWT_SECRET);

    console.log(teacherId);
    return res.status(201).json({ message: "Teacher logged in successfully", token: token1 });
})



router.get("/getstudents",teachermiddleware,async(req,res)=>{
    const students = await Student.find({teacherId:req.teacherId})
    res.status(200).json({students:students});
})


const studentSchema=zod.object({
    email:zod.string().email(),
    password:zod.string(),
    name:zod.string(),
})

router.post("/createstudent",teachermiddleware,async(req,res)=>{
    const {email, name,password} = req.body;
    const resp = studentSchema.safeParse(req.body);
    if(!resp.success){
        return res.status(401).json({mssg:"Invalid inputs"})

    }
    const exist = await Student.findOne({email:email})
    if(exist){
        return res.status(400).json({mssg:"Student already exists"})
    }


    const teacherId = req.teacherId;

    const student = await Student.create({
        email:email,
        password:password,
        name:name,
        teacherId:teacherId
    })

    if(!student){
        return res.status(500).json({mssg:"Could not create student account"})
    }


    return res.status(200).json({mssg:`student account created`})
})

const deletestudentschema=zod.object({
    email:zod.string().email(),
})


router.delete("/deletestudent",teachermiddleware,async(req,res)=>{
    const resp = deletestudentschema.safeParse(req.body)
    if(!resp){
        return res.status(400).json({mssg:"Invalid Inputs"})
    }

    const {email} = req.body;

    const student = await Student.findOne({email:email})
    if(!student){
        return res.status(404).json({mssg:"Student doesnt exist"})
    }
    await Student.deleteOne({email:email});

    return res.status(200).json({mssg:"Student deleted successfully"})
    
})



router.get("/myclass",teachermiddleware,async(req,res)=>{
    const teacher = await Teacher.findOne({_id:req.teacherId})
    if(!teacher){
        return res.status(404).json({mssg:"teacher authorization problem"});
    }


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

const updateStudentSchema = zod.object({
    currentEmail: zod.string().email(),
    newEmail: zod.string().email().optional(),
    name: zod.string().optional(),
});

router.put("/updatestudent", teachermiddleware, async (req, res) => {
    const { currentEmail, newEmail, name } = req.body;
    const resp = updateStudentSchema.safeParse(req.body);

    if (!resp.success) {
        return res.status(400).json({ mssg: "Invalid inputs" });
    }

    const student = await Student.findOne({ email: currentEmail });

    if (!student) {
        return res.status(404).json({ mssg: "Student doesn't exist" });
    }

    // Update the student's email and name if provided
    if (newEmail) student.email = newEmail;
    if (name) student.name = name;

    await student.save();

    return res.status(200).json({ mssg: "Student details updated successfully" });
});



module.exports = router