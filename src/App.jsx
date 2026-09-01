import { useState, useEffect, useMemo } from "react";
import {
  Search, LayoutGrid, Sparkles, Wallet, Calendar, Film, ClipboardList,
  MessageCircle, X, Check, Clock, ChevronRight, BookOpen, FolderOpen, Users,
  Phone, Mail, ListChecks, StickyNote, Lock, Printer, Plus, Trash2, Package, ScrollText,
} from "lucide-react";
import { LOGO_B64 } from "./logo.js";
import { supabase } from "./supabaseClient.js";

/* ---------------------------------------------------------------------- */
/*  DESIGN TOKENS                                                          */
/*  Palette stays true to the EMIC LAB SHORTS deck (black + gold + theme   */
/*  accents). Typography now pulls from film production's own vernacular:  */
/*  Bebas Neue for title cards, IBM Plex Mono for timecodes and budgets,   */
/*  Inter for everything you actually have to read at length.             */
/* ---------------------------------------------------------------------- */
const C = {
  bg: "#0A0A0A",
  panel: "#161616",
  card: "#1C1C1C",
  cardAlt: "#222222",
  line: "#2A2A2A",
  ink: "#F5F5F1",
  sub: "#DAD8D2",
  mute: "#6E6E6C",
  gold: "#D4A017",
  silver: "#AEB2B8",
};

const FONTS = {
  display: "'Bebas Neue', sans-serif",
  body: "'Inter', 'Segoe UI', sans-serif",
  mono: "'IBM Plex Mono', 'Courier New', monospace",
};

/* ---------------------------------------------------------------------- */
/*  THE 6 THEMES, one per production slot. Groups define their own sub-   */
/*  theme, location, and (if relevant) brand partner within these.        */
/* ---------------------------------------------------------------------- */
const THEMES = [
  {
    id: "moral-dilemma",
    name: "Moral Dilemma",
    color: "#D4A017",
    prompt: "A character faces a choice where every option costs something, and has to decide in the moment, with no time to deliberate.",
  },
  {
    id: "the-wait",
    name: "The Wait",
    color: "#E67E22",
    prompt: "A character, or the audience, is suspended in anticipation: for a result, a person, a moment that may or may not come.",
  },
  {
    id: "human-connection",
    name: "Human Connection",
    color: "#2980B9",
    prompt: "How technology, distance, or an everyday object changes, or reveals, a relationship between two people.",
  },
  {
    id: "the-debt",
    name: "The Debt",
    color: "#C0392B",
    prompt: "A character owes someone something: moral, emotional, or material, and must repay it, ignore it, or confront it.",
  },
  {
    id: "uncanny-familiar",
    name: "The Uncanny Familiar",
    color: "#9B59B6",
    prompt: "Something is quietly wrong beneath an ordinary setting, never fully explained, only felt.",
  },
  {
    id: "second-chances",
    name: "Second Chances",
    color: "#27AE60",
    prompt: "A character is handed an unexpected opportunity to fix, redo, or say what they didn't say the first time.",
  },
];

const STAGES = [
  { id: "oct", label: "October", detail: "Kickoff, concept brief and groups & themes confirmed" },
  { id: "nov", label: "November", detail: "R&D" },
  { id: "dec", label: "December", detail: "R&D" },
  { id: "jan", label: "January", detail: "Statement of intent" },
  { id: "feb", label: "February", detail: "Pre-production and shoot prep" },
  { id: "mar", label: "March", detail: "Shooting" },
  { id: "apr", label: "April", detail: "Shooting + Post-production" },
  { id: "may", label: "May", detail: "Post-production and rough cut screened" },
  { id: "jun", label: "June", detail: "Final edit & mix" },
  { id: "jul", label: "July", detail: "Final screening & jury" },
];

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "pitch", label: "Pitch & Outline", icon: Sparkles },
  { key: "script", label: "Script", icon: ScrollText },
  { key: "castcrew", label: "Cast & Crew", icon: Users },
  { key: "budget", label: "Budget", icon: Wallet },
  { key: "schedule", label: "Shooting Schedule", icon: Calendar },
  { key: "shotlist", label: "Shot List", icon: Film },
  { key: "equipment", label: "Equipment & Props", icon: Package },
  { key: "callsheets", label: "Callsheets", icon: ClipboardList },
  { key: "jury", label: "Jury Prep", icon: MessageCircle },
];

/* ---------------------------------------------------------------------- */
/*  CONTACTS                                                                */
/* ---------------------------------------------------------------------- */
const CONTACTS = [
  { name: "Matt Mather", role: "Project Lead", tel: "06 08 37 44 50", emails: ["matt.mather@emicparis.com", "matt@jargonprod.com"] },
  { name: "Claire Boutron", role: "EMIC", tel: "06 29 34 00 47", emails: ["claire.boutron@emicparis.com"] },
  { name: "Bernard Sizey", role: "EMIC", tel: "06 51 60 42 54", emails: ["bernard.sizey@emicparis.com"] },
];

/* ---------------------------------------------------------------------- */
/*  STATIC REFERENCE CONTENT, condensed from the dossier                   */
/* ---------------------------------------------------------------------- */
const DOSSIER_SECTIONS = [
  {
    key: "brief",
    label: "Creative Brief",
    body: [
      ["Context", "You are commissioned to produce a fiction short film. This is not an institutional film: it's a self-contained fictional work answering a precise creative brief."],
      ["What matters", "Production takes priority over direction. Organization, rigor and technical control above all: deliver on time, without a budget overrun, on an approved funding strategy, and be ready to defend your choices before a jury of audiovisual professionals."],
      ["Expected deliverables", "Post-produced film (.mp4, H.264, 1080p min.) · Statement of intent (1 page max) · Production dossier (budget, shooting schedule, technical list) · Oral presentation before the jury (5 min + 5 min Q&A)"],
      ["What the jury evaluates", "Production control · Relevance of the narrative treatment · Technical consistency · Ability to defend your choices"],
    ],
  },
  {
    key: "specs",
    label: "Technical Specifications",
    body: [
      ["Format & length", "2 min (± 10 sec) · 16:9, 1080p minimum · Stereo, mastered at –14 LUFS · .MP4, H.264 or H.265 · credits included within the 2 minutes"],
      ["Equipment", "iPhone (native camera or Filmic Pro) · motorized gimbal and/or tripod allowed · live sound (at least 1 synchronous on-location scene) · natural light preferred (at least 1 scene)"],
      ["Required settings", "1 OUTDOOR sequence · 1 INDOOR sequence · 1 TRANSIT sequence. These apply to every group, regardless of theme."],
      ["Cast & music", "Max. 5 actors, min. 2 · royalty-free (CC) or original music with a signed rights transfer"],
      ["Budget template", "€1,000 EMIC base allocation, a starting point, not a ceiling. Groups raise additional funds, justify every expense, and return any surplus to EMIC. Financial rigor is evaluated by the jury."],
    ],
  },
  {
    key: "calendar",
    label: "Calendar",
    body: null, // rendered specially, pulls from STAGES
  },
  {
    key: "examples",
    label: "Production Examples",
    body: null, // rendered specially, pulls from EXAMPLE_PRODUCTIONS
  },
];

