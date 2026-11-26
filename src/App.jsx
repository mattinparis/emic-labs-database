import { useState, useEffect, useMemo, createContext, useContext } from "react";
import {
  Search, LayoutGrid, Sparkles, Wallet, Calendar, Film, ClipboardList,
  MessageCircle, X, Check, Clock, ChevronRight, BookOpen, FolderOpen, Users,
  Phone, Mail, StickyNote, Lock, Printer, Plus, Trash2, Package, ScrollText,
} from "lucide-react";
import { LOGO_B64 } from "./logo.js";
import { supabase } from "./supabaseClient.js";
import { STRINGS, FR_THEMES, FR_STAGES, FR_TABS, FR_CONTACT_ROLES, FR_DOSSIER, FR_EXAMPLES } from "./i18n.js";

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
  { id: "oct", label: "October", detail: "Intro & brief", classes: [1] },
  { id: "nov", label: "November", detail: "Groups & themes · Workshop Q&A", classes: [2, 3] },
  { id: "dec", label: "December", detail: "R&D · Statement of intent, script", classes: [4] },
  { id: "jan", label: "January", detail: "Pre-production · Pitch, location, budget", classes: [5] },
  { id: "feb", label: "February", detail: "Pre-production · Pitch, location, budget, contracts, means", classes: [6] },
  { id: "mar", label: "March", detail: "Shoot", classes: [7] },
  { id: "apr", label: "April", detail: "Shoot / post-production", classes: [8] },
  { id: "may", label: "May", detail: "1st screening · Internal rough cut viewing · Post-production", classes: [9] },
  { id: "jun", label: "June", detail: "Post-production · Final mix & exports, final jury screening", classes: [10] },
  { id: "jul", label: "July", detail: "Debrief · Full class on the season", classes: [11] },
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
      ["Format & length", "2 to 4 min (± 10 sec) · 16:9, 1080p minimum · Stereo, mastered at –14 LUFS · .MP4, H.264 or H.265 · credits included within the total running time"],
      ["Equipment", "iPhone (native camera or Filmic Pro) · motorized gimbal and/or tripod allowed · live sound (at least 1 synchronous on-location scene) · natural light preferred (at least 1 scene)"],
      ["Kit: image", "1 x iPhone Pro 512 Go · 1 x Cage iPhone + poignées · 1 x Stabilisateur smartphone type DJI Osmo Mobile · 1 x Trépied compact à tête fluide · 1 x Kit filtres ND + support · 1 x Micro moniteur (optionnel)"],
      ["Kit: sound", "1 x Kit HF cravate sans fil pour 2 personnes · 1 x Micro secours · 1 x Kit son perche · 1 x Enregistreur / interface · 2 x Casque de monitoring fermé"],
      ["Kit: lighting", "2 x Light panels LED/COB bicolores compactes · 2 x Pieds de lumière + diffuseurs · 1 x Réflecteur pliable"],
      ["Kit: chargers and backup", "1 x SSD externe renforcé 2 To · 1 x Batterie externe USB-C PD 20 000 mAh · 1 x Hub USB-C / câbles / support SSD · 1 x Station de charge centrale multiports USB-C PD"],
      ["Kit: misc", "1 x Trousse de consommables de production (consommables d'urgence) · 1 x Sac de production matelassé"],
      ["Required settings", "1 OUTDOOR sequence · 1 INDOOR sequence · 1 TRANSIT sequence. These apply to every group, regardless of theme."],
      ["Cast", "Max. 5 actors, min. 2 · Extras possible if required"],
      ["Music", "Royalty-free (CC) or original music with a signed rights transfer"],
      ["Budget template", "€1,000 EMIC Lab base allocation, a starting point, not a ceiling. Groups raise additional funds, justify every expense, and return any surplus to EMIC. Financial rigor is evaluated by the jury."],
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
        { stageId: "oct", done: true, date: "Oct 3", note: "Intro and brief" },
        { stageId: "nov", done: true, date: "Nov 20", note: "Groups and themes confirmed, workshop Q&A" },
        { stageId: "dec", done: true, date: "Dec 14", note: "Statement of intent submitted, scouting and script underway" },
        { stageId: "jan", done: true, date: "Jan 29", note: "Pitch, location and budget presented" },
        { stageId: "feb", done: true, date: "Feb 26", note: "Contracts signed, means and shoot plan confirmed" },
        { stageId: "mar", done: true, date: "Mar 25", note: "Shoot complete, rushes submitted" },
        { stageId: "apr", done: true, date: "Apr 10", note: "Post-production began, first assembly cut" },
        { stageId: "may", done: true, date: "May 28", note: "Internal rough cut screened" },
        { stageId: "jun", done: true, date: "Jun 20", note: "Final mix and exports delivered, final jury screening" },
        { stageId: "jul", done: true, date: "Jul 2", note: "Season debrief" },
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
      equipment: ["iPhone, native camera", "DJI Mic 2", "Gimbal", "Telephoto lens attachment", "2x Light Panels", "2x RF Mics", "1x Boom Mic", "1x Portable monitor", "IMAGE : 1 x iPhone Pro 512 Go", "IMAGE : 1 x Cage iPhone + poignées", "IMAGE : 1 x Stabilisateur smartphone type DJI Osmo Mobile", "IMAGE : 1 x Trépied compact à tête fluide", "IMAGE : 1 x Kit filtres ND + support", "IMAGE : 1 x Micro moniteur (optionnel)", "SON : 1 x Kit HF cravate sans fil pour 2 personnes", "SON : 1 x Micro secours", "SON : 1 x Kit son perche", "SON : 1 x Enregistreur / interface", "SON : 2 x Casque de monitoring fermé", "LUMIÈRE : 2 x Light panels LED/COB bicolores compactes", "LUMIÈRE : 2 x Pieds de lumière + diffuseurs", "LUMIÈRE : 1 x Réflecteur pliable", "CHARGEURS ET BACKUP : 1 x SSD externe renforcé 2 To", "CHARGEURS ET BACKUP : 1 x Batterie externe USB-C PD 20 000 mAh", "CHARGEURS ET BACKUP : 1 x Hub USB-C / câbles / support SSD", "CHARGEURS ET BACKUP : 1 x Station de charge centrale multiports USB-C PD", "DIVERS : 1 x Trousse de consommables de production (consommables d'urgence)", "DIVERS : 1 x Sac de production matelassé"],
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
        { stageId: "oct", done: true, date: "", note: "Intro and brief" },
        { stageId: "nov", done: true, date: "", note: "Groups and themes confirmed" },
        { stageId: "dec", done: true, date: "", note: "Statement of intent submitted" },
        { stageId: "jan", done: true, date: "", note: "Pitch, location and budget presented" },
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
/* School Notes and the PIN check go through Postgres functions (see the SQL
   in the deployment handoff), not direct table reads. That way the real PIN
   and the notes content never reach a browser that hasn't proven it knows
   the code, unlike a client-side comparison against a fetched value. */
