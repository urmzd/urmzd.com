// Types for script letter mappings

export type ScriptType = 'latin' | 'arabic' | 'cyrillic';

export interface ArabicForms {
  isolated: string;
  initial: string;
  medial: string;
  final: string;
}

export interface Letter {
  character: string;
  name: string;
  ipa: string;
  audioHint: string;
}

export interface ArabicLetter extends Letter {
  forms: ArabicForms;
}

export interface LetterMapping {
  latin: Letter;
  arabic: ArabicLetter;
  cyrillic: Letter;
}

export interface ScriptConfig {
  name: string;
  direction: 'ltr' | 'rtl';
  fontFamily?: string;
}

// Script configurations
export const scriptConfigs: Record<ScriptType, ScriptConfig> = {
  latin: {
    name: 'Latin',
    direction: 'ltr',
  },
  arabic: {
    name: 'Arabic',
    direction: 'rtl',
    fontFamily: 'Amiri, "Noto Naskh Arabic", serif',
  },
  cyrillic: {
    name: 'Cyrillic',
    direction: 'ltr',
  },
};

// Complete letter mappings for all 26 letters
export const letterMappings: Record<string, LetterMapping> = {
  A: {
    latin: {
      character: 'A',
      name: 'A',
      ipa: '/eɪ/ or /æ/',
      audioHint: "like 'a' in 'father' or 'cat'",
    },
    arabic: {
      character: 'ا',
      name: 'Alif',
      ipa: '/ʔ/ or /aː/',
      audioHint: 'glottal stop or long "ah" sound',
      forms: { isolated: 'ا', initial: 'ا', medial: 'ـا', final: 'ـا' },
    },
    cyrillic: {
      character: 'А',
      name: 'A',
      ipa: '/a/',
      audioHint: "like 'a' in 'father'",
    },
  },
  B: {
    latin: {
      character: 'B',
      name: 'B',
      ipa: '/biː/',
      audioHint: "like 'b' in 'boy'",
    },
    arabic: {
      character: 'ب',
      name: 'Ba',
      ipa: '/b/',
      audioHint: "like 'b' in 'boy'",
      forms: { isolated: 'ب', initial: 'بـ', medial: 'ـبـ', final: 'ـب' },
    },
    cyrillic: {
      character: 'Б',
      name: 'Be',
      ipa: '/b/',
      audioHint: "like 'b' in 'boy'",
    },
  },
  C: {
    latin: {
      character: 'C',
      name: 'C',
      ipa: '/siː/',
      audioHint: "like 'c' in 'cat' or 'city'",
    },
    arabic: {
      character: 'ك',
      name: 'Kaf',
      ipa: '/k/',
      audioHint: "like 'k' in 'kite' (no soft C in Arabic)",
      forms: { isolated: 'ك', initial: 'كـ', medial: 'ـكـ', final: 'ـك' },
    },
    cyrillic: {
      character: 'Ц',
      name: 'Tse',
      ipa: '/ts/',
      audioHint: "like 'ts' in 'cats'",
    },
  },
  D: {
    latin: {
      character: 'D',
      name: 'D',
      ipa: '/diː/',
      audioHint: "like 'd' in 'dog'",
    },
    arabic: {
      character: 'د',
      name: 'Dal',
      ipa: '/d/',
      audioHint: "like 'd' in 'dog'",
      forms: { isolated: 'د', initial: 'د', medial: 'ـد', final: 'ـد' },
    },
    cyrillic: {
      character: 'Д',
      name: 'De',
      ipa: '/d/',
      audioHint: "like 'd' in 'dog'",
    },
  },
  E: {
    latin: {
      character: 'E',
      name: 'E',
      ipa: '/iː/',
      audioHint: "like 'e' in 'me' or 'bed'",
    },
    arabic: {
      character: 'ي',
      name: 'Ya',
      ipa: '/iː/ or /j/',
      audioHint: "like 'ee' in 'see' (Arabic uses Ya for E sounds)",
      forms: { isolated: 'ي', initial: 'يـ', medial: 'ـيـ', final: 'ـي' },
    },
    cyrillic: {
      character: 'Е',
      name: 'Ye',
      ipa: '/je/ or /e/',
      audioHint: "like 'ye' in 'yes' or 'e' in 'bed'",
    },
  },
  F: {
    latin: {
      character: 'F',
      name: 'F',
      ipa: '/ɛf/',
      audioHint: "like 'f' in 'fish'",
    },
    arabic: {
      character: 'ف',
      name: 'Fa',
      ipa: '/f/',
      audioHint: "like 'f' in 'fish'",
      forms: { isolated: 'ف', initial: 'فـ', medial: 'ـفـ', final: 'ـف' },
    },
    cyrillic: {
      character: 'Ф',
      name: 'Ef',
      ipa: '/f/',
      audioHint: "like 'f' in 'fish'",
    },
  },
  G: {
    latin: {
      character: 'G',
      name: 'G',
      ipa: '/dʒiː/',
      audioHint: "like 'g' in 'go'",
    },
    arabic: {
      character: 'غ',
      name: 'Ghayn',
      ipa: '/ɣ/',
      audioHint: "guttural 'g', like French 'r' (no hard G in classical Arabic)",
      forms: { isolated: 'غ', initial: 'غـ', medial: 'ـغـ', final: 'ـغ' },
    },
    cyrillic: {
      character: 'Г',
      name: 'Ge',
      ipa: '/ɡ/',
      audioHint: "like 'g' in 'go'",
    },
  },
  H: {
    latin: {
      character: 'H',
      name: 'H',
      ipa: '/eɪtʃ/',
      audioHint: "like 'h' in 'hat'",
    },
    arabic: {
      character: 'ه',
      name: 'Ha',
      ipa: '/h/',
      audioHint: "like 'h' in 'hat'",
      forms: { isolated: 'ه', initial: 'هـ', medial: 'ـهـ', final: 'ـه' },
    },
    cyrillic: {
      character: 'Х',
      name: 'Kha',
      ipa: '/x/',
      audioHint: "like 'ch' in Scottish 'loch'",
    },
  },
  I: {
    latin: {
      character: 'I',
      name: 'I',
      ipa: '/aɪ/',
      audioHint: "like 'i' in 'ice' or 'it'",
    },
    arabic: {
      character: 'ي',
      name: 'Ya',
      ipa: '/iː/',
      audioHint: "like 'ee' in 'see'",
      forms: { isolated: 'ي', initial: 'يـ', medial: 'ـيـ', final: 'ـي' },
    },
    cyrillic: {
      character: 'И',
      name: 'I',
      ipa: '/i/',
      audioHint: "like 'ee' in 'see'",
    },
  },
  J: {
    latin: {
      character: 'J',
      name: 'J',
      ipa: '/dʒeɪ/',
      audioHint: "like 'j' in 'jump'",
    },
    arabic: {
      character: 'ج',
      name: 'Jeem',
      ipa: '/dʒ/',
      audioHint: "like 'j' in 'jump'",
      forms: { isolated: 'ج', initial: 'جـ', medial: 'ـجـ', final: 'ـج' },
    },
    cyrillic: {
      character: 'Й',
      name: 'Short I',
      ipa: '/j/',
      audioHint: "like 'y' in 'yes'",
    },
  },
  K: {
    latin: {
      character: 'K',
      name: 'K',
      ipa: '/keɪ/',
      audioHint: "like 'k' in 'kite'",
    },
    arabic: {
      character: 'ك',
      name: 'Kaf',
      ipa: '/k/',
      audioHint: "like 'k' in 'kite'",
      forms: { isolated: 'ك', initial: 'كـ', medial: 'ـكـ', final: 'ـك' },
    },
    cyrillic: {
      character: 'К',
      name: 'Ka',
      ipa: '/k/',
      audioHint: "like 'k' in 'kite'",
    },
  },
  L: {
    latin: {
      character: 'L',
      name: 'L',
      ipa: '/ɛl/',
      audioHint: "like 'l' in 'love'",
    },
    arabic: {
      character: 'ل',
      name: 'Lam',
      ipa: '/l/',
      audioHint: "like 'l' in 'love'",
      forms: { isolated: 'ل', initial: 'لـ', medial: 'ـلـ', final: 'ـل' },
    },
    cyrillic: {
      character: 'Л',
      name: 'El',
      ipa: '/l/',
      audioHint: "like 'l' in 'love'",
    },
  },
  M: {
    latin: {
      character: 'M',
      name: 'M',
      ipa: '/ɛm/',
      audioHint: "like 'm' in 'mom'",
    },
    arabic: {
      character: 'م',
      name: 'Meem',
      ipa: '/m/',
      audioHint: "like 'm' in 'mom'",
      forms: { isolated: 'م', initial: 'مـ', medial: 'ـمـ', final: 'ـم' },
    },
    cyrillic: {
      character: 'М',
      name: 'Em',
      ipa: '/m/',
      audioHint: "like 'm' in 'mom'",
    },
  },
  N: {
    latin: {
      character: 'N',
      name: 'N',
      ipa: '/ɛn/',
      audioHint: "like 'n' in 'no'",
    },
    arabic: {
      character: 'ن',
      name: 'Nun',
      ipa: '/n/',
      audioHint: "like 'n' in 'no'",
      forms: { isolated: 'ن', initial: 'نـ', medial: 'ـنـ', final: 'ـن' },
    },
    cyrillic: {
      character: 'Н',
      name: 'En',
      ipa: '/n/',
      audioHint: "like 'n' in 'no'",
    },
  },
  O: {
    latin: {
      character: 'O',
      name: 'O',
      ipa: '/oʊ/',
      audioHint: "like 'o' in 'go'",
    },
    arabic: {
      character: 'و',
      name: 'Waw',
      ipa: '/uː/ or /w/',
      audioHint: "like 'oo' in 'moon' (Arabic uses Waw for O sounds)",
      forms: { isolated: 'و', initial: 'و', medial: 'ـو', final: 'ـو' },
    },
    cyrillic: {
      character: 'О',
      name: 'O',
      ipa: '/o/',
      audioHint: "like 'o' in 'more'",
    },
  },
  P: {
    latin: {
      character: 'P',
      name: 'P',
      ipa: '/piː/',
      audioHint: "like 'p' in 'pen'",
    },
    arabic: {
      character: 'پ',
      name: 'Pe',
      ipa: '/p/',
      audioHint: "like 'p' in 'pen' (Persian addition to Arabic script)",
      forms: { isolated: 'پ', initial: 'پـ', medial: 'ـپـ', final: 'ـپ' },
    },
    cyrillic: {
      character: 'П',
      name: 'Pe',
      ipa: '/p/',
      audioHint: "like 'p' in 'pen'",
    },
  },
  Q: {
    latin: {
      character: 'Q',
      name: 'Q',
      ipa: '/kjuː/',
      audioHint: "like 'q' in 'queen'",
    },
    arabic: {
      character: 'ق',
      name: 'Qaf',
      ipa: '/q/',
      audioHint: "deep 'k' sound from back of throat",
      forms: { isolated: 'ق', initial: 'قـ', medial: 'ـقـ', final: 'ـق' },
    },
    cyrillic: {
      character: 'К',
      name: 'Ka',
      ipa: '/k/',
      audioHint: "like 'k' in 'kite' (Cyrillic has no Q)",
    },
  },
  R: {
    latin: {
      character: 'R',
      name: 'R',
      ipa: '/ɑːr/',
      audioHint: "like 'r' in 'run'",
    },
    arabic: {
      character: 'ر',
      name: 'Ra',
      ipa: '/r/',
      audioHint: "rolled 'r' like Spanish",
      forms: { isolated: 'ر', initial: 'ر', medial: 'ـر', final: 'ـر' },
    },
    cyrillic: {
      character: 'Р',
      name: 'Er',
      ipa: '/r/',
      audioHint: "rolled 'r' like Spanish",
    },
  },
  S: {
    latin: {
      character: 'S',
      name: 'S',
      ipa: '/ɛs/',
      audioHint: "like 's' in 'sun'",
    },
    arabic: {
      character: 'س',
      name: 'Seen',
      ipa: '/s/',
      audioHint: "like 's' in 'sun'",
      forms: { isolated: 'س', initial: 'سـ', medial: 'ـسـ', final: 'ـس' },
    },
    cyrillic: {
      character: 'С',
      name: 'Es',
      ipa: '/s/',
      audioHint: "like 's' in 'sun'",
    },
  },
  T: {
    latin: {
      character: 'T',
      name: 'T',
      ipa: '/tiː/',
      audioHint: "like 't' in 'top'",
    },
    arabic: {
      character: 'ت',
      name: 'Ta',
      ipa: '/t/',
      audioHint: "like 't' in 'top'",
      forms: { isolated: 'ت', initial: 'تـ', medial: 'ـتـ', final: 'ـت' },
    },
    cyrillic: {
      character: 'Т',
      name: 'Te',
      ipa: '/t/',
      audioHint: "like 't' in 'top'",
    },
  },
  U: {
    latin: {
      character: 'U',
      name: 'U',
      ipa: '/juː/',
      audioHint: "like 'u' in 'use' or 'put'",
    },
    arabic: {
      character: 'و',
      name: 'Waw',
      ipa: '/uː/',
      audioHint: "like 'oo' in 'moon'",
      forms: { isolated: 'و', initial: 'و', medial: 'ـو', final: 'ـو' },
    },
    cyrillic: {
      character: 'У',
      name: 'U',
      ipa: '/u/',
      audioHint: "like 'oo' in 'moon'",
    },
  },
  V: {
    latin: {
      character: 'V',
      name: 'V',
      ipa: '/viː/',
      audioHint: "like 'v' in 'very'",
    },
    arabic: {
      character: 'ڤ',
      name: 'Ve',
      ipa: '/v/',
      audioHint: "like 'v' in 'very' (modern addition)",
      forms: { isolated: 'ڤ', initial: 'ڤـ', medial: 'ـڤـ', final: 'ـڤ' },
    },
    cyrillic: {
      character: 'В',
      name: 'Ve',
      ipa: '/v/',
      audioHint: "like 'v' in 'very'",
    },
  },
  W: {
    latin: {
      character: 'W',
      name: 'W',
      ipa: '/ˈdʌbəljuː/',
      audioHint: "like 'w' in 'water'",
    },
    arabic: {
      character: 'و',
      name: 'Waw',
      ipa: '/w/',
      audioHint: "like 'w' in 'water'",
      forms: { isolated: 'و', initial: 'و', medial: 'ـو', final: 'ـو' },
    },
    cyrillic: {
      character: 'В',
      name: 'Ve',
      ipa: '/v/',
      audioHint: "like 'v' in 'very' (Cyrillic has no W)",
    },
  },
  X: {
    latin: {
      character: 'X',
      name: 'X',
      ipa: '/ɛks/',
      audioHint: "like 'x' in 'box'",
    },
    arabic: {
      character: 'خ',
      name: 'Kha',
      ipa: '/x/',
      audioHint: "like 'ch' in Scottish 'loch'",
      forms: { isolated: 'خ', initial: 'خـ', medial: 'ـخـ', final: 'ـخ' },
    },
    cyrillic: {
      character: 'КС',
      name: 'Ka-Es',
      ipa: '/ks/',
      audioHint: "like 'x' in 'box' (combination of К and С)",
    },
  },
  Y: {
    latin: {
      character: 'Y',
      name: 'Y',
      ipa: '/waɪ/',
      audioHint: "like 'y' in 'yes'",
    },
    arabic: {
      character: 'ي',
      name: 'Ya',
      ipa: '/j/',
      audioHint: "like 'y' in 'yes'",
      forms: { isolated: 'ي', initial: 'يـ', medial: 'ـيـ', final: 'ـي' },
    },
    cyrillic: {
      character: 'Й',
      name: 'Short I',
      ipa: '/j/',
      audioHint: "like 'y' in 'yes'",
    },
  },
  Z: {
    latin: {
      character: 'Z',
      name: 'Z',
      ipa: '/zɛd/ or /ziː/',
      audioHint: "like 'z' in 'zoo'",
    },
    arabic: {
      character: 'ز',
      name: 'Zayn',
      ipa: '/z/',
      audioHint: "like 'z' in 'zoo'",
      forms: { isolated: 'ز', initial: 'ز', medial: 'ـز', final: 'ـز' },
    },
    cyrillic: {
      character: 'З',
      name: 'Ze',
      ipa: '/z/',
      audioHint: "like 'z' in 'zoo'",
    },
  },
};

/**
 * Get the letter mapping for a specific letter
 */
export function getLetterMapping(letter: string): LetterMapping | undefined {
  return letterMappings[letter.toUpperCase()];
}

/**
 * Get all letters for a specific script
 */
export function getScriptLetters(script: ScriptType): Letter[] | ArabicLetter[] {
  return Object.values(letterMappings).map((mapping) => mapping[script]);
}

/**
 * Translate a string of letters from source script to target script
 */
export function translateLetters(
  letters: string,
  targetScript: ScriptType,
  sourceScript: ScriptType = 'latin'
): Array<{ source: Letter | ArabicLetter; target: Letter | ArabicLetter } | null> {
  return letters.split('').map((letter) => {
    const mapping = getLetterMapping(letter);
    if (!mapping) return null;
    return {
      source: mapping[sourceScript],
      target: mapping[targetScript],
    };
  });
}
