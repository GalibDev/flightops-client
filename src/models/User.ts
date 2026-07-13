import {Schema,model,models} from "mongoose";
const UserSchema=new Schema({name:{type:String,required:true},email:{type:String,required:true,unique:true,lowercase:true},password:{type:String,required:true,select:false},role:{type:String,enum:["user","admin"],default:"user"},isBlocked:{type:Boolean,default:false}},{timestamps:true});
export const UserModel=models.User||model("User",UserSchema);
