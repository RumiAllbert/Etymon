import { atom } from "jotai";

// Core UI state atoms
export const isLoadingAtom = atom<boolean>(false);
export const showSimilarAtom = atom<boolean>(false);
export const inputValueAtom = atom<string>("");
export const showHistoryAtom = atom<boolean>(false);
export const currentRootAtom = atom<string | null>(null);

// Timeline panel atoms
export const showTimelinePanelAtom = atom<boolean>(false);
export const timelineWordAtom = atom<string | null>(null);

// Cognates panel atoms
export const showCognatesPanelAtom = atom<boolean>(false);
export const cognatesWordAtom = atom<string | null>(null);

// Word of the Day panel atom
export const showWotdPanelAtom = atom<boolean>(false);

// Word Family panel atoms
export const showWordFamilyAtom = atom<boolean>(false);
export const showTimelineAtom = atom<boolean>(false);
export const showCognatesAtom = atom<boolean>(false);
