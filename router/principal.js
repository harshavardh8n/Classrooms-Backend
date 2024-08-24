const express = require("express");
const router = express.Router()
const zod = require("zod");
const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config");
const { Principal, Classroom, Teacher, Student } = require("../db");
const principalmiddleware = require("../middlewares/principalmiddleware");

router.get("/add",principalmiddleware,(req,res)=>{
    res.send("working");
})

const signupSchema = zod.object({
    email:zod.string().email(),
    password:zod.string(),
    name:zod.string(),
})

router.post("/signup",async(req,res)=>{
    try {
        const { email, password, name } = req.body;

        // Validate input using zod schema
        const { success } = signupSchema.safeParse(req.body);
        if (!success) {
            return res.status(400).json({ message: "Invalid inputs" });
        }

        // Check if the user already exists
        const existing = await Principal.findOne({ email: email });
        if (existing) {
            return res.status(409).json({ message: "User already exists" });
        }

        // Hash the password before saving
        // Create the new principal
        const principal = await Principal.create({
            email: email,
            password: password,
            name: name
        });

        // Generate a JWT token
        const principalId = principal._id;
        const token1 = jwt.sign({principalId}, JWT_SECRET);

        console.log(principalId);
        res.status(201).json({ message: "Principal created successfully", token: token1 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred during signup" });
    }
});

const signinSchema = zod.object({
    email:zod.string().email(),
    password:zod.string()
})

router.post("/signin",async(req,res)=>{
    const {username,password} = req.body;
    const resp = signinSchema.safeParse(req.body)

    if(!resp.success){
        return res.status(202).json({mssg:"Invalid inputs"})
    }
    const principal = await Principal.findOne({username:username,password:password})
    if(!principal){
        return res.status(201).json({mssg:"User not found"})
    }
    const principalId = principal._id;
    const token1 = jwt.sign({principalId}, JWT_SECRET);

    console.log(principalId);
    res.status(200).json({ message: "Principal logged in successfully", token: token1 });
})


const classroomschema = zod.object({
    name: zod.string(),
    start_time: zod.string(),
    end_time: zod.string(),
    days: zod.string()  // Update days to be a string
});

router.post("/createclassroom", principalmiddleware, async (req, res) => {
    const resp = classroomschema.safeParse(req.body);
    if (!resp.success) {
        return res.status(400).json({ mssg: "Invalid inputs" });
    }

    const { name, start_time, end_time, days } = req.body;

    // Convert the 'days' string into an array of space-separated words
    const daysArray = days.split(" ");

    const existing = await Classroom.findOne({ name: name });
    if (existing) {
        return res.status(400).json({ mssg: "Classroom already exists" });
    }

    await Classroom.create({ name, start_time, end_time, days: daysArray });

    return res.status(200).json({ mssg: "Classroom created successfully" });
});


const teacherSchema=zod.object({
    email:zod.string().email(),
    password:zod.string(),
    name:zod.string(),
    ClassroomName:zod.string()
})

router.get("/getclassrooms", principalmiddleware, async (req, res) => {
    try {
        const classrooms = await Classroom.find({});

        if (!classrooms || classrooms.length === 0) {
            return res.status(404).json({ mssg: "No classrooms found" });
        }

        const classroomsWithTeachers = await Promise.all(
            classrooms.map(async (classroom) => {
                const teacher = await Teacher.findOne({ classroomId: classroom._id });

                return {
                    classroomName: classroom.name,
                    start_time: classroom.start_time,
                    end_time: classroom.end_time,
                    days:classroom.days,
                    teacher: teacher ? teacher.name: "Empty",
                };
            })
        );

        return res.status(200).json({ classrooms: classroomsWithTeachers });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mssg: "An error occurred while fetching classrooms" });
    }
});



router.post("/createteacher",principalmiddleware,async(req,res)=>{
    const resp = teacherSchema.safeParse(req.body);
    const {email,password,name,ClassroomName} = req.body;
    if(!resp.success){
        return res.status(400).json({msssg:"Invalid inputs"})
    }

    const exists  = await Teacher.findOne({email:email})
    if(exists){
        return res.status(402).json({mssg:"User already exists"})
    }

    const classroom = await Classroom.findOne({name:ClassroomName})
    if(!classroom){
        return res.status(401).json({mssg:"Classroom doesn't exist"})
    }

    const taken = await Teacher.findOne({classroomId:classroom._id})
    if(taken){
        return res.status(400).json({mssg:"classroom already assigned to a Teacher"})
    }

    const teacher  = await Teacher.create({
        email:email,
        password:password,
        name:name,
        classroomId:classroom._id
    })
    console.log(teacher);

    res.status(200).json({mssg:"Teacher has been created"})

})