async function verifyEditPin(candidate) {
  const { data, error } = await supabase.rpc("verify_edit_pin", { candidate });
  if (error) return false;
  return data === true;
}
/* School Notes has its own separate code (app_settings.notes_pin), distinct
   from the general edit PIN, so only staff who know it can get in. */
async function verifyNotesPin(candidate) {
  const { data, error } = await supabase.rpc("verify_notes_pin", { candidate });
  if (error) return false;
  return data === true;
}
async function loadSchoolNotes(pin) {
  const { data, error } = await supabase.rpc("get_school_notes", { candidate: pin });
  if (error) return null;
  return data;
}
async function saveSchoolNotes(pin, content) {
  const { data, error } = await supabase.rpc("set_school_notes", { candidate: pin, new_content: content });
  if (error) return false;
  return data === true;
}

/* ---------------------------------------------------------------------- */
/*  LANGUAGE, EN / FR. Components read their labels (t) and the localized  */
/*  reference content (themes, stages, brief, examples) from this context. */
/*  The choice is remembered per browser. Text groups type into their      */
/*  productions is shown as written, in whatever language they used.       */
/* ---------------------------------------------------------------------- */
const LangContext = createContext(null);
function useI18n() {
  return useContext(LangContext);
}

function buildLocale(lang) {
  const t = STRINGS[lang];
  if (lang !== "fr") {
    return { lang, t, THEMES, STAGES, TABS, CONTACTS, DOSSIER_SECTIONS, EXAMPLE_PRODUCTIONS };
  }
  return {
    lang,
    t,
    THEMES: THEMES.map((th) => ({ ...th, ...FR_THEMES[th.id] })),
    STAGES: STAGES.map((s) => ({ ...s, ...FR_STAGES[s.id] })),
    TABS: TABS.map((tab) => ({ ...tab, label: FR_TABS[tab.key] })),
    CONTACTS: CONTACTS.map((c) => ({ ...c, role: FR_CONTACT_ROLES[c.role] || c.role })),
    DOSSIER_SECTIONS: DOSSIER_SECTIONS.map((d) => ({ ...d, ...FR_DOSSIER[d.key] })),
    EXAMPLE_PRODUCTIONS: EXAMPLE_PRODUCTIONS.map((ex) => {
      const fr = FR_EXAMPLES[ex.id] || {};
      return { ...ex, ...fr, sections: { ...ex.sections, ...fr.sections } };
    }),
  };
}

/* Live productions are numbered in theme order, Group 1 to 6. The worked
   examples have their own ids, so they get no number. */
function groupNumber(productionId) {
  const i = THEMES.findIndex((th) => th.id === productionId);
  return i === -1 ? null : i + 1;
}

function readSavedLang() {
  try {
    const saved = localStorage.getItem("emic-lang");
    return saved === "fr" ? "fr" : "en";
  } catch {
    return "en";
  }
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

/* EN / FR switch, shown in the top bar and in every production's header. */
function LangToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div role="group" aria-label={t.language} className="flex rounded-md overflow-hidden flex-shrink-0" style={{ border: `1px solid ${C.line}` }}>
      {["en", "fr"].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className="px-2.5 py-2 text-xs font-bold tracking-wide"
          style={{ background: lang === l ? C.gold : C.card, color: lang === l ? "#141414" : C.sub, fontFamily: FONTS.body }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  EDIT GATE, a friction gate (not real security) for the shared PIN.     */
/*  Browsing is always open; entering the code unlocks editing for the     */
/*  rest of this browser session (see app_settings.edit_pin).              */
/* ---------------------------------------------------------------------- */
function EditGate({ unlocked, onUnlock, onLock }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [err, setErr] = useState(false);
  const [checking, setChecking] = useState(false);

  if (unlocked) {
    return (
      <button
        onClick={onLock}
        className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold"
        style={{ background: C.card, border: `1px solid ${C.line}`, color: "#27AE60", fontFamily: FONTS.body }}
      >
        <Lock size={13} /> {t.editingUnlocked}
      </button>
    );
  }

  const attempt = async () => {
    setChecking(true);
    const ok = await onUnlock(value);
    setChecking(false);
    if (ok) {
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
        <Lock size={13} /> {t.enterCode}
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
            placeholder={t.editCodePh}
            className="w-full rounded-md px-3 py-2 text-sm outline-none mb-2"
            style={{ background: C.card, border: `1px solid ${err ? "#E74C3C" : C.line}`, color: C.ink, fontFamily: FONTS.body }}
          />
          {err && (
            <div className="text-xs mb-2" style={{ color: "#E74C3C", fontFamily: FONTS.body }}>
              {t.incorrectCode}
            </div>
          )}
          <button
            onClick={attempt}
            disabled={checking}
            className="w-full px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
            style={{ background: C.gold, color: "#141414", opacity: checking ? 0.6 : 1 }}
          >
            {checking ? t.checking : t.unlock}
          </button>
        </div>
      )}
    </div>
  );
}

function StageTrack({ stage, compact }) {
  const { STAGES } = useI18n();
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
  const { t } = useI18n();
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
          {t.save}
        </button>
        {saved && !dirty && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
            <Check size={13} /> {t.saved}
          </span>
        )}
      </div>
    </div>
  );
}

function StaticSection({ value, emptyText }) {
  const { t } = useI18n();
  return (
    <div
      className="w-full rounded-lg p-4 text-sm leading-relaxed"
      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, whiteSpace: "pre-wrap", fontFamily: FONTS.body }}
    >
      {value && value.trim() ? value : <span style={{ color: C.mute }}>{emptyText || t.nothingRecorded}</span>}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  FILM TITLE & TAGLINE, the group's own creative identity within theme   */
