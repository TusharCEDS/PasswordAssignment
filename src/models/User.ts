import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  name: string;
  phone: string;
  email: string;
  password: string;
}

const userSchema = new Schema<User>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<User>("User", userSchema);
