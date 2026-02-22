import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronDown, ChevronRight, Eye, EyeOff, Check, X, Clock, RotateCcw, Flag, Trophy, Star, Lock, Unlock, Play, Pause, Wrench, BookOpen, Terminal } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type MainTab = 'learn' | 'sandbox';
type Category = 'crypto' | 'web' | 'forensics' | 'reverse' | 'misc';
type Difficulty = 'Easy' | 'Medium' | 'Hard';
type WorkspaceTool = 'base64' | 'hex' | 'caesar';

interface Challenge {
  id: string;
  category: Category;
  title: string;
  difficulty: Difficulty;
  points: number;
  description: string;
  hints: string[];
  flag: string;
  solution: string;
}

// ─── Challenge Data ──────────────────────────────────────────────────────────

const CHALLENGES: Challenge[] = [
  // ── Cryptography ──
  {
    id: 'crypto-1',
    category: 'crypto',
    title: 'Decode the Message',
    difficulty: 'Easy',
    points: 50,
    description:
      'We intercepted an encoded message from a suspect. It appears to be Base64 encoded. Can you decode it and recover the flag?\n\nEncoded string:\nRkxBR3tiYXNlNjRfaXNfbm90X2VuY3J5cHRpb259',
    hints: [
      'Base64 uses characters A-Z, a-z, 0-9, +, and /.',
      'You can decode Base64 in the Workspace tab or with atob() in JS.',
      'Try: atob("RkxBR3tiYXNlNjRfaXNfbm90X2VuY3J5cHRpb259") in a browser console.',
    ],
    flag: 'FLAG{base64_is_not_encryption}',
    solution:
      'Base64 is an encoding, not encryption. Decoding "RkxBR3tiYXNlNjRfaXNfbm90X2VuY3J5cHRpb259" directly yields the flag. Use the Base64 tool in the Workspace or any online decoder.',
  },
  {
    id: 'crypto-2',
    category: 'crypto',
    title: "Caesar's Secret",
    difficulty: 'Easy',
    points: 75,
    description:
      'Julius Caesar used a simple substitution cipher to protect his military communications. This message was encrypted with a Caesar shift cipher.\n\nCiphertext: IODJ{fdhvdu_flskhu_lv_fodvvlfdo}\n\nThe shift value is 3.',
    hints: [
      'A Caesar cipher shifts each letter forward by a fixed amount.',
      'With a shift of 3: A becomes D, B becomes E, C becomes F.',
      'To decrypt, shift each letter BACKWARD by 3. I->F, O->L, D->A, J->G...',
    ],
    flag: 'FLAG{caesar_cipher_is_classical}',
    solution:
      'Shift every letter back by 3 positions. I->F, O->L, D->A, J->G giving "FLAG". Continue for the rest. Use the Caesar cipher tool in the Workspace with shift 23 (or -3).',
  },
  {
    id: 'crypto-3',
    category: 'crypto',
    title: 'Hex Marks the Spot',
    difficulty: 'Medium',
    points: 100,
    description:
      "We found this hexadecimal string scrawled in a suspect's notebook. Convert it to ASCII text to recover the hidden flag.\n\n464c41477b6865785f656e636f64696e675f756e7665696c65647d",
    hints: [
      'Each pair of hex digits represents one ASCII character.',
      '46 = 70 decimal = "F", 4c = 76 decimal = "L", 41 = 65 decimal = "A".',
      'Use the Hex tool in the Workspace or Python: bytes.fromhex("464c41...").decode()',
    ],
    flag: 'FLAG{hex_encoding_unveiled}',
    solution:
      'Convert each hex pair to its decimal value, then map to ASCII. 46->F, 4c->L, 41->A, 47->G, 7b->{, and so on. The Workspace hex decoder handles this automatically.',
  },
  {
    id: 'crypto-4',
    category: 'crypto',
    title: 'XOR Riddle',
    difficulty: 'Hard',
    points: 200,
    description:
      'The flag was XORed with a single repeating byte key. The ciphertext in hex is:\n\n27 39 26 24 58 41 4c 4e 52 46 4b 58 45 52 46 46 4a 58 52 40 44 48 5c\n\nYou know the flag format starts with "FLAG". Use the known plaintext to find the key byte, then decrypt the entire message.',
    hints: [
      'XOR is self-inverse: if A XOR K = C, then C XOR K = A.',
      'First byte 0x27 should decrypt to "F" (0x46). So key = 0x27 XOR 0x46 = 0x61.',
      '0x61 is 97 decimal, which is the letter "a". XOR every ciphertext byte with 0x61.',
      'After XOR with 0x61: 0x27->F, 0x39->L, 0x26->A, 0x24->G, 0x58->{, ...',
    ],
    flag: 'FLAG{xor_single_byte_cracked}',
    solution:
      'Use known-plaintext attack: the first byte 0x27 XOR "F"(0x46) = 0x61, which is the key. XOR each ciphertext byte with 0x61 to recover the full plaintext.',
  },

  // ── Web Security ──
  {
    id: 'web-1',
    category: 'web',
    title: 'Hidden in Plain Sight',
    difficulty: 'Easy',
    points: 50,
    description:
      'A developer forgot to remove something from the HTML source before deploying. Inspect the source code below to find the flag.\n\n<div class="login-page">\n  <form action="/login">\n    <input type="text" name="user" />\n    <input type="password" name="pass" />\n    <!-- TODO: Remove before deployment -->\n    <!-- FLAG{inspect_element_is_your_friend} -->\n    <button>Login</button>\n  </form>\n</div>',
    hints: [
      'HTML comments use the syntax <!-- comment -->.',
      'Developers sometimes leave debug info, credentials, or flags in comments.',
      'Look carefully at the comment above the <button> element.',
    ],
    flag: 'FLAG{inspect_element_is_your_friend}',
    solution:
      'The flag is sitting in an HTML comment: <!-- FLAG{inspect_element_is_your_friend} -->. Always view page source or use DevTools to find hidden comments.',
  },
  {
    id: 'web-2',
    category: 'web',
    title: 'Cookie Monster',
    difficulty: 'Medium',
    points: 100,
    description:
      'A web application stores authentication data in browser cookies. We captured this cookie:\n\nName: auth_token\nValue: eyJ1c2VyIjoiYWRtaW4iLCJmbGFnIjoiRkxBR3tjb29raWVzX3N0b3JlX3NlY3JldHN9In0=\n\nDecode the cookie value to extract the flag.',
    hints: [
      'The cookie value ends with "=" which is typical Base64 padding.',
      'After Base64 decoding, the result looks like JSON.',
      'Decode to get: {"user":"admin","flag":"FLAG{cookies_store_secrets}"}',
    ],
    flag: 'FLAG{cookies_store_secrets}',
    solution:
      'Base64 decode the cookie value. It decodes to a JSON string: {"user":"admin","flag":"FLAG{cookies_store_secrets}"}. Cookies should never store sensitive data in plaintext or simple encoding.',
  },
  {
    id: 'web-3',
    category: 'web',
    title: 'URL Secrets',
    difficulty: 'Medium',
    points: 100,
    description:
      'A web application passes data through URL query parameters. Decode this full URL to find the flag:\n\nhttps://example.com/page?data=RkxBR3t1cmxfcGFyYW1zX2FyZV92aXNpYmxlfQ%3D%3D\n\nThe "data" parameter contains encoded information.',
    hints: [
      '%3D is the URL-encoded form of the "=" character.',
      'After URL-decoding, the value becomes standard Base64.',
      'URL decode first: RkxBR3t1cmxfcGFyYW1zX2FyZV92aXNpYmxlfQ==, then Base64 decode.',
    ],
    flag: 'FLAG{url_params_are_visible}',
    solution:
      'First URL-decode %3D to "=", giving Base64 string "RkxBR3t1cmxfcGFyYW1zX2FyZV92aXNpYmxlfQ==". Then Base64 decode to get the flag. URL parameters are visible to anyone inspecting network traffic.',
  },

  // ── Forensics ──
  {
    id: 'forensics-1',
    category: 'forensics',
    title: 'Binary Transmission',
    difficulty: 'Easy',
    points: 75,
    description:
      'We intercepted a raw binary transmission from a compromised server. Convert this binary data to ASCII text:\n\n01000110 01001100 01000001 01000111 01111011 01100010 01101001 01101110 01100001 01110010 01111001 01011111 01110100 01101111 01011111 01110100 01100101 01111000 01110100 01111101',
    hints: [
      'Each group of 8 bits (one byte) represents a single ASCII character.',
      '01000110 = 70 in decimal = "F" in ASCII.',
      'Convert each byte: 01000110=F, 01001100=L, 01000001=A, 01000111=G, 01111011={, ...',
    ],
    flag: 'FLAG{binary_to_text}',
    solution:
      'Convert each 8-bit binary group to decimal, then look up the ASCII character. 01000110->70->F, 01001100->76->L, and so on.',
  },
  {
    id: 'forensics-2',
    category: 'forensics',
    title: 'Steganography Intro',
    difficulty: 'Medium',
    points: 125,
    description:
      'Steganography hides data within innocent-looking content. Read the first letter of each line in this "poem" to reveal a secret message:\n\nForever watching, the hawk soars high\nLanding softly on the ancient tree\nAlways searching for its prey below\nGliding through the evening sky\n{\nSilently it waits with eyes so keen\nThrough darkness and through light\nEach moment captured, nothing missed\nGently floating, a beautiful sight\nAlthough unseen, it\'s always there\nNesting high above the ground\nOver mountains, plains, and sea\n}',
    hints: [
      'Read only the FIRST character of each line.',
      'The lines starting with { and } are literal bracket characters.',
      'First letters: F, L, A, G, {, S, T, E, G, A, N, O, }',
    ],
    flag: 'FLAG{STEGANO}',
    solution:
      'Take the first character of each line: F-L-A-G-{-S-T-E-G-A-N-O-}. This is an acrostic, one of the simplest forms of text steganography.',
  },
  {
    id: 'forensics-3',
    category: 'forensics',
    title: 'Timestamp Mystery',
    difficulty: 'Hard',
    points: 175,
    description:
      'A forensic analyst found these numbers in a corrupted log file. They were labeled "timestamps" but the values are suspiciously small:\n\n70 76 65 71 123 116 105 109 101 115 116 97 109 112 95 97 110 97 108 121 115 105 115 125\n\nWhat could these numbers actually represent?',
    hints: [
      'Real Unix timestamps are very large numbers (billions). These are all under 130.',
      'Numbers in the range 65-125 fall neatly in the printable ASCII range.',
      'Convert each decimal number to its ASCII character: 70=F, 76=L, 65=A...',
    ],
    flag: 'FLAG{timestamp_analysis}',
    solution:
      'The "timestamps" are actually ASCII codes. Convert each decimal value to its character: 70=F, 76=L, 65=A, 71=G, 123={, 116=t, 105=i, 109=m, etc.',
  },

  // ── Reverse Engineering ──
  {
    id: 'reverse-1',
    category: 'reverse',
    title: 'Reverse the Logic',
    difficulty: 'Easy',
    points: 75,
    description:
      'Analyze this JavaScript function. What input will make it return true?\n\nfunction check(input) {\n  const target = "}.desrever_si_gnirts{GALF";\n  return input === target.split("").reverse().join("");\n}',
    hints: [
      'The function takes "target", splits it into characters, reverses them, and joins back.',
      'So the function compares input against the reversed version of target.',
      'Reverse "}.desrever_si_gnirts{GALF" to get the answer.',
    ],
    flag: 'FLAG{string_is_reversed.}',
    solution:
      'The function reverses the target string and compares it to input. Reversing "}.desrever_si_gnirts{GALF" gives "FLAG{string_is_reversed.}".',
  },
  {
    id: 'reverse-2',
    category: 'reverse',
    title: 'Array Mapping',
    difficulty: 'Medium',
    points: 125,
    description:
      'Trace the execution of this code to determine what "flag" evaluates to:\n\nconst encoded = [5, 11, 0, 6, 26, 12, 0, 15, 27, 18, 27, 10, 4, 24, 28];\nconst key = "abcdefghijklmnopqrstuvwxyz{}_";\nconst flag = encoded.map(i => key[i]).join("");\n\nconsole.log(flag); // What is printed?',
    hints: [
      'Each number in "encoded" is an index into the "key" string (0-indexed).',
      'key[5]="f", key[11]="l", key[0]="a", key[6]="g".',
      'Continue mapping: key[26]="{", key[12]="m", key[0]="a", key[15]="p", key[27]="_", ...',
    ],
    flag: 'flag{map_s_key}',
    solution:
      'Map each index to the key string character: 5->f, 11->l, 0->a, 6->g, 26->{, 12->m, 0->a, 15->p, 27->_, 18->s, 27->_, 10->k, 4->e, 24->y, 28->}. Result: "flag{map_s_key}".',
  },
  {
    id: 'reverse-3',
    category: 'reverse',
    title: 'Obfuscated Check',
    difficulty: 'Hard',
    points: 200,
    description:
      'Deobfuscate this password verification function to determine what input it accepts:\n\nfunction verify(s) {\n  if (s.length !== 18) return false;\n  if (s.charCodeAt(0) !== 70) return false;\n  if (s.charCodeAt(1) !== 76) return false;\n  if (s.charCodeAt(2) !== 65) return false;\n  if (s.charCodeAt(3) !== 71) return false;\n  if (s[4] !== "{") return false;\n  if (s.slice(5, 17) !== "d30bfu5c4t3d") return false;\n  if (s[17] !== "}") return false;\n  return true;\n}',
    hints: [
      'charCodeAt returns ASCII codes: 70="F", 76="L", 65="A", 71="G".',
      's[4] must be "{", s.slice(5,17) must be "d30bfu5c4t3d", s[17] must be "}".',
      'Combining all constraints: F + L + A + G + { + d30bfu5c4t3d + }',
    ],
    flag: 'FLAG{d30bfu5c4t3d}',
    solution:
      'Decode each charCodeAt value (70=F, 76=L, 65=A, 71=G), combine with the literal checks for "{", the slice "d30bfu5c4t3d", and "}". The accepted input is "FLAG{d30bfu5c4t3d}".',
  },

  // ── Misc ──
  {
    id: 'misc-1',
    category: 'misc',
    title: 'Morse Code',
    difficulty: 'Easy',
    points: 50,
    description:
      'Decode this Morse code transmission:\n\n..-. .-.. .- --. { -- --- .-. ... . ..--.- -.-. --- -.. . }',
    hints: [
      'Standard Morse: ..-. = F, .-.. = L, .- = A, --. = G.',
      '{ and } are literal characters (not Morse encoded).',
      'Continue: -- = M, --- = O, .-. = R, ... = S, . = E, ..--.- = _, -.-. = C, --- = O, -.. = D, . = E.',
    ],
    flag: 'FLAG{MORSE_CODE}',
    solution:
      'Decode each Morse group: ..-.=F, .-..=L, .-=A, --.=G, {, --=M, ---=O, .-.=R, ...=S, .=E, ..--.-=_, -.-.=C, ---=O, -..=D, .=E, }. Result: FLAG{MORSE_CODE}.',
  },
  {
    id: 'misc-2',
    category: 'misc',
    title: 'ROT13 or Nothing',
    difficulty: 'Easy',
    points: 50,
    description:
      'ROT13 is a Caesar cipher that shifts every letter by 13 positions. Since the alphabet has 26 letters, applying ROT13 twice returns the original text.\n\nDecrypt this ROT13 message:\nSYNT{ebg13_vf_vgf_bja_vairefr}',
    hints: [
      'ROT13 maps: A<->N, B<->O, C<->P, ..., M<->Z.',
      'S->F, Y->L, N->A, T->G, { stays, e->r, b->o, g->t...',
      'Apply ROT13 to each letter. Numbers, braces, and underscores are unchanged.',
    ],
    flag: 'FLAG{rot13_is_its_own_inverse}',
    solution:
      'Apply ROT13 letter substitution: S->F, Y->L, N->A, T->G, {, e->r, b->o, g->t, 1->1, 3->3, _->_, v->i, f->s, _->_, i->v, g->t, f->s, _->_, b->o, j->w, a->n, _->_, v->i, a->n, i->v, r->e, e->r, f->s, r->e, }.',
  },
  {
    id: 'misc-3',
    category: 'misc',
    title: 'Octal Oddity',
    difficulty: 'Medium',
    points: 100,
    description:
      'Convert these octal (base-8) numbers to ASCII characters to reveal the flag:\n\n106 114 101 107 173 157 143 164 141 154 137 146 165 156 175',
    hints: [
      'Octal uses digits 0-7 to represent numbers in base 8.',
      '106 (base 8) = 1*64 + 0*8 + 6 = 70 (decimal) = "F" in ASCII.',
      'Convert each: 106->70->F, 114->76->L, 101->65->A, 107->71->G, 173->123->{, ...',
    ],
    flag: 'FLAG{octal_fun}',
    solution:
      'Convert each octal number to decimal, then to ASCII: 106->70->F, 114->76->L, 101->65->A, 107->71->G, 173->123->{, 157->111->o, 143->99->c, 164->116->t, 141->97->a, 154->108->l, 137->95->_, 146->102->f, 165->117->u, 156->110->n, 175->125->}.',
  },
];