/* ---------------------------------------------------------------------- */
function FilmTitleEditor({ title, tagline, onSave, readOnly }) {
  const { t } = useI18n();
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
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold, fontFamily: FONTS.body }}>{t.yourFilm}</div>
        <input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder={t.workingTitle}
          className="w-full mb-2 rounded-md px-3 py-2 text-sm outline-none"
          style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }}
          autoFocus
        />
        <input
          value={draftTagline}
          onChange={(e) => setDraftTagline(e.target.value)}
          placeholder={t.taglinePh}
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
            {t.save}
          </button>
          <button
            onClick={() => { setDraftTitle(title || ""); setDraftTagline(tagline || ""); setEditing(false); }}
            className="px-3 py-1.5 rounded-md text-xs font-semibold"
            style={{ color: C.mute }}
          >
            {t.cancel}
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
        <p className="text-sm" style={{ color: C.mute, fontFamily: FONTS.body }}>{t.noTitle}</p>
      )}
      <button onClick={() => setEditing(true)} className="text-xs font-semibold underline mt-1" style={{ color: C.sub, fontFamily: FONTS.body }}>
        {title ? t.editTitle : t.addTitle}
      </button>
      {saved && (
        <span className="text-xs ml-2 inline-flex items-center gap-1" style={{ color: "#27AE60" }}>
          <Check size={12} /> {t.saved}
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  GROUP MEMBERS, compact editable roster, visible across every tab       */
/* ---------------------------------------------------------------------- */
function GroupMembers({ value, onSave, readOnly }) {
  const { t } = useI18n();
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
          <Users size={13} /> {t.group}
        </span>
        {names.length > 0 ? (
          names.map((n) => (
            <span key={n} className="text-xs font-semibold px-2 py-1 rounded" style={{ background: C.cardAlt, color: C.ink }}>
              {n}
            </span>
          ))
        ) : (
          <span className="text-xs" style={{ color: C.mute }}>{t.notRecordedExample}</span>
        )}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mt-3 rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>
          <Users size={13} /> {t.assignedGroup}
        </div>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.membersPh}
          className="w-full rounded-md px-3 py-2 text-sm outline-none"
          style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }}
          autoFocus
        />
        <div className="text-xs mt-1.5 mb-3" style={{ color: C.mute }}>
          {t.separateCommas}
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
            {t.save}
          </button>
          <button
            onClick={() => { setDraft(value || ""); setEditing(false); }}
            className="px-3 py-1.5 rounded-md text-xs font-semibold"
            style={{ color: C.mute }}
          >
            {t.cancel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-start gap-2 flex-wrap">
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: C.gold }}>
        <Users size={13} /> {t.assignedGroup}
      </span>
      {names.length > 0 ? (
        names.map((n) => (
          <span key={n} className="text-xs font-semibold px-2 py-1 rounded" style={{ background: C.cardAlt, color: C.ink }}>
            {n}
          </span>
        ))
      ) : (
        <span className="text-xs" style={{ color: C.mute }}>{t.notAllocated}</span>
      )}
      <button onClick={() => setEditing(true)} className="text-xs font-semibold underline" style={{ color: C.sub }}>
        {names.length > 0 ? t.edit : t.allocate}
      </button>
      {saved && (
        <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
          <Check size={12} /> {t.saved}
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
  const { t } = useI18n();
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
        {t.budgetNote}
      </p>
      {list.length === 0 && <p className="text-sm mb-4" style={{ color: C.mute, fontFamily: FONTS.body }}>{t.noBudgetLines}</p>}
      {list.length > 0 && (
        <div className="grid grid-cols-12 gap-2 px-1 mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: C.mute }}>
          <div className="col-span-8">{t.item}</div>
          <div className="col-span-3">{t.amountEuros}</div>
        </div>
      )}
      <div className="space-y-2">
        {list.map((row, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center rounded-lg p-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <input value={row.label} onChange={(e) => update(i, "label", e.target.value)} placeholder={t.budgetItemPh} className="col-span-8 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
            <input value={row.amount} onChange={(e) => update(i, "amount", e.target.value)} placeholder="0" className="col-span-3 rounded-md px-2 py-1.5 text-sm outline-none" style={{ ...inputStyle, fontFamily: FONTS.mono }} />
            <button onClick={() => removeRow(i)} style={{ color: C.mute }} className="col-span-1 flex justify-center" aria-label={t.removeLine}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      {list.length > 0 && (
        <div className="flex items-center justify-between rounded-lg px-4 py-3 mt-3" style={{ background: C.cardAlt, border: `1px solid ${C.gold}55` }}>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.gold }}>{t.total}</span>
          <span className="text-lg font-bold" style={{ color: C.gold, fontFamily: FONTS.mono }}>{formatEuro(sumBudget(list))}</span>
        </div>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide" style={{ background: C.cardAlt, color: C.gold, border: `1px solid ${C.line}` }}>
          <Plus size={13} /> {t.addLine}
        </button>
        <button
          disabled={!dirty}
          onClick={async () => { await onSave(list); setDirty(false); setSaved(true); }}
          className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
          style={{ background: dirty ? C.gold : C.line, color: dirty ? "#141414" : C.mute, cursor: dirty ? "pointer" : "default" }}
        >
          {t.save}
        </button>
        {saved && !dirty && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
            <Check size={13} /> {t.saved}
          </span>
        )}
      </div>
    </div>
  );
}

function StaticBudget({ rows }) {
  const { t } = useI18n();
  if (!rows || rows.length === 0) {
    return (
      <div className="w-full rounded-lg p-4 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.mute, fontFamily: FONTS.body }}>
        {t.noBudgetExample}
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
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.gold }}>{t.total}</span>
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
  const { t, STAGES } = useI18n();
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
        {t.scheduleNote}
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
                  aria-label={t.markDone(s.label)}
                />
                <div className="flex-1">
                  <span className="text-sm font-bold" style={{ color: row.done ? "#27AE60" : C.ink, fontFamily: FONTS.body }}>{s.label}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 ml-7">
                <input
                  value={row.date}
                  onChange={(e) => update(row.stageId, "date", e.target.value)}
                  placeholder={t.actualDatePh}
                  className="rounded-md px-2 py-1.5 text-sm outline-none"
                  style={{ ...inputStyle, fontFamily: FONTS.mono }}
                />
                <input
                  value={row.note}
                  onChange={(e) => update(row.stageId, "note", e.target.value)}
                  placeholder={t.notePh}
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
          {t.save}
        </button>
        {saved && !dirty && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
            <Check size={13} /> {t.saved}
          </span>
        )}
      </div>
    </div>
  );
}

