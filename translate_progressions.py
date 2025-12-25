#!/usr/bin/env python3
"""
Helper script to translate progression descriptions from English to German.
This creates a template that can then be manually reviewed and refined.
"""

import json
import sys

# German musical terminology mappings
GERMAN_TERMS = {
    # Basic terms
    "progression": "Progression",
    "chord": "Akkord",
    "tonic": "Tonika",
    "dominant": "Dominante",
    "subdominant": "Subdominante",
    "resolution": "Auflösung",
    "tension": "Spannung",
    "cadence": "Kadenz",
    "voice leading": "Stimmführung",

    # Descriptive terms
    "creates": "Erzeugt",
    "provides": "Bietet",
    "moves": "Bewegt sich",
    "establishes": "Etabliert",
    "adds": "Fügt hinzu",
    "descends": "Steigt ab",
    "ascends": "Steigt auf",

    # Character/mood
    "dramatic": "dramatisch",
    "melancholic": "melancholisch",
    "emotional": "emotional",
    "bright": "hell",
    "dark": "dunkel",
    "smooth": "glatt/fließend",
    "powerful": "kraftvoll",
}

# Key phrases
KEY_PHRASES = {
    "The most popular progression": "Die beliebteste Progression",
    "The foundation of": "Die Grundlage von",
    "Used in": "Verwendet in",
    "Creates": "Erzeugt",
    "Perfect for": "Perfekt für",
    "Foundation of": "Grundlage von",
    "Characteristic of": "Charakteristisch für",
    "Common in": "Üblich in",
}

def read_english_file():
    with open('/home/user/AkaiMPC/AkaiMPCChordProgressionGenerator/locales/en.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    en_data = read_english_file()

    print("English progression descriptions to translate:")
    print("=" * 80)

    for category, progs in en_data.get("progressions", {}).items():
        print(f"\n### {category} ###\n")
        for prog_name, prog_data in progs.items():
            print(f"{prog_name} - {prog_data.get('nickname', '')}")
            print(f"  EN: {prog_data.get('description', '')}")
            print()

if __name__ == "__main__":
    main()