const studentSchema=zod.object({
    email:zod.string().email(),
    password:zod.string(),
    name:zod.string(),
    teacheremail:zod.string().email(),
})




router.post("/createstudent",principalmiddleware,async(req,res)=>{
    const {email, name,password,teacheremail} = req.body;
    const resp = studentSchema.safeParse(req.body);
    if(!resp.success){
        return res.status(401).json({mssg:"Invalid inputs"})

    }
    const exist = await Student.findOne({email:email})
    if(exist){
        return res.status(400).json({mssg:"Student already exists"})
    }

    const teacher = await Teacher.findOne({email:teacheremail})
    if(!teacher){
        return res.status(400).json({mssg:"Teacher not found"})
    }

    const teacherId = teacher._id;

    const student = await Student.create({
        email:email,
        password:password,
        name:name,
        teacherId:teacherId
    })

    if(!student){
        return res.status(500).json({mssg:"Could not create student account"})
    }


    return res.status(200).json({mssg:`student account created and assigned ${teacher.name} teacher`})
})


router.get("/classroom/:name",principalmiddleware,async(req,res)=>{
    // try {
        const classroomName = req.params.name;
        console.log("working 1")
        const classroom = await Classroom.findOne({name:classroomName})
        if(!classroom){
            return res.status(404).json({mssg:"No such classroom found"})
        }
        console.log("working 1")
        const teacher = await Teacher.findOne({classroomId:classroom._id})
        if(!teacher){
            return res.status(400).json({mssg:"No Teacher assigned to this classroom"})
        }
        console.log("working 1")

        const Students = await Student.find({teacherId:teacher._id})

        console.log(Students)

        res.status(200).json({
            classroomName:classroomName,
            start_time:classroom.start_time,
            end_time:classroom.end_time,
            days:classroom.days,
            Teacher:{email:teacher.email,name:teacher.name},Students:Students.map(student=>(
           {email: student.email,
           name: student.name}
        ))})
        
    // } catch (error) {
    //     res.status(500).json({mssg:"some error occurred"})
    // }
})


const updateStudentSchema = zod.object({
    currentEmail: zod.string().email(),
    newEmail: zod.string().email().optional(),
    name: zod.string().optional(),
});

router.put("/updatestudent", principalmiddleware, async (req, res) => {
    const { currentEmail, newEmail, name } = req.body;
    const resp = updateStudentSchema.safeParse(req.body);

    if (!resp.success) {
        return res.status(400).json({ mssg: "Invalid inputs" });
    }

    const student = await Student.findOne({ email: currentEmail });

    if (!student) {
        return res.status(404).json({ mssg: "Student doesn't exist" });
    }

    if (newEmail) student.email = newEmail;
    if (name) student.name = name;

    await student.save();

    return res.status(200).json({ mssg: "Student details updated successfully" });
});



router.delete("/deletestudent", principalmiddleware, async (req, res) => {
    const { email } = req.body;

    const student = await Student.findOneAndDelete({ email });

    if (!student) {
        return res.status(404).json({ mssg: "Student doesn't exist" });
    }

    return res.status(200).json({ mssg: "Student deleted successfully" });
});


const updateTeacherSchema = zod.object({
    currentEmail: zod.string().email(),
    newEmail: zod.string().email().optional(),
    name: zod.string().optional(),
    classroomName: zod.string().optional(),
});


router.put("/updateteacher", principalmiddleware, async (req, res) => {
    const { currentEmail, newEmail, name, classroomName } = req.body;
    const resp = updateTeacherSchema.safeParse(req.body);

    if (!resp.success) {
        return res.status(400).json({ mssg: "Invalid inputs" });
    }

    const teacher = await Teacher.findOne({ email: currentEmail });

    if (!teacher) {
        return res.status(404).json({ mssg: "Teacher doesn't exist" });
    }

    if (newEmail) teacher.email = newEmail;
    if (name) teacher.name = name;

    if (classroomName) {
        const classroom = await Classroom.findOne({ name: classroomName });
        if (!classroom) {
            return res.status(404).json({ mssg: "Classroom doesn't exist" });
        }
        teacher.classroomId = classroom._id;
    }

    await teacher.save();

    return res.status(200).json({ mssg: "Teacher details updated successfully" });
});


router.delete("/deleteteacher", principalmiddleware, async (req, res) => {
    const { email } = req.body;

    // Find the teacher by email
    const teacher = await Teacher.findOne({ email });

    if (!teacher) {
        return res.status(404).json({ mssg: "Teacher doesn't exist" });
    }

    // Delete all students associated with the teacher
    await Student.deleteMany({ teacherId: teacher._id });

    // Delete the teacher
    await Teacher.findOneAndDelete({ email });

    return res.status(200).json({ mssg: "Teacher and associated students deleted successfully" });
});







module.exports = router