function StaticScheduleChecklist({ checklist }) {
  const { t, STAGES } = useI18n();
  if (!checklist || checklist.length === 0) {
    return (
      <div className="w-full rounded-lg p-4 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.mute, fontFamily: FONTS.body }}>
        {t.noScheduleExample}
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
  const { t } = useI18n();
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
      {list.length === 0 && <p className="text-sm mb-4" style={{ color: C.mute, fontFamily: FONTS.body }}>{t.noShots}</p>}
      <div className="space-y-3">
        {list.map((row, i) => (
          <div key={i} className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-start gap-2 mb-2">
              <div className="grid grid-cols-12 gap-2 flex-1">
                <input value={row.number} onChange={(e) => update(i, "number", e.target.value)} placeholder="01" className="col-span-1 rounded-md px-2 py-1.5 text-sm outline-none" style={{ ...inputStyle, fontFamily: FONTS.mono }} />
                <input value={row.location} onChange={(e) => update(i, "location", e.target.value)} placeholder={t.location} className="col-span-4 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
                <input value={row.duration} onChange={(e) => update(i, "duration", e.target.value)} placeholder={t.durationPh} className="col-span-4 rounded-md px-2 py-1.5 text-sm outline-none" style={{ ...inputStyle, fontFamily: FONTS.mono }} />
                <input value={row.framing} onChange={(e) => update(i, "framing", e.target.value)} placeholder={t.framing} className="col-span-3 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
              </div>
              <button onClick={() => removeRow(i)} style={{ color: C.mute }} aria-label={t.removeShot} className="flex-shrink-0 mt-1.5"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input value={row.characters} onChange={(e) => update(i, "characters", e.target.value)} placeholder={t.charactersPh} className="rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
              <input value={row.description} onChange={(e) => update(i, "description", e.target.value)} placeholder={t.actionPh} className="col-span-2 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide" style={{ background: C.cardAlt, color: C.gold, border: `1px solid ${C.line}` }}>
          <Plus size={13} /> {t.addShot}
        </button>
        <button
          disabled={!dirty}
          onClick={async () => { await onSave(list); setDirty(false); setSaved(true); }}
          className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
          style={{ background: dirty ? C.gold : C.line, color: dirty ? "#141414" : C.mute, cursor: dirty ? "pointer" : "default" }}
        >
          {t.save}
        </button>
        {saved && !dirty && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
            <Check size={13} /> {t.saved}
          </span>
        )}
      </div>
    </div>
  );
}

function StaticShotList({ rows }) {
  const { t } = useI18n();
  if (!rows || rows.length === 0) {
    return (
      <div className="w-full rounded-lg p-4 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.mute, fontFamily: FONTS.body }}>
        {t.noShotsExample}
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
          {r.characters && <div style={{ color: C.sub, fontSize: 13, marginTop: 2 }}>{t.characters}: {r.characters}</div>}
        </div>
      ))}
    </div>
  );
}

function ProductionStats({ stage, length, cast, shootDays, budgetEmic, budgetRaised, surplus, readOnly, onSave }) {
  const { t, STAGES } = useI18n();
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
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: C.gold }}>{t.editDetailsTitle}</div>
        <div>
          <label className="text-xs" style={{ color: C.mute }}>{t.stage}</label>
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
            <label className="text-xs" style={{ color: C.mute }}>{t.length}</label>
            <input value={d.length} onChange={(e) => setD({ ...d, length: e.target.value })} placeholder={t.lengthPh}
              className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
          </div>
          <div>
            <label className="text-xs" style={{ color: C.mute }}>{t.cast}</label>
            <input value={d.cast} onChange={(e) => setD({ ...d, cast: e.target.value })} placeholder={t.castPh}
              className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
          </div>
          <div>
            <label className="text-xs" style={{ color: C.mute }}>{t.shoot}</label>
            <input value={d.shootDays} onChange={(e) => setD({ ...d, shootDays: e.target.value })} placeholder={t.shootPh}
              className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs" style={{ color: C.mute }}>{t.budgetRaised}</label>
            <input value={d.budgetRaised} onChange={(e) => setD({ ...d, budgetRaised: e.target.value })} placeholder="0" inputMode="numeric"
              className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
          </div>
          <div>
            <label className="text-xs" style={{ color: C.mute }}>{t.surplusReturnedEuros}</label>
            <input value={d.surplus} onChange={(e) => setD({ ...d, surplus: e.target.value })} placeholder={t.leaveBlank} inputMode="numeric"
              className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={async () => { await onSave(d); setEditing(false); setSaved(true); }}
            className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
            style={{ background: C.gold, color: "#141414" }}
          >
            {t.save}
          </button>
          <button
            onClick={() => { setD({ stage, length, cast, shootDays, budgetRaised, surplus }); setEditing(false); }}
            className="px-3 py-1.5 rounded-md text-xs font-semibold"
            style={{ color: C.mute }}
          >
            {t.cancel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>{t.stage}</div>
        <StageTrack stage={stage} />
        <div className="text-xs mt-2" style={{ color: C.sub, fontFamily: FONTS.mono }}>
          {STAGES.find((s) => s.id === stage)?.label}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[[t.length, length || t.tbc], [t.cast, cast || t.tbc], [t.shoot, shootDays || t.tbc]].map(([label, val]) => (
          <div key={label} className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="text-xs uppercase tracking-wide" style={{ color: C.mute }}>{label}</div>
            <div className="text-sm font-semibold mt-1" style={{ color: C.ink }}>{val}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-xs uppercase tracking-wide" style={{ color: C.mute }}>{t.emicBase}</div>
          <div className="text-lg font-bold" style={{ color: C.gold, fontFamily: FONTS.mono }}>€{budgetEmic}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-xs uppercase tracking-wide" style={{ color: C.mute }}>{t.raised}</div>
          <div className="text-lg font-bold" style={{ color: C.ink, fontFamily: FONTS.mono }}>{raisedValid ? `€${raisedNum}` : t.tbc}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-xs uppercase tracking-wide" style={{ color: C.mute }}>{t.surplusReturned}</div>
          <div className="text-lg font-bold" style={{ color: "#27AE60", fontFamily: FONTS.mono }}>{surplusValid ? `€${surplusNum}` : t.tbc}</div>
        </div>
      </div>
      {!readOnly && (
        <button onClick={() => { setEditing(true); setSaved(false); }} className="text-xs font-semibold underline" style={{ color: C.sub }}>
          {t.editDetails}
        </button>
      )}
      {saved && (
        <span className="text-xs ml-2 inline-flex items-center gap-1" style={{ color: "#27AE60" }}>
          <Check size={12} /> {t.saved}
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
  const { t } = useI18n();
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
          {t.noCallsheets}
        </p>
      )}
      <div className="space-y-4">
        {list.map((entry, i) => (
          <div key={i} className="rounded-lg p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between mb-3">
              <input
                value={entry.day}
                onChange={(e) => updateField(i, "day", e.target.value)}
                placeholder={t.dayPh(i + 1)}
                className="text-xs font-bold uppercase tracking-widest outline-none bg-transparent"
                style={{ color: C.gold, fontFamily: FONTS.body, border: "none", width: "70%" }}
              />
              <button onClick={() => removeEntry(i)} style={{ color: C.mute }} aria-label={t.removeCallsheet}>
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs" style={{ color: C.mute }}>{t.location}</label>
                <input value={entry.location} onChange={(e) => updateField(i, "location", e.target.value)}
                  className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
              </div>
              <div>
                <label className="text-xs" style={{ color: C.mute }}>{t.scenesCovered}</label>
                <input value={entry.scenes} onChange={(e) => updateField(i, "scenes", e.target.value)}
                  className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs" style={{ color: C.mute }}>{t.notes}</label>
              <input value={entry.notes} onChange={(e) => updateField(i, "notes", e.target.value)}
                className="w-full mt-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }} />
            </div>

            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>{t.daySchedule}</div>
            <div className="space-y-2 mb-2">
              {entry.schedule.map((row, ri) => (
                <div key={ri} className="flex items-center gap-2">
                  <input value={row.time} onChange={(e) => updateRow(i, ri, "time", e.target.value)} placeholder="07:00"
                    style={{ width: 84, background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.mono }}
                    className="rounded-md px-2 py-1.5 text-sm outline-none flex-shrink-0" />
                  <input value={row.who} onChange={(e) => updateRow(i, ri, "who", e.target.value)} placeholder={t.whatHappensPh}
                    style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }}
                    className="flex-1 rounded-md px-3 py-1.5 text-sm outline-none" />
                  <button onClick={() => removeRow(i, ri)} style={{ color: C.mute }} aria-label={t.removeScheduleItem}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
            <button onClick={() => addRow(i)} className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.sub }}>
              <Plus size={12} /> {t.addScheduleItem}
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button onClick={addEntry} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide" style={{ background: C.cardAlt, color: C.gold, border: `1px solid ${C.line}` }}>
          <Plus size={13} /> {t.addCallsheet}
        </button>
        <button
          disabled={!dirty}
          onClick={async () => { await onSave(list); setDirty(false); setSaved(true); }}
          className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
          style={{ background: dirty ? C.gold : C.line, color: dirty ? "#141414" : C.mute, cursor: dirty ? "pointer" : "default" }}
        >
          {t.save}
        </button>
        {saved && !dirty && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
            <Check size={13} /> {t.saved}
          </span>
        )}
      </div>
    </div>
  );
}

function StaticCallsheets({ entries }) {
  const { t } = useI18n();
  if (!entries || entries.length === 0) {
    return (
      <div className="w-full rounded-lg p-4 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.mute, fontFamily: FONTS.body }}>
        {t.noCallsheetsExample}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <div key={i} className="rounded-lg p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>{entry.day || t.callsheetN(i + 1)}</div>
          <div className="text-sm space-y-1" style={{ color: C.ink, fontFamily: FONTS.body }}>
            {entry.location && <div><span style={{ color: C.mute }}>{t.location}: </span>{entry.location}</div>}
            {entry.scenes && <div><span style={{ color: C.mute }}>{t.scenesCovered}: </span>{entry.scenes}</div>}
            {entry.notes && <div><span style={{ color: C.mute }}>{t.notes}: </span>{entry.notes}</div>}
          </div>
          {entry.schedule && entry.schedule.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.mute }}>{t.daySchedule}</div>
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
  const { t } = useI18n();
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
          {t.noCast}
        </p>
      )}
      {list.length > 0 && (
        <div className="grid grid-cols-12 gap-2 px-1 mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: C.mute }}>
          <div className="col-span-3">{t.name}</div>
          <div className="col-span-3">{t.role}</div>
          <div className="col-span-2">{t.phone}</div>
          <div className="col-span-3">{t.email}</div>
        </div>
      )}
      <div className="space-y-2">
        {list.map((p, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center rounded-lg p-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <input value={p.name} onChange={(e) => update(i, "name", e.target.value)} placeholder={t.name} className="col-span-3 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
            <input value={p.role} onChange={(e) => update(i, "role", e.target.value)} placeholder={t.rolePh} className="col-span-3 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
            <input value={p.phone} onChange={(e) => update(i, "phone", e.target.value)} placeholder={t.phone} className="col-span-2 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
            <input value={p.email} onChange={(e) => update(i, "email", e.target.value)} placeholder={t.email} className="col-span-3 rounded-md px-2 py-1.5 text-sm outline-none" style={inputStyle} />
            <button onClick={() => removeEntry(i)} style={{ color: C.mute }} className="col-span-1 flex justify-center" aria-label={t.removePerson}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button onClick={addEntry} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide" style={{ background: C.cardAlt, color: C.gold, border: `1px solid ${C.line}` }}>
          <Plus size={13} /> {t.addPerson}
        </button>
        <button
          disabled={!dirty}
          onClick={async () => { await onSave(list); setDirty(false); setSaved(true); }}
          className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
          style={{ background: dirty ? C.gold : C.line, color: dirty ? "#141414" : C.mute, cursor: dirty ? "pointer" : "default" }}
        >
          {t.save}
        </button>
        {saved && !dirty && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
            <Check size={13} /> {t.saved}
          </span>
        )}
      </div>
    </div>
  );
}

function StaticCastCrew({ entries }) {
  const { t } = useI18n();
  if (!entries || entries.length === 0) {
    return (
      <div className="w-full rounded-lg p-4 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.mute, fontFamily: FONTS.body }}>
        {t.noCastExample}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {entries.map((p, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg p-3 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, fontFamily: FONTS.body }}>
          <span style={{ fontWeight: 700, minWidth: 100 }}>{p.name || t.unnamed}</span>
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
  const { t } = useI18n();
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
          <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} style={{ color: C.mute }} aria-label={t.removeItem}><Trash2 size={14} /></button>
        </div>
      ))}
      <button onClick={() => setItems([...items, ""])} className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.sub }}>
        <Plus size={12} /> {t.addItem}
      </button>
    </div>
  );
}

