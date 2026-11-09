import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const app = express();
app.use(cors());
app.use(express.json());

const enquirySchema = new mongoose.Schema({
  name: { type:String, required:true, trim:true }, phone:{ type:String, required:true, trim:true }, email:{ type:String, required:true, trim:true, lowercase:true }, service:{ type:String, required:true }, property:{ type:String }, location:{ type:String, required:true }, area:{ type:Number }, budget:{ type:String }, date:{ type:String }, requirements:{ type:String }, status:{ type:String, enum:['New','Contacted','Consultation booked','In progress','Completed'], default:'New' }
}, { timestamps:true });
const Enquiry = mongoose.models.Enquiry || mongoose.model('Enquiry', enquirySchema);
const enquiryInput = z.object({ name:z.string().trim().min(2).max(100), phone:z.string().trim().min(10).max(18), email:z.string().email().max(200), service:z.string().min(2).max(100), property:z.string().max(50).optional(), location:z.string().trim().min(2).max(150), area:z.union([z.string(),z.number()]).optional(), budget:z.string().max(80).optional(), date:z.string().max(20).optional(), requirements:z.string().max(3000).optional() });
const requireAdmin = (req,res,next) => { try { const token = req.headers.authorization?.replace(/^Bearer\s+/i,''); if (!token) return res.status(401).json({error:'Sign in required'}); req.admin = jwt.verify(token,process.env.JWT_SECRET); next(); } catch { return res.status(401).json({error:'Invalid or expired session'}); } };

app.post('/api/enquiries', async (req,res) => {
  const parsed = enquiryInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({error:'Please check the enquiry details',details:parsed.error.flatten()});
  try { const item = await Enquiry.create({...parsed.data, area:parsed.data.area ? Number(parsed.data.area) : undefined}); res.status(201).json({enquiry:{_id:item._id,status:item.status}}); }
  catch (err) { res.status(503).json({error:'Enquiries are temporarily unavailable'}); }
});

app.post('/api/admin/login', async (req,res) => {
  const {email,password} = req.body || {};
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH || !process.env.JWT_SECRET) return res.status(503).json({error:'Admin login is not configured'});
  const match = email === process.env.ADMIN_EMAIL && await bcrypt.compare(password || '',process.env.ADMIN_PASSWORD_HASH);
  if (!match) return res.status(401).json({error:'Incorrect email or password'});
  res.json({token:jwt.sign({email,role:'admin'},process.env.JWT_SECRET,{expiresIn:'8h'})});
});
app.get('/api/enquiries', requireAdmin, async (_req,res) => { try { res.json({enquiries:await Enquiry.find().sort({createdAt:-1}).limit(1000).lean()}); } catch { res.status(503).json({error:'Enquiries are temporarily unavailable'}); } });
app.patch('/api/enquiries/:id', requireAdmin, async (req,res) => { const status = z.enum(['New','Contacted','Consultation booked','In progress','Completed']).safeParse(req.body?.status); if (!status.success) return res.status(400).json({error:'Unknown enquiry status'}); try { const item=await Enquiry.findByIdAndUpdate(req.params.id,{status:status.data},{new:true}).lean(); if(!item)return res.status(404).json({error:'Enquiry not found'}); res.json({enquiry:item}); } catch { res.status(400).json({error:'Could not update the enquiry'}); } });

const port = Number(process.env.PORT || 4000);
if (process.env.MONGODB_URI) mongoose.connect(process.env.MONGODB_URI).then(()=>console.log('Mr Care database connected')).catch(err=>console.error('MongoDB connection failed:',err.message));
app.listen(port,()=>console.log(`Mr Care API listening on ${port}`));

