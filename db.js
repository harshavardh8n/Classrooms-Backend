const mongoose = require("mongoose");
require("dotenv").config()


mongoose.connect(process.env.MONGO_URL)

const studentSchema = mongoose.Schema({
    email: String,
    password: String,
    name: String,
    teacherId:{type:mongoose.Schema.Types.ObjectId,ref:'Teacher'}

})

const teacherSchema = mongoose.Schema({
    email: String,
    password: String,
    name: String,
    classroomId: {type:mongoose.Schema.Types.ObjectId,ref:'Classroom'},

})

const principalSchema = mongoose.Schema({
    email: String,
    password: String,
    name: String,
    clasrooms:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Classroom'
    }],
    teachers:[{type:mongoose.Schema.Types.ObjectId,
        ref:'Teacher'}],
    students:[{type:mongoose.Schema.Types.ObjectId,
        ref:'Student'}]
})

const classroomSchema = mongoose.Schema({
    name:String,
    start_time:String,
    end_time:String,
    days:{
        type:[String]
    }

})

const Student = mongoose.model("Student",studentSchema);
const Teacher = mongoose.model("Teacher",teacherSchema);
const Principal = mongoose.model("Principal",principalSchema);
const Classroom = mongoose.model("Classroom",classroomSchema)


module.exports = {Student,Teacher,Principal,Classroom}