function EquipmentPropsEditor({ equipment, props, onSave }) {
  const { t } = useI18n();
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
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>{t.techEquipment}</div>
        {eq.length === 0 && <p className="text-sm mb-2" style={{ color: C.mute, fontFamily: FONTS.body }}>{t.nothingListed}</p>}
        <ChecklistRows items={eq} setItems={wrapEq} placeholder={t.equipPh} />
      </div>
      <div className="mb-4">
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>{t.propsAccessories}</div>
        {pr.length === 0 && <p className="text-sm mb-2" style={{ color: C.mute, fontFamily: FONTS.body }}>{t.nothingListed}</p>}
        <ChecklistRows items={pr} setItems={wrapPr} placeholder={t.propsPh} />
      </div>
      <div className="flex items-center gap-3">
        <button
          disabled={!dirty}
          onClick={async () => { await onSave({ equipment: eq.filter((x) => x !== ""), props: pr.filter((x) => x !== "") }); setDirty(false); setSaved(true); }}
          className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
          style={{ background: dirty ? C.gold : C.line, color: dirty ? "#141414" : C.mute, cursor: dirty ? "pointer" : "default" }}
        >
          {t.save}
        </button>
        {saved && !dirty && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#27AE60" }}>
            <Check size={13} /> {t.saved}
          </span>
        )}
      </div>
    </div>
  );
}

