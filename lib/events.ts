export interface VentureEvent {
  id: string;
  title: string;
  city: string;
  date: string;
  url: string;
  source: string;
}

const MOCK_EVENTS: VentureEvent[] = [
  { id: "1", title: "YC Demo Day", city: "San Francisco", date: "2025-03-15", url: "#", source: "YC" },
  { id: "2", title: "Fintech Connect", city: "New York", date: "2025-03-20", url: "#", source: "Fintech Connect" },
  { id: "3", title: "Robotics Summit", city: "Boston", date: "2025-04-01", url: "#", source: "Robotics" },
  { id: "4", title: "SaaS North", city: "San Francisco", date: "2025-04-10", url: "#", source: "SaaS" },
  { id: "5", title: "AI Investor Day", city: "Austin", date: "2025-04-15", url: "#", source: "AI" },
];

export function getEventsByCity(city?: string): VentureEvent[] {
  if (!city) return MOCK_EVENTS;
  return MOCK_EVENTS.filter((e) => e.city.toLowerCase() === city.toLowerCase());
}
