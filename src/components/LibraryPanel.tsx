import React, { useState } from "react";
import {
  Box, Typography, Stack, Grid, TextField, InputAdornment,
  IconButton, Tooltip, Tabs, Tab, Card, CardActionArea
} from "@mui/material";
import { Search, X } from "lucide-react";

interface LibraryItem {
  id: string;
  name: string;
  type: "path" | "svg";
  content?: string;
  svgContent?: string;
  preview: string; // SVG preview markup
}

// ── SHAPES ──────────────────────────────────────────────
const SHAPES: LibraryItem[] = [
  { id: "heart", name: "Heart", type: "path", content: "M 50 85 C 50 85 10 60 10 35 C 10 15 30 15 50 30 C 70 15 90 15 90 35 C 90 60 50 85 50 85 Z", preview: `<path d="M12 21C12 21 4 15 4 9.5C4 6 6.5 4 9.5 5.5C11 6.3 12 8 12 8C12 8 13 6.3 14.5 5.5C17.5 4 20 6 20 9.5C20 15 12 21 12 21Z" fill="currentColor" opacity="0.3" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "star", name: "Star", type: "path", content: "M 50 5 L 63 38 L 98 38 L 70 59 L 81 91 L 50 72 L 19 91 L 30 59 L 2 38 L 37 38 Z", preview: `<polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" fill="currentColor" opacity="0.3" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "triangle", name: "Triangle", type: "path", content: "M 50 10 L 90 90 L 10 90 Z", preview: `<polygon points="12,3 22,21 2,21" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "hexagon", name: "Hexagon", type: "path", content: "M 50 10 L 90 30 L 90 70 L 50 90 L 10 70 L 10 30 Z", preview: `<polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "octagon", name: "Octagon", type: "path", content: "M 30 10 L 70 10 L 90 30 L 90 70 L 70 90 L 30 90 L 10 70 L 10 30 Z", preview: `<polygon points="8,2 16,2 22,8 22,16 16,22 8,22 2,16 2,8" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "pentagon", name: "Pentagon", type: "path", content: "M 50 10 L 90 40 L 75 90 L 25 90 L 10 40 Z", preview: `<polygon points="12,2 22,9 19,21 5,21 2,9" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "diamond", name: "Diamond", type: "path", content: "M 50 5 L 95 50 L 50 95 L 5 50 Z", preview: `<polygon points="12,2 22,12 12,22 2,12" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "cross", name: "Cross", type: "path", content: "M 35 10 L 65 10 L 65 35 L 90 35 L 90 65 L 65 65 L 65 90 L 35 90 L 35 65 L 10 65 L 10 35 L 35 35 Z", preview: `<path d="M8,3 L16,3 L16,8 L21,8 L21,16 L16,16 L16,21 L8,21 L8,16 L3,16 L3,8 L8,8 Z" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "arrow-right", name: "Arrow Right", type: "path", content: "M 10 35 L 60 35 L 60 15 L 90 50 L 60 85 L 60 65 L 10 65 Z", preview: `<path d="M3,8 L14,8 L14,3 L21,12 L14,21 L14,16 L3,16 Z" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "speech-bubble", name: "Speech Bubble", type: "path", content: "M 15 15 L 85 15 Q 90 15 90 20 L 90 60 Q 90 65 85 65 L 40 65 L 25 80 L 30 65 L 15 65 Q 10 65 10 60 L 10 20 Q 10 15 15 15 Z", preview: `<path d="M4,4 L20,4 Q21,4 21,5 L21,15 Q21,16 20,16 L10,16 L6,20 L7,16 L4,16 Q3,16 3,15 L3,5 Q3,4 4,4 Z" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "badge", name: "Badge", type: "path", content: "M 50 5 L 60 20 L 78 12 L 75 32 L 95 38 L 82 52 L 95 65 L 75 70 L 78 90 L 60 80 L 50 95 L 40 80 L 22 90 L 25 70 L 5 65 L 18 52 L 5 38 L 25 32 L 22 12 L 40 20 Z", preview: `<path d="M12,2 L14,6 L18,5 L17,9 L21,10 L18,13 L21,16 L17,17 L18,20 L14,19 L12,22 L10,19 L6,20 L7,17 L3,16 L6,13 L3,10 L7,9 L6,5 L10,6 Z" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "lightning", name: "Lightning", type: "path", content: "M 55 5 L 25 50 L 45 50 L 35 95 L 75 45 L 55 45 Z", preview: `<path d="M14,2 L6,12 L11,12 L8,22 L18,10 L13,10 Z" fill="currentColor" opacity="0.3" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "crescent", name: "Crescent", type: "path", content: "M 60 10 C 30 10 10 35 10 55 C 10 78 30 95 55 95 C 35 85 30 60 45 40 C 55 25 55 10 60 10 Z", preview: `<path d="M15,3 C8,3 3,8 3,13 C3,19 8,22 13,22 C8,19 7,14 10,9 C13,6 14,3 15,3 Z" fill="currentColor" opacity="0.3" stroke="currentColor" stroke-width="1.5"/>` },
];

// ── ICONS (Lucide-compatible 24x24 viewBox SVG markup) ──
const ICONS: LibraryItem[] = [
  { id: "i-home", name: "Home", type: "svg", svgContent: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="currentColor" stroke-width="2"/>`, preview: `<path d="M3,9 L12,2 L21,9 V20 A2,2 0 0 1 19,22 H5 A2,2 0 0 1 3,20 Z" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="9,22 9,12 15,12 15,22" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "i-search", name: "Search", type: "svg", svgContent: `<circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2"/>`, preview: `<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="20" y1="20" x2="16" y2="16" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "i-settings", name: "Settings", type: "svg", svgContent: `<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="currentColor" stroke-width="2"/>`, preview: `<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3"/>` },
  { id: "i-user", name: "User", type: "svg", svgContent: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/>`, preview: `<path d="M20,21 V19 A4,4 0 0 0 16,15 H8 A4,4 0 0 0 4,19 V21" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "i-mail", name: "Mail", type: "svg", svgContent: `<rect width="20" height="16" x="2" y="4" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="22 7 12 13 2 7" fill="none" stroke="currentColor" stroke-width="2"/>`, preview: `<rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="22,7 12,13 2,7" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "i-phone", name: "Phone", type: "svg", svgContent: `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" fill="none" stroke="currentColor" stroke-width="2"/>`, preview: `<path d="M22,17v3a2,2 0 0 1-2,2C10,22 2,14 2,4A2,2 0 0 1 4,2H7L9,7 7,9C8,11 13,16 15,15L17,13Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "i-camera", name: "Camera", type: "svg", svgContent: `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="2"/>`, preview: `<path d="M23,19A2,2 0 0 1 21,21H3A2,2 0 0 1 1,19V8A2,2 0 0 1 3,6H7L9,3H15L17,6H21A2,2 0 0 1 23,8Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "i-heart", name: "Heart", type: "svg", svgContent: `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="none" stroke="currentColor" stroke-width="2"/>`, preview: `<path d="M20.84,4.61 a5.5,5.5 0 0 0 -7.78,0 L12,5.67 l-1.06,-1.06 a5.5,5.5 0 0 0 -7.78,7.78 L12,21.23 l8.84,-8.84 a5.5,5.5 0 0 0 0,-7.78 Z" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "i-map-pin", name: "Location", type: "svg", svgContent: `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="2"/>`, preview: `<path d="M21,10c0,7-9,13-9,13s-9-6-9-13a9,9 0 0 1 18,0z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "i-clock", name: "Clock", type: "svg", svgContent: `<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" stroke-width="2"/>`, preview: `<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="12,6 12,12 16,14" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "i-calendar", name: "Calendar", type: "svg", svgContent: `<rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>`, preview: `<rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "i-wifi", name: "Wifi", type: "svg", svgContent: `<path d="M5 12.55a11 11 0 0 1 14.08 0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M1.42 9a16 16 0 0 1 21.16 0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="20" r="1" fill="currentColor"/>`, preview: `<path d="M5,12.55a11,11 0 0 1 14.08,0" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M1.42,9a16,16 0 0 1 21.16,0" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8.53,16.11a6,6 0 0 1 6.95,0" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="20" r="1" fill="currentColor"/>` },
  { id: "i-globe", name: "Globe", type: "svg", svgContent: `<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" fill="none" stroke="currentColor" stroke-width="2"/>`, preview: `<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1"/><path d="M12,2 a15.3,15.3 0 0 1 4,10 15.3,15.3 0 0 1 -4,10 15.3,15.3 0 0 1 -4,-10 15.3,15.3 0 0 1 4,-10z" fill="none" stroke="currentColor" stroke-width="1"/>` },
  { id: "i-share", name: "Share", type: "svg", svgContent: `<circle cx="18" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="19" r="3" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" stroke-width="2"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" stroke-width="2"/>`, preview: `<circle cx="18" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="18" cy="19" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" stroke-width="1.5"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "i-lock", name: "Lock", type: "svg", svgContent: `<rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" stroke-width="2"/>`, preview: `<rect x="3" y="11" width="18" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7,11 V7 A5,5 0 0 1 17,7 V11" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "i-zap", name: "Zap", type: "svg", svgContent: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="none" stroke="currentColor" stroke-width="2"/>`, preview: `<polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5"/>` },
];

// ── UI ELEMENTS ──────────────────────────────────────────
const UI_ELEMENTS: LibraryItem[] = [
  { id: "ui-button", name: "Button", type: "svg", svgContent: `<rect x="0" y="0" width="100" height="40" rx="8" fill="#22d3ee"/><text x="50" y="20" text-anchor="middle" dominant-baseline="central" fill="#020617" font-family="Inter,sans-serif" font-size="14" font-weight="700">Button</text>`, preview: `<rect x="3" y="7" width="18" height="10" rx="3" fill="#22d3ee"/><text x="12" y="12" text-anchor="middle" dominant-baseline="central" fill="#020617" font-size="5" font-weight="700">Button</text>` },
  { id: "ui-input", name: "Input Field", type: "svg", svgContent: `<rect x="0" y="0" width="100" height="36" rx="6" fill="none" stroke="#64748b" stroke-width="1.5"/><text x="12" y="18" dominant-baseline="central" fill="#94a3b8" font-family="Inter,sans-serif" font-size="12">Type here...</text>`, preview: `<rect x="2" y="8" width="20" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/><text x="5" y="12" dominant-baseline="central" fill="currentColor" font-size="3.5" opacity="0.4">Type here...</text>` },
  { id: "ui-checkbox", name: "Checkbox", type: "svg", svgContent: `<rect x="0" y="0" width="20" height="20" rx="4" fill="none" stroke="#22d3ee" stroke-width="2"/><polyline points="4 10 8 14 16 6" fill="none" stroke="#22d3ee" stroke-width="2.5"/>`, preview: `<rect x="7" y="7" width="10" height="10" rx="2" fill="none" stroke="#22d3ee" stroke-width="1.5"/><polyline points="9,12 11,14 15,10" fill="none" stroke="#22d3ee" stroke-width="1.5"/>` },
  { id: "ui-toggle", name: "Toggle", type: "svg", svgContent: `<rect x="0" y="5" width="50" height="26" rx="13" fill="#22d3ee"/><circle cx="37" cy="18" r="10" fill="white"/>`, preview: `<rect x="3" y="8" width="18" height="8" rx="4" fill="#22d3ee"/><circle cx="17" cy="12" r="3" fill="white"/>` },
  { id: "ui-card", name: "Card", type: "svg", svgContent: `<rect x="0" y="0" width="100" height="80" rx="12" fill="none" stroke="#334155" stroke-width="1.5"/><rect x="0" y="0" width="100" height="40" rx="12" fill="#1e293b"/><circle cx="15" cy="55" r="8" fill="#22d3ee" opacity="0.3"/><rect x="30" y="50" width="55" height="4" rx="2" fill="#475569"/><rect x="30" y="60" width="35" height="3" rx="1.5" fill="#334155"/>`, preview: `<rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/><rect x="3" y="3" width="18" height="8" rx="3" fill="currentColor" opacity="0.1"/><rect x="5" y="14" width="10" height="2" rx="1" fill="currentColor" opacity="0.3"/><rect x="5" y="17" width="6" height="1.5" rx="0.75" fill="currentColor" opacity="0.15"/>` },
  { id: "ui-avatar", name: "Avatar", type: "svg", svgContent: `<circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#22d3ee" stroke-width="2"/><circle cx="50" cy="38" r="16" fill="#22d3ee" opacity="0.3"/><path d="M20 80 Q 50 55 80 80" fill="#22d3ee" opacity="0.2"/>`, preview: `<circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.1" stroke="#22d3ee" stroke-width="1"/><circle cx="12" cy="9" r="3" fill="#22d3ee" opacity="0.4"/><path d="M6,18 Q12,13 18,18" fill="#22d3ee" opacity="0.3"/>` },
  { id: "ui-navbar", name: "Navbar", type: "svg", svgContent: `<rect x="0" y="0" width="100" height="20" rx="4" fill="#0f172a" stroke="#1e293b" stroke-width="1"/><circle cx="12" cy="10" r="4" fill="#22d3ee" opacity="0.5"/><rect x="25" y="8" width="15" height="3" rx="1.5" fill="#475569"/><rect x="45" y="8" width="15" height="3" rx="1.5" fill="#475569"/><rect x="65" y="8" width="15" height="3" rx="1.5" fill="#475569"/>`, preview: `<rect x="2" y="8" width="20" height="8" rx="2" fill="currentColor" opacity="0.08" stroke="currentColor" stroke-width="0.5" opacity="0.2"/><circle cx="5" cy="12" r="1.5" fill="#22d3ee" opacity="0.5"/><rect x="8" y="11" width="4" height="1.5" rx="0.75" fill="currentColor" opacity="0.3"/><rect x="13" y="11" width="4" height="1.5" rx="0.75" fill="currentColor" opacity="0.3"/><rect x="18" y="11" width="3" height="1.5" rx="0.75" fill="currentColor" opacity="0.3"/>` },
  { id: "ui-progress", name: "Progress Bar", type: "svg", svgContent: `<rect x="0" y="0" width="100" height="8" rx="4" fill="#1e293b"/><rect x="0" y="0" width="65" height="8" rx="4" fill="#22d3ee"/>`, preview: `<rect x="3" y="10" width="18" height="4" rx="2" fill="currentColor" opacity="0.1"/><rect x="3" y="10" width="12" height="4" rx="2" fill="#22d3ee"/>` },
];

// ── DECORATIVE / TEMPLATES ──────────────────────────────
const DECORATIVE: LibraryItem[] = [
  { id: "d-divider-dots", name: "Dot Divider", type: "svg", svgContent: `<circle cx="10" cy="50" r="4" fill="currentColor"/><circle cx="30" cy="50" r="4" fill="currentColor"/><circle cx="50" cy="50" r="4" fill="currentColor"/><circle cx="70" cy="50" r="4" fill="currentColor"/><circle cx="90" cy="50" r="4" fill="currentColor"/>`, preview: `<circle cx="4" cy="12" r="1.5" fill="currentColor" opacity="0.5"/><circle cx="8" cy="12" r="1.5" fill="currentColor" opacity="0.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.5"/><circle cx="16" cy="12" r="1.5" fill="currentColor" opacity="0.5"/><circle cx="20" cy="12" r="1.5" fill="currentColor" opacity="0.5"/>` },
  { id: "d-wavy-line", name: "Wavy Line", type: "path", content: "M 0 50 Q 15 30 30 50 Q 45 70 60 50 Q 75 30 90 50 Q 105 70 120 50", preview: `<path d="M2,12 Q6,6 10,12 Q14,18 18,12 Q22,6 24,12" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "d-bracket-l", name: "Left Bracket", type: "path", content: "M 60 10 Q 40 10 40 30 L 40 45 Q 40 50 30 50 Q 40 50 40 55 L 40 70 Q 40 90 60 90", preview: `<path d="M16,4 Q8,4 8,8 L8,10 Q8,12 5,12 Q8,12 8,14 L8,16 Q8,20 16,20" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "d-bracket-r", name: "Right Bracket", type: "path", content: "M 40 10 Q 60 10 60 30 L 60 45 Q 60 50 70 50 Q 60 50 60 55 L 60 70 Q 60 90 40 90", preview: `<path d="M8,4 Q16,4 16,8 L16,10 Q16,12 19,12 Q16,12 16,14 L16,16 Q16,20 8,20" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
  { id: "d-sunburst", name: "Sunburst", type: "svg", svgContent: `<circle cx="50" cy="50" r="15" fill="currentColor" opacity="0.3"/><line x1="50" y1="5" x2="50" y2="25" stroke="currentColor" stroke-width="2"/><line x1="50" y1="75" x2="50" y2="95" stroke="currentColor" stroke-width="2"/><line x1="5" y1="50" x2="25" y2="50" stroke="currentColor" stroke-width="2"/><line x1="75" y1="50" x2="95" y2="50" stroke="currentColor" stroke-width="2"/><line x1="18" y1="18" x2="32" y2="32" stroke="currentColor" stroke-width="2"/><line x1="68" y1="68" x2="82" y2="82" stroke="currentColor" stroke-width="2"/><line x1="82" y1="18" x2="68" y2="32" stroke="currentColor" stroke-width="2"/><line x1="18" y1="82" x2="32" y2="68" stroke="currentColor" stroke-width="2"/>`, preview: `<circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3"/><line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="5" y1="5" x2="8" y2="8" stroke="currentColor" stroke-width="1"/><line x1="16" y1="16" x2="19" y2="19" stroke="currentColor" stroke-width="1"/><line x1="19" y1="5" x2="16" y2="8" stroke="currentColor" stroke-width="1"/><line x1="5" y1="19" x2="8" y2="16" stroke="currentColor" stroke-width="1"/>` },
  { id: "d-ribbon", name: "Ribbon Banner", type: "path", content: "M 5 30 L 15 30 L 15 15 L 85 15 L 85 30 L 95 30 L 85 40 L 85 55 L 15 55 L 15 40 Z", preview: `<path d="M2,8 L5,8 L5,4 L19,4 L19,8 L22,8 L19,11 L19,16 L5,16 L5,11 Z" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1"/>` },
  { id: "d-wave-bg", name: "Wave BG", type: "path", content: "M 0 60 Q 25 40 50 55 Q 75 70 100 50 L 100 100 L 0 100 Z", preview: `<path d="M0,14 Q6,10 12,13 Q18,16 24,12 L24,22 L0,22 Z" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="0.5"/>` },
  { id: "d-circle-frame", name: "Circle Frame", type: "svg", svgContent: `<circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="4 4"/>`, preview: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="0.75" stroke-dasharray="2 2"/>` },
];

const ALL_TABS = [
  { label: "Shapes", items: SHAPES, accent: "#22d3ee" },
  { label: "Icons", items: ICONS, accent: "#4f8bff" },
  { label: "UI", items: UI_ELEMENTS, accent: "#a78bfa" },
  { label: "Decor", items: DECORATIVE, accent: "#fbbf24" },
];

interface LibraryPanelProps {
  onAddItem: (type: "path" | "svg", name: string, content?: string, svgContent?: string) => void;
  onClose: () => void;
  theme: "light" | "dark";
}

const LibraryPanel: React.FC<LibraryPanelProps> = ({ onAddItem, onClose }) => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);

  const currentTab = ALL_TABS[tab];
  const filtered = currentTab.items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box className="glass-panel" sx={{
      width: 300, height: "calc(100vh - 120px)",
      display: "flex", flexDirection: "column",
      boxShadow: "0 20px 40px rgba(0,0,0,0.4)", borderRadius: "16px"
    }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: currentTab.accent }} />
          <Typography className="heading-font" sx={{ fontWeight: 800, fontSize: "0.9rem", color: currentTab.accent }}>LIBRARY</Typography>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: "rgba(255,255,255,0.4)" }}><X size={18} /></IconButton>
      </Stack>

      <Box sx={{ p: 1.5 }}>
        <TextField
          fullWidth size="small" placeholder="Search elements..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={14} opacity={0.4} /></InputAdornment>,
            sx: { borderRadius: "10px", bgcolor: "rgba(255,255,255,0.03)", fontSize: "0.75rem" }
          }}
        />
      </Box>

      <Tabs
        value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
        sx={{ borderBottom: "1px solid rgba(255,255,255,0.08)", minHeight: 36, "& .MuiTabs-indicator": { bgcolor: currentTab.accent } }}
      >
        {ALL_TABS.map((t, i) => (
          <Tab key={i} label={t.label} sx={{ fontSize: "0.6rem", fontWeight: 700, minWidth: 0, minHeight: 36, color: "rgba(255,255,255,0.4)", "&.Mui-selected": { color: "#fff" } }} />
        ))}
      </Tabs>

      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 1.5, "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: "4px" } }}>
        <Typography sx={{ fontSize: "0.55rem", fontWeight: 700, opacity: 0.3, mb: 1, textTransform: "uppercase", letterSpacing: "1px" }}>
          {filtered.length} {currentTab.label}
        </Typography>
        <Grid container spacing={1}>
          {filtered.map(item => (
            <Grid key={item.id} size={tab >= 2 ? 6 : 4}>
              <Tooltip title={item.name} arrow placement="top">
                <Card sx={{
                  borderRadius: "10px",
                  bgcolor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  transition: "all 0.2s",
                  "&:hover": { transform: "scale(1.05)", borderColor: currentTab.accent, bgcolor: `${currentTab.accent}10` }
                }}>
                  <CardActionArea
                    onClick={() => onAddItem(item.type, item.name, item.content, item.svgContent)}
                    sx={{ p: 1.5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5 }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: currentTab.accent }}>
                      <g dangerouslySetInnerHTML={{ __html: item.preview }} />
                    </svg>
                    {tab >= 2 && (
                      <Typography sx={{ fontSize: "0.5rem", fontWeight: 700, opacity: 0.5, mt: 0.25 }}>{item.name}</Typography>
                    )}
                  </CardActionArea>
                </Card>
              </Tooltip>
            </Grid>
          ))}
        </Grid>

        {filtered.length === 0 && (
          <Box sx={{ py: 4, textAlign: "center", opacity: 0.3 }}>
            <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>No items found</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LibraryPanel;