function StaticEquipmentProps({ equipment, props }) {
  const { t } = useI18n();
  const List = ({ items }) =>
    !items || items.length === 0 ? (
      <p className="text-sm" style={{ color: C.mute, fontFamily: FONTS.body }}>{t.noneRecorded}</p>
    ) : (
      <ul className="text-sm space-y-1" style={{ color: C.ink, fontFamily: FONTS.body }}>
        {items.map((item, i) => <li key={i}>· {item}</li>)}
      </ul>
    );
  return (
    <div>
      <div className="mb-5">
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>{t.techEquipment}</div>
        <List items={equipment} />
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gold }}>{t.propsAccessories}</div>
        <List items={props} />
      </div>
    </div>
  );
}


/* ---------------------------------------------------------------------- */
/*  PRINT VIEW, a clean white-background document for Print / Save as PDF  */
/* ---------------------------------------------------------------------- */
function PrintView({ production, theme, readOnly, onClose }) {
  const { t, STAGES } = useI18n();
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
      {text && text.trim() ? text : <span style={{ color: "#999" }}>{empty || t.notCompleted}</span>}
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
          {t.back}
        </button>
        <button
          onClick={() => window.print()}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, background: "#141414", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          {t.printPdf}
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px 80px", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <div style={{ borderBottom: `3px solid ${theme.color}`, paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: theme.color }}>{theme.name}{groupNumber(production.id) && ` · ${t.groupN(groupNumber(production.id))}`}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#111", marginTop: 4 }}>{title || t.untitled}</div>
          {tagline && <div style={{ fontSize: 14, color: "#555", marginTop: 2 }}>{tagline}</div>}
          <div style={{ fontSize: 10, color: "#999", marginTop: 10, letterSpacing: 0.5 }}>
            {t.printFooter}
          </div>
        </div>

        <Section label={t.productionDetails}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 13, color: "#222" }}>
            <div><b>{t.stage}:</b> {STAGES.find((s) => s.id === stage)?.label}</div>
            <div><b>{t.length}:</b> {length || t.tbc}</div>
            <div><b>{t.cast}:</b> {cast || t.tbc}</div>
            <div><b>{t.emicBase}:</b> €{production.budgetEmic}</div>
            <div><b>{t.raised}:</b> {raisedValid ? `€${raisedNum}` : t.tbc}</div>
            <div><b>{t.surplusReturned}:</b> {surplusValid ? `€${surplusNum}` : t.tbc}</div>
          </div>
          <div style={{ fontSize: 13, color: "#222", marginTop: 10 }}>
            <b>{t.group}:</b> {memberNames.length ? memberNames.join(", ") : (readOnly ? t.notRecordedExample : t.notAllocated)}
          </div>
        </Section>

        <Section label={t.pitchOutline}><Prose text={production.sections.pitch} /></Section>
        <Section label={t.script}><Prose text={production.sections.script} empty={t.noScript} /></Section>
        <Section label={t.budget}>
          {(!production.sections.budget || production.sections.budget.length === 0) ? (
            <Prose text="" empty={t.noBudget} />
          ) : (
            <>
              {production.sections.budget.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#222", marginBottom: 3 }}>
                  <span>{r.label}</span>
                  <span>{formatEuro(parseMoney(r.amount).value ?? 0)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#111", marginTop: 6, paddingTop: 6, borderTop: "1px solid #ddd" }}>
                <span>{t.total}</span>
                <span>{formatEuro(sumBudget(production.sections.budget))}</span>
              </div>
            </>
          )}
        </Section>
        <Section label={t.shootingSchedule}>
          {(!production.sections.schedule || production.sections.schedule.length === 0) ? (
            <Prose text="" empty={t.noSchedule} />
          ) : (
            STAGES.map((s) => {
              const row = (production.sections.schedule || []).find((r) => r.stageId === s.id);
              if (!row) return null;
              return (
                <div key={s.id} style={{ fontSize: 13, color: "#222", marginBottom: 3 }}>
                  <b>{row.done ? "✓" : "○"} {s.label}</b>
                  {row.date && <span style={{ color: "#666" }}> {t.actual(row.date)}</span>}
                  {row.note && <span> · {row.note}</span>}
                </div>
              );
            })
          )}
        </Section>
        <Section label={t.shotList}>
          {(!production.sections.shotlist || production.sections.shotlist.length === 0) ? (
            <Prose text="" empty={t.noShotsRec} />
          ) : (
            production.sections.shotlist.map((r, i) => (
              <div key={i} style={{ fontSize: 13, color: "#222", marginBottom: 6 }}>
                <b>{r.number}</b> {r.location}{r.duration ? `, ${r.duration}` : ""}{r.framing ? `, ${r.framing}` : ""}
                <div>{r.description}</div>
                {r.characters && <div style={{ color: "#666" }}>{t.characters}: {r.characters}</div>}
              </div>
            ))
          )}
        </Section>

        <Section label={t.castCrew}>
          {(!production.sections.castCrew || production.sections.castCrew.length === 0) ? (
            <Prose text="" empty={t.noCastRec} />
          ) : (
            production.sections.castCrew.map((p, i) => (
              <div key={i} style={{ fontSize: 13, color: "#222", marginBottom: 4 }}>
                <b>{p.name || t.unnamed}</b>{p.role ? `, ${p.role}` : ""}{p.phone ? ` · ${p.phone}` : ""}{p.email ? ` · ${p.email}` : ""}
              </div>
            ))
          )}
        </Section>

        <Section label={t.equipProps}>
          <div style={{ fontSize: 13, color: "#222" }}>
            <b>{t.techEquipment}:</b> {production.sections.equipment && production.sections.equipment.length ? production.sections.equipment.join(", ") : t.noneRecorded}
          </div>
          <div style={{ fontSize: 13, color: "#222", marginTop: 4 }}>
            <b>{t.propsAccessories}:</b> {production.sections.props && production.sections.props.length ? production.sections.props.join(", ") : t.noneRecorded}
          </div>
        </Section>

        <Section label={t.callSheets}>
          {callsheets.length === 0 ? (
            <Prose text="" empty={t.noCallsheetsRec} />
          ) : (
            callsheets.map((e, i) => (
              <div key={i} style={{ marginBottom: 14, fontSize: 13, color: "#222" }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{e.day || t.callsheetN(i + 1)}</div>
                {e.location && <div><b>{t.location}:</b> {e.location}</div>}
                {e.scenes && <div><b>{t.scenesCovered}:</b> {e.scenes}</div>}
                {e.notes && <div><b>{t.notes}:</b> {e.notes}</div>}
                {e.schedule && e.schedule.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <b>{t.daySchedule}:</b>
                    {e.schedule.map((row, ri) => <div key={ri} style={{ marginLeft: 12 }}>{row.time}: {row.who}</div>)}
                  </div>
                )}
              </div>
            ))
          )}
        </Section>

        <Section label={t.juryPrep}><Prose text={production.sections.jury} /></Section>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PRODUCTION DETAIL, shared by live theme slots and read-only examples   */
/* ---------------------------------------------------------------------- */
function ProductionDetail({ production, readOnly, onUpdate, onClose }) {
  const { t, THEMES, TABS } = useI18n();
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
              <div className="text-xl font-bold uppercase tracking-widest" style={{ color: C.ink, fontFamily: FONTS.body }}>
                {theme.name}
                {groupNumber(production.id) && <span style={{ color: theme.color }}> {t.groupN(groupNumber(production.id))}</span>}
              </div>
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
            <LangToggle />
            <button
              onClick={() => setPrintMode(true)}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
              style={{ color: C.sub }}
              title={t.exportPdfTitle}
            >
              <Printer size={15} /> {t.exportPdf}
            </button>
            <button onClick={onClose} style={{ color: C.mute }} aria-label={t.close}>
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
            : <EditableSection value={production.sections.pitch} placeholder={t.pitchPh} onSave={(v) => persist({ pitch: v })} />)}
          {tab === "script" && (readOnly
            ? <StaticSection value={production.sections.script} emptyText={t.noScriptExample} />
            : <EditableSection value={production.sections.script} placeholder={t.scriptPh} onSave={(v) => persist({ script: v })} />)}
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
            : <EditableSection value={production.sections.jury} placeholder={t.juryPh} onSave={(v) => persist({ jury: v })} />)}
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
  const { t, THEMES, STAGES } = useI18n();
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
          <div className="text-lg font-bold uppercase tracking-wide" style={{ color: C.ink, fontFamily: FONTS.body }}>
            {theme.name} <span style={{ color: theme.color }}>{t.groupN(groupNumber(production.id))}</span>
          </div>
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
            <div className="text-sm" style={{ color: C.mute, fontFamily: FONTS.body }}>{t.noTitleClick}</div>
          )}
        </div>

        <div className="flex items-center gap-1.5 mb-4 text-sm" style={{ color: memberNames.length ? C.sub : C.mute, fontFamily: FONTS.body }}>
          <Users size={14} />
          <span className="line-clamp-1">{memberNames.length > 0 ? memberNames.join(", ") : t.notAllocated}</span>
        </div>

        <StageTrack stage={production.sections.stage} compact />
        <div className="flex items-center justify-between mt-3 text-xs" style={{ color: C.mute, fontFamily: FONTS.mono }}>
          <span className="flex items-center gap-1"><Clock size={12} /> {STAGES.find((s) => s.id === production.sections.stage)?.label}</span>
          <span>{t.filled(filled, totalFields)}</span>
        </div>
      </div>
    </button>
  );
}