/* ---------------------------------------------------------------------- */
/*  PRODUCTION EXAMPLES, static reference material shown in the Brief      */
/*  These are not editable. They live under their real underlying theme.   */
/* ---------------------------------------------------------------------- */
const EXAMPLE_PRODUCTIONS = [
  {
    id: "line9",
    themeId: "moral-dilemma",
    filmTitle: "LINE 9",
    tagline: "Real-time moral dilemma on the Paris subway",
    stage: "jul",
    cast: "2 (Yasmine, 24, and Sylvie, 52)",
    shootDays: "3 days (1 scouting + 2 shooting)",
    length: "1 min 57 sec",
    budgetEmic: 1000,
    budgetRaised: 530,
    surplus: 310,
    sections: {
      members: "Inès, Nathan, Théo, Manon, David, Daphné",
      pitch:
        "Our reading of the theme \"The Ordinary Lie\" is not rooted in a lie that is spoken, but in a lie of inaction: the one we tell ourselves to justify not acting.\n\nYasmine, 24, takes the subway to her interview at EMIC. She is running late. In the train car, a woman collapses. The film lasts exactly as long as this ride. In 2 minutes, Yasmine has no time to think: she has to feel, decide, act.\n\nThe final shot: Yasmine seated, seen from behind, as the train pulls away. She stayed. The dilemma isn't what we do, but what we almost did.\n\nDramatic structure\nSETUP (0:00 to 0:28): We establish Yasmine's inner world. Sylvie seated in the background, nothing visible yet.\nINCITING INCIDENT (0:28 to 0:50): Sylvie slumps. The collapse sets in, silently.\nDILEMMA (0:50 to 1:22): Yasmine hesitates over the alarm button. The train slows.\nTURNING POINT (1:22 to 1:45): Sylvie falls. The choice no longer exists. Yasmine acts.\nOPEN RESOLUTION (1:45 to 1:57): Doors close. Fade to black.",
      budget: [
        { label: "RATP permit", amount: "0" },
        { label: "DJI Mic 2, 2-day rental", amount: "55" },
        { label: "iPhone accessories", amount: "42" },
        { label: "Actress, Yasmine", amount: "150" },
        { label: "Actress, Sylvie", amount: "100" },
        { label: "Transport + costumes", amount: "122" },
        { label: "Crew meals, 2 days", amount: "172" },
        { label: "Post-production, sound mix + color grade", amount: "400" },
        { label: "Contingency", amount: "179" },
      ],
      schedule: [
        { stageId: "oct", done: true, date: "Oct 3", note: "Kickoff, concept brief and groups confirmed" },
        { stageId: "nov", done: true, date: "Nov 20", note: "R&D and research underway" },
        { stageId: "dec", done: true, date: "Dec 14", note: "R&D and writing continued" },
        { stageId: "jan", done: true, date: "Jan 29", note: "Statement of intent submitted" },
        { stageId: "feb", done: true, date: "Feb 26", note: "Pre-production, budget and shoot plan confirmed" },
        { stageId: "mar", done: true, date: "Mar 25", note: "Shoot complete, rushes submitted" },
        { stageId: "apr", done: true, date: "Apr 10", note: "Post-production began, first assembly cut" },
        { stageId: "may", done: true, date: "May 28", note: "Rough cut presented" },
        { stageId: "jun", done: true, date: "Jun 20", note: "Final edit and mix locked" },
        { stageId: "jul", done: true, date: "Jul 2", note: "Final screening and jury presentation" },
      ],
      script:
        "LINE 9\n\nA short film, no dialogue.\n\nEXT. LINE 9 ELEVATED PLATFORM, MORNING\n\nMorning light through steel girders. Commuters cross in both directions.\n\nYASMINE, 24, backpack over one shoulder, climbs into frame from the stairwell. She checks her phone: 8:54. She quickens her pace.\n\nPLATFORM, CONTINUOUS\n\nYasmine waits at the platform edge, earbuds in, weight shifting foot to foot. Close on her phone: still 8:54.\n\nA train pulls in. Doors open.\n\nINT. SUBWAY CAR, CONTINUOUS\n\nYasmine steps aboard, scans the car, sits. Across the aisle, SYLVIE, 52, sits with her bag on her lap, eyes closed, perfectly still.\n\nThe doors close. The train pulls away.\n\nSylvie's hands rest on the bag strap, knuckles pale.\n\nYasmine's eyes drift to her phone. Music plays low in her ears.\n\nA beat. Yasmine pulls one earbud free. Something in the air has shifted. She glances over.\n\nSylvie's breathing has changed, shallow and uneven. Her bag slides from her lap to the floor. She doesn't reach for it.\n\nClose on Yasmine's phone: 8:55.\n\nYasmine's eyes flick to the alarm button beside the door. Back to Sylvie.\n\nShe half rises. Hesitates. Sits back down.\n\nThe train begins to slow for the next station.\n\nSylvie tips forward and collapses gently into the aisle.\n\nThe choice is gone. Yasmine is already on her knees, pressing the alarm button, taking Sylvie's hand.\n\nA recorded RATP announcement plays over the speakers, indifferent to what is happening below it.\n\nThe train stops. Doors open. Passengers filter in, pause, take in the scene, react in their own ways.\n\nYasmine doesn't look up. She stays exactly where she is, holding Sylvie's hand.\n\nThe doors close.\n\nFADE OUT.",
      shotlist: [
        { number: "01", location: "Ext, subway entrance", duration: "0:00 to 0:06", framing: "Wide", characters: "Yasmine", description: "Establishing shot, morning light through the girders, commuters crossing." },
        { number: "02", location: "Ext, subway entrance", duration: "0:06 to 0:12", framing: "Shoulder", characters: "Yasmine", description: "Yasmine emerges from the stairwell, checks her phone, quickens her pace." },
        { number: "03", location: "Platform", duration: "0:12 to 0:16", framing: "Insert", characters: "", description: "Close on phone screen, 8:54." },
        { number: "04", location: "Platform", duration: "0:16 to 0:22", framing: "Static", characters: "Yasmine", description: "Yasmine waits, earbuds in. Train arrives, doors open." },
        { number: "05", location: "Train car", duration: "0:22 to 0:28", framing: "Wide", characters: "Yasmine, Sylvie", description: "Yasmine boards, scans for a seat, sits across from Sylvie." },
        { number: "06", location: "Train car", duration: "0:28 to 0:34", framing: "Medium", characters: "Sylvie", description: "Sylvie sits still, bag on her lap, eyes closed." },
        { number: "07", location: "Train car", duration: "0:34 to 0:42", framing: "Insert", characters: "Sylvie", description: "Close on Sylvie's hands, knuckles pale against the bag strap." },
        { number: "08", location: "Train car", duration: "0:42 to 0:50", framing: "Close-up", characters: "Yasmine", description: "Yasmine pulls one earbud out, glances over, uncertain." },
        { number: "09", location: "Train car", duration: "0:50 to 0:58", framing: "Insert", characters: "Sylvie", description: "Sylvie's bag slides from her lap to the floor, unnoticed." },
        { number: "10", location: "Train car", duration: "0:58 to 1:06", framing: "Insert", characters: "", description: "Close on phone screen, 8:55." },
        { number: "11", location: "Train car", duration: "1:06 to 1:14", framing: "Long lens", characters: "Yasmine", description: "Yasmine half rises, hand near the alarm button." },
        { number: "12", location: "Train car", duration: "1:14 to 1:22", framing: "Long lens", characters: "Yasmine", description: "She sits back down, hesitates. The train begins to slow." },
        { number: "13", location: "Train car", duration: "1:22 to 1:31", framing: "Handheld", characters: "Yasmine, Sylvie", description: "Sylvie collapses forward into the aisle. Yasmine drops to her knees." },
        { number: "14", location: "Train car", duration: "1:31 to 1:38", framing: "Insert", characters: "", description: "Close on the alarm button, pressed. Live RATP announcement plays." },
        { number: "15", location: "Train car", duration: "1:38 to 1:45", framing: "Sylvie's POV", characters: "Yasmine", description: "Yasmine's face seen from below, steady, focused." },
        { number: "16", location: "Train car", duration: "1:45 to 1:51", framing: "Wide", characters: "Yasmine, Sylvie", description: "Doors open, passengers filter in, pause, react." },
        { number: "17", location: "Train car", duration: "1:51 to 1:57", framing: "Static wide", characters: "Yasmine, Sylvie", description: "Yasmine stays exactly where she is, holding Sylvie's hand. Doors close, fade to black." },
      ],
      callsheets: [
        {
          day: "Day 1, Scouting", location: "Line 9 elevated platform (confirm exact station with RATP contact)",
          schedule: [{ time: "07:00", who: "Director, 1st AD/producer, sound recordist" }],
          scenes: "Confirm framing for shots 01 to 04, check natural light window", notes: "",
        },
        {
          day: "Day 2, Shoot day 1 of 2", location: "",
          schedule: [
            { time: "06:00", who: "Arrival, Unit Manager" },
            { time: "07:00", who: "Arrival, tech crew and cast" },
            { time: "08:00", who: "RTS, shots 1, 2, 3" },
            { time: "11:00", who: "Set up for shots 5 to 10" },
            { time: "11:30", who: "RTS, shots 5 to 7" },
            { time: "13:00", who: "Lunch break" },
            { time: "14:00", who: "RTS, shots 8 to 10" },
            { time: "16:00", who: "Wrap cast" },
            { time: "16:30", who: "Beauty and pickup shots, wildtracks" },
          ],
          scenes: "Covering shots 01 to 10", notes: "Backup plan on file in case of RATP delay",
        },
        {
          day: "Day 3, Shoot day 2 of 2", location: "",
          schedule: [
            { time: "06:00", who: "Arrival, Unit Manager" },
            { time: "07:00", who: "Arrival, tech crew and cast" },
            { time: "08:00", who: "RTS, shots 11 to 15" },
            { time: "11:00", who: "Wrap cast" },
            { time: "11:30", who: "Beauty and pickup shots, wildtracks" },
          ],
          scenes: "Covering shots 11 to 17", notes: "",
        },
      ],
      castCrew: [
        { name: "Yasmine", role: "Actor, lead", phone: "", email: "" },
        { name: "Sylvie", role: "Actor", phone: "", email: "" },
        { name: "Inès", role: "Director", phone: "", email: "" },
        { name: "Nathan", role: "Producer", phone: "", email: "" },
        { name: "Théo", role: "1st AD", phone: "", email: "" },
        { name: "Manon", role: "Sound recordist", phone: "", email: "" },
        { name: "David", role: "Unit Manager", phone: "", email: "" },
        { name: "Daphné", role: "Cameraman", phone: "", email: "" },
      ],
      equipment: ["iPhone, native camera", "DJI Mic 2", "Gimbal", "Telephoto lens attachment", "2x Light Panels", "2x RF Mics", "1x Boom Mic", "1x Portable monitor"],
      props: ["Sylvie's bag, must slide cleanly for shot 09", "Yasmine's backpack", "Sylvie's coat"],
      jury:
        "Q The open ending: choice or lack of courage?\n→ Fully deliberate, viewers leave wondering what they would have done.\n\nQ An RATP permit in 3 weeks?\n→ Filed at M2, followed up at M3, confirmed at M5. Backup plan ready at an elevated station.\n\nQ Only 2 actors?\n→ Deliberate constraint: Yasmine's solitude had to be real.\n\nQ No dialogue, limitation or choice?\n→ Total choice, the dilemma reads on her face, with no language barrier.",
    },
  },
  {
    id: "lastcut",
    themeId: "the-wait",
    filmTitle: "THE LAST CUT",
    tagline: "Branded content with Salon ÉCLAT",
    stage: "may",
    cast: "3 (client, hairdresser, extra)",
    shootDays: "1 scouting + 1 shooting day (outside opening hours)",
    length: "2 min",
    budgetEmic: 1000,
    budgetRaised: 280,
    surplus: null,
    sections: {
      pitch:
        "Getting a location for free in exchange for usable content is exactly the economic model of independent branded content. Salon ÉCLAT agreed after a 20-minute pitch, on condition the film work on Instagram and TikTok without harming the salon's image, and that constraint shaped the entire project.\n\nTension to hold throughout: fiction wants grain, naturalism and an ambiguous ending; ÉCLAT wants a clean image, a flawless employee performance, and a resolved smile in the mirror. Compromise reached in the final shot.",
      script: "",
      budget: [],
      schedule: [
        { stageId: "oct", done: true, date: "", note: "Kickoff, concept brief and groups confirmed" },
        { stageId: "nov", done: true, date: "", note: "R&D and research underway" },
        { stageId: "dec", done: true, date: "", note: "Groups and roles confirmed" },
        { stageId: "jan", done: true, date: "", note: "Statement of intent submitted" },
        { stageId: "feb", done: true, date: "", note: "ÉCLAT partnership confirmed" },
        { stageId: "mar", done: true, date: "", note: "Shoot complete" },
        { stageId: "apr", done: true, date: "", note: "Post-production began" },
        { stageId: "may", done: false, date: "", note: "Rough cut in session review, awaiting client sign-off" },
        { stageId: "jun", done: false, date: "", note: "" },
        { stageId: "jul", done: false, date: "", note: "" },
      ],
      shotlist: [],
      callsheets: [
        {
          day: "Day 1, Shoot", location: "Salon ÉCLAT, Paris 18e",
          schedule: [{ time: "TBC", who: "Coordinate with salon owner, must be outside opening hours" }],
          scenes: "", notes: "No shots of dirty floors, smudged mirrors, or a messy salon.",
        },
      ],
      castCrew: [
        { name: "", role: "Client, talent", phone: "", email: "" },
        { name: "", role: "Hairdresser, talent", phone: "", email: "" },
        { name: "", role: "Extra", phone: "", email: "" },
      ],
      equipment: ["iPhone, native camera", "Tripod"],
      props: ["Salon smock", "Hairdressing tools, client's own"],
      jury: "",
    },
  },
];

/* ---------------------------------------------------------------------- */
/*  PRODUCTIONS, the 6 live theme slots groups fill in as they progress    */
/* ---------------------------------------------------------------------- */
function blankSections() {
  return {
    members: "", filmTitle: "", tagline: "", pitch: "", script: "",
    budget: [], schedule: blankScheduleChecklist(), shotlist: [], callsheets: [], jury: "",
    castCrew: [], equipment: [], props: [],
    stage: "oct", length: "", cast: "", shootDays: "", budgetRaised: "", surplus: "",
  };
}

const DEFAULT_PRODUCTIONS = THEMES.map((t) => ({
  id: t.id,
  themeId: t.id,
  budgetEmic: 1000,
  sections: blankSections(),
}));

