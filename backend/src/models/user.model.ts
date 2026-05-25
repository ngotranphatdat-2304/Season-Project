import mongoose, { Document, Schema, Types } from "mongoose";
import {
  comparePassword,
  hashPassword,
} from "../utils/hash-password.js";

export type UserRole = "admin" | "customer";
export type UserStatus = "active" | "banned";

const USER_ROLES: UserRole[] = ["admin", "customer"];
const USER_STATUSES: UserStatus[] = ["active", "banned"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_MAX_PASSWORD_BYTES = 72;

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phone?: string;
  avatar?: string;
  addresses: IUserAddress[];
  isActive: boolean;
  status: UserStatus;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

export interface IUserAddress {
  _id?: Types.ObjectId;
  label?: string;
  address: string;
  isDefault: boolean;
}

const UserAddressSchema = new Schema<IUserAddress>({
  label: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
      validate: {
        validator(value: string): boolean {
          return Buffer.byteLength(value, "utf8") <= BCRYPT_MAX_PASSWORD_BYTES;
        },
        message: `Password must be at most ${BCRYPT_MAX_PASSWORD_BYTES} UTF-8 bytes`,
      },
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "customer",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    addresses: {
      type: [UserAddressSchema],
      default: (): IUserAddress[] => [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: "active",
    },
  },
  { timestamps: true },
);

UserSchema.pre("save", async function () {
  if (this.isModified("password") === false) {
    return;
  }

  this.password = await hashPassword(this.password);
});

UserSchema.methods.matchPassword = async function (
  enteredPassword: string,
): Promise<boolean> {
  return comparePassword(enteredPassword, this.password);
};

UserSchema.methods.toJSON = function () {
  const user = this.toObject() as Record<string, unknown>;
  delete user.password;
  return user;
};

export const User = mongoose.model<IUser>("User", UserSchema);
