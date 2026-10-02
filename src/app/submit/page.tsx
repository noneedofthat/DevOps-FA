"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/context/EventContext';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LockKeyhole, UploadCloud, Link as LinkIcon, Server, GitBranch, FileText, CheckSquare, Palette, PenTool } from 'lucide-react';
import Link from 'next/link';

// Zod Schema (made generic to support multiple track types)
const submissionSchema = z.object({
  eventId: z.string().min(1, 'Please select an event to submit for'),
  title: z.string().min(5, 'Project title must be at least 5 characters').max(50, 'Title is too long'),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .regex(/^[\x00-\x7F]*$/, 'Emojis and special characters are strictly prohibited'),
  
  // DevOps fields
  repoUrl: z.string().optional(),
  liveAppUrl: z.string().optional(),
  
  // UI/UX fields
  figmaUrl: z.string().optional(),
  
  // Generic checklists
  checklist1: z.boolean().optional(),
  checklist2: z.boolean().optional(),
  checklist3: z.boolean().optional(),
});

type SubmissionSchemaType = z.infer<typeof submissionSchema>;

export default function SubmissionGatewayPage() {
  const { user } = useAuth();
  const { events } = useEvents();
  const [file, setFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [registeredEvents, setRegisteredEvents] = useState<{id: string, title: string}[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<SubmissionSchemaType>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      checklist1: false,
      checklist2: false,
      checklist3: false
    }
  });

  const selectedEventId = watch('eventId');
  const c1 = watch('checklist1');
  const c2 = watch('checklist2');
  const c3 = watch('checklist3');
  const allChecked = c1 && c2 && c3;

  // Determine the track type based on the selected event
  const selectedEventObj = events.find(e => e.id === selectedEventId);
  const isUiUx = selectedEventObj?.category?.toLowerCase().includes('ui/ux') || selectedEventObj?.title?.toLowerCase().includes('ui/ux');

  // Fetch the events this user is registered for
  useEffect(() => {
    if (!db || !user) {
      setLoadingRegistrations(false);
      return;
    }
    const q = query(collection(db, "registrations"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.data().eventId,
        title: doc.data().eventTitle
      }));
      setRegisteredEvents(fetchedEvents);
      setLoadingRegistrations(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Reset file and checkboxes when event changes
  useEffect(() => {
    setFile(null);
    setValue('checklist1', false);
    setValue('checklist2', false);
    setValue('checklist3', false);
  }, [selectedEventId, setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: SubmissionSchemaType) => {
    setUploadMessage(null);
    
    // Manual validation based on track
    if (!isUiUx && (!data.repoUrl || !data.liveAppUrl)) {
      setUploadMessage({ type: 'error', text: 'DevOps track requires Repository and Live App URLs.' });
      return;
    }
    if (isUiUx && !data.figmaUrl) {
      setUploadMessage({ type: 'error', text: 'UI/UX track requires a Figma Prototype URL.' });
      return;
    }
    if (!file) {
      setUploadMessage({ type: 'error', text: isUiUx ? 'You must upload High-Fidelity Mockups (PDF/PNG).' : 'You must upload a Workflow Diagram (PDF/PNG).' });
      return;
    }

    try {
      if (!db) throw new Error("Firebase not initialized");

      // 1. Upload File to Local Backend
      let uploadedAssetUrl = null;
      if (file) {
        const fileData = new FormData();
        fileData.append('asset', file);
        
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/upload`, {
          method: 'POST',
          body: fileData
        });
        
        if (!uploadRes.ok) throw new Error('File upload failed');
        const uploadData = await uploadRes.json();
        uploadedAssetUrl = uploadData.file.url;
      }

      // 2. Submit form data to Firestore
      const eventTitle = registeredEvents.find(e => e.id === data.eventId)?.title || "Unknown Event";

      await addDoc(collection(db, "submissions"), {
        title: data.title,
        description: data.description,
        repoUrl: data.repoUrl || null,
        liveAppUrl: data.liveAppUrl || null,
        figmaUrl: data.figmaUrl || null,
        eventTitle, 
        category: isUiUx ? 'UI/UX' : 'DevOps',
        submittedBy: user?.uid || "Anonymous User",
        hasAsset: !!file,
        assetUrl: uploadedAssetUrl,
        status: 'Pending',
        timestamp: serverTimestamp()
      });
      
      setUploadMessage({ type: 'success', text: 'Submission successful and locked in the database!' });
      reset();
      setFile(null);
    } catch (error) {
      console.error(error);
      setUploadMessage({ type: 'error', text: 'Error during submission. Please try again.' });
    }
  };

  if (!loadingRegistrations && registeredEvents.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
        <LockKeyhole className="mx-auto text-amber-300 w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Required</h2>
        <p className="text-slate-500 mb-8 text-sm">You must register for an active hackathon event before you can submit a project.</p>
        <Link href="/">
          <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition shadow-md">
            Browse Upcoming Events
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Project Submission Gateway</h2>
        <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto">Select your event track to load the specific assessment criteria and securely lock in your deployment for faculty grading.</p>
        {!user && <p className="text-amber-600 text-xs font-bold bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-200">Authentication Required</p>}
      </div>

      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-200 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${isUiUx ? 'from-pink-500 to-amber-500' : 'from-blue-600 to-indigo-600'}`}></div>
        
        <form className="space-y-10" onSubmit={handleSubmit(onSubmit)}>
          
          {/* General Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className={isUiUx ? "text-pink-500" : "text-blue-500"} /> Core Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Select Event Track</label>
                <select 
                  {...register('eventId')}
                  className={`w-full border-2 rounded-xl p-3 focus:ring-4 outline-none bg-slate-50 transition-all ${errors.eventId ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'}`}
                >
                  <option value="">-- Choose Registered Track --</option>
                  {registeredEvents.map(event => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                  ))}
                </select>
                {errors.eventId && <p className="text-red-500 text-xs mt-1 font-bold">{errors.eventId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Project Title</label>
                <input 
                  type="text" 
                  {...register('title')}
                  className={`w-full border-2 rounded-xl p-3 focus:ring-4 outline-none bg-slate-50 transition-all ${errors.title ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'}`}
                  placeholder={isUiUx ? "e.g. Modern E-Commerce Redesign" : "e.g. Scalable K8s Infrastructure"}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1 font-bold">{errors.title.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Technical Description</label>
              <textarea 
                {...register('description')}
                className={`w-full border-2 rounded-xl p-3 h-32 focus:ring-4 outline-none bg-slate-50 transition-all resize-none ${errors.description ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'}`}
                placeholder={isUiUx ? "Detail your design system, accessibility compliance, and user flows..." : "Detail your architecture, Ansible playbooks used, and Docker configurations..."}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1 font-bold">{errors.description.message}</p>}
            </div>
          </div>

          {/* Conditional Endpoints based on Track */}
          {selectedEventId && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <LinkIcon className={isUiUx ? "text-amber-500" : "text-indigo-500"} /> Assessment Endpoints
              </h3>
              
              {isUiUx ? (
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <PenTool size={16} /> Figma Prototype URL
                    </label>
                    <p className="text-xs text-slate-500 mb-2">Must be a public link with 'Anyone with the link can view' enabled.</p>
                    <input 
                      type="text" 
                      {...register('figmaUrl')}
                      className="w-full border-2 rounded-xl p-3 focus:ring-4 outline-none bg-slate-50 transition-all border-slate-200 focus:border-amber-500 focus:ring-amber-100"
                      placeholder="https://www.figma.com/proto/..."
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <GitBranch size={16} /> Source Code Repository
                    </label>
                    <p className="text-xs text-slate-500 mb-2">Must contain .tf files, deploy.yml, and Dockerfile.</p>
                    <input 
                      type="text" 
                      {...register('repoUrl')}
                      className="w-full border-2 rounded-xl p-3 focus:ring-4 outline-none bg-slate-50 transition-all border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Server size={16} /> Live Application URL
                    </label>
                    <p className="text-xs text-slate-500 mb-2">Public IP of your running AWS EC2 instance.</p>
                    <input 
                      type="text" 
                      {...register('liveAppUrl')}
                      className="w-full border-2 rounded-xl p-3 focus:ring-4 outline-none bg-slate-50 transition-all border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                      placeholder="http://3.14.159.26:8080"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conditional Asset Uploader */}
          {selectedEventId && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <UploadCloud className="text-cyan-500" /> Mandatory Assets
              </h3>
              
              <div className={`group border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center bg-slate-50 transition-all relative overflow-hidden ${isUiUx ? 'hover:bg-amber-50 hover:border-amber-400' : 'hover:bg-blue-50 hover:border-blue-400'}`}>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <UploadCloud className={`mx-auto w-12 h-12 text-slate-400 mb-4 transition-colors ${isUiUx ? 'group-hover:text-amber-500' : 'group-hover:text-blue-500'}`} />
                <div className="text-slate-700 mb-2 font-bold text-lg">
                  {file ? <span className="text-green-600 font-bold flex items-center justify-center gap-2"><CheckSquare size={18}/> {file.name}</span> : (isUiUx ? 'Upload High-Fidelity Mockups' : 'Upload Workflow Diagram')}
                </div>
                <div className="text-sm text-slate-500">Drag & Drop or click to browse (PDF, PNG, JPG)</div>
              </div>
            </div>
          )}

          {/* Conditional Final Review Panel */}
          {selectedEventId && (
            <div className={`p-6 rounded-2xl border ${isUiUx ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CheckSquare className="text-emerald-500"/> Pre-Submission Checklist</h4>
              <div className="space-y-3">
                {isUiUx ? (
                  <>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" {...register('checklist1')} className="mt-1 w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500" />
                      <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900">Figma prototype is public and interactive flows are properly linked.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" {...register('checklist2')} className="mt-1 w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500" />
                      <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900">Design system and component library is documented in the description.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" {...register('checklist3')} className="mt-1 w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500" />
                      <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900">High-fidelity mockups (PDF/PNG) are attached for faculty review.</span>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" {...register('checklist1')} className="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                      <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900">AWS EC2 instance is currently running and accessible via the Live Application URL.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" {...register('checklist2')} className="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                      <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900">GitHub repository is public and contains Terraform scripts, Ansible playbooks, and Dockerfiles.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" {...register('checklist3')} className="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                      <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900">Workflow diagram is attached and correctly maps the CI/CD deployment process.</span>
                    </label>
                  </>
                )}
              </div>
            </div>
          )}

          {uploadMessage && (
            <div className={`p-4 rounded-xl text-sm font-bold border ${uploadMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
              {uploadMessage.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting || !allChecked}
            className={`w-full text-white font-black py-4 rounded-xl transition-all shadow-lg text-lg flex items-center justify-center gap-2 ${
              isSubmitting ? 'bg-slate-400 cursor-wait' : 
              !allChecked ? 'bg-slate-300 cursor-not-allowed' : (isUiUx ? 'bg-amber-500 hover:bg-amber-600 hover:shadow-amber-500/25' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25')
            } hover:-translate-y-0.5`}
          >
            {isSubmitting ? 'Processing Submission...' : 'Confirm & Lock Submission'}
          </button>
        </form>
      </div>
    </div>
  );
}
