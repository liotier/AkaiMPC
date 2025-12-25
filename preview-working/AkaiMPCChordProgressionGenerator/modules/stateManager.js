// State Manager Module
// Centralized state management for the Chord Progression Generator

import { hasTouchCapability, hasHoverCapability, isLikelyTablet } from './constants.js';

// ============================================================================
// State Variables
// ============================================================================

let selectedKey = 'C';
let selectedMode = 'Major';
let selectedProgression = 'I—V—vi—IV';
let progressionName = '';
let variants = [];
let chordRequirements = [];
let currentContext = 'mpc'; // Current view context: 'mpc', 'keyboard', 'guitar', 'staff', or 'midi'
let isLeftHanded = false;
let hasGeneratedOnce = false;
let generationMode = 'template'; // 'template' or 'scale'

// Device capability detection (cached at startup)
const hasTouch = hasTouchCapability();
const hasHover = hasHoverCapability();
const isTablet = isLikelyTablet();

// Tablet interaction state
let voiceLeadingLocked = null;
let activeTooltip = null;

// ============================================================================
// State Getters
// ============================================================================

export function getSelectedKey() {
    return selectedKey;
}

export function getSelectedMode() {
    return selectedMode;
}

export function getSelectedProgression() {
    return selectedProgression;
}

export function getProgressionName() {
    return progressionName;
}

export function getVariants() {
    return variants;
}

export function getChordRequirements() {
    return chordRequirements;
}

export function getCurrentContext() {
    return currentContext;
}

export function getIsLeftHanded() {
    return isLeftHanded;
}

export function getHasGeneratedOnce() {
    return hasGeneratedOnce;
}

export function getGenerationMode() {
    return generationMode;
}

export function getHasTouch() {
    return hasTouch;
}

export function getHasHover() {
    return hasHover;
}

export function getIsTablet() {
    return isTablet;
}

export function getVoiceLeadingLocked() {
    return voiceLeadingLocked;
}

export function getActiveTooltip() {
    return activeTooltip;
}

// ============================================================================
// State Setters
// ============================================================================

export function setSelectedKey(key) {
    selectedKey = key;
}

export function setSelectedMode(mode) {
    selectedMode = mode;
}

export function setSelectedProgression(progression) {
    selectedProgression = progression;
}

export function setProgressionName(name) {
    progressionName = name;
}

export function setVariants(newVariants) {
    variants = newVariants;
}

export function setChordRequirements(requirements) {
    chordRequirements = requirements;
}

export function setCurrentContext(context) {
    currentContext = context;
}

export function setIsLeftHanded(leftHanded) {
    isLeftHanded = leftHanded;
}

export function setHasGeneratedOnce(value) {
    hasGeneratedOnce = value;
}

export function setGenerationMode(mode) {
    generationMode = mode;
}

export function setVoiceLeadingLocked(pad) {
    voiceLeadingLocked = pad;
}

export function setActiveTooltip(element) {
    activeTooltip = element;
}

// ============================================================================
// State Utilities
// ============================================================================

export function addChordRequirement(chord) {
    chordRequirements.push(chord);
}

export function removeChordRequirementAt(index) {
    chordRequirements.splice(index, 1);
}

export function clearAllChordRequirements() {
    chordRequirements = [];
}

// Expose state variables for debugging (read-only via getters)
export function exposeDebugState() {
    Object.defineProperty(globalThis, 'selectedKey', { get: () => selectedKey, configurable: true });
    Object.defineProperty(globalThis, 'selectedMode', { get: () => selectedMode, configurable: true });
    Object.defineProperty(globalThis, 'selectedProgression', { get: () => selectedProgression, configurable: true });
}
