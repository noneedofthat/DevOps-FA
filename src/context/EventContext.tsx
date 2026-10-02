"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type HackathonEvent = {
  id: string;
  category: string;
  title: string;
  description: string;
  dateRange: string;
};

type EventContextType = {
  events: HackathonEvent[];
  addEvent: (event: Omit<HackathonEvent, "id">) => Promise<void>;
};

const EventContext = createContext<EventContextType>({
  events: [],
  addEvent: async () => {}
});

export const EventProvider = ({ children }: { children: React.ReactNode }) => {
  const [events, setEvents] = useState<HackathonEvent[]>([]);

  // Listen to Firestore events collection
  useEffect(() => {
    if (!db) return;
    
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HackathonEvent[];
      setEvents(fetchedEvents);
    });

    return () => unsubscribe();
  }, []);

  const addEvent = async (eventData: Omit<HackathonEvent, "id">) => {
    if (!db) {
      console.error("Firestore not initialized. Ensure Firebase is configured.");
      return;
    }
    await addDoc(collection(db, "events"), eventData);
  };

  return (
    <EventContext.Provider value={{ events, addEvent }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => useContext(EventContext);