const CATEGORY_META: { id: Category; label: string; color: string }[] = [
  { id: 'crypto', label: 'Cryptography', color: 'from-amber-500 to-orange-500' },
  { id: 'web', label: 'Web Security', color: 'from-blue-500 to-cyan-500' },
  { id: 'forensics', label: 'Forensics', color: 'from-green-500 to-emerald-500' },
  { id: 'reverse', label: 'Reverse Eng.', color: 'from-purple-500 to-pink-500' },
  { id: 'misc', label: 'Misc', color: 'from-red-500 to-rose-500' },
];

const DIFF_STYLES: Record<Difficulty, string> = {
  Easy: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  Hard: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

// ─── Learn Tab Sections ──────────────────────────────────────────────────────

interface LearnSection {
  title: string;
  content: string;
}

const LEARN_SECTIONS: LearnSection[] = [
  {
    title: 'What is Capture The Flag (CTF)?',
    content: `A Capture The Flag (CTF) competition is a cybersecurity challenge where participants solve security-related puzzles to find hidden strings called "flags." These flags are typically formatted as FLAG{some_text_here} and prove that a participant successfully completed a challenge.

CTFs are one of the most popular and effective ways to learn cybersecurity skills in a hands-on, gamified environment. They are used by universities, companies, and security conferences worldwide to train and evaluate security talent. Unlike theoretical study, CTFs force you to apply knowledge to real (but safe) scenarios, building practical skills that translate directly to professional security work.

Participants range from absolute beginners learning their first encoding scheme to seasoned professionals practicing advanced exploitation techniques. The community is welcoming and educational resources are abundant.`,
  },
  {
    title: 'Types of CTF Competitions',
    content: `There are three main formats of CTF competitions:

JEOPARDY-STYLE: The most common format. Challenges are organized into categories (crypto, web, forensics, etc.) with varying point values based on difficulty. Teams solve challenges independently and earn points. Higher-difficulty challenges yield more points. This is the format used in the Sandbox tab of this tool.

ATTACK-DEFENSE: Each team is given an identical server or network with vulnerabilities. Teams must simultaneously defend their own systems by patching vulnerabilities while attacking other teams' systems to capture their flags. This format closely mirrors real-world security operations where you must both protect and assess systems.

MIXED / KING-OF-THE-HILL: Combines elements of both formats. Teams may solve jeopardy-style challenges while also competing for control of shared systems. Some mixed formats add time-based scoring where holding a position longer earns more points.

Most beginner-friendly CTFs use the Jeopardy format because it allows self-paced learning and covers a wide range of topics without requiring live attack infrastructure.`,
  },
  {
    title: 'Category: Cryptography',
    content: `Cryptography challenges test your understanding of encoding schemes, classical ciphers, modern encryption, and hashing algorithms.

ENCODING (not encryption): Base64, hexadecimal, binary, octal, URL encoding. These are reversible transformations that provide no security -- anyone can decode them. A critical first lesson: encoding is NOT encryption.

CLASSICAL CIPHERS: Caesar cipher (shift cipher), Vigenere cipher, substitution ciphers, transposition ciphers. These historical ciphers teach fundamental concepts but are easily broken with frequency analysis or brute force.

MODERN CRYPTOGRAPHY: RSA, AES, XOR-based encryption, stream ciphers. Challenges may involve exploiting weak key generation, small key sizes, ECB mode vulnerabilities, or padding oracle attacks.

HASHING: MD5, SHA-1, SHA-256. Challenges often involve cracking weak hashes, exploiting hash collisions, or understanding hash length extension attacks. A key concept: hashes are one-way functions -- you cannot "decrypt" a hash, only try to find inputs that produce the same output.

Common approach: Identify the encoding or cipher used, then apply the appropriate decoding or cryptanalysis technique.`,
  },
  {
    title: 'Category: Web Security',
    content: `Web security challenges focus on finding vulnerabilities in web applications. These are among the most practical CTF categories since web applications are everywhere.

HTML INSPECTION: Flags hidden in HTML comments, hidden form fields, JavaScript source code, or CSS. Always "View Source" first -- developers frequently leave debug information in client-side code.

COOKIES & SESSION DATA: Flags or clues stored in browser cookies, often encoded in Base64 or JWT (JSON Web Tokens). Tools like browser DevTools let you inspect, decode, and modify cookies.

URL PARAMETERS: Sensitive data passed through query strings (?key=value). Parameters may be encoded or contain hints about server-side logic. Manipulating URL parameters can reveal hidden functionality.

CLIENT-SIDE BYPASSES: JavaScript validation that can be bypassed by modifying the DOM, disabling scripts, or sending requests directly. Never trust client-side security controls -- they are merely convenience features, not real security boundaries.

Other web topics include SQL injection, cross-site scripting (XSS), directory traversal, server-side request forgery (SSRF), and authentication bypasses. These require understanding how web servers process requests.`,
  },
  {
    title: 'Category: Forensics',
    content: `Forensics challenges involve analyzing files, data, and digital artifacts to extract hidden information. This mirrors real-world digital forensics used in incident response and law enforcement.

FILE ANALYSIS: Examining file headers (magic bytes), file types, embedded data, and file system artifacts. A file's extension might not match its actual type -- always check the header bytes. Tools like "file" (Linux) and hex editors are essential.

STEGANOGRAPHY: Hiding data within images, audio, video, or text. Techniques include least-significant-bit (LSB) encoding in images, appending data after file EOF markers, hiding text in whitespace, or using acrostic patterns. Tools like steghide, zsteg, and stegsolve are commonly used.

METADATA: EXIF data in images (GPS coordinates, camera info, timestamps), document properties (author, creation date), and file system metadata (MAC times). The "strings" command and exiftool can reveal surprising amounts of hidden information.

MEMORY & DISK ANALYSIS: Advanced challenges may provide memory dumps or disk images for analysis. Tools like Volatility (memory forensics) and Autopsy (disk forensics) help reconstruct user activity, recover deleted files, and find malware artifacts.

NETWORK FORENSICS: Analyzing packet captures (PCAP files) with Wireshark to reconstruct network communications, extract transferred files, or find credentials sent in plaintext.`,
  },
  {
    title: 'Category: Reverse Engineering',
    content: `Reverse engineering challenges require analyzing compiled programs, obfuscated code, or complex logic to understand what a program does and how to extract the flag.

OBFUSCATED CODE: Reading and understanding deliberately obscured source code. Variable names may be meaningless, logic may be convoluted, and red herrings are common. Patience and methodical tracing are key skills.

BINARY ANALYSIS: Examining compiled executables using disassemblers (Ghidra, IDA Free) and debuggers (GDB, x64dbg). You learn to read assembly language, understand calling conventions, and trace program flow without source code.

STRING ANALYSIS: Running the "strings" command on a binary to extract readable text, which often contains flags, error messages, or clues about program behavior. This is usually the first step in any binary analysis.

DYNAMIC ANALYSIS: Running a program in a controlled environment (sandbox/debugger) and observing its behavior -- what files it accesses, what network connections it makes, what system calls it issues. Setting breakpoints at key decision points lets you understand the logic.

PATCHING: Modifying a binary's instructions to bypass checks, change program flow, or force specific behavior. This teaches how programs make decisions at the machine code level and how security checks can be circumvented.`,
  },
  {
    title: 'Category: OSINT (Open Source Intelligence)',
    content: `OSINT challenges test your ability to find publicly available information using search engines, social media, public databases, and other open sources.

SEARCH ENGINE TECHNIQUES: Advanced Google operators (site:, filetype:, inurl:, intitle:, cache:), reverse image search, and cached page viewing. Knowing how to construct precise search queries is a powerful skill.

SOCIAL MEDIA ANALYSIS: Extracting information from public profiles, posts, images, check-ins, and connections across platforms. People often share more than they realize.

GEOLOCATION: Determining a location from photographs by analyzing visible landmarks, signage, vegetation, architecture, sun position, and other environmental clues. Google Maps Street View and GeoGuessr skills are directly applicable.

PUBLIC RECORDS: Government databases, WHOIS records, DNS history, company registrations, court documents, and academic publications. Tools like Shodan (for internet-connected devices) and Censys provide infrastructure intelligence.

METADATA MINING: Extracting and cross-referencing metadata from documents, images, and other files to identify authors, locations, and timelines.

OSINT is arguably the most universally applicable CTF category -- these skills are used in journalism, law enforcement, competitive intelligence, and security research.`,
  },
  {
    title: 'How to Approach a CTF Challenge',
    content: `A systematic methodology helps you solve challenges efficiently:

1. READ CAREFULLY: Read the entire challenge description. Hints are often embedded in the text, title, or category. Note any specific numbers, formats, or keywords mentioned.

2. IDENTIFY THE TYPE: Determine what kind of challenge it is. Is the data encoded? Is there a cipher? Is it a web page to inspect? Categorizing the challenge narrows your approach.

3. START SIMPLE: Try the most basic techniques first. Check for Base64, hex encoding, ROT13, or simple ciphers before attempting complex cryptanalysis. Many challenges are simpler than they first appear.

4. USE YOUR TOOLS: Leverage CyberChef (the "Swiss Army Knife" of data transformation), command-line tools, programming languages, and specialized CTF tools. Do not try to do everything manually.

5. TAKE NOTES: Document what you have tried, what worked, and what did not. For multi-step challenges, tracking your progress prevents repeating dead ends.

6. COLLABORATE: CTFs are often team events. Different people bring different skills. Discussion frequently triggers insights that solitary work misses.

7. LEARN FROM WRITEUPS: After the competition, read writeups from other participants. You will discover alternative approaches and tools you did not know about. This is one of the most valuable learning opportunities.

8. DO NOT GIVE UP TOO QUICKLY: Struggling with a challenge builds more skill than reading the answer immediately. Use hints progressively and give yourself time to think before revealing solutions.`,
  },
  {
    title: 'Common Tools and Techniques',
    content: `Essential tools for CTF competitors at every level:

ENCODING/DECODING: CyberChef (web-based, handles hundreds of operations), command-line tools (base64, xxd, od), Python (the go-to scripting language for CTFs).

CRYPTOGRAPHY: hashcat and John the Ripper (password cracking), openssl (crypto operations), SageMath (mathematical analysis for RSA and number theory challenges), RsaCtfTool.

WEB SECURITY: Browser DevTools (inspect, console, network, storage tabs), Burp Suite (intercepting proxy for analyzing and modifying HTTP requests), curl/wget (command-line HTTP), DirBuster/gobuster (directory enumeration).

FORENSICS: Wireshark (packet analysis), Volatility (memory forensics), binwalk (firmware and embedded file extraction), exiftool (metadata extraction), steghide/zsteg/stegsolve (steganography).

REVERSE ENGINEERING: Ghidra (free, powerful disassembler/decompiler from the NSA), IDA Free (industry-standard disassembler), GDB (Linux debugger), x64dbg (Windows debugger), radare2 (command-line reverse engineering framework).

PROGRAMMING: Python is the dominant language in CTFs due to its rich library ecosystem (pwntools, requests, PIL, pycryptodome). Basic scripting ability dramatically accelerates your solving speed.

GENERAL: Linux command line proficiency, basic networking knowledge (TCP/IP, HTTP, DNS), and familiarity with common file formats are foundational skills that support all categories.`,
  },
  {
    title: 'How CTFs Build Real Security Skills',
    content: `CTFs are not just games -- they develop skills directly applicable to professional cybersecurity careers:

PENETRATION TESTING: Web and network CTF challenges mirror the techniques used by professional penetration testers to identify vulnerabilities in client systems.

INCIDENT RESPONSE: Forensics challenges replicate the analytical skills needed when responding to security breaches -- analyzing logs, memory dumps, network captures, and compromised systems.

SECURITY ENGINEERING: Understanding attack techniques through CTFs makes you a better defender. You learn what to protect against and why certain security controls matter.

MALWARE ANALYSIS: Reverse engineering challenges build the skills needed to analyze malicious software -- understanding what it does, how it communicates, and how to neutralize it.

CRYPTOGRAPHIC AWARENESS: Crypto challenges teach you which algorithms are safe, which are broken, and why implementation details matter as much as algorithm choice.

CAREER ADVANCEMENT: Many security employers actively recruit from CTF competitions. Platforms like CTFtime track team rankings globally. A strong CTF track record demonstrates practical skills that certifications alone cannot prove.

Notable platforms to practice: PicoCTF (beginner-friendly), HackTheBox, TryHackMe, OverTheWire (wargames), CTFtime.org (competition calendar and rankings).`,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export const CTFChallenge: React.FC = () => {
  // ── Top-level state ──
  const [mainTab, setMainTab] = useState<MainTab>('learn');

  // ── Learn state ──
  const [expandedLearnSection, setExpandedLearnSection] = useState<number | null>(0);

  // ── Sandbox state ──
  const [selectedCategory, setSelectedCategory] = useState<Category>('crypto');
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [flagInput, setFlagInput] = useState('');
  const [flagResult, setFlagResult] = useState<'correct' | 'incorrect' | null>(null);
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  const [showSolution, setShowSolution] = useState(false);

  // ── Timer state ──
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerInterval, setTimerIntervalState] = useState<ReturnType<typeof setInterval> | null>(null);

  // ── Workspace state ──
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [workspaceTool, setWorkspaceTool] = useState<WorkspaceTool>('base64');
  const [workspaceInput, setWorkspaceInput] = useState('');
  const [workspaceOutput, setWorkspaceOutput] = useState('');
  const [caesarShift, setCaesarShift] = useState(13);

  // ── Derived values ──
  const totalPoints = CHALLENGES.reduce((s, c) => s + (solvedIds.has(c.id) ? c.points : 0), 0);
  const maxPoints = CHALLENGES.reduce((s, c) => s + c.points, 0);
  const solvedCount = solvedIds.size;
  const categoryChallenges = CHALLENGES.filter(c => c.category === selectedCategory);

  // ── Timer helpers ──
  const formatTime = useCallback((secs: number): string => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const toggleTimer = useCallback(() => {
    if (timerRunning) {
      if (timerInterval) clearInterval(timerInterval);
      setTimerIntervalState(null);
      setTimerRunning(false);
    } else {
      const id = setInterval(() => setTimerSeconds(prev => prev + 1), 1000);
      setTimerIntervalState(id);
      setTimerRunning(true);
    }
  }, [timerRunning, timerInterval]);

  const resetTimer = useCallback(() => {
    if (timerInterval) clearInterval(timerInterval);
    setTimerIntervalState(null);
    setTimerRunning(false);
    setTimerSeconds(0);
  }, [timerInterval]);

  // ── Challenge actions ──
  const openChallenge = useCallback((ch: Challenge) => {
    setActiveChallenge(ch);
    setFlagInput('');
    setFlagResult(null);
    setRevealedHints(new Set());
    setShowSolution(false);
  }, []);

  const submitFlag = useCallback(() => {
    if (!activeChallenge || !flagInput.trim()) return;
    if (flagInput.trim() === activeChallenge.flag) {
      setFlagResult('correct');
      setSolvedIds(prev => new Set([...prev, activeChallenge.id]));
    } else {
      setFlagResult('incorrect');
    }
  }, [activeChallenge, flagInput]);

  const revealHint = useCallback((idx: number) => {
    setRevealedHints(prev => new Set([...prev, idx]));
  }, []);

  const resetAllProgress = useCallback(() => {
    setSolvedIds(new Set());
    resetTimer();
    setActiveChallenge(null);
  }, [resetTimer]);

  // ── Workspace tools ──
  const runWorkspaceTool = useCallback(() => {
    const input = workspaceInput;
    if (!input.trim()) {
      setWorkspaceOutput('');
      return;
    }
    try {
      switch (workspaceTool) {
        case 'base64': {
          // Try to detect if input is base64 and decode, otherwise encode
          try {
            const decoded = atob(input.trim());
            // Check if result is printable
            const isPrintable = /^[\x20-\x7E\r\n\t]*$/.test(decoded);
            if (isPrintable && decoded.length > 0) {
              setWorkspaceOutput(`Decoded (Base64 -> Text):\n${decoded}\n\n---\nEncoded (Text -> Base64):\n${btoa(input.trim())}`);
            } else {
              setWorkspaceOutput(`Encoded (Text -> Base64):\n${btoa(input.trim())}`);
            }
          } catch {
            setWorkspaceOutput(`Encoded (Text -> Base64):\n${btoa(input.trim())}`);
          }
          break;
        }
        case 'hex': {
          const trimmed = input.trim();
          // Try hex-to-text first
          const hexClean = trimmed.replace(/\s+/g, '').replace(/0x/g, '');
          if (/^[0-9a-fA-F]+$/.test(hexClean) && hexClean.length % 2 === 0) {
            let text = '';
            for (let i = 0; i < hexClean.length; i += 2) {
              text += String.fromCharCode(parseInt(hexClean.substring(i, i + 2), 16));
            }
            const isPrintable = /^[\x20-\x7E\r\n\t]*$/.test(text);
            if (isPrintable) {
              setWorkspaceOutput(`Decoded (Hex -> Text):\n${text}\n\n---\nEncoded (Text -> Hex):\n${trimmed.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')}`);
            } else {
              setWorkspaceOutput(`Encoded (Text -> Hex):\n${trimmed.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')}`);
            }
          } else {
            // Encode text to hex
            const hexEncoded = trimmed
              .split('')
              .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
              .join(' ');
            setWorkspaceOutput(`Encoded (Text -> Hex):\n${hexEncoded}`);
          }
          break;
        }
        case 'caesar': {
          const shift = ((caesarShift % 26) + 26) % 26;
          const result = input
            .split('')
            .map(ch => {
              if (ch >= 'A' && ch <= 'Z') {
                return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65);
              }
              if (ch >= 'a' && ch <= 'z') {
                return String.fromCharCode(((ch.charCodeAt(0) - 97 + shift) % 26) + 97);
              }
              return ch;
            })
            .join('');
          const reverseResult = input
            .split('')
            .map(ch => {
              if (ch >= 'A' && ch <= 'Z') {
                return String.fromCharCode(((ch.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
              }
              if (ch >= 'a' && ch <= 'z') {
                return String.fromCharCode(((ch.charCodeAt(0) - 97 - shift + 26) % 26) + 97);
              }
              return ch;
            })
            .join('');
          setWorkspaceOutput(`Shift +${shift} (encrypt):\n${result}\n\nShift -${shift} (decrypt):\n${reverseResult}`);
          break;
        }
      }
    } catch (err) {
      setWorkspaceOutput(`Error: ${err instanceof Error ? err.message : 'Processing failed'}`);
    }
  }, [workspaceInput, workspaceTool, caesarShift]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-green-50 dark:from-gray-950 dark:to-green-950 p-3 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Capture The Flag</h2>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Learn CTF fundamentals and solve hands-on challenges
          </p>
        </div>
      </div>

      {/* ── Main Tab Switcher ── */}
      <div className="flex gap-1 mb-3 flex-shrink-0">
        <button
          onClick={() => setMainTab('learn')}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg font-semibold transition-all ${
            mainTab === 'learn'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Learn
        </button>
        <button
          onClick={() => setMainTab('sandbox')}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg font-semibold transition-all ${
            mainTab === 'sandbox'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Sandbox
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* LEARN TAB                                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {mainTab === 'learn' && (
        <div className="flex-1 min-h-0 overflow-auto space-y-1.5 pr-1">
          {LEARN_SECTIONS.map((section, idx) => {
            const isExpanded = expandedLearnSection === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedLearnSection(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className="text-xs font-bold text-gray-900 dark:text-white pr-4">
                    {section.title}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
                    <pre className="text-[11px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed mt-3">
                      {section.content}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SANDBOX TAB                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {mainTab === 'sandbox' && (
        <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
          {/* ── Scoreboard & Controls Row ── */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {/* Score */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {totalPoints}
                <span className="text-gray-400 font-normal">/{maxPoints}</span>
              </span>
            </div>
            {/* Solved */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5">
              <Flag className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {solvedCount}
                <span className="text-gray-400 font-normal">/{CHALLENGES.length}</span>
              </span>
            </div>
            {/* Progress bar */}
            <div className="flex-1 min-w-[80px] h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
              {maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0}%
            </span>

            {/* Timer toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1">
              <button
                onClick={() => {
                  if (timerEnabled) {
                    resetTimer();
                    setTimerEnabled(false);
                  } else {
                    setTimerEnabled(true);
                  }
                }}
                className={`p-0.5 rounded transition-colors ${timerEnabled ? 'text-green-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title={timerEnabled ? 'Disable timer' : 'Enable timer'}
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
              {timerEnabled && (
                <>
                  <span className="text-[11px] font-mono font-bold text-gray-800 dark:text-gray-200 min-w-[52px] text-center">
                    {formatTime(timerSeconds)}
                  </span>
                  <button
                    onClick={toggleTimer}
                    className="p-0.5 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                    title={timerRunning ? 'Pause' : 'Start'}
                  >
                    {timerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Reset timer"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>

            {/* Workspace toggle */}
            <button
              onClick={() => setShowWorkspace(prev => !prev)}
              className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-semibold rounded-lg border transition-all ${
                showWorkspace
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <Wrench className="w-3 h-3" />
              Workspace
            </button>

            {/* Reset */}
            <button
              onClick={resetAllProgress}
              className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-semibold rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* ── Workspace Panel (collapsible) ── */}
          {showWorkspace && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-800 p-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-blue-500" />
                  Decode / Encode Workspace
                </h3>
                <div className="flex gap-1">
                  {(
                    [
                      ['base64', 'Base64'],
                      ['hex', 'Hex'],
                      ['caesar', 'Caesar'],
                    ] as [WorkspaceTool, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => {
                        setWorkspaceTool(id);
                        setWorkspaceOutput('');
                      }}
                      className={`px-2 py-0.5 text-[10px] rounded font-semibold transition-colors ${
                        workspaceTool === id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {workspaceTool === 'caesar' && (
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Shift:</label>
                  <input
                    type="number"
                    value={caesarShift}
                    onChange={e => setCaesarShift(parseInt(e.target.value) || 0)}
                    min={0}
                    max={25}
                    className="w-14 px-1.5 py-0.5 text-[11px] rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex gap-1">
                    {[3, 7, 13].map(s => (
                      <button
                        key={s}
                        onClick={() => setCaesarShift(s)}
                        className={`px-1.5 py-0.5 text-[9px] rounded font-medium transition-colors ${
                          caesarShift === s
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        ROT{s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex-1">
                  <textarea
                    value={workspaceInput}
                    onChange={e => setWorkspaceInput(e.target.value)}
                    placeholder="Enter text to encode/decode..."
                    className="w-full h-16 px-2 py-1.5 text-[11px] font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={runWorkspaceTool}
                  className="self-center px-3 py-2 text-[10px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Run
                </button>
                <div className="flex-1">
                  <textarea
                    value={workspaceOutput}
                    readOnly
                    placeholder="Output will appear here..."
                    className="w-full h-16 px-2 py-1.5 text-[11px] font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none outline-none placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Category Tabs ── */}
          <div className="flex gap-1 flex-shrink-0 flex-wrap">
            {CATEGORY_META.map(cat => {
              const catSolved = CHALLENGES.filter(c => c.category === cat.id && solvedIds.has(c.id)).length;
              const catTotal = CHALLENGES.filter(c => c.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setActiveChallenge(null);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                    selectedCategory === cat.id
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  {cat.label}
                  <span
                    className={`text-[9px] px-1 rounded ${
                      selectedCategory === cat.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    {catSolved}/{catTotal}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Challenge List or Detail View ── */}
          <div className="flex-1 min-h-0 overflow-auto">
            {!activeChallenge ? (
              /* ── Challenge Browser ── */
              <div className="grid gap-2">
                {categoryChallenges.map(ch => {
                  const solved = solvedIds.has(ch.id);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => openChallenge(ch)}
                      className={`w-full text-left p-3 rounded-xl border transition-all hover:shadow-md ${
                        solved
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {solved ? (
                            <Unlock className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                          )}
                          <span
                            className={`text-sm font-semibold ${
                              solved ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {ch.title}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${DIFF_STYLES[ch.difficulty]}`}>
                            {ch.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5 text-xs font-bold text-gray-500 dark:text-gray-400">
                            <Star className="w-3 h-3 text-amber-400" />
                            {ch.points}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 ml-5.5">
                        {ch.description.split('\n')[0]}
                      </p>
                    </button>
                  );
                })}
                {categoryChallenges.length === 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-xs">
                    No challenges in this category yet.
                  </div>
                )}
              </div>
            ) : (
              /* ── Challenge Detail ── */
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-auto h-full">
                {/* Back */}
                <button
                  onClick={() => setActiveChallenge(null)}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mb-3"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back to challenges
                </button>

                {/* Title row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {activeChallenge.title}
                      {solvedIds.has(activeChallenge.id) && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${DIFF_STYLES[activeChallenge.difficulty]}`}>
                        {activeChallenge.difficulty}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400">
                        <Star className="w-3 h-3 text-amber-400" />
                        {activeChallenge.points} points
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                  <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                    {activeChallenge.description}
                  </pre>
                </div>

                {/* Hints */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
                    Hints ({activeChallenge.hints.length} available)
                  </h4>
                  <div className="space-y-1.5">
                    {activeChallenge.hints.map((hint, idx) => (
                      <div key={idx}>
                        {revealedHints.has(idx) ? (
                          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg text-xs text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
                            <Eye className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>
                              <span className="font-bold">Hint {idx + 1}:</span> {hint}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => revealHint(idx)}
                            className="w-full text-left p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-2"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            Reveal Hint {idx + 1}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flag submission */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 block">
                    Submit Flag
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={flagInput}
                      onChange={e => {
                        setFlagInput(e.target.value);
                        setFlagResult(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') submitFlag();
                      }}
                      placeholder="FLAG{...}"
                      className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                    <button
                      onClick={submitFlag}
                      disabled={!flagInput.trim()}
                      className="px-4 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit
                    </button>
                  </div>
                  {flagResult === 'correct' && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-400 dark:border-green-600 rounded-lg text-xs text-green-700 dark:text-green-400 font-bold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Correct! +{activeChallenge.points} points earned.
                    </div>
                  )}
                  {flagResult === 'incorrect' && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-600 rounded-lg text-xs text-red-700 dark:text-red-400 font-bold flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Incorrect flag. Try again.
                    </div>
                  )}
                </div>

                {/* Solution spoiler */}
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                  {!showSolution ? (
                    <button
                      onClick={() => setShowSolution(true)}
                      className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
                    >
                      <EyeOff className="w-3 h-3" />
                      Show Solution (spoiler)
                    </button>
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                      <div className="font-bold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        Solution
                      </div>
                      <p className="leading-relaxed">{activeChallenge.solution}</p>
                      <div className="mt-2 font-mono text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded inline-block">
                        {activeChallenge.flag}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