function ExampleCard({ production, onOpen }) {
  const { THEMES } = useI18n();
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
  const { t, STAGES, DOSSIER_SECTIONS, EXAMPLE_PRODUCTIONS } = useI18n();
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
            <div className="space-y-2">
              {STAGES.map((s) => (
                <div key={s.id} className="flex items-stretch rounded-lg overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                  <div className="flex items-center justify-center px-4 py-3 flex-shrink-0" style={{ background: C.gold, minWidth: 120 }}>
                    <span className="text-sm font-bold" style={{ color: "#141414", fontFamily: FONTS.body }}>{s.label}</span>
                  </div>
                  <div className="flex items-center px-4 py-3 flex-1" style={{ color: C.ink, fontFamily: FONTS.body, fontSize: 14 }}>
                    {s.detail}
                  </div>
                  <div className="flex items-center px-4 py-3 flex-shrink-0 text-xs font-bold" style={{ color: C.gold, fontFamily: FONTS.mono }}>
                    {t.classes(s.classes)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : active.key === "examples" ? (
          <div>
            <p className="text-sm mb-4" style={{ color: C.sub, fontFamily: FONTS.body }}>
              {t.examplesIntro}
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
/*  CONTACTS VIEW                                                           */
/* ---------------------------------------------------------------------- */
function ContactsView() {
  const { CONTACTS } = useI18n();
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
/*  SCHOOL NOTES, staff-only, gated by its OWN separate code (distinct      */
/*  from the general edit PIN). Content is never fetched without a         */
/*  verified code, see get_school_notes/set_school_notes/verify_notes_pin  */
/*  in Supabase.                                                            */
/* ---------------------------------------------------------------------- */
function NotesView() {
  const { t } = useI18n();
  const [pin, setPin] = useState(() => {
    try { return sessionStorage.getItem("emic-notes-pin"); } catch { return null; }
  });
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [value, setValue] = useState("");
  const [err, setErr] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!pin) {
      setNotes("");
      setLoaded(false);
      return;
    }
    (async () => {
      setLoaded(false);
      const saved = await loadSchoolNotes(pin);
      if (saved === null) {
        setPin(null);
        try { sessionStorage.removeItem("emic-notes-pin"); } catch {}
        return;
      }
      setNotes(saved);
      setLoaded(true);
    })();
  }, [pin]);

  if (!pin) {
    const attempt = async () => {
      setChecking(true);
      const ok = await verifyNotesPin(value);
      setChecking(false);
      if (ok) {
        setPin(value);
        try { sessionStorage.setItem("emic-notes-pin", value); } catch {}
        setValue("");
        setErr(false);
      } else {
        setErr(true);
      }
    };
    return (
      <div className="rounded-lg p-4" style={{ background: C.cardAlt, border: `1px solid ${C.line}`, maxWidth: 360 }}>
        <div className="flex items-start gap-2 mb-3">
          <Lock size={16} style={{ color: C.gold, flexShrink: 0, marginTop: 2 }} />
          <p className="text-xs" style={{ color: C.sub, fontFamily: FONTS.body }}>
            {t.staffOnly}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            autoFocus
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setErr(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") attempt(); }}
            placeholder={t.notesCodePh}
            className="flex-1 rounded-md px-3 py-2 text-sm outline-none"
            style={{ background: C.card, border: `1px solid ${err ? "#E74C3C" : C.line}`, color: C.ink, fontFamily: FONTS.body }}
          />
          <button
            onClick={attempt}
            disabled={checking}
            className="px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide"
            style={{ background: C.gold, color: "#141414", opacity: checking ? 0.6 : 1 }}
          >
            {checking ? t.checking : t.unlock}
          </button>
        </div>
        {err && (
          <div className="text-xs mt-2" style={{ color: "#E74C3C", fontFamily: FONTS.body }}>
            {t.incorrectCode}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start gap-2 mb-4 rounded-lg p-3" style={{ background: C.cardAlt, border: `1px solid ${C.line}` }}>
        <Lock size={16} style={{ color: C.gold, flexShrink: 0, marginTop: 2 }} />
        <p className="text-xs" style={{ color: C.sub, fontFamily: FONTS.body }}>
          {t.notesVisible}
        </p>
      </div>
      {!loaded ? (
        <div className="text-sm" style={{ color: C.mute }}>{t.loading}</div>
      ) : (
        <EditableSection
          value={notes}
          placeholder={t.notesPh}
          onSave={async (v) => {
            setNotes(v);
            await saveSchoolNotes(pin, v);
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

  const [lang, setLang] = useState(readSavedLang);
  const locale = useMemo(() => ({
    ...buildLocale(lang),
    setLang: (next) => {
      setLang(next);
      try { localStorage.setItem("emic-lang", next); } catch {}
    },
  }), [lang]);
  const { t } = locale;
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const [view, setView] = useState("productions");
  const [productions, setProductions] = useState(DEFAULT_PRODUCTIONS);
  const [openId, setOpenId] = useState(null);
  const [openExampleId, setOpenExampleId] = useState(null);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [unlockPin, setUnlockPin] = useState(() => {
    try { return sessionStorage.getItem("emic-unlock-pin"); } catch { return null; }
  });
  const unlocked = unlockPin != null;

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
  }, []);

  const handleUnlock = async (value) => {
    const ok = await verifyEditPin(value);
    if (ok) {
      setUnlockPin(value);
      try { sessionStorage.setItem("emic-unlock-pin", value); } catch {}
    }
    return ok;
  };
  const handleLock = () => {
    setUnlockPin(null);
    try { sessionStorage.removeItem("emic-unlock-pin"); } catch {}
  };

  const filtered = useMemo(() => {
    if (!search) return productions;
    const q = search.toLowerCase();
    return productions.filter((p) => {
      const theme = locale.THEMES.find((th) => th.id === p.themeId);
      const haystack = `${theme?.name || ""} ${t.groupN(groupNumber(p.id))} ${p.sections.filmTitle || ""} ${p.sections.tagline || ""} ${p.sections.members || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [productions, search, locale, t]);

  const openProd = productions.find((p) => p.id === openId);
  const openExample = locale.EXAMPLE_PRODUCTIONS.find((e) => e.id === openExampleId);

  const NAV = [
    { key: "brief", label: t.navBrief, icon: BookOpen },
    { key: "productions", label: t.navProductions, icon: FolderOpen },
    { key: "contacts", label: t.navContacts, icon: Phone },
    { key: "notes", label: t.navNotes, icon: StickyNote },
  ];

  return (
    <LangContext.Provider value={locale}>
    <div className="min-h-screen w-full" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, #171512 0%, ${C.bg} 60%)`, fontFamily: FONTS.body }}>
      <header className="flex flex-col items-center py-12 px-4" style={{ background: "#1F1F1F" }}>
        <img src={`data:image/png;base64,${LOGO_B64}`} alt="EMIC LAB SHORTS" style={{ height: 120, width: "auto", borderRadius: 8 }} />
        <div className="text-xs uppercase mt-5" style={{ color: C.sub, letterSpacing: 4, fontFamily: FONTS.body }}>
          {t.season}
        </div>
        <div className="text-base uppercase font-bold mt-1.5" style={{ color: C.gold, letterSpacing: 3, fontFamily: FONTS.body }}>
          EMIC LABS DATABASE
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
              placeholder={t.searchPh}
              className="bg-transparent outline-none text-sm w-64"
              style={{ color: C.ink, fontFamily: FONTS.body }}
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <LangToggle />
          <EditGate unlocked={unlocked} onUnlock={handleUnlock} onLock={handleLock} />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {view === "brief" && <BriefView onOpenExample={(id) => setOpenExampleId(id)} />}

        {view === "productions" && (
          <>
            {!loaded && <div className="text-sm mb-4" style={{ color: C.mute }}>{t.loadingEdits}</div>}
            {filtered.length === 0 && (
              <div className="text-sm py-8 text-center" style={{ color: C.mute }}>
                {t.noMatch(search)}
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filtered.map((p) => (
                <ProductionCard key={p.id} production={p} onOpen={() => setOpenId(p.id)} />
              ))}
            </div>
          </>
        )}

        {view === "contacts" && <ContactsView />}
        {view === "notes" && <NotesView />}
      </main>

      <footer className="text-center text-xs py-6" style={{ color: C.mute, fontFamily: FONTS.body }}>
        {t.footer}
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
    </LangContext.Provider>
  );
}
