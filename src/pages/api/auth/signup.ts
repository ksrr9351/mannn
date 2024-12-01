// pages/api/auth/signup.ts
import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken'; // To generate verification tokens

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/new';
const JWT_SECRET = process.env.JWT_SECRET || '123456p';
const BASE_URL = 'http://localhost:3000'; // Adjust as needed

async function connectToDatabase() {
  if (!mongoose.connections[0].readyState) {
    await mongoose.connect(MONGO_URI);
  }
}

// Create a transporter for sending emails using Hostinger SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com', // Hostinger's SMTP server
  port: 465, // Port for secure SMTP
  secure: true, // Use TLS
  auth: {
    user: 'hello@codetechnolabs.com', // Replace with your email address
    pass: 'Singh@#6249', // Replace with your email password or app password
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    await connectToDatabase();

    const { firstName, lastName, email, password } = req.body;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create a new user with emailVerified set to false
      const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        emailVerified: false, // Add email verification field
      });

      // Save the user
      await user.save();

      // Generate a verification token
      const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });

      // Create verification link
      const verificationLink = `${BASE_URL}/verify-email?token=${verificationToken}`;

      // Send verification email
      const mailOptions = {
        from: 'hello@codetechnolabs.com', // Replace with your email address
        to: email,
        subject: 'Email Verification',
        html: `<p>Please verify your email by clicking the link below:</p><p><a href="${verificationLink}">Verify Email</a></p>`,
      };

      await transporter.sendMail(mailOptions);

      res.status(201).json({ message: 'User created successfully. Please check your email for verification.' });
    } catch (error) {
      
      console.error(error);
      res.status(500).json({ error: 'Something went wrong' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
