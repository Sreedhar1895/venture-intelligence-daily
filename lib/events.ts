export interface VentureEvent {
  id: string;
  title: string;
  city: string;
  date: string;
  url: string;
  registration_url: string | null;
  source: string;
}

/** Events come from ingest only; no test data. Add events table + ingest when you have a source. */
export function getEventsByCity(_city?: string): VentureEvent[] {
  return [];
}