/* ---------------------------------------------------------------------- */
/*  STORAGE HELPERS, backed by Supabase                                    */
/* ---------------------------------------------------------------------- */
async function loadProductionSections(id) {
  const { data, error } = await supabase.from("productions").select("sections").eq("id", id).single();
  if (error || !data) return null;
  return data.sections;
}
async function saveProductionSections(id, sections) {
  const { error } = await supabase
    .from("productions")
    .update({ sections, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}
async function loadSchoolNotes() {
  const { data, error } = await supabase.from("school_notes").select("content").eq("id", 1).single();
  if (error || !data) return null;
  return data.content;
}
async function saveSchoolNotes(content) {
  const { error } = await supabase
    .from("school_notes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", 1);
  return !error;
}
async function fetchEditPin() {
  const { data, error } = await supabase.from("app_settings").select("edit_pin").eq("id", 1).single();
  console.log("[EMIC DEBUG] fetchEditPin", { data, error });
  if (error || !data) return null;
  return data.edit_pin;
}

/* ---------------------------------------------------------------------- */
/*  GOOGLE FONTS, injected once. Bebas Neue for title-card display type,   */
/*  IBM Plex Mono for timecodes and budget figures, Inter for body copy.   */
/* ---------------------------------------------------------------------- */
function useCinemaFonts() {
  useEffect(() => {
    if (document.getElementById("emic-fonts")) return;
    const link = document.createElement("link");
    link.id = "emic-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

/* ---------------------------------------------------------------------- */
/*  SIGNATURE ELEMENT: a 35mm filmstrip edge, perforations on a colored    */
/*  bar. Used consistently as the framing device across the page.         */
/* ---------------------------------------------------------------------- */
function FilmStripBar({ color, height = 10, orientation = "horizontal" }) {
  if (orientation === "vertical") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: height, background: color, padding: "6px 0", overflow: "hidden", flexShrink: 0, alignSelf: "stretch" }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} style={{ width: 4, height: 4, background: "#0A0A0A", flexShrink: 0 }} />
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, height, background: color, padding: "0 6px", overflow: "hidden" }}>
      {Array.from({ length: 60 }).map((_, i) => (
        <div key={i} style={{ width: 4, height: 4, background: "#0A0A0A", flexShrink: 0 }} />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  SMALL UI PRIMITIVES                                                     */
/* ---------------------------------------------------------------------- */
function Pill({ active, onClick, children, style }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-md text-sm font-semibold transition-colors"
      style={{
        background: active ? C.gold : C.card,
        color: active ? "#141414" : C.sub,
        border: `1px solid ${active ? C.gold : C.line}`,
        fontFamily: FONTS.body,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/*  EDIT GATE, a friction gate (not real security) for the shared PIN.     */
/*  Browsing is always open; entering the code unlocks editing for the     */
/*  rest of this browser session (see app_settings.edit_pin).              */
/* ---------------------------------------------------------------------- */
function EditGate({ unlocked, onUnlock, onLock }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [err, setErr] = useState(false);

  if (unlocked) {
    return (
      <button
        onClick={onLock}
        className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold"
        style={{ background: C.card, border: `1px solid ${C.line}`, color: "#27AE60", fontFamily: FONTS.body }}
      >
        <Lock size={13} /> Editing unlocked
      </button>
    );
  }

  const attempt = () => {
    if (onUnlock(value)) {
      setOpen(false);
      setValue("");
      setErr(false);
    } else {
      setErr(true);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold"
        style={{ background: C.card, border: `1px solid ${C.line}`, color: C.sub, fontFamily: FONTS.body }}
      >
        <Lock size={13} /> Enter code to edit
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 p-3 rounded-md z-20"
          style={{ background: C.panel, border: `1px solid ${C.line}`, width: 220 }}
        >
          <input
            autoFocus
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setErr(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") attempt(); }}
            placeholder="Edit code"
            className="w-full rounded-md px-3 py-2 text-sm outline-none mb-2"
            style={{ background: C.card, border: `1px solid ${err ? "#E74C3C" : C.line}`, color: C.ink, fontFamily: FONTS.body }}
          />
          {err && (
            <div className="text-xs mb-2" style={{ color: "#E74C3C", fontFamily: FONTS.body }}>
              Incorrect code.
            </div>
          )}
          <button
            onClick={attempt}
            className="w-full px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
            style={{ background: C.gold, color: "#141414" }}
          >
            Unlock
          </button>
        </div>
      )}
    </div>
  );
}

function StageTrack({ stage, compact }) {
  const idx = STAGES.findIndex((s) => s.id === stage);
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1" title={`${s.label}: ${s.detail}`}>
          <div
            style={{
              width: compact ? 7 : 10,
              height: compact ? 7 : 10,
              borderRadius: 999,
              background: i < idx ? "#27AE60" : i === idx ? C.gold : C.line,
            }}
          />
          {i < STAGES.length - 1 && (
            <div style={{ width: compact ? 8 : 14, height: 2, background: i < idx ? "#27AE60" : C.line }} />
          )}
        </div>
      ))}
    </div>
  );
}

function ThemeTag({ theme }) {
  return (
    <span
      className="text-xs font-semibold uppercase px-2 py-1 rounded"
      style={{ color: theme.color, background: C.cardAlt, border: `1px solid ${theme.color}55`, fontFamily: FONTS.body }}
    >
      {theme.name}
    </span>
  );
}

/* ---------------------------------------------------------------------- */
/*  EDITABLE / STATIC SECTION, long-form tab content                       */
/* ---------------------------------------------------------------------- */
function EditableSection({ value, placeholder, onSave }) {
  const [draft, setDraft] = useState(value || "");
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(value || "");
    setDirty(false);
  }, [value]);

  return (
    <div>
      <textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setDirty(true);
          setSaved(false);
        }}
        placeholder={placeholder}
        rows={12}
        className="w-full rounded-lg p-4 text-sm leading-relaxed resize-y outline-none"
        style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, whiteSpace: "pre-wrap", fontFamily: FONTS.body }}
      />
      <div className="flex items-center gap-3 mt-2">
        <button
          disabled={!dirty}
          onClick={async () => {
            await onSave(draft);
            setDirty(false);
            setSaved(true);
          }}
          className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
          style={{
            background: dirty ? C.gold : C.line,
            color: dirty ? "#141414" : C.mute,
            cursor: dirty ? "pointer" : "default",
          }}
        >
          Save
        </button>
        {saved && !dirty && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
            <Check size={13} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

function StaticSection({ value, emptyText }) {
  return (
    <div
      className="w-full rounded-lg p-4 text-sm leading-relaxed"
      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, whiteSpace: "pre-wrap", fontFamily: FONTS.body }}
    >
      {value && value.trim() ? value : <span style={{ color: C.mute }}>{emptyText || "Nothing recorded here."}</span>}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  FILM TITLE & TAGLINE, the group's own creative identity within theme   */
/* ---------------------------------------------------------------------- */
function FilmTitleEditor({ title, tagline, onSave, readOnly }) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title || "");
  const [draftTagline, setDraftTagline] = useState(tagline || "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraftTitle(title || "");
    setDraftTagline(tagline || "");
  }, [title, tagline]);

  const titleStyle = { color: C.ink, fontFamily: FONTS.display, letterSpacing: 1, fontSize: 34, lineHeight: 1.05, textTransform: "uppercase" };

  if (readOnly) {
    return (
      <div className="mt-3">
        <h2 style={titleStyle}>{title}</h2>
        {tagline && <p className="text-sm mt-1" style={{ color: C.sub, fontFamily: FONTS.body }}>{tagline}</p>}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mt-3 rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold, fontFamily: FONTS.body }}>Your film</div>
        <input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder="Working title"
          className="w-full mb-2 rounded-md px-3 py-2 text-sm outline-none"
          style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }}
          autoFocus
        />
        <input
          value={draftTagline}
          onChange={(e) => setDraftTagline(e.target.value)}
          placeholder="One-line tagline"
          className="w-full rounded-md px-3 py-2 text-sm outline-none"
          style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }}
        />
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={async () => {
              await onSave(draftTitle, draftTagline);
              setEditing(false);
              setSaved(true);
            }}
            className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
            style={{ background: C.gold, color: "#141414" }}
          >
            Save
          </button>
          <button
            onClick={() => { setDraftTitle(title || ""); setDraftTagline(tagline || ""); setEditing(false); }}
            className="px-3 py-1.5 rounded-md text-xs font-semibold"
            style={{ color: C.mute }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {title ? (
        <>
          <h2 style={titleStyle}>{title}</h2>
          {tagline && <p className="text-sm mt-1" style={{ color: C.sub, fontFamily: FONTS.body }}>{tagline}</p>}
        </>
      ) : (
        <p className="text-sm" style={{ color: C.mute, fontFamily: FONTS.body }}>No title yet</p>
      )}
      <button onClick={() => setEditing(true)} className="text-xs font-semibold underline mt-1" style={{ color: C.sub, fontFamily: FONTS.body }}>
        {title ? "Edit title & tagline" : "Add your title & tagline"}
      </button>
      {saved && (
        <span className="text-xs ml-2 inline-flex items-center gap-1" style={{ color: "#27AE60" }}>
          <Check size={12} /> Saved
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  GROUP MEMBERS, compact editable roster, visible across every tab       */
/* ---------------------------------------------------------------------- */
function GroupMembers({ value, onSave, readOnly }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  const names = (value || "").split(",").map((n) => n.trim()).filter(Boolean);

  if (readOnly) {
    return (
      <div className="mt-3 flex items-start gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: C.gold }}>
          <Users size={13} /> Group
        </span>
        {names.length > 0 ? (
          names.map((n) => (
            <span key={n} className="text-xs font-semibold px-2 py-1 rounded" style={{ background: C.cardAlt, color: C.ink }}>
              {n}
            </span>
          ))
        ) : (
          <span className="text-xs" style={{ color: C.mute }}>Not recorded for this example</span>
        )}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mt-3 rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>
          <Users size={13} /> Assigned group
        </div>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Camille Dubois, Léo Martin, Nina Chen"
          className="w-full rounded-md px-3 py-2 text-sm outline-none"
          style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }}
          autoFocus
        />
        <div className="text-xs mt-1.5 mb-3" style={{ color: C.mute }}>
          Separate names with commas.
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              await onSave(draft);
              setEditing(false);
              setSaved(true);
            }}
            className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
            style={{ background: C.gold, color: "#141414" }}
          >
            Save
          </button>
          <button
            onClick={() => { setDraft(value || ""); setEditing(false); }}
            className="px-3 py-1.5 rounded-md text-xs font-semibold"
            style={{ color: C.mute }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-start gap-2 flex-wrap">
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: C.gold }}>
        <Users size={13} /> Assigned group
      </span>
      {names.length > 0 ? (
        names.map((n) => (
          <span key={n} className="text-xs font-semibold px-2 py-1 rounded" style={{ background: C.cardAlt, color: C.ink }}>
            {n}
          </span>
        ))
      ) : (
        <span className="text-xs" style={{ color: C.mute }}>Not yet allocated</span>
      )}
      <button onClick={() => setEditing(true)} className="text-xs font-semibold underline" style={{ color: C.sub }}>
        {names.length > 0 ? "Edit" : "Allocate students"}
      </button>
      {saved && (
        <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
          <Check size={12} /> Saved
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PRODUCTION STATS, the Overview tab's numbers: stage, length, cast,     */
/*  shoot days, budget raised, surplus. Editable the same way as title     */
/*  and members, since these are exactly the fields that start as TBC      */
/*  and fill in as a group's shoot actually happens.                       */
/* ---------------------------------------------------------------------- */
/* ---------------------------------------------------------------------- */
/*  MONEY PARSING, accepts whatever people naturally type: "500", "500€",  */
/*  "€500", "500 €", "1,000", not just bare digits.                        */
/* ---------------------------------------------------------------------- */
function parseMoney(str) {
  if (str == null || str === "") return { valid: false, value: null };
  const cleaned = String(str).replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  if (cleaned === "") return { valid: false, value: null };
  const n = Number(cleaned);
  return isNaN(n) ? { valid: false, value: null } : { valid: true, value: n };
}

/* ---------------------------------------------------------------------- */
/*  BUDGET, a real line-item table: as many rows as needed, a title and    */
/*  an amount per row, with a live-calculated total.                       */
/* ---------------------------------------------------------------------- */
function blankBudgetRow() {
  return { label: "", amount: "" };
}
function sumBudget(rows) {
  return (rows || []).reduce((total, r) => {
    const { valid, value } = parseMoney(r.amount);
    return valid ? total + value : total;
  }, 0);
}
function formatEuro(n) {
  return Number.isInteger(n) ? `€${n}` : `€${n.toFixed(2)}`;
}

function BudgetEditor({ rows, onSave }) {
  const [list, setList] = useState(rows || []);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setList(rows || []); setDirty(false); }, [rows]);

  const update = (i, field, value) => {
    setList(list.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
    setDirty(true); setSaved(false);
  };
  const addRow = () => { setList([...list, blankBudgetRow()]); setDirty(true); setSaved(false); };
  const removeRow = (i) => { setList(list.filter((_, idx) => idx !== i)); setDirty(true); setSaved(false); };

  const inputStyle = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body };

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: C.mute, fontFamily: FONTS.body }}>
        This total reflects what you've actually spent. Money raised and any surplus returned are tracked separately, on Overview, Edit details.
      </p>
      {list.length === 0 && <p className="text-sm mb-4" style={{ color: C.mute, fontFamily: FONTS.body }}>No budget lines yet. Add one for every expense.</p>}
      {list.length > 0 && (
        <div className="grid grid-cols-12 gap-2 px-1 mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: C.mute }}>
          <div className="col-span-8">Item</div>
          <div className="col-span-3">Amount, euros</div>
        </div>
      )}
      <div className="space-y-2">
        {list.map((row, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center rounded-lg p-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <input value={row.label} onChange={(e) => update(i, "label", e.target.value)} placeholder="e.g. DJI Mic 2 rental" className="col-span-8 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
            <input value={row.amount} onChange={(e) => update(i, "amount", e.target.value)} placeholder="0" className="col-span-3 rounded-md px-2 py-1.5 text-sm outline-none" style={{ ...inputStyle, fontFamily: FONTS.mono }} />
            <button onClick={() => removeRow(i)} style={{ color: C.mute }} className="col-span-1 flex justify-center" aria-label="Remove line"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      {list.length > 0 && (
        <div className="flex items-center justify-between rounded-lg px-4 py-3 mt-3" style={{ background: C.cardAlt, border: `1px solid ${C.gold}55` }}>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.gold }}>Total</span>
          <span className="text-lg font-bold" style={{ color: C.gold, fontFamily: FONTS.mono }}>{formatEuro(sumBudget(list))}</span>
        </div>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide" style={{ background: C.cardAlt, color: C.gold, border: `1px solid ${C.line}` }}>
          <Plus size={13} /> Add line
        </button>
        <button
          disabled={!dirty}
          onClick={async () => { await onSave(list); setDirty(false); setSaved(true); }}
          className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
          style={{ background: dirty ? C.gold : C.line, color: dirty ? "#141414" : C.mute, cursor: dirty ? "pointer" : "default" }}
        >
          Save
        </button>
        {saved && !dirty && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
            <Check size={13} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

function StaticBudget({ rows }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="w-full rounded-lg p-4 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.mute, fontFamily: FONTS.body }}>
        No budget lines recorded for this example.
      </div>
    );
  }
  return (
    <div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }}>
            <span>{r.label}</span>
            <span style={{ fontFamily: FONTS.mono, color: C.sub }}>{formatEuro(parseMoney(r.amount).value ?? 0)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-lg px-4 py-3 mt-3" style={{ background: C.cardAlt, border: `1px solid ${C.gold}55` }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.gold }}>Total</span>
        <span className="text-lg font-bold" style={{ color: C.gold, fontFamily: FONTS.mono }}>{formatEuro(sumBudget(rows))}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  SCHEDULE CHECKLIST, one row per real EMIC checkpoint: done, an actual  */
/*  date, and a note. This is where dates actually get entered.            */
/* ---------------------------------------------------------------------- */
function blankScheduleChecklist() {
  return STAGES.map((s) => ({ stageId: s.id, done: false, date: "", note: "" }));
}

function ScheduleChecklistEditor({ checklist, onSave }) {
  const rows = STAGES.map((s) => {
    const existing = (checklist || []).find((r) => r.stageId === s.id);
    return existing || { stageId: s.id, done: false, date: "", note: "" };
  });
  const [list, setList] = useState(rows);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const next = STAGES.map((s) => (checklist || []).find((r) => r.stageId === s.id) || { stageId: s.id, done: false, date: "", note: "" });
    setList(next);
    setDirty(false);
  }, [checklist]);

  const update = (stageId, field, value) => {
    setList(list.map((r) => (r.stageId === stageId ? { ...r, [field]: value } : r)));
    setDirty(true); setSaved(false);
  };

  const inputStyle = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body };

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: C.mute, fontFamily: FONTS.body }}>
        One row per real EMIC session. Tick it off, add the actual date if it differs from the target month, and a short note. Your Stage shown on your card is set separately, on Overview, Edit details.
      </p>
      <div className="space-y-2">
        {list.map((row) => {
          const s = STAGES.find((x) => x.id === row.stageId);
          return (
            <div key={row.stageId} className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${row.done ? "#27AE6055" : C.line}` }}>
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={row.done}
                  onChange={(e) => update(row.stageId, "done", e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#27AE60", flexShrink: 0 }}
                  aria-label={`Mark ${s.label} done`}
                />
                <div className="flex-1">
                  <span className="text-sm font-bold" style={{ color: row.done ? "#27AE60" : C.ink, fontFamily: FONTS.body }}>{s.label}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 ml-7">
                <input
                  value={row.date}
                  onChange={(e) => update(row.stageId, "date", e.target.value)}
                  placeholder="Actual date, e.g. Dec 12"
                  className="rounded-md px-2 py-1.5 text-sm outline-none"
                  style={{ ...inputStyle, fontFamily: FONTS.mono }}
                />
                <input
                  value={row.note}
                  onChange={(e) => update(row.stageId, "note", e.target.value)}
                  placeholder="Note, e.g. what happened"
                  className="col-span-2 rounded-md px-2 py-1.5 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button
          disabled={!dirty}
          onClick={async () => { await onSave(list); setDirty(false); setSaved(true); }}
          className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
          style={{ background: dirty ? C.gold : C.line, color: dirty ? "#141414" : C.mute, cursor: dirty ? "pointer" : "default" }}
        >
          Save
        </button>
        {saved && !dirty && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
            <Check size={13} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

function StaticScheduleChecklist({ checklist }) {
  if (!checklist || checklist.length === 0) {
    return (
      <div className="w-full rounded-lg p-4 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.mute, fontFamily: FONTS.body }}>
        No schedule recorded for this example.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {STAGES.map((s) => {
        const row = checklist.find((r) => r.stageId === s.id);
        if (!row) return null;
        return (
          <div key={s.id} className="rounded-lg p-3 text-sm" style={{ background: C.card, border: `1px solid ${row.done ? "#27AE6055" : C.line}`, fontFamily: FONTS.body }}>
            <div className="flex items-center gap-2">
              <Check size={14} style={{ color: row.done ? "#27AE60" : C.line, flexShrink: 0 }} />
              <span style={{ fontWeight: 700, color: row.done ? "#27AE60" : C.ink }}>{s.label}</span>
              {row.date && <span style={{ color: C.sub, fontFamily: FONTS.mono, fontSize: 12 }}>· {row.date}</span>}
            </div>
            {row.note && <div style={{ color: C.sub, marginLeft: 22, marginTop: 2 }}>{row.note}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  SHOT LIST, a real table: shot number, location, duration, framing,     */
/*  characters, and description, as many rows as the film needs.          */
/* ---------------------------------------------------------------------- */
function blankShotRow() {
  return { number: "", location: "", duration: "", framing: "", characters: "", description: "" };
}

function ShotListEditor({ rows, onSave }) {
  const [list, setList] = useState(rows || []);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setList(rows || []); setDirty(false); }, [rows]);

  const update = (i, field, value) => {
    setList(list.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
    setDirty(true); setSaved(false);
  };
  const addRow = () => { setList([...list, blankShotRow()]); setDirty(true); setSaved(false); };
  const removeRow = (i) => { setList(list.filter((_, idx) => idx !== i)); setDirty(true); setSaved(false); };

  const inputStyle = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body };

  return (
    <div>
      {list.length === 0 && <p className="text-sm mb-4" style={{ color: C.mute, fontFamily: FONTS.body }}>No shots yet. Add one for every shot in the film.</p>}
      <div className="space-y-3">
        {list.map((row, i) => (
          <div key={i} className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-start gap-2 mb-2">
              <div className="grid grid-cols-12 gap-2 flex-1">
                <input value={row.number} onChange={(e) => update(i, "number", e.target.value)} placeholder="01" className="col-span-1 rounded-md px-2 py-1.5 text-sm outline-none" style={{ ...inputStyle, fontFamily: FONTS.mono }} />
                <input value={row.location} onChange={(e) => update(i, "location", e.target.value)} placeholder="Location" className="col-span-4 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
                <input value={row.duration} onChange={(e) => update(i, "duration", e.target.value)} placeholder="Duration, e.g. 0:00 to 0:12" className="col-span-4 rounded-md px-2 py-1.5 text-sm outline-none" style={{ ...inputStyle, fontFamily: FONTS.mono }} />
                <input value={row.framing} onChange={(e) => update(i, "framing", e.target.value)} placeholder="Framing" className="col-span-3 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
              </div>
              <button onClick={() => removeRow(i)} style={{ color: C.mute }} aria-label="Remove shot" className="flex-shrink-0 mt-1.5"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input value={row.characters} onChange={(e) => update(i, "characters", e.target.value)} placeholder="Characters in shot" className="rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
              <input value={row.description} onChange={(e) => update(i, "description", e.target.value)} placeholder="Action & description" className="col-span-2 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide" style={{ background: C.cardAlt, color: C.gold, border: `1px solid ${C.line}` }}>
          <Plus size={13} /> Add shot
        </button>
        <button
          disabled={!dirty}
          onClick={async () => { await onSave(list); setDirty(false); setSaved(true); }}
          className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
          style={{ background: dirty ? C.gold : C.line, color: dirty ? "#141414" : C.mute, cursor: dirty ? "pointer" : "default" }}
        >
          Save
        </button>
        {saved && !dirty && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
            <Check size={13} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

function StaticShotList({ rows }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="w-full rounded-lg p-4 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.mute, fontFamily: FONTS.body }}>
        No shots recorded for this example.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="rounded-lg p-3 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }}>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span style={{ fontFamily: FONTS.mono, color: C.gold, fontWeight: 700 }}>{r.number}</span>
            <span style={{ color: C.sub }}>{r.location}</span>
            {r.duration && <span style={{ fontFamily: FONTS.mono, color: C.mute, fontSize: 12 }}>{r.duration}</span>}
            {r.framing && <span style={{ color: C.mute, fontSize: 12 }}>· {r.framing}</span>}
          </div>
          <div>{r.description}</div>
          {r.characters && <div style={{ color: C.sub, fontSize: 13, marginTop: 2 }}>Characters: {r.characters}</div>}
        </div>
      ))}
    </div>
  );
}

function ProductionStats({ stage, length, cast, shootDays, budgetEmic, budgetRaised, surplus, readOnly, onSave }) {
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState({ stage, length, cast, shootDays, budgetRaised, surplus });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setD({ stage, length, cast, shootDays, budgetRaised, surplus });
  }, [stage, length, cast, shootDays, budgetRaised, surplus]);

  const { valid: raisedValid, value: raisedNum } = parseMoney(budgetRaised);
  const { valid: surplusValid, value: surplusNum } = parseMoney(surplus);

  if (editing) {
    return (
      <div className="rounded-lg p-4 space-y-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: C.gold }}>Edit production details</div>
        <div>
          <label className="text-xs" style={{ color: C.mute }}>Stage</label>
          <select
            value={d.stage}
            onChange={(e) => setD({ ...d, stage: e.target.value })}
            className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none"
            style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }}
          >
            {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs" style={{ color: C.mute }}>Length</label>
            <input value={d.length} onChange={(e) => setD({ ...d, length: e.target.value })} placeholder="1 min 57 sec"
              className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
          </div>
          <div>
            <label className="text-xs" style={{ color: C.mute }}>Cast</label>
            <input value={d.cast} onChange={(e) => setD({ ...d, cast: e.target.value })} placeholder="2 actors"
              className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
          </div>
          <div>
            <label className="text-xs" style={{ color: C.mute }}>Shoot</label>
            <input value={d.shootDays} onChange={(e) => setD({ ...d, shootDays: e.target.value })} placeholder="2 days"
              className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs" style={{ color: C.mute }}>Budget raised, euros</label>
            <input value={d.budgetRaised} onChange={(e) => setD({ ...d, budgetRaised: e.target.value })} placeholder="0" inputMode="numeric"
              className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
          </div>
          <div>
            <label className="text-xs" style={{ color: C.mute }}>Surplus returned, euros</label>
            <input value={d.surplus} onChange={(e) => setD({ ...d, surplus: e.target.value })} placeholder="Leave blank until known" inputMode="numeric"
              className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={async () => { await onSave(d); setEditing(false); setSaved(true); }}
            className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
            style={{ background: C.gold, color: "#141414" }}
          >
            Save
          </button>
          <button
            onClick={() => { setD({ stage, length, cast, shootDays, budgetRaised, surplus }); setEditing(false); }}
            className="px-3 py-1.5 rounded-md text-xs font-semibold"
            style={{ color: C.mute }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>Stage</div>
        <StageTrack stage={stage} />
        <div className="text-xs mt-2" style={{ color: C.sub, fontFamily: FONTS.mono }}>
          {STAGES.find((s) => s.id === stage)?.label}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[["Length", length || "TBC"], ["Cast", cast || "TBC"], ["Shoot", shootDays || "TBC"]].map(([label, val]) => (
          <div key={label} className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="text-xs uppercase tracking-wide" style={{ color: C.mute }}>{label}</div>
            <div className="text-sm font-semibold mt-1" style={{ color: C.ink }}>{val}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-xs uppercase tracking-wide" style={{ color: C.mute }}>EMIC base</div>
          <div className="text-lg font-bold" style={{ color: C.gold, fontFamily: FONTS.mono }}>€{budgetEmic}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-xs uppercase tracking-wide" style={{ color: C.mute }}>Raised</div>
          <div className="text-lg font-bold" style={{ color: C.ink, fontFamily: FONTS.mono }}>{raisedValid ? `€${raisedNum}` : "TBC"}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-xs uppercase tracking-wide" style={{ color: C.mute }}>Surplus returned</div>
          <div className="text-lg font-bold" style={{ color: "#27AE60", fontFamily: FONTS.mono }}>{surplusValid ? `€${surplusNum}` : "TBC"}</div>
        </div>
      </div>
      {!readOnly && (
        <button onClick={() => { setEditing(true); setSaved(false); }} className="text-xs font-semibold underline" style={{ color: C.sub }}>
          Edit details
        </button>
      )}
      {saved && (
        <span className="text-xs ml-2 inline-flex items-center gap-1" style={{ color: "#27AE60" }}>
          <Check size={12} /> Saved
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CALLSHEETS, one entry per shoot day: location, scenes, notes, and a    */
/*  day schedule of timed events. Who's on the production lives in Cast &  */
/*  Crew instead, so it isn't retyped on every single day's sheet.         */
/* ---------------------------------------------------------------------- */
function blankCallsheetEntry() {
  return { day: "", location: "", schedule: [], scenes: "", notes: "" };
}
function blankScheduleRow() {
  return { time: "", who: "" };
}

function CallsheetsEditor({ entries, onSave }) {
  const [list, setList] = useState(entries || []);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setList(entries || []); setDirty(false); }, [entries]);

  const updateField = (i, field, value) => {
    setList(list.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
    setDirty(true); setSaved(false);
  };
  const addEntry = () => { setList([...list, blankCallsheetEntry()]); setDirty(true); setSaved(false); };
  const removeEntry = (i) => { setList(list.filter((_, idx) => idx !== i)); setDirty(true); setSaved(false); };
  const updateRow = (ei, ri, field, value) => {
    setList(list.map((e, idx) => idx !== ei ? e : { ...e, schedule: e.schedule.map((r, rIdx) => rIdx === ri ? { ...r, [field]: value } : r) }));
    setDirty(true); setSaved(false);
  };
  const addRow = (ei) => {
    setList(list.map((e, idx) => idx === ei ? { ...e, schedule: [...e.schedule, blankScheduleRow()] } : e));
    setDirty(true); setSaved(false);
  };
  const removeRow = (ei, ri) => {
    setList(list.map((e, idx) => idx === ei ? { ...e, schedule: e.schedule.filter((_, rIdx) => rIdx !== ri) } : e));
    setDirty(true); setSaved(false);
  };

  return (
    <div>
      {list.length === 0 && (
        <p className="text-sm mb-4" style={{ color: C.mute, fontFamily: FONTS.body }}>
          No call sheets yet. Add one for each day of shooting.
        </p>
      )}
      <div className="space-y-4">
        {list.map((entry, i) => (
          <div key={i} className="rounded-lg p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between mb-3">
              <input
                value={entry.day}
                onChange={(e) => updateField(i, "day", e.target.value)}
                placeholder={`Day ${i + 1}, e.g. Shoot day 1`}
                className="text-xs font-bold uppercase tracking-widest outline-none bg-transparent"
                style={{ color: C.gold, fontFamily: FONTS.body, border: "none", width: "70%" }}
              />
              <button onClick={() => removeEntry(i)} style={{ color: C.mute }} aria-label="Remove call sheet">
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs" style={{ color: C.mute }}>Location</label>
                <input value={entry.location} onChange={(e) => updateField(i, "location", e.target.value)}
                  className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
              </div>
              <div>
                <label className="text-xs" style={{ color: C.mute }}>Scenes covered</label>
                <input value={entry.scenes} onChange={(e) => updateField(i, "scenes", e.target.value)}
                  className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs" style={{ color: C.mute }}>Notes</label>
              <input value={entry.notes} onChange={(e) => updateField(i, "notes", e.target.value)}
                className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
            </div>

            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>Day schedule</div>
            <div className="space-y-2 mb-2">
              {entry.schedule.map((row, ri) => (
                <div key={ri} className="flex items-center gap-2">
                  <input value={row.time} onChange={(e) => updateRow(i, ri, "time", e.target.value)} placeholder="07:00"
                    style={{ width: 84, background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.mono }}
                    className="rounded-md px-2 py-1.5 text-sm outline-none flex-shrink-0" />
                  <input value={row.who} onChange={(e) => updateRow(i, ri, "who", e.target.value)} placeholder="What happens, e.g. Actors arrive, Lunch break, RTS"
                    style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }}
                    className="flex-1 rounded-md px-3 py-1.5 text-sm outline-none" />
                  <button onClick={() => removeRow(i, ri)} style={{ color: C.mute }} aria-label="Remove schedule item"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
            <button onClick={() => addRow(i)} className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.sub }}>
              <Plus size={12} /> Add schedule item
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button onClick={addEntry} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide" style={{ background: C.cardAlt, color: C.gold, border: `1px solid ${C.line}` }}>
          <Plus size={13} /> Add call sheet
        </button>
        <button
          disabled={!dirty}
          onClick={async () => { await onSave(list); setDirty(false); setSaved(true); }}
          className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
          style={{ background: dirty ? C.gold : C.line, color: dirty ? "#141414" : C.mute, cursor: dirty ? "pointer" : "default" }}
        >
          Save
        </button>
        {saved && !dirty && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
            <Check size={13} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

function StaticCallsheets({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="w-full rounded-lg p-4 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.mute, fontFamily: FONTS.body }}>
        No call sheets recorded for this example.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <div key={i} className="rounded-lg p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>{entry.day || `Call sheet ${i + 1}`}</div>
          <div className="text-sm space-y-1" style={{ color: C.ink, fontFamily: FONTS.body }}>
            {entry.location && <div><span style={{ color: C.mute }}>Location: </span>{entry.location}</div>}
            {entry.scenes && <div><span style={{ color: C.mute }}>Scenes covered: </span>{entry.scenes}</div>}
            {entry.notes && <div><span style={{ color: C.mute }}>Notes: </span>{entry.notes}</div>}
          </div>
          {entry.schedule && entry.schedule.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.mute }}>Day schedule</div>
              {entry.schedule.map((row, ri) => (
                <div key={ri} className="text-sm flex gap-2" style={{ color: C.ink, fontFamily: FONTS.body }}>
                  <span style={{ fontFamily: FONTS.mono, color: C.gold, width: 50, flexShrink: 0 }}>{row.time}</span>
                  <span>{row.who}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CAST & CREW, one shared contact list for the whole production.         */
/* ---------------------------------------------------------------------- */
function blankCastCrewEntry() {
  return { name: "", role: "", phone: "", email: "" };
}

function CastCrewEditor({ entries, onSave }) {
  const [list, setList] = useState(entries || []);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setList(entries || []); setDirty(false); }, [entries]);

  const update = (i, field, value) => {
    setList(list.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
    setDirty(true); setSaved(false);
  };
  const addEntry = () => { setList([...list, blankCastCrewEntry()]); setDirty(true); setSaved(false); };
  const removeEntry = (i) => { setList(list.filter((_, idx) => idx !== i)); setDirty(true); setSaved(false); };

  const inputStyle = { background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body };

  return (
    <div>
      {list.length === 0 && (
        <p className="text-sm mb-4" style={{ color: C.mute, fontFamily: FONTS.body }}>
          No cast or crew added yet. Add everyone involved, actors and crew together.
        </p>
      )}
      {list.length > 0 && (
        <div className="grid grid-cols-12 gap-2 px-1 mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: C.mute }}>
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-2">Phone</div>
          <div className="col-span-3">Email</div>
        </div>
      )}
      <div className="space-y-2">
        {list.map((p, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center rounded-lg p-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <input value={p.name} onChange={(e) => update(i, "name", e.target.value)} placeholder="Name" className="col-span-3 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
            <input value={p.role} onChange={(e) => update(i, "role", e.target.value)} placeholder="e.g. Director, Actor" className="col-span-3 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
            <input value={p.phone} onChange={(e) => update(i, "phone", e.target.value)} placeholder="Phone" className="col-span-2 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
            <input value={p.email} onChange={(e) => update(i, "email", e.target.value)} placeholder="Email" className="col-span-3 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
            <button onClick={() => removeEntry(i)} style={{ color: C.mute }} className="col-span-1 flex justify-center" aria-label="Remove person"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button onClick={addEntry} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide" style={{ background: C.cardAlt, color: C.gold, border: `1px solid ${C.line}` }}>
          <Plus size={13} /> Add person
        </button>
        <button
          disabled={!dirty}
          onClick={async () => { await onSave(list); setDirty(false); setSaved(true); }}
          className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
          style={{ background: dirty ? C.gold : C.line, color: dirty ? "#141414" : C.mute, cursor: dirty ? "pointer" : "default" }}
        >
          Save
        </button>
        {saved && !dirty && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
            <Check size={13} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

function StaticCastCrew({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="w-full rounded-lg p-4 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.mute, fontFamily: FONTS.body }}>
        No cast or crew recorded for this example.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {entries.map((p, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg p-3 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }}>
          <span style={{ fontWeight: 700, minWidth: 100 }}>{p.name || "Unnamed"}</span>
          <span style={{ color: C.sub }}>{p.role}</span>
          {p.phone && <span style={{ color: C.mute }}>· {p.phone}</span>}
          {p.email && <span style={{ color: C.mute }}>· {p.email}</span>}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  EQUIPMENT & PROPS, two simple checklists shared across the shoot.      */
/* ---------------------------------------------------------------------- */
function ChecklistRows({ items, setItems, placeholder }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item}
            onChange={(e) => { const next = [...items]; next[i] = e.target.value; setItems(next); }}
            placeholder={placeholder}
            className="flex-1 rounded-md px-3 py-2 text-sm outline-none"
            style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }}
          />
          <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} style={{ color: C.mute }} aria-label="Remove item"><Trash2 size={14} /></button>
        </div>
      ))}
      <button onClick={() => setItems([...items, ""])} className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.sub }}>
        <Plus size={12} /> Add item
      </button>
    </div>
  );
}

function EquipmentPropsEditor({ equipment, props, onSave }) {
  const [eq, setEq] = useState(equipment || []);
  const [pr, setPr] = useState(props || []);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setEq(equipment || []); setPr(props || []); setDirty(false); }, [equipment, props]);

  const wrapEq = (next) => { setEq(next); setDirty(true); setSaved(false); };
  const wrapPr = (next) => { setPr(next); setDirty(true); setSaved(false); };

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>Technical equipment</div>
        {eq.length === 0 && <p className="text-sm mb-2" style={{ color: C.mute, fontFamily: FONTS.body }}>Nothing listed yet.</p>}
        <ChecklistRows items={eq} setItems={wrapEq} placeholder="e.g. iPhone 15 Pro, DJI Mic 2, gimbal" />
      </div>
      <div className="mb-4">
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>Props & accessories</div>
        {pr.length === 0 && <p className="text-sm mb-2" style={{ color: C.mute, fontFamily: FONTS.body }}>Nothing listed yet.</p>}
        <ChecklistRows items={pr} setItems={wrapPr} placeholder="e.g. prop phone, tote bag, costume piece" />
      </div>
      <div className="flex items-center gap-3">
        <button
          disabled={!dirty}
          onClick={async () => { await onSave({ equipment: eq.filter((x) => x !== ""), props: pr.filter((x) => x !== "") }); setDirty(false); setSaved(true); }}
          className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
          style={{ background: dirty ? C.gold : C.line, color: dirty ? "#141414" : C.mute, cursor: dirty ? "pointer" : "default" }}
        >
          Save
        </button>
        {saved && !dirty && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
            <Check size={13} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

function StaticEquipmentProps({ equipment, props }) {
  const List = ({ items }) =>
    !items || items.length === 0 ? (
      <p className="text-sm" style={{ color: C.mute, fontFamily: FONTS.body }}>None recorded.</p>
    ) : (
      <ul className="text-sm space-y-1" style={{ color: C.ink, fontFamily: FONTS.body }}>
        {items.map((item, i) => <li key={i}>· {item}</li>)}
      </ul>
    );
  return (
    <div>
      <div className="mb-5">
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>Technical equipment</div>
        <List items={equipment} />
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>Props & accessories</div>
        <List items={props} />
      </div>
    </div>
  );
}


/* ---------------------------------------------------------------------- */
/*  PRINT VIEW, a clean white-background document for Print / Save as PDF  */
/* ---------------------------------------------------------------------- */
function PrintView({ production, theme, readOnly, onClose }) {
  const title = readOnly ? production.filmTitle : production.sections.filmTitle;
  const tagline = readOnly ? production.tagline : production.sections.tagline;
  const stage = readOnly ? production.stage : production.sections.stage;
  const length = readOnly ? production.length : production.sections.length;
  const cast = readOnly ? production.cast : production.sections.cast;
  const budgetRaised = readOnly ? production.budgetRaised : production.sections.budgetRaised;
  const surplus = readOnly ? production.surplus : production.sections.surplus;
  const memberNames = (production.sections.members || "").split(",").map((n) => n.trim()).filter(Boolean);
  const callsheets = production.sections.callsheets || [];

  const { valid: raisedValid, value: raisedNum } = parseMoney(budgetRaised);
  const { valid: surplusValid, value: surplusNum } = parseMoney(surplus);

  const Section = ({ label, children }) => (
    <div style={{ marginBottom: 26, breakInside: "avoid" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: theme.color, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4 }}>
        {label}
      </div>
      {children}
    </div>
  );

  const Prose = ({ text, empty }) => (
    <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "#222" }}>
      {text && text.trim() ? text : <span style={{ color: "#999" }}>{empty || "Not yet completed."}</span>}
    </div>
  );

  return (
    <div className="print-area" style={{ position: "fixed", inset: 0, zIndex: 30, background: "#fff", overflowY: "auto" }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: static !important; inset: auto !important; overflow: visible !important; height: auto !important; }
          .no-print { display: none !important; }
          @page { margin: 18mm; }
        }
      `}</style>

      <div className="no-print" style={{ position: "sticky", top: 0, background: "#f4f4f4", borderBottom: "1px solid #ddd", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onClose} style={{ fontSize: 13, color: "#333", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
          Back
        </button>
        <button
          onClick={() => window.print()}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, background: "#141414", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          Print / Save as PDF
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px 80px", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <div style={{ borderBottom: `3px solid ${theme.color}`, paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: theme.color }}>{theme.name}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#111", marginTop: 4 }}>{title || "Untitled production"}</div>
          {tagline && <div style={{ fontSize: 14, color: "#555", marginTop: 2 }}>{tagline}</div>}
          <div style={{ fontSize: 10, color: "#999", marginTop: 10, letterSpacing: 0.5 }}>
            EMIC LAB SHORTS, EMIC LABS DATABASE V12, Master II Audiovisuel, Season 2026 / 2027
          </div>
        </div>

        <Section label="Production details">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 13, color: "#222" }}>
            <div><b>Stage:</b> {STAGES.find((s) => s.id === stage)?.label}</div>
            <div><b>Length:</b> {length || "TBC"}</div>
            <div><b>Cast:</b> {cast || "TBC"}</div>
            <div><b>EMIC base:</b> €{production.budgetEmic}</div>
            <div><b>Raised:</b> {raisedValid ? `€${raisedNum}` : "TBC"}</div>
            <div><b>Surplus returned:</b> {surplusValid ? `€${surplusNum}` : "TBC"}</div>
          </div>
          <div style={{ fontSize: 13, color: "#222", marginTop: 10 }}>
            <b>Group:</b> {memberNames.length ? memberNames.join(", ") : (readOnly ? "Not recorded for this example" : "Not yet allocated")}
          </div>
        </Section>

        <Section label="Pitch & outline"><Prose text={production.sections.pitch} /></Section>
        <Section label="Script"><Prose text={production.sections.script} empty="No script submitted." /></Section>
        <Section label="Budget">
          {(!production.sections.budget || production.sections.budget.length === 0) ? (
            <Prose text="" empty="No budget lines recorded." />
          ) : (
            <>
              {production.sections.budget.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#222", marginBottom: 3 }}>
                  <span>{r.label}</span>
                  <span>{formatEuro(parseMoney(r.amount).value ?? 0)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#111", marginTop: 6, paddingTop: 6, borderTop: "1px solid #ddd" }}>
                <span>Total</span>
                <span>{formatEuro(sumBudget(production.sections.budget))}</span>
              </div>
            </>
          )}
        </Section>
        <Section label="Shooting schedule">
          {(!production.sections.schedule || production.sections.schedule.length === 0) ? (
            <Prose text="" empty="No schedule recorded." />
          ) : (
            STAGES.map((s) => {
              const row = (production.sections.schedule || []).find((r) => r.stageId === s.id);
              if (!row) return null;
              return (
                <div key={s.id} style={{ fontSize: 13, color: "#222", marginBottom: 3 }}>
                  <b>{row.done ? "✓" : "○"} {s.label}</b>
                  {row.date && <span style={{ color: "#666" }}> (actual: {row.date})</span>}
                  {row.note && <span> · {row.note}</span>}
                </div>
              );
            })
          )}
        </Section>
        <Section label="Shot list">
          {(!production.sections.shotlist || production.sections.shotlist.length === 0) ? (
            <Prose text="" empty="No shots recorded." />
          ) : (
            production.sections.shotlist.map((r, i) => (
              <div key={i} style={{ fontSize: 13, color: "#222", marginBottom: 6 }}>
                <b>{r.number}</b> {r.location}{r.duration ? `, ${r.duration}` : ""}{r.framing ? `, ${r.framing}` : ""}
                <div>{r.description}</div>
                {r.characters && <div style={{ color: "#666" }}>Characters: {r.characters}</div>}
              </div>
            ))
          )}
        </Section>

        <Section label="Cast & crew">
          {(!production.sections.castCrew || production.sections.castCrew.length === 0) ? (
            <Prose text="" empty="No cast or crew recorded." />
          ) : (
            production.sections.castCrew.map((p, i) => (
              <div key={i} style={{ fontSize: 13, color: "#222", marginBottom: 4 }}>
                <b>{p.name || "Unnamed"}</b>{p.role ? `, ${p.role}` : ""}{p.phone ? ` · ${p.phone}` : ""}{p.email ? ` · ${p.email}` : ""}
              </div>
            ))
          )}
        </Section>

        <Section label="Equipment & props">
          <div style={{ fontSize: 13, color: "#222" }}>
            <b>Technical equipment:</b> {production.sections.equipment && production.sections.equipment.length ? production.sections.equipment.join(", ") : "None recorded."}
          </div>
          <div style={{ fontSize: 13, color: "#222", marginTop: 4 }}>
            <b>Props & accessories:</b> {production.sections.props && production.sections.props.length ? production.sections.props.join(", ") : "None recorded."}
          </div>
        </Section>

        <Section label="Call sheets">
          {callsheets.length === 0 ? (
            <Prose text="" empty="No call sheets recorded." />
          ) : (
            callsheets.map((e, i) => (
              <div key={i} style={{ marginBottom: 14, fontSize: 13, color: "#222" }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{e.day || `Call sheet ${i + 1}`}</div>
                {e.location && <div><b>Location:</b> {e.location}</div>}
                {e.scenes && <div><b>Scenes covered:</b> {e.scenes}</div>}
                {e.notes && <div><b>Notes:</b> {e.notes}</div>}
                {e.schedule && e.schedule.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <b>Day schedule:</b>
                    {e.schedule.map((row, ri) => <div key={ri} style={{ marginLeft: 12 }}>{row.time}: {row.who}</div>)}
                  </div>
                )}
              </div>
            ))
          )}
        </Section>

        <Section label="Jury prep"><Prose text={production.sections.jury} /></Section>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PRODUCTION DETAIL, shared by live theme slots and read-only examples   */
/* ---------------------------------------------------------------------- */
function ProductionDetail({ production, readOnly, onUpdate, onClose }) {
  const [tab, setTab] = useState("overview");
  const [printMode, setPrintMode] = useState(false);
  const theme = THEMES.find((t) => t.id === production.themeId);

  const persist = async (updates) => {
    const next = { ...production.sections, ...updates };
    onUpdate({ ...production, sections: next });
    await saveProductionSections(production.id, next);
  };

  const title = readOnly ? production.filmTitle : production.sections.filmTitle;
  const tagline = readOnly ? production.tagline : production.sections.tagline;

  if (printMode) {
    return <PrintView production={production} theme={theme} readOnly={readOnly} onClose={() => setPrintMode(false)} />;
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto py-8 px-4" style={{ background: "#000000dd" }}>
      <div className="w-full max-w-4xl rounded-xl overflow-hidden" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <FilmStripBar color={theme.color} height={8} />
        <div className="flex items-start justify-between p-6" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="flex-1">
            <div>
              <div className="text-xl font-bold uppercase tracking-widest" style={{ color: C.ink, fontFamily: FONTS.body }}>{theme.name}</div>
              <p className="text-sm italic mt-1" style={{ color: C.sub, fontFamily: FONTS.body }}>{theme.prompt}</p>
            </div>

            <FilmTitleEditor
              title={title}
              tagline={tagline}
              readOnly={readOnly}
              onSave={(t, tg) => persist({ filmTitle: t, tagline: tg })}
            />

            <GroupMembers
              value={production.sections.members}
              readOnly={readOnly}
              onSave={readOnly ? undefined : (v) => persist({ members: v })}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPrintMode(true)}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
              style={{ color: C.sub }}
              title="Export this production as a PDF"
            >
              <Printer size={15} /> Export PDF
            </button>
            <button onClick={onClose} style={{ color: C.mute }} aria-label="Close">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="relative" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="flex gap-1 overflow-x-auto px-6 pt-4">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  style={{
                    color: active ? C.gold : C.mute,
                    borderBottom: `2px solid ${active ? C.gold : "transparent"}`,
                  }}
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
          <div
            style={{
              position: "absolute", right: 0, top: 0, bottom: 0, width: 36,
              background: `linear-gradient(to right, transparent, ${C.panel})`,
              pointerEvents: "none",
            }}
          />
          <ChevronRight size={16} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", color: C.mute, pointerEvents: "none" }} />
        </div>

        <div className="p-6">
          {tab === "overview" && (
            <ProductionStats
              stage={readOnly ? production.stage : production.sections.stage}
              length={readOnly ? production.length : production.sections.length}
              cast={readOnly ? production.cast : production.sections.cast}
              shootDays={readOnly ? production.shootDays : production.sections.shootDays}
              budgetEmic={production.budgetEmic}
              budgetRaised={readOnly ? production.budgetRaised : production.sections.budgetRaised}
              surplus={readOnly ? production.surplus : production.sections.surplus}
              readOnly={readOnly}
              onSave={(updates) => persist(updates)}
            />
          )}

          {tab === "pitch" && (readOnly
            ? <StaticSection value={production.sections.pitch} />
            : <EditableSection value={production.sections.pitch} placeholder="Write the logline, statement of intent, and dramatic structure here." onSave={(v) => persist({ pitch: v })} />)}
          {tab === "script" && (readOnly
            ? <StaticSection value={production.sections.script} emptyText="No script submitted for this example." />
            : <EditableSection value={production.sections.script} placeholder="Paste or write the full script here, scene headings, action, and dialogue." onSave={(v) => persist({ script: v })} />)}
          {tab === "castcrew" && (readOnly
            ? <StaticCastCrew entries={production.sections.castCrew} />
            : <CastCrewEditor entries={production.sections.castCrew} onSave={(v) => persist({ castCrew: v })} />)}
          {tab === "budget" && (readOnly
            ? <StaticBudget rows={production.sections.budget} />
            : <BudgetEditor rows={production.sections.budget} onSave={(v) => persist({ budget: v })} />)}
          {tab === "schedule" && (readOnly
            ? <StaticScheduleChecklist checklist={production.sections.schedule} />
            : <ScheduleChecklistEditor checklist={production.sections.schedule} onSave={(v) => persist({ schedule: v })} />)}
          {tab === "shotlist" && (readOnly
            ? <StaticShotList rows={production.sections.shotlist} />
            : <ShotListEditor rows={production.sections.shotlist} onSave={(v) => persist({ shotlist: v })} />)}
          {tab === "equipment" && (readOnly
            ? <StaticEquipmentProps equipment={production.sections.equipment} props={production.sections.props} />
            : <EquipmentPropsEditor equipment={production.sections.equipment} props={production.sections.props} onSave={(v) => persist(v)} />)}
          {tab === "callsheets" && (readOnly
            ? <StaticCallsheets entries={production.sections.callsheets} />
            : <CallsheetsEditor entries={production.sections.callsheets} onSave={(v) => persist({ callsheets: v })} />)}
          {tab === "jury" && (readOnly
            ? <StaticSection value={production.sections.jury} />
            : <EditableSection value={production.sections.jury} placeholder="Anticipate the jury's questions and draft your answers." onSave={(v) => persist({ jury: v })} />)}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CARDS                                                                   */
/* ---------------------------------------------------------------------- */
function isFilled(key, v) {
  if (key === "schedule") return Array.isArray(v) && v.some((r) => r.done || r.date || r.note);
  if (Array.isArray(v)) return v.length > 0;
  return typeof v === "string" && v.trim().length > 0;
}

function ProductionCard({ production, onOpen }) {
  const theme = THEMES.find((t) => t.id === production.themeId);
  const totalFields = Object.keys(production.sections).filter((k) => k !== "stage").length;
  const filled = Object.entries(production.sections).filter(([k, v]) => k !== "stage" && isFilled(k, v)).length;
  const memberNames = (production.sections.members || "").split(",").map((n) => n.trim()).filter(Boolean);
  const filmTitle = production.sections.filmTitle;
  const tagline = production.sections.tagline;

  return (
    <button
      onClick={onOpen}
      className="flex text-left rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{ background: C.card, border: `1px solid ${theme.color}55` }}
    >
      <FilmStripBar color={theme.color} height={10} orientation="vertical" />
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-1">
          <div className="text-lg font-bold uppercase tracking-wide" style={{ color: C.ink, fontFamily: FONTS.body }}>{theme.name}</div>
          <ChevronRight size={20} style={{ color: C.mute }} />
        </div>
        <p className="text-sm mb-4" style={{ color: C.sub, fontFamily: FONTS.body, fontStyle: "italic" }}>{theme.prompt}</p>

        <div className="rounded-lg p-3 mb-4" style={{ background: C.cardAlt }}>
          {filmTitle ? (
            <>
              <div style={{ color: C.ink, fontFamily: FONTS.display, fontSize: 26, letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1.05 }}>
                {filmTitle}
              </div>
              {tagline && <div className="text-sm mt-1" style={{ color: C.sub, fontFamily: FONTS.body }}>{tagline}</div>}
            </>
          ) : (
            <div className="text-sm" style={{ color: C.mute, fontFamily: FONTS.body }}>No title yet. Click to start.</div>
          )}
        </div>

        <div className="flex items-center gap-1.5 mb-4 text-sm" style={{ color: memberNames.length ? C.sub : C.mute, fontFamily: FONTS.body }}>
          <Users size={14} />
          <span className="line-clamp-1">{memberNames.length > 0 ? memberNames.join(", ") : "Not yet allocated"}</span>
        </div>

        <StageTrack stage={production.sections.stage} compact />
        <div className="flex items-center justify-between mt-3 text-xs" style={{ color: C.mute, fontFamily: FONTS.mono }}>
          <span className="flex items-center gap-1"><Clock size={12} /> {STAGES.find((s) => s.id === production.sections.stage)?.label}</span>
          <span>{filled}/{totalFields} filled</span>
        </div>
      </div>
    </button>
  );
}

function ExampleCard({ production, onOpen }) {
  const theme = THEMES.find((t) => t.id === production.themeId);
  return (
    <button
      onClick={onOpen}
      className="flex text-left rounded-xl overflow-hidden w-full"
      style={{ background: C.card, border: `1px solid ${theme.color}55` }}
    >
      <FilmStripBar color={theme.color} height={8} orientation="vertical" />
      <div className="p-4 flex-1">
        <ThemeTag theme={theme} />
        <h3 style={{ color: C.ink, fontFamily: FONTS.display, fontSize: 24, letterSpacing: 0.5, textTransform: "uppercase", marginTop: 8, marginBottom: 4 }}>
          {production.filmTitle}
        </h3>
        <p className="text-xs mb-3" style={{ color: C.sub, fontFamily: FONTS.body }}>{production.tagline}</p>
        <StageTrack stage={production.stage} compact />
      </div>
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/*  PROJECT BRIEF (STATIC REFERENCE) VIEW                                  */
/* ---------------------------------------------------------------------- */
function BriefView({ onOpenExample }) {
  const [section, setSection] = useState("brief");
  const active = DOSSIER_SECTIONS.find((s) => s.key === section);

  return (
    <div className="grid grid-cols-4 gap-6">
      <div className="col-span-1 space-y-1">
        {DOSSIER_SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
            style={{
              background: section === s.key ? C.card : "transparent",
              color: section === s.key ? C.gold : C.sub,
              border: `1px solid ${section === s.key ? C.line : "transparent"}`,
              fontFamily: FONTS.body,
            }}
          >
            <BookOpen size={14} /> {s.label}
          </button>
        ))}
      </div>

      <div className="col-span-3">
        {active.key === "calendar" ? (
          <div>
            <p className="text-sm mb-4" style={{ color: C.sub, fontFamily: FONTS.body }}>
              The real EMIC session calendar for this project. Every production's Stage, set on its Overview tab, is one of these checkpoints.
            </p>
            <div className="space-y-2">
              {STAGES.map((s) => (
                <div key={s.id} className="flex items-stretch rounded-lg overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                  <div className="flex items-center justify-center px-4 py-3 flex-shrink-0" style={{ background: C.gold, minWidth: 120 }}>
                    <span className="text-sm font-bold" style={{ color: "#141414", fontFamily: FONTS.body }}>{s.label}</span>
                  </div>
                  <div className="flex items-center px-4 py-3" style={{ color: C.ink, fontFamily: FONTS.body, fontSize: 14 }}>
                    {s.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : active.key === "examples" ? (
          <div>
            <p className="text-sm mb-4" style={{ color: C.sub, fontFamily: FONTS.body }}>
              Two worked examples from a previous season, kept here for reference. Click either to see the full production dossier: pitch, budget, shot list, callsheets, and jury prep.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {EXAMPLE_PRODUCTIONS.map((ex) => (
                <ExampleCard key={ex.id} production={ex} onOpen={() => onOpenExample(ex.id)} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {active.body.map(([label, text]) => (
              <div key={label} className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>{label}</div>
                <p className="text-sm leading-relaxed" style={{ color: C.ink, fontFamily: FONTS.body }}>{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  SCHEDULE VIEW, one row per production so the whole cohort's progress   */
/*  is visible at a glance.                                                 */
/* ---------------------------------------------------------------------- */
function ScheduleView({ productions }) {
  return (
    <div>
      <p className="text-sm mb-4" style={{ color: C.sub, fontFamily: FONTS.body }}>
        Every group's current stage against the real EMIC calendar, in one view.
      </p>
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
        <div className="grid grid-cols-12 px-4 py-3 text-xs font-bold uppercase tracking-wide" style={{ background: C.cardAlt, color: C.mute }}>
          <div className="col-span-2">Theme</div>
          <div className="col-span-3">Title</div>
          <div className="col-span-2">Group</div>
          <div className="col-span-5">Stage</div>
        </div>
        {productions.map((p, i) => {
          const theme = THEMES.find((t) => t.id === p.themeId);
          const names = (p.sections.members || "").split(",").map((n) => n.trim()).filter(Boolean);
          const stageInfo = STAGES.find((s) => s.id === p.sections.stage);
          return (
            <div
              key={p.id}
              className="grid grid-cols-12 px-4 py-3 items-center text-sm"
              style={{ background: i % 2 === 0 ? C.card : C.panel, borderTop: `1px solid ${C.line}` }}
            >
              <div className="col-span-2 flex items-center gap-2">
                <span style={{ width: 8, height: 8, borderRadius: 999, background: theme.color, flexShrink: 0 }} />
                <span style={{ color: C.ink, fontFamily: FONTS.body, fontWeight: 600 }}>{theme.name}</span>
              </div>
              <div className="col-span-3" style={{ color: p.sections.filmTitle ? C.ink : C.mute, fontFamily: FONTS.body }}>
                {p.sections.filmTitle || "No title yet"}
              </div>
              <div className="col-span-2" style={{ color: names.length ? C.sub : C.mute, fontFamily: FONTS.body }}>
                {names.length ? names.join(", ") : "Not yet allocated"}
              </div>
              <div className="col-span-5">
                <StageTrack stage={p.sections.stage} compact />
                <div className="text-xs mt-1" style={{ color: C.mute, fontFamily: FONTS.mono }}>
                  {stageInfo?.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CONTACTS VIEW                                                           */
/* ---------------------------------------------------------------------- */
function ContactsView() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {CONTACTS.map((c) => (
        <div key={c.name} className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: C.gold }}>{c.role}</div>
          <div style={{ color: C.ink, fontFamily: FONTS.display, fontSize: 24, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.name}</div>
          <div className="mt-3 space-y-2 text-sm" style={{ fontFamily: FONTS.body }}>
            <div className="flex items-center gap-2" style={{ color: C.sub }}>
              <Phone size={14} /> {c.tel}
            </div>
            {c.emails.map((e) => (
              <div key={e} className="flex items-center gap-2" style={{ color: C.sub }}>
                <Mail size={14} /> {e}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  SCHOOL NOTES, shared. Gated behind the edit PIN, see EditGate.         */
/* ---------------------------------------------------------------------- */
function NotesView({ readOnly }) {
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await loadSchoolNotes();
      if (saved && typeof saved === "string") setNotes(saved);
      setLoaded(true);
    })();
  }, []);

  return (
    <div>
      <div className="flex items-start gap-2 mb-4 rounded-lg p-3" style={{ background: C.cardAlt, border: `1px solid ${C.line}` }}>
        <Lock size={16} style={{ color: C.gold, flexShrink: 0, marginTop: 2 }} />
        <p className="text-xs" style={{ color: C.sub, fontFamily: FONTS.body }}>
          Meant for Matt and team only. Anyone with the link can view this tab; enter the edit code to change it.
        </p>
      </div>
      {!loaded ? (
        <div className="text-sm" style={{ color: C.mute }}>Loading.</div>
      ) : readOnly ? (
        <StaticSection value={notes} emptyText="No notes yet." />
      ) : (
        <EditableSection
          value={notes}
          placeholder="Internal notes: group concerns, budget flags, jury scheduling, anything not meant for students."
          onSave={async (v) => {
            setNotes(v);
            await saveSchoolNotes(v);
          }}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  ROOT                                                                    */
/* ---------------------------------------------------------------------- */
export default function EmicProductionDatabase() {
  useCinemaFonts();

  const [view, setView] = useState("productions");
  const [productions, setProductions] = useState(DEFAULT_PRODUCTIONS);
  const [openId, setOpenId] = useState(null);
  const [openExampleId, setOpenExampleId] = useState(null);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [editPin, setEditPin] = useState(null);
  const [unlocked, setUnlocked] = useState(() => {
    try { return sessionStorage.getItem("emic-unlocked") === "1"; } catch { return false; }
  });

  useEffect(() => {
    (async () => {
      const merged = await Promise.all(
        DEFAULT_PRODUCTIONS.map(async (p) => {
          const saved = await loadProductionSections(p.id);
          return saved ? { ...p, sections: { ...p.sections, ...saved } } : p;
        })
      );
      setProductions(merged);
      setLoaded(true);
    })();
    (async () => {
      setEditPin(await fetchEditPin());
    })();
  }, []);

  const handleUnlock = (value) => {
    console.log("[EMIC DEBUG] handleUnlock", { value, editPin, typeofEditPin: typeof editPin });
    if (editPin != null && value === editPin) {
      setUnlocked(true);
      try { sessionStorage.setItem("emic-unlocked", "1"); } catch {}
      return true;
    }
    return false;
  };
  const handleLock = () => {
    setUnlocked(false);
    try { sessionStorage.removeItem("emic-unlocked"); } catch {}
  };

  const filtered = useMemo(() => {
    if (!search) return productions;
    const q = search.toLowerCase();
    return productions.filter((p) => {
      const theme = THEMES.find((t) => t.id === p.themeId);
      const haystack = `${theme?.name || ""} ${p.sections.filmTitle || ""} ${p.sections.tagline || ""} ${p.sections.members || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [productions, search]);

  const openProd = productions.find((p) => p.id === openId);
  const openExample = EXAMPLE_PRODUCTIONS.find((e) => e.id === openExampleId);

  const NAV = [
    { key: "brief", label: "Project Brief", icon: BookOpen },
    { key: "productions", label: "Productions", icon: FolderOpen },
    { key: "schedule", label: "Schedule", icon: ListChecks },
    { key: "contacts", label: "Contacts", icon: Phone },
    { key: "notes", label: "School Notes", icon: StickyNote },
  ];

  return (
    <div className="min-h-screen w-full" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, #171512 0%, ${C.bg} 60%)`, fontFamily: FONTS.body }}>
      <header className="flex flex-col items-center py-12 px-4" style={{ background: "#1F1F1F" }}>
        <img src={`data:image/png;base64,${LOGO_B64}`} alt="EMIC LAB SHORTS" style={{ height: 120, width: "auto", borderRadius: 8 }} />
        <div className="text-xs uppercase mt-5" style={{ color: C.sub, letterSpacing: 4, fontFamily: FONTS.body }}>
          Master II Audiovisuel · Season 2026 / 2027
        </div>
        <div className="text-base uppercase font-bold mt-1.5" style={{ color: C.gold, letterSpacing: 3, fontFamily: FONTS.body }}>
          EMIC LABS DATABASE V12
        </div>
      </header>
      <FilmStripBar color={C.silver} height={6} />

      <div className="sticky top-0 z-10 px-6 py-3 flex flex-wrap items-center gap-3" style={{ background: "#0d0d0df2", borderBottom: `1px solid ${C.line}` }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <Pill key={n.key} active={view === n.key} onClick={() => setView(n.key)}>
              <span className="flex items-center gap-1.5"><Icon size={14} /> {n.label}</span>
            </Pill>
          );
        })}

        {view === "productions" && (
          <div className="flex items-center gap-2 ml-2 px-3 py-2 rounded-md" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <Search size={14} style={{ color: C.mute }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by theme, title, or student name."
              className="bg-transparent outline-none text-sm w-64"
              style={{ color: C.ink, fontFamily: FONTS.body }}
            />
          </div>
        )}

        <div className="ml-auto">
          <EditGate unlocked={unlocked} onUnlock={handleUnlock} onLock={handleLock} />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {view === "brief" && <BriefView onOpenExample={(id) => setOpenExampleId(id)} />}

        {view === "productions" && (
          <>
            {!loaded && <div className="text-sm mb-4" style={{ color: C.mute }}>Loading saved edits.</div>}
            {filtered.length === 0 && (
              <div className="text-sm py-8 text-center" style={{ color: C.mute }}>
                No productions match "{search}".
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filtered.map((p) => (
                <ProductionCard key={p.id} production={p} onOpen={() => setOpenId(p.id)} />
              ))}
            </div>
          </>
        )}

        {view === "schedule" && <ScheduleView productions={productions} />}
        {view === "contacts" && <ContactsView />}
        {view === "notes" && <NotesView readOnly={!unlocked} />}
      </main>

      <footer className="text-center text-xs py-6" style={{ color: C.mute, fontFamily: FONTS.body }}>
        Shared live database. Edits save for everyone as you go.
      </footer>

      {openProd && (
        <ProductionDetail
          production={openProd}
          readOnly={!unlocked}
          onClose={() => setOpenId(null)}
          onUpdate={(next) => setProductions((prev) => prev.map((p) => (p.id === next.id ? next : p)))}
        />
      )}

      {openExample && (
        <ProductionDetail
          production={openExample}
          readOnly
          onClose={() => setOpenExampleId(null)}
          onUpdate={() => {}}
        />
      )}
    </div>
  );
}
