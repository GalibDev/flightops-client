import {Schema,model,models} from "mongoose";
const PaymentSchema=new Schema({transactionId:{type:String,required:true,unique:true},providerPaymentId:String,booking:{type:Schema.Types.ObjectId,ref:"Booking"},bookingNumber:{type:String,required:true},customerEmail:{type:String,required:true},amount:{type:Number,required:true},method:{type:String,enum:["card","bank","cash","mobile"],default:"card"},status:{type:String,enum:["pending","paid","refunded","failed"],default:"pending"}},{timestamps:true});
export const PaymentModel=models.Payment||model("Payment",PaymentSchema);
