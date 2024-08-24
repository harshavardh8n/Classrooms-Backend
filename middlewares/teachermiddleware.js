const express = require("express")
const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config");
const { Teacher } = require("../db");

const teachermiddleware = async(req,res,next)=>{
    console.log("comming atleast")
    const authheader = req.headers.authorization;

    console.log(authheader);
    const decodedvalue = jwt.verify(authheader,JWT_SECRET)
    if(decodedvalue){
        req.teacherId = decodedvalue.teacherId;
        const teacher = await Teacher.findOne({_id:req.teacherId})
        console.log(req.teacherId)
        if(teacher){

            next();
        }
        else{
            return res.status(420).json({mssg:"Unauthorized user access"})
        }
    }
    else{
        console.error("error")
    }

}


module.exports = teachermiddleware