import React, { useState, useCallback } from 'react';
import {
  BookOpen,
  Play,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Shield,
  Brain,
  Target,
  Info,
  Star,
  Lock,
  Eye,
} from 'lucide-react';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type Tab = 'learn' | 'sandbox';
type ScenarioCategory = 'email' | 'phone' | 'in-person' | 'physical';
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface Choice {
  text: string;
  correct: boolean;
  consequence: string;
}

interface Step {
  situation: string;
  choices: Choice[];
  redFlags: string[];
}

interface Scenario {
  id: string;
  title: string;
  category: ScenarioCategory;
  description: string;
  difficulty: Difficulty;
  steps: Step[];
  tips: string[];
}

interface ScenarioResult {
  score: number;
  total: number;
  answers: boolean[];
}

interface LearnSection {
  id: string;
  title: string;
}

// ──────────────────────────────────────────────
// Learn-tab section data
// ──────────────────────────────────────────────

const LEARN_SECTIONS: LearnSection[] = [
  { id: 'what', title: 'What is Social Engineering?' },
  { id: 'types', title: 'Types of Attacks' },
  { id: 'psychology', title: 'Psychology Behind It' },
  { id: 'mitnick', title: 'Kevin Mitnick Case Studies' },
  { id: 'redflags', title: 'Red Flags to Watch For' },
  { id: 'defense', title: 'Defense Strategies' },
];

const ATTACK_TYPES = [
  {
    name: 'Phishing',
    desc: 'Email-based deception where attackers impersonate trusted entities to trick recipients into revealing credentials, clicking malicious links, or downloading malware. Phishing remains the most common initial attack vector in data breaches worldwide.',
    example: 'An email appearing to come from your bank asks you to "verify your account" by clicking a link that leads to a convincing fake login page.',
    flags: ['Mismatched sender domain', 'Urgency or threats', 'Generic greetings', 'Suspicious links on hover', 'Spelling or grammar errors'],
  },
  {
    name: 'Pretexting',
    desc: 'The attacker fabricates a believable scenario (pretext) to establish trust and extract information. Unlike phishing, pretexting relies on building a narrative and relationship over time rather than a single deceptive message.',
    example: 'Someone calls posing as an auditor needing employee records for a "compliance review" and cites real regulatory frameworks to sound credible.',
    flags: ['Unsolicited contact with a story', 'Requests for internal data', 'Name-dropping executives', 'Reluctance to verify through official channels'],
  },
  {
    name: 'Baiting',
    desc: 'Offering something enticing to lure victims, such as a USB drive labeled with intriguing content left in a public area, or a free download that bundles malware. Baiting exploits human curiosity and the desire for free things.',
    example: 'A USB drive labeled "Salary Info Q4 - CONFIDENTIAL" is left in the company parking lot. When plugged in, it silently installs a keylogger.',
    flags: ['Found media in public areas', 'Too-good-to-be-true offers', 'Enticing labels on unknown devices', 'Free software from untrusted sources'],
  },
  {
    name: 'Tailgating / Piggybacking',
    desc: 'Physical access bypass where an unauthorized person follows an authorized employee through a secured door or checkpoint. The attacker exploits social norms of politeness and the reluctance to challenge strangers.',
    example: 'Someone carrying a large box approaches a badge-access door behind you and asks you to hold it open because their "hands are full."',
    flags: ['Hands conveniently full', 'No visible badge', 'Timing approach with your entry', 'Emotional pressure when challenged'],
  },
  {
    name: 'Quid Pro Quo',
    desc: 'The attacker offers a service or benefit in exchange for information. Often disguised as technical support, the attacker offers to "help" solve a problem (real or fabricated) in exchange for login credentials or system access.',
    example: '"Microsoft Support" cold-calls you saying they detected viruses on your PC and offers free cleanup if you install their remote-access tool.',
    flags: ['Unsolicited help offers', 'Requests for credentials in return', 'Too-good-to-be-true services', 'Caller ID spoofing'],
  },
  {
    name: 'Watering Hole Attacks',
    desc: 'The attacker compromises a website frequently visited by the target group. Instead of attacking victims directly, the attacker infects a trusted resource, exploiting the implicit trust users have in familiar sites.',
    example: 'An industry news site popular with finance professionals is injected with a script that silently exploits browser vulnerabilities to install spyware on visitors\' machines.',
    flags: ['Unexpected browser warnings on trusted sites', 'Unusual redirects', 'Sudden performance drops when visiting familiar pages', 'New pop-ups on previously clean sites'],
  },
  {
    name: 'Vishing (Voice Phishing)',
    desc: 'Phishing conducted over the phone. Attackers impersonate banks, government agencies, or tech support and use urgency, authority, and fear to pressure victims into revealing sensitive information or making payments.',
    example: 'A caller claiming to be from the IRS says you owe back taxes and will be arrested unless you pay immediately via gift cards.',
    flags: ['Unexpected calls from "authorities"', 'Demands for immediate payment', 'Unusual payment methods (gift cards, crypto)', 'Caller ID can be spoofed', 'Refusal to let you call back on an official number'],
  },
];

const PSYCHOLOGY_PRINCIPLES = [
  { name: 'Authority', desc: 'People tend to comply with requests from perceived authority figures. Attackers impersonate managers, IT staff, law enforcement, or executives to leverage this instinct.' },
  { name: 'Urgency', desc: 'Creating artificial time pressure short-circuits rational decision-making. "Act now or your account will be locked" forces quick, unreflective responses.' },
  { name: 'Fear', desc: 'Threats of negative consequences (job loss, legal action, account compromise) trigger the fight-or-flight response, bypassing critical thinking.' },
  { name: 'Trust', desc: 'Building rapport and familiarity makes victims lower their guard. Attackers invest time in establishing credibility before making their request.' },
  { name: 'Reciprocity', desc: 'When someone does something for us, we feel obligated to return the favor. Attackers exploit this by offering help or small gifts before requesting sensitive information.' },
  { name: 'Social Proof', desc: 'People follow the actions of others, especially in uncertain situations. "Everyone in your department has already updated their password" leverages herd mentality.' },
];

const MITNICK_CASES = [
  {
    title: 'The DEC VMS Source Code Theft',
    year: '1979',
    summary: 'At age 16, Mitnick convinced a DEC system manager to grant him an account by claiming to be Anton Chernoff, one of the project leaders. Using nothing more than a phone call and a confident manner, he gained access to the RSTS/E source code. This demonstrated how authority and confidence alone can bypass even corporate security.',
  },
  {
    title: 'Pacific Bell Wiretapping',
    year: '1981-1983',
    summary: 'Mitnick repeatedly social-engineered Pacific Bell employees by posing as fellow technicians and supervisors, obtaining internal procedures, dial-up numbers, and technical documentation. He combined these pieces of information to gain deep access to the telephone network, illustrating how small pieces of seemingly harmless info can be chained together.',
  },
  {
    title: 'The Motorola Source Code Heist',
    year: '1992',
    summary: 'Mitnick obtained Motorola\'s proprietary MicroTAC Ultra Lite source code by calling their offices and pretending to be a fellow Motorola engineer needing the code for a project. Employees helpfully emailed him the code, never questioning why a colleague would not already have access through normal channels.',
  },
  {
    title: 'The Shimomura Pursuit',
    year: '1994-1995',
    summary: 'In his most famous case, Mitnick used social engineering alongside technical attacks to compromise Tsutomu Shimomura\'s systems. He called cellular phone companies pretending to be technicians to clone cell phone signals, demonstrating the blend of social and technical attacks. This case led to his eventual capture and the book "Takedown."',
  },
];

// ──────────────────────────────────────────────
// Sandbox scenario data (6 scenarios)
// ──────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  {
    id: 'phishing-email',
    title: 'Suspicious Bank Email',
    category: 'email',
    description: 'You receive an urgent email from what appears to be your bank warning of a compromised account.',
    difficulty: 'Beginner',
    tips: [
      'Always verify sender email addresses carefully - look at the actual domain, not just the display name',
      'Hover over links before clicking to see the real URL destination',
      'Legitimate organizations never ask for passwords via email',
      'Watch for urgency tactics and threatening language designed to short-circuit your judgment',
      'When in doubt, contact the organization directly using a number from their official website or your card',
    ],
    steps: [
      {
        situation: 'You receive an email from "security@yourbank-alert.com" with the subject line "URGENT: Your account has been compromised!" The email states that unauthorized transactions have been detected and your account will be locked within 24 hours unless you verify your identity by clicking a link. The email includes your bank\'s logo and looks professional.',
        choices: [
          { text: 'Click the link immediately to protect your account before it gets locked', correct: false, consequence: 'The link leads to a pixel-perfect replica of your bank\'s login page. When you enter your credentials, they are captured by the attacker, who now has full access to your real account.' },
          { text: 'Examine the sender address and email carefully for red flags', correct: true, consequence: 'Good instinct! You notice the domain is "yourbank-alert.com" instead of the real bank domain. The email also uses a generic greeting ("Dear Customer") rather than your name, and the urgency is a classic pressure tactic.' },
          { text: 'Forward the email to colleagues to ask if they received it too', correct: false, consequence: 'By forwarding the phishing email, you spread it to more potential victims. Some phishing emails also contain tracking pixels that notify the attacker of forwards, confirming active email addresses.' },
        ],
        redFlags: ['Suspicious sender domain (yourbank-alert.com vs the official bank domain)', 'Urgency and fear tactics ("account compromised", "24 hours")', 'Generic greeting ("Dear Customer") instead of your actual name', 'The entire email is designed to trigger panic and bypass rational thinking'],
      },
      {
        situation: 'After examining the email more closely, you notice the "Verify Now" button. When you hover over it without clicking, the URL preview shows "http://login-verify.suspicious-site.ru/bank-portal". What do you do next?',
        choices: [
          { text: 'The URL is clearly not from your bank - report the email as phishing', correct: true, consequence: 'Excellent! The URL points to a Russian domain completely unrelated to your bank, and uses insecure HTTP instead of HTTPS. Reporting it helps email providers block this campaign for everyone.' },
          { text: 'Copy the URL and paste it into your browser to investigate further', correct: false, consequence: 'Even visiting the page can be dangerous. Malicious sites can exploit browser vulnerabilities, run drive-by downloads, or install malware automatically without any user interaction beyond visiting the page.' },
          { text: 'Reply to the email asking the sender to confirm if this is legitimate', correct: false, consequence: 'Replying confirms to the attacker that your email address is active and monitored, making you a higher-value target for future attacks. The attacker will simply reassure you it is legitimate.' },
        ],
        redFlags: ['URL points to a foreign domain (.ru) completely unrelated to the bank', 'Uses HTTP instead of HTTPS - legitimate banks always use HTTPS', 'Domain name is engineered to look legitimate at a quick glance', 'The actual link destination never matches what the button text claims'],
      },
      {
        situation: 'You decide to verify the email by contacting your bank directly. How do you look up their contact information?',
        choices: [
          { text: 'Call the phone number listed in the suspicious email', correct: false, consequence: 'Phone numbers in phishing emails are often controlled by the attackers. They answer as "bank support" and use the opportunity to extract even more personal information from you.' },
          { text: 'Look up the bank\'s official number from the back of your debit card or their verified website (typed manually, not from the email link)', correct: true, consequence: 'This is the safest approach. Using independently verified contact information ensures you are talking to the actual bank. They confirm no security alert was sent, verifying this was a phishing attempt.' },
          { text: 'Search for the bank\'s phone number on Google and call the first result', correct: false, consequence: 'Sophisticated attackers sometimes purchase ads or create fake listings to intercept people searching for bank phone numbers. Always use the number from your card or official correspondence.' },
        ],
        redFlags: ['Contact information within phishing emails is controlled by attackers', 'Always use independently verified contact methods', 'Even search engine results can be manipulated by determined attackers'],
      },
      {
        situation: 'The bank confirms this was a phishing email. They have no record of sending it and your account is fine. What final actions should you take?',
        choices: [
          { text: 'Delete the email and move on with your day', correct: false, consequence: 'While you are safe, not reporting means the phishing campaign continues targeting thousands of others. Your report could help get the malicious domain taken down.' },
          { text: 'Report it to your IT/security team, mark it as phishing in your email client, and report the domain to the bank\'s fraud department', correct: true, consequence: 'Triple action: your IT team can block similar emails organization-wide, marking as phishing trains email filters, and the bank\'s fraud team can work to take down the fake domain - potentially preventing thousands of victims.' },
          { text: 'Post the full email on social media to warn your friends', correct: false, consequence: 'While well-intentioned, posting details publicly can reveal your email provider and organization to other attackers, and the phishing link in your screenshot could lead your followers to the malicious site.' },
        ],
        redFlags: ['Always report phishing to your security team and the impersonated organization', 'Use built-in "Report Phishing" features in email clients (Gmail, Outlook, etc.)', 'Forward phishing to reportphishing@apwg.org for industry-wide tracking'],
      },
    ],
  },
  {
    id: 'pretexting-call',
    title: 'Fake IT Support Call',
    category: 'phone',
    description: 'Someone calls claiming to be from IT support and needs remote access to your computer for a "critical security update."',
    difficulty: 'Intermediate',
    tips: [
      'IT support will never ask for your password over the phone - they have admin tools that do not require it',
      'Verify any caller\'s identity through official internal channels before complying',
      'Be wary of unexpected calls about "urgent" issues you were not already aware of',
      'Ask for a ticket number and verify it in your organization\'s ticketing system independently',
      'When in doubt, hang up and call IT at their published number yourself',
    ],
    steps: [
      {
        situation: 'You receive a phone call from someone identifying as "Mike from IT Support." He says there is a critical security vulnerability that requires immediate patching on your workstation. He needs you to install a remote access tool so he can apply the update. He sounds professional, uses technical jargon fluently, and mentions your company by name.',
        choices: [
          { text: 'Install the remote access tool since he sounds knowledgeable and mentioned the company name', correct: false, consequence: 'The attacker now has full control of your machine. Company names are public information. They install a persistent backdoor and begin extracting sensitive documents, credentials, and internal communications.' },
          { text: 'Ask for his employee ID and the IT ticket number for this maintenance request', correct: true, consequence: 'This is the right first step. Legitimate IT staff can always provide verifiable identification and reference numbers. You plan to verify these through the company directory and ticketing system independently.' },
          { text: 'Tell him you are in the middle of something and ask him to call back later', correct: false, consequence: 'Delaying does not solve the problem. The attacker will call back with a more refined and urgent approach, or simply move on to target another employee who might comply immediately.' },
        ],
        redFlags: ['Unsolicited call about a "critical" issue you had not heard about', 'Requesting you install remote access software (legitimate IT typically pushes updates through centralized systems)', 'Using technical jargon to establish false credibility', 'Company name is public information and proves nothing'],
      },
      {
        situation: '"Mike" provides a badge number, "IT-4521," and says the ticket is "SEC-EMERGENCY-001." He adds that your manager, whom he names correctly, has already approved this work. He warns that if you delay, your account will be suspended as a security precaution and you will be unable to work until the patch is applied.',
        choices: [
          { text: 'Proceed since he provided credentials and correctly named your manager', correct: false, consequence: 'Badge numbers can be fabricated and manager names are typically available on LinkedIn, company websites, and organizational charts. Attackers routinely research targets before calling to make their pretext more convincing.' },
          { text: 'Tell him you will verify independently - you will look up IT\'s published number and call them directly', correct: true, consequence: 'When you call the real IT department at their published number, they confirm no one named Mike works there, no emergency ticket exists, and no security patches are being applied via phone today.' },
          { text: 'Ask him to prove his identity by telling you your employee ID number', correct: false, consequence: 'This is a trap in reverse. The attacker may say "For security, I need you to tell me yours first" or use social engineering to make you reveal other identifying information while seeming to "verify."' },
        ],
        redFlags: ['Pressure tactics (threatening account suspension for non-compliance)', 'Name-dropping your manager without you bringing it up first', 'Unusual ticket naming convention ("EMERGENCY" is not how real IT tickets are named)', 'The combination of urgency + authority + consequences is a classic manipulation stack'],
      },
      {
        situation: '"Mike" becomes increasingly insistent, saying every minute of delay puts the entire company network at risk. He claims he has already patched 30 other workstations today and you are the last remaining vulnerability. He sounds genuinely stressed and says his own job is on the line if he cannot complete this by end of day.',
        choices: [
          { text: 'Comply because he sounds genuinely stressed and you do not want to be the person who caused a breach', correct: false, consequence: 'Emotional manipulation is a core social engineering technique. The attacker exploits your empathy and desire to be helpful, as well as fear of being blamed. Real IT staff would never pressure you this way.' },
          { text: 'Hang up and report the suspicious call to your security team immediately', correct: true, consequence: 'Excellent decision. This stops the attack cold and alerts the security team, who can warn other employees, block the caller\'s number, and investigate whether anyone else fell for the same approach today.' },
          { text: 'Ask him to email you the patch details so you can review them yourself', correct: false, consequence: 'The attacker sends a professional-looking email with a malicious attachment disguised as "patch documentation." Opening it installs malware, creating a second attack vector you just handed them.' },
        ],
        redFlags: ['Escalating pressure and emotional manipulation', 'Creating a sense of being "the last one" (isolation tactic that makes you feel like the outlier)', 'Playing on sympathy (claiming his job is at risk)', 'Real IT staff follow process - they do not make pressure calls'],
      },
    ],
  },
  {
    id: 'tailgating',
    title: 'The Held Door',
    category: 'in-person',
    description: 'Someone tries to follow you through a badge-access door without using their own credentials.',
    difficulty: 'Beginner',
    tips: [
      'Never hold secured doors open for people you do not recognize, regardless of how they react',
      'Politely ask unrecognized individuals to badge in themselves - this is expected and acceptable',
      'Report suspicious behavior to building security immediately',
      'Be aware of people who time their approach to coincide with yours at secured entrances',
      'Security is everyone\'s responsibility - being cautious protects the entire organization',
    ],
    steps: [
      {
        situation: 'You badge into the secure entrance of your office building. As the door opens, someone walking quickly behind you is carrying a large box and a coffee. They call out, "Hey, could you hold the door? My hands are full and I left my badge on my desk this morning."',
        choices: [
          { text: 'Hold the door open - they seem like a regular employee having a tough morning', correct: false, consequence: 'You just allowed a potentially unauthorized person into a secured area. They could be a corporate spy, a thief, or someone conducting reconnaissance for a larger attack. Physical security breaches enable digital ones.' },
          { text: 'Politely decline but offer to hold their box while they find or retrieve their badge', correct: true, consequence: 'This balances security with helpfulness. A legitimate employee will appreciate the assistance and understand the policy. An attacker will typically make an excuse and leave rather than submit to verification.' },
          { text: 'Ignore them and quickly slip through the door yourself', correct: false, consequence: 'While better than holding the door, simply ignoring the situation means a determined tailgater might still catch the door before it closes. You also miss the opportunity to identify a potential threat.' },
        ],
        redFlags: ['Hands conveniently too full to use their own badge', 'Badge is "on their desk" - a story that cannot be immediately verified', 'Timing their approach to coincide with your badge-in', 'Using the box and coffee as props to seem like a normal employee'],
      },
      {
        situation: 'The person becomes visibly annoyed and says, "Seriously? I work on the 3rd floor in Marketing. Ask anyone up there - they know me. I am already late for a meeting with the VP and this is really embarrassing." They do look vaguely familiar.',
        choices: [
          { text: 'Let them in since they named a specific department and you think you might recognize them', correct: false, consequence: 'Attackers research company structures using LinkedIn, press releases, and the company website. Naming a specific department and VP is easily prepared. Vague "familiarity" in a large company proves nothing.' },
          { text: 'Suggest they call their colleague or the front desk reception to come escort them in', correct: true, consequence: 'A legitimate employee can easily call a coworker to come down and vouch for them. An attacker will not have a real colleague to call and will typically abandon the attempt.' },
          { text: 'Ask them to name their manager for verification', correct: false, consequence: 'Manager names are publicly available on LinkedIn and corporate org charts. This is easy for a prepared attacker to answer correctly. It creates a false sense of verification.' },
        ],
        redFlags: ['Getting annoyed or emotional to pressure you into compliance', 'Dropping a VP\'s name to invoke authority', 'Claiming familiarity in a way that cannot be disproven', 'Information about departments and roles is publicly researched'],
      },
      {
        situation: 'The person says "Fine, forget it" and walks away looking frustrated. Thirty minutes later, you see the same person at a different building entrance attempting the exact same approach with another employee. What do you do?',
        choices: [
          { text: 'Mind your own business - maybe they genuinely lost their badge and are trying different doors', correct: false, consequence: 'Ignoring repeated suspicious behavior puts the entire organization at risk. A legitimate employee who lost their badge would go to reception or security, not try the same social engineering trick at different entrances.' },
          { text: 'Report it to building security immediately with a description of the person and their behavior', correct: true, consequence: 'Building security responds quickly and intercepts the individual. It turns out they are a penetration tester hired by the company. Your vigilance is noted positively - you were one of only three employees who reported the attempt.' },
          { text: 'Confront the person directly and loudly ask to see their badge', correct: false, consequence: 'Direct confrontation can be physically dangerous. Professional social engineers may become aggressive when cornered. It is always safer to let trained security personnel handle unknown individuals.' },
        ],
        redFlags: ['Same person using the same pretext at different entrances', 'Targeting different employees for the same "problem"', 'Legitimate employees would contact security or reception, not keep trying doors', 'Pattern of behavior indicates deliberate social engineering, not genuine badge loss'],
      },
    ],
  },
  {
    id: 'usb-baiting',
    title: 'The Mysterious USB Drive',
    category: 'physical',
    description: 'You find a USB drive labeled "Salary Info Q4 - CONFIDENTIAL" in the company parking lot.',
    difficulty: 'Intermediate',
    tips: [
      'Never plug unknown USB drives into any computer - personal or corporate',
      'USB drives can contain auto-executing malware, hardware-based keystroke injectors, or even electrical kill devices',
      'Even new-looking or company-branded drives can be weaponized (attackers buy or steal branded drives)',
      'Always turn found drives over to IT security for analysis in a sandboxed environment',
      'This attack exploits natural human curiosity and the desire to return lost items',
    ],
    steps: [
      {
        situation: 'Walking from your car to the office, you spot a USB drive lying on the ground near the entrance. It has a professional-looking label reading "Q4 Salary Adjustments - EXECUTIVE ONLY - CONFIDENTIAL." It appears to be a company-branded USB drive. What do you do?',
        choices: [
          { text: 'Plug it into your work computer to see whose it is so you can return it to them', correct: false, consequence: 'The USB drive contains auto-executing malware. The moment it is plugged in, a keystroke injector fires, stealing your credentials while a backdoor is installed. The infection spreads laterally across the corporate network within minutes.' },
          { text: 'Pick it up carefully and take it directly to the IT security team without plugging it into anything', correct: true, consequence: 'IT security examines the drive in an isolated sandbox environment and discovers it contains a USB Rubber Ducky payload designed to execute credential-stealing scripts. Your caution prevented a serious breach.' },
          { text: 'Plug it into your personal phone to check the contents safely since phones are more secure', correct: false, consequence: 'Phones can also be compromised by malicious USB devices. Some attacks work across multiple platforms and device types. Additionally, USB devices can emulate keyboards, which phones also accept input from.' },
        ],
        redFlags: ['USB drive found in a public area near your workplace (common baiting location)', 'Enticing label specifically designed to trigger curiosity ("Salary Adjustments")', 'Marked "EXECUTIVE ONLY" and "CONFIDENTIAL" to increase the temptation to look', 'Company branding on USB drives can be easily replicated'],
      },
      {
        situation: 'A colleague sees you pick up the USB drive and says, "Oh interesting! Let me check it on my laptop - I have the latest antivirus with real-time scanning so it should be totally safe." How do you respond?',
        choices: [
          { text: 'Let them check it since up-to-date antivirus provides adequate protection', correct: false, consequence: 'Modern USB attacks frequently bypass traditional antivirus. Devices like the USB Rubber Ducky emulate a keyboard rather than a storage device, executing commands before AV can even scan. Hardware-based exploits operate below the software security layer.' },
          { text: 'Warn them that antivirus cannot protect against all USB attack types and insist on taking it to IT security', correct: true, consequence: 'You correctly identify that hardware-based USB attacks bypass traditional antivirus entirely. Your colleague learns something important, and the drive is safely delivered to professionals with proper analysis tools.' },
          { text: 'Suggest using an old or disposable computer to check it first', correct: false, consequence: 'Even a "disposable" computer on the corporate network provides a foothold for lateral movement. The malware can spread to shared drives, other network segments, and cloud-synced folders. Network isolation matters.' },
        ],
        redFlags: ['Antivirus alone cannot detect or prevent hardware-based USB attacks', 'USB Rubber Ducky devices execute in milliseconds, before any scanner activates', 'Curiosity is precisely the vulnerability this attack exploits', 'Well-meaning colleagues can inadvertently enable breaches'],
      },
      {
        situation: 'You deliver the USB drive to IT security. They thank you and ask for details: where exactly you found it, how many other people you saw walk past it, whether you noticed anyone placing or dropping drives in the area, and the approximate time. What do you share?',
        choices: [
          { text: 'Tell them where you found it but say you did not notice anything else', correct: false, consequence: 'Any observations, even partial ones, can significantly aid the investigation. The time you arrived, the exact location, other people in the area, and vehicles nearby are all valuable intelligence that can be correlated with security camera footage.' },
          { text: 'Share everything you can recall: exact time, precise location, who else was nearby, any unfamiliar vehicles, and whether you saw similar drives elsewhere', correct: true, consequence: 'Your detailed observations prove invaluable. Security reviews camera footage from the time you specify and identifies an unknown individual who planted USB drives at three different entrance points at 6:15 AM. Law enforcement is contacted.' },
          { text: 'Post about the incident on the company chat channel to warn everyone immediately', correct: false, consequence: 'While warning colleagues is important, posting details before the investigation concludes alerts the attacker that their operation was detected. They may remotely wipe evidence or change tactics. Let the security team manage communications.' },
        ],
        redFlags: ['Coordinated baiting attacks typically target multiple locations simultaneously', 'Timing details help correlate with security camera footage', 'Details about other people and vehicles help identify the attacker', 'Security teams should control the communication timeline about active incidents'],
      },
    ],
  },
  {
    id: 'vishing',
    title: 'The IRS Scam Call',
    category: 'phone',
    description: 'You get an aggressive phone call from someone claiming to be from the IRS threatening immediate arrest.',
    difficulty: 'Beginner',
    tips: [
      'The IRS never initiates contact via phone for outstanding tax issues - they always send written letters first',
      'Government agencies never demand immediate payment or threaten immediate arrest over the phone',
      'No legitimate agency requests payment via gift cards, cryptocurrency, or wire transfer',
      'Caller ID can be easily spoofed to show any number, including legitimate government numbers',
      'If you receive a suspicious call, hang up and contact the agency directly using the number from their official .gov website',
    ],
    steps: [
      {
        situation: 'You receive a phone call from a number displaying "Internal Revenue Service" on your caller ID. An authoritative voice says: "This is Agent Williams, badge number 4478, calling from the IRS Criminal Investigation Division. We have identified a serious discrepancy in your 2024 tax filing amounting to $14,382. A warrant for your arrest has been issued and local police have been notified. You need to resolve this immediately."',
        choices: [
          { text: 'Panic and ask what you need to do to resolve it right away', correct: false, consequence: 'This is exactly the reaction the scammer wants. By panicking, you enter a fight-or-flight state where critical thinking shuts down. The scammer will now guide you through a "payment process" to steal your money.' },
          { text: 'Recognize this as a scam - the IRS never calls to threaten arrest and always sends letters first', correct: true, consequence: 'Correct! The IRS always initiates contact through official written correspondence sent via US mail. They never call to demand immediate payment, threaten arrest, or require payment via unusual methods. This is a textbook vishing scam.' },
          { text: 'Ask for more details about the discrepancy to determine if the claim is legitimate', correct: false, consequence: 'Engaging with the scammer in any form validates the call and gives them more time to manipulate you. Scammers have scripted responses for every question and will use your engagement to build a more convincing narrative.' },
        ],
        redFlags: ['The IRS always sends written notice first - they never initiate contact by phone for tax issues', 'Threatening immediate arrest is a fear/authority tactic (the IRS does not operate this way)', 'Caller ID showing "Internal Revenue Service" means nothing - it is trivially easy to spoof', 'Badge numbers and specific dollar amounts are fabricated to sound legitimate'],
      },
      {
        situation: 'You tell the caller you believe this is a scam. They respond: "Sir/Ma\'am, I understand your skepticism, and I respect that. If you doubt me, I can give you the direct number of our Washington DC headquarters to verify. But I must warn you, the warrant is active and officers could arrive at any time. Every minute you delay puts you at greater risk." They provide a phone number.',
        choices: [
          { text: 'Call the number they provided to verify, since they offered it voluntarily', correct: false, consequence: 'The "headquarters number" connects to an accomplice who will confirm everything the original caller said. Scam operations often have multiple people playing different roles. Any number provided by the scammer is part of the scam.' },
          { text: 'Hang up immediately - the continued threats and provided number are part of the same scam', correct: true, consequence: 'The escalation pattern, continued threats, and conveniently provided "verification number" are all standard vishing techniques. Hanging up is the correct and only safe response to a confirmed scam call.' },
          { text: 'Stay on the line to gather information about the scammer for a police report', correct: false, consequence: 'While seemingly clever, staying engaged risks accidentally revealing personal information. Experienced scammers embed probing questions into natural conversation. They may also become aggressive or make genuine threats.' },
        ],
        redFlags: ['Offering a "verification number" that the scammer controls', 'Continued escalation of threats despite your skepticism', '"Officers could arrive at any time" is designed to keep fear levels high', 'Legitimate agencies never rush you - they give you time and official channels'],
      },
      {
        situation: 'You have hung up. What sequence of follow-up actions should you take?',
        choices: [
          { text: 'Do nothing further - you recognized the scam and did not give them anything', correct: false, consequence: 'While you are safe, not reporting means this scam operation continues calling thousands of others daily. Older adults and immigrants are particularly vulnerable to IRS impersonation scams. Your report helps shut them down.' },
          { text: 'Report the number to the FTC (ftc.gov/complaint), TIGTA (IRS oversight), and your state attorney general. Warn vulnerable contacts, especially elderly relatives, about the scam', correct: true, consequence: 'Multiple reporting channels maximize the chance of action. TIGTA specifically handles IRS impersonation scams. Warning vulnerable contacts is critical because these scams disproportionately target seniors, who lose an average of $9,000 per incident.' },
          { text: 'Call the number back to confront them and waste their time', correct: false, consequence: 'Calling back confirms your number is active and engaged. Scammers can use this to escalate harassment, sell your number to other scam operations as a "responsive" lead, or attempt different manipulation tactics.' },
        ],
        redFlags: ['Always report scam calls to the FTC, TIGTA, and local authorities', 'Warn vulnerable people in your life - these scams cause real financial harm', 'Never call scam numbers back for any reason', 'Consider registering on the Do Not Call Registry (donotcall.gov) to reduce scam calls'],
      },
    ],
  },
  {
    id: 'spear-phishing',
    title: 'The Executive Impersonation',
    category: 'email',
    description: 'You receive a targeted email that appears to be from your CEO asking for an urgent wire transfer.',
    difficulty: 'Advanced',
    tips: [
      'Spear phishing targets specific individuals with personalized information gathered from public sources',
      'CEO fraud / Business Email Compromise (BEC) caused $2.7 billion in losses in 2022 alone (FBI IC3 report)',
      'Any urgent, unusual financial request via email should be verified through a separate communication channel (phone call, in-person)',
      'Pay attention to subtle email address differences - attackers register lookalike domains',
      'Establish and follow wire transfer verification protocols that require multi-person approval and voice confirmation',
    ],
    steps: [
      {
        situation: 'You work in finance. At 4:47 PM on Friday, you receive an email from "CEO Robert Chen" (r.chen@yourcompany-corp.com) marked as high priority: "Hi [your name], I need you to urgently process a wire transfer of $47,500 to a new vendor account before end of business today. This is for the acquisition we discussed at last Tuesday\'s board meeting - you know how time-sensitive this is. I\'m in back-to-back meetings so please handle this via email only. Details attached. - Robert"',
        choices: [
          { text: 'Process the wire transfer - it came from the CEO, references a real board meeting, and the amount seems reasonable for a corporate transaction', correct: false, consequence: 'The email was from a lookalike domain (yourcompany-corp.com vs yourcompany.com). The attacker researched the board meeting from press releases. $47,500 was chosen because it is below the $50,000 threshold that triggers additional verification at many companies. The money is gone within minutes.' },
          { text: 'Notice the urgency and timing are suspicious - verify by calling Robert directly on his known phone number', correct: true, consequence: 'You call Robert\'s direct line. He confirms he sent no such email and is alarmed. IT security investigates and discovers the lookalike domain was registered 3 days ago. The attack is neutralized and other finance staff are warned.' },
          { text: 'Reply to the email asking Robert to confirm the account details', correct: false, consequence: 'You just replied to the attacker, who will enthusiastically confirm and provide "correct" account details. Replying to a phishing email means all "confirmation" goes through the attacker. Verification must happen through a different channel entirely.' },
        ],
        redFlags: ['Subtle domain difference: yourcompany-corp.com vs yourcompany.com', 'End-of-day Friday urgency (reduced oversight, pressure to act before weekend)', '"Handle via email only" prevents you from calling to verify', 'Amount strategically below common verification thresholds', 'References real events (board meeting) to establish legitimacy'],
      },
      {
        situation: 'After your call to the real CEO, IT security asks you to examine the email headers for forensic analysis. They also ask whether you clicked on the attachment. You realize you actually previewed the attachment in your email client before calling Robert. What should you do?',
        choices: [
          { text: 'Tell IT you did not open the attachment to avoid getting in trouble', correct: false, consequence: 'Concealing potential compromise delays incident response. If the attachment contained malware that activated on preview, every minute without IT\'s knowledge gives the attacker more time to establish persistence on your machine and move laterally through the network.' },
          { text: 'Immediately inform IT that you previewed the attachment, disconnect your machine from the network, and follow their incident response instructions', correct: true, consequence: 'Your honesty enables IT to respond effectively. They isolate your machine, scan for indicators of compromise, and discover the attachment contained a macro that attempted to install a keylogger. Because you reported quickly, it was caught before it could transmit any data.' },
          { text: 'Run your antivirus scan first and only report to IT if something is found', correct: false, consequence: 'Consumer antivirus may not detect sophisticated, targeted malware. Running a scan wastes critical response time and could trigger the malware to destroy evidence of its presence. Professional incident response tools are needed.' },
        ],
        redFlags: ['Previewing attachments from suspicious emails can trigger embedded malware', 'Honesty in incident response is critical - hiding information makes things worse', 'Time is the most valuable asset during incident response', 'Professional IR tools are far more effective than consumer antivirus for targeted attacks'],
      },
      {
        situation: 'IT contains the incident. Your CEO asks you to help implement new controls to prevent this from happening again. Which approach is most comprehensive?',
        choices: [
          { text: 'Add a warning banner to all emails from external domains and train employees to watch for it', correct: false, consequence: 'External email banners are a good control but insufficient alone. Employees quickly develop "banner blindness" and attackers can compromise internal accounts. This is one layer, not a comprehensive solution.' },
          { text: 'Implement multi-channel verification for all financial transactions above $10,000, add DMARC/DKIM/SPF email authentication, deploy external email banners, and conduct regular BEC simulation training', correct: true, consequence: 'This layered approach addresses the attack at multiple points: DMARC blocks domain spoofing, banners flag external emails, multi-channel verification catches impersonation, and training builds human awareness. Defense in depth is the only reliable strategy.' },
          { text: 'Block all external emails and only allow communication through the company\'s internal messaging system', correct: false, consequence: 'This is impractical for any business that communicates with clients, vendors, or partners. Overly restrictive controls are routinely circumvented by employees using personal devices or workarounds, creating even larger security gaps.' },
        ],
        redFlags: ['No single control is sufficient - effective security requires defense in depth', 'Financial verification must happen through a separate communication channel', 'DMARC/DKIM/SPF prevent domain spoofing at the technical level', 'Regular simulation training keeps awareness sharp and identifies vulnerable employees before real attacks do'],
      },
    ],
  },
  {
    id: 'watering-hole',
    title: 'The Compromised Industry Forum',
    category: 'email',
    description: 'A trusted industry website you visit regularly has been secretly compromised to target visitors from your organization.',
    difficulty: 'Advanced',
    tips: [
      'Watering hole attacks target trusted websites that a specific group frequents, making them extremely difficult to detect',
      'Keep your browser and all plugins fully updated - watering holes exploit known browser vulnerabilities',
      'Use network-level protections like web proxies that scan for exploit kits and anomalous behavior',
      'Browser isolation technology can contain watering hole payloads by rendering web content in a disposable container',
      'Monitor for unusual DNS queries and network connections that may indicate a compromised site has delivered its payload',
    ],
    steps: [
      {
        situation: 'You regularly visit an industry news forum to keep up with developments in your field. One morning, your browser briefly flashes to a blank page before the forum loads normally. The site looks perfectly normal otherwise. Your colleague mentions they noticed the same brief flash when visiting the same site yesterday. What do you do?',
        choices: [
          { text: 'Ignore it - websites glitch sometimes, and it loaded fine afterward', correct: false, consequence: 'The brief flash was an iframe loading and then hiding an exploit kit that probed your browser for vulnerabilities. Because your Flash plugin was slightly out of date, a zero-day exploit silently installed a RAT (Remote Access Trojan) on your machine.' },
          { text: 'Note the anomalous behavior and report it to IT security, mentioning that a colleague observed the same thing', correct: true, consequence: 'IT security investigates and discovers the forum\'s server was compromised. A malicious script was injected to profile visitors and selectively deploy exploits targeting employees from specific organizations. Your report triggers an industry-wide alert.' },
          { text: 'Clear your browser cache and cookies and revisit the site to see if it happens again', correct: false, consequence: 'Revisiting the compromised site exposes you to the exploit again. Clearing cache does not remove malware already delivered. You have now given the exploit kit a second opportunity to find and leverage any browser vulnerability.' },
        ],
        redFlags: ['Unexpected visual anomalies on previously stable websites (flashes, redirects, blank frames)', 'Multiple people observing the same anomaly confirms it is not a local glitch', 'Watering hole attacks are specifically designed to appear normal after the initial exploit', 'Industry-specific sites are prime targets because they aggregate high-value victims'],
      },
      {
        situation: 'IT security confirms the industry forum was compromised. They find that the attack specifically targeted employees from your company and two competitors. Your machine may have been exposed. What is the appropriate response?',
        choices: [
          { text: 'Run a full antivirus scan and keep working if nothing is found', correct: false, consequence: 'Targeted watering hole attacks use custom malware designed to evade standard antivirus signatures. A clean AV scan provides false confidence while sophisticated malware continues operating below the detection threshold.' },
          { text: 'Allow IT to perform a full forensic analysis of your machine, accept a temporary replacement, and change all credentials from a known-clean device', correct: true, consequence: 'Forensic analysis reveals artifacts of a sophisticated implant that standard AV missed. Your credentials are rotated from a clean device. The temporary disruption prevents what could have been a catastrophic data breach.' },
          { text: 'Immediately reformat your hard drive to eliminate any potential malware', correct: false, consequence: 'Reformatting destroys forensic evidence that security teams need to understand the scope and nature of the attack. Without this evidence, they cannot determine what data was accessed, what other systems may be compromised, or how to defend against the specific threat actor.' },
        ],
        redFlags: ['Standard antivirus cannot detect targeted, custom malware', 'Forensic evidence must be preserved for proper investigation', 'Credential rotation must happen from a known-clean device, not the potentially compromised one', 'Targeted attacks require professional incident response, not DIY remediation'],
      },
      {
        situation: 'The forensic investigation is complete. Your CISO asks for recommendations on preventing future watering hole attacks. Which strategy provides the best protection?',
        choices: [
          { text: 'Block all non-essential websites and only allow a whitelist of approved sites', correct: false, consequence: 'Rigid whitelisting kills productivity and is easily circumvented (employees use phones, VPNs, or personal hotspots). It also fails if a whitelisted site is compromised - which is exactly how watering hole attacks work.' },
          { text: 'Deploy browser isolation technology, ensure automatic browser/plugin updates, implement network monitoring for anomalous connections, and add DNS filtering', correct: true, consequence: 'Browser isolation renders web content in disposable containers so exploits cannot reach the endpoint. Combined with patching, network monitoring, and DNS filtering, this creates multiple detection and prevention layers that address watering holes without restricting productivity.' },
          { text: 'Switch to a different browser that is more secure and train employees to avoid suspicious sites', correct: false, consequence: 'No browser is immune to zero-day exploits. "Avoid suspicious sites" is irrelevant advice for watering hole attacks because the compromised sites are the ones employees already trust and need to visit for their work.' },
        ],
        redFlags: ['Watering holes exploit the trust in "safe" sites, so behavioral advice alone is insufficient', 'Browser isolation physically separates untrusted web content from the endpoint', 'Automatic updates close known vulnerabilities that exploit kits target', 'Network monitoring detects command-and-control communication from already-delivered payloads'],
      },
    ],
  },
];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const difficultyColor = (d: Difficulty): string => {
  switch (d) {
    case 'Beginner':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'Intermediate':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Advanced':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  }
};

const categoryLabel = (c: ScenarioCategory): string => {
  switch (c) {
    case 'email': return 'Email';
    case 'phone': return 'Phone Call';
    case 'in-person': return 'In-Person';
    case 'physical': return 'USB / Physical';
  }
};

const categoryColor = (c: ScenarioCategory): string => {
  switch (c) {
    case 'email': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'phone': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'in-person': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    case 'physical': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  }
};

const getGrade = (score: number, total: number) => {
  const pct = total > 0 ? (score / total) * 100 : 0;
  if (pct >= 90) return { letter: 'A', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Excellent - Security Champion' };
  if (pct >= 75) return { letter: 'B', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Good Awareness' };
  if (pct >= 60) return { letter: 'C', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Needs Improvement' };
  if (pct >= 40) return { letter: 'D', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'Vulnerable - Study Required' };
  return { letter: 'F', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Critical - Immediate Training Needed' };
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export const SocialEngineeringWalkthroughs: React.FC = () => {
  // Top-level tab
  const [activeTab, setActiveTab] = useState<Tab>('sandbox');

  // Learn tab
  const [expandedSection, setExpandedSection] = useState<string | null>('what');

  // Sandbox tab
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [stepAnswers, setStepAnswers] = useState<boolean[]>([]);
  const [showRedFlags, setShowRedFlags] = useState(false);
  const [results, setResults] = useState<Record<string, ScenarioResult>>({});
  const [sandboxView, setSandboxView] = useState<'list' | 'walkthrough' | 'results'>('list');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'All'>('All');

  const scenario = activeScenario ? SCENARIOS.find(s => s.id === activeScenario) ?? null : null;
  const step = scenario ? scenario.steps[currentStep] ?? null : null;

  const completedCount = Object.keys(results).length;
  const totalScore = Object.values(results).reduce((a, r) => a + r.score, 0);
  const totalQuestions = Object.values(results).reduce((a, r) => a + r.total, 0);

  const filteredScenarios = filterDifficulty === 'All' ? SCENARIOS : SCENARIOS.filter(s => s.difficulty === filterDifficulty);

  const toggleSection = useCallback((id: string) => {
    setExpandedSection(prev => (prev === id ? null : id));
  }, []);

  const startScenario = useCallback((id: string) => {
    setActiveScenario(id);
    setCurrentStep(0);
    setSelectedChoice(null);
    setStepAnswers([]);
    setShowRedFlags(false);
    setSandboxView('walkthrough');
  }, []);

  const handleChoice = useCallback((idx: number) => {
    if (selectedChoice !== null) return;
    setSelectedChoice(idx);
    setShowRedFlags(true);
  }, [selectedChoice]);

  const nextStep = useCallback(() => {
    if (!scenario || selectedChoice === null || !step) return;
    const correct = step.choices[selectedChoice].correct;
    const newAnswers = [...stepAnswers, correct];
    setStepAnswers(newAnswers);

    if (currentStep < scenario.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSelectedChoice(null);
      setShowRedFlags(false);
    } else {
      const result: ScenarioResult = {
        score: newAnswers.filter(Boolean).length,
        total: newAnswers.length,
        answers: newAnswers,
      };
      setResults(prev => ({ ...prev, [scenario.id]: result }));
      setSandboxView('results');
    }
  }, [scenario, step, currentStep, selectedChoice, stepAnswers]);

  const backToList = useCallback(() => {
    setActiveScenario(null);
    setSandboxView('list');
    setCurrentStep(0);
    setSelectedChoice(null);
    setStepAnswers([]);
    setShowRedFlags(false);
  }, []);

  // ──────────────────────────────────────────
  // Learn-tab section renderers
  // ──────────────────────────────────────────

  const renderLearnSection = (id: string) => {
    switch (id) {
      case 'what':
        return (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              <strong>Social engineering</strong> is the art of manipulating human psychology to bypass security controls. Rather than exploiting software vulnerabilities, social engineers exploit the most unpredictable element in any security system: people.
            </p>
            <p>
              At its core, social engineering targets cognitive biases and emotional responses that are hardwired into human nature. Attackers craft scenarios that trigger automatic, instinctive reactions - compliance with authority, response to urgency, desire to help, fear of consequences - that override rational security thinking.
            </p>
            <p>
              The effectiveness of social engineering is staggering: according to Verizon's Data Breach Investigations Report, over 74% of all breaches involve the human element. No matter how strong your technical defenses are, a single manipulated employee can provide an attacker with credentials, install malware, or grant physical access that bypasses millions of dollars in security infrastructure.
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Kevin Mitnick, one of history's most famous hackers, said: <em>"I was so much more successful at social engineering than I was with all the technical skills combined. Social engineering was responsible for about 80% of the breaches I accomplished."</em>
                </p>
              </div>
            </div>
          </div>
        );

      case 'types':
        return (
          <div className="space-y-3">
            {ATTACK_TYPES.map((t, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">{t.name}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2">{t.desc}</p>
                <div className="bg-gray-50 dark:bg-gray-750 rounded p-2 mb-2 border border-gray-100 dark:border-gray-600">
                  <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">Example</span>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{t.example}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {t.flags.map((f, j) => (
                    <span key={j} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'psychology':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              Social engineers exploit fundamental psychological principles that govern human decision-making. Understanding these principles is the first step to recognizing when they are being weaponized against you.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PSYCHOLOGY_PRINCIPLES.map((p, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-3.5 h-3.5 text-purple-500" />
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{p.name}</h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'mitnick':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
              Kevin Mitnick (1963-2023) was once the FBI's Most Wanted hacker. His attacks relied overwhelmingly on social engineering rather than technical exploits, proving that people are always the weakest link. After serving prison time, he became a respected security consultant and author.
            </p>
            {MITNICK_CASES.map((c, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{c.title}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono">{c.year}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{c.summary}</p>
              </div>
            ))}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Recommended reading: <em>"The Art of Deception"</em> by Kevin Mitnick - a comprehensive exploration of social engineering techniques and defenses, drawing from his real-world experiences.
                </p>
              </div>
            </div>
          </div>
        );

      case 'redflags':
        return (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>Every type of social engineering attack has characteristic warning signs. Training yourself to recognize these red flags transforms you from a potential victim into a human firewall.</p>
            <div className="space-y-3">
              {[
                { type: 'Email Attacks', flags: ['Mismatched sender domain or display name', 'Urgency or threatening language', 'Generic greetings instead of your name', 'Suspicious links (hover to check)', 'Unexpected attachments', 'Requests for credentials or sensitive data', 'Poor grammar or formatting inconsistencies'] },
                { type: 'Phone Attacks', flags: ['Unsolicited calls claiming to be IT, bank, or government', 'Requests for passwords or remote access', 'Caller ID can be spoofed - it proves nothing', 'Refusal to let you call back on an official number', 'Pressure to stay on the line', 'Background noise mimicking a call center'] },
                { type: 'In-Person Attacks', flags: ['Unknown person requesting you hold a secure door', 'No visible badge or ID', 'Name-dropping executives or managers', 'Claims of urgency for meetings or deadlines', 'Emotional pressure when you enforce policy', 'Attempting the same approach at different entrances'] },
                { type: 'Physical / USB Attacks', flags: ['Found media with enticing labels', 'USB drives in parking lots, lobbies, or common areas', 'Free promotional devices from unknown sources', '"Lost" devices conveniently near your workspace', 'QR codes posted in unusual locations'] },
              ].map((section, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-red-500" />
                    {section.type}
                  </h4>
                  <ul className="space-y-1">
                    {section.flags.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 'defense':
        return (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              Defending against social engineering requires a combination of awareness, procedures, culture, and technology. No single measure is sufficient - defense in depth is essential.
            </p>
            {[
              {
                title: 'Security Awareness Training',
                icon: <Shield className="w-4 h-4 text-blue-500" />,
                points: [
                  'Regular, mandatory training for all employees (not just once a year)',
                  'Simulated phishing campaigns to test and reinforce knowledge',
                  'Role-specific training (finance staff need BEC awareness, front desk needs tailgating training)',
                  'Positive reinforcement for reporting - never punish employees who report incidents',
                  'Include real-world case studies and examples relevant to your industry',
                ],
              },
              {
                title: 'Verification Procedures',
                icon: <Lock className="w-4 h-4 text-green-500" />,
                points: [
                  'Multi-channel verification for financial transactions (email request verified by phone call)',
                  'Callback verification using independently sourced numbers (never from the request itself)',
                  'Challenge-response protocols for IT support requests',
                  'Mandatory badge scanning - no exceptions, no tailgating allowed',
                  'Documented escalation paths so employees know who to contact when suspicious',
                ],
              },
              {
                title: 'Zero-Trust Mindset',
                icon: <Target className="w-4 h-4 text-red-500" />,
                points: [
                  'Trust nothing and verify everything - regardless of who appears to be asking',
                  'Legitimate requests can always survive verification - only attacks cannot',
                  'It is always acceptable to slow down and verify, no matter how urgent the request seems',
                  'If someone gets angry when you follow security procedures, that is a red flag, not a reason to comply',
                  'Apply the principle of least privilege to information sharing - share only what is necessary',
                ],
              },
            ].map((section, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  {section.icon}
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{section.title}</h4>
                </div>
                <ul className="space-y-1.5">
                  {section.points.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // ──────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-orange-50 dark:from-gray-950 dark:to-orange-950 p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">
          Social Engineering Walkthroughs
        </h2>
        {activeTab === 'sandbox' && totalQuestions > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {completedCount}/{SCENARIOS.length} completed
            </span>
            <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / SCENARIOS.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {totalScore}/{totalQuestions}
            </span>
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-3 flex-shrink-0">
        <button
          onClick={() => setActiveTab('learn')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'learn'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Learn
        </button>
        <button
          onClick={() => setActiveTab('sandbox')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'sandbox'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          Scenarios
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {/* ━━━━━━━━━━━━━━━ LEARN TAB ━━━━━━━━━━━━━━━ */}
        {activeTab === 'learn' && (
          <div className="space-y-2 max-w-4xl">
            {LEARN_SECTIONS.map(section => (
              <div key={section.id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{section.title}</span>
                  {expandedSection === section.id ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {expandedSection === section.id && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    {renderLearnSection(section.id)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━ SANDBOX TAB ━━━━━━━━━━━━━━━ */}
        {activeTab === 'sandbox' && sandboxView === 'list' && (
          <div className="space-y-3">
            {/* Quick Start */}
            <div className="flex items-start gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-950/40 rounded-lg border border-orange-200 dark:border-orange-700 text-xs">
              <span className="font-bold text-orange-700 dark:text-orange-400 flex-shrink-0 mt-0.5">How to use:</span>
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-gray-700 dark:text-gray-300 leading-relaxed">
                <span><span className="font-semibold text-orange-700 dark:text-orange-400">1.</span> Pick a scenario card — each shows a real social engineering attack (e.g. "Phishing Email", "Pretexting Call")</span>
                <span className="text-gray-400">·</span>
                <span><span className="font-semibold text-orange-700 dark:text-orange-400">2.</span> Read through the attack step by step — see exactly how the attacker manipulates the victim</span>
                <span className="text-gray-400">·</span>
                <span><span className="font-semibold text-orange-700 dark:text-orange-400">3.</span> At decision points, choose how you would respond — your choices affect the outcome</span>
                <span className="text-gray-400">·</span>
                <span><span className="font-semibold text-orange-700 dark:text-orange-400">4.</span> At the end, see the defense strategy — what should have been done to prevent the attack</span>
              </div>
            </div>
            {/* Difficulty Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Filter:</span>
              {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setFilterDifficulty(d)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-full transition-all ${
                    filterDifficulty === d
                      ? 'bg-orange-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-orange-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Scenario Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredScenarios.map(s => {
                const completed = !!results[s.id];
                const result = results[s.id];
                return (
                  <button
                    key={s.id}
                    onClick={() => startScenario(s.id)}
                    className={`text-left p-4 rounded-xl border transition-all hover:shadow-lg ${
                      completed
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${categoryColor(s.category)}`}>
                        {categoryLabel(s.category)}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${difficultyColor(s.difficulty)}`}>
                        {s.difficulty}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-1">{s.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{s.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{s.steps.length} decision points</span>
                      {completed && result && (
                        <span className={`text-xs font-bold ${getGrade(result.score, result.total).color}`}>
                          {result.score}/{result.total} - Grade {getGrade(result.score, result.total).letter}
                        </span>
                      )}
                      {!completed && (
                        <span className="flex items-center gap-1 text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                          <Play className="w-3 h-3" />
                          Start
                        </span>
                      )}
                    </div>
                    {completed && (
                      <div className="flex items-center gap-1 mt-2">
                        {result.answers.map((correct, i) => (
                          <div
                            key={i}
                            className={`w-4 h-1.5 rounded-full ${correct ? 'bg-green-400' : 'bg-red-400'}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {filteredScenarios.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                No scenarios match the selected difficulty filter.
              </div>
            )}
          </div>
        )}

        {/* Walkthrough View */}
        {activeTab === 'sandbox' && sandboxView === 'walkthrough' && scenario && step && (
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Back + Progress */}
            <div className="flex items-center gap-3">
              <button
                onClick={backToList}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{scenario.title}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${difficultyColor(scenario.difficulty)}`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Step {currentStep + 1} of {scenario.steps.length}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + (selectedChoice !== null ? 1 : 0)) / scenario.steps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Situation Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-[10px] uppercase tracking-wider text-orange-600 dark:text-orange-400 font-bold mb-2">
                Situation
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{step.situation}</p>
            </div>

            {/* Choices */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
                Your Response
              </div>
              {step.choices.map((choice, idx) => {
                const isSelected = selectedChoice === idx;
                const isRevealed = selectedChoice !== null;

                let borderColor = 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600';
                let bgColor = 'bg-white dark:bg-gray-800';

                if (isRevealed) {
                  if (choice.correct) {
                    borderColor = 'border-green-400 dark:border-green-600';
                    bgColor = 'bg-green-50 dark:bg-green-900/20';
                  } else if (isSelected && !choice.correct) {
                    borderColor = 'border-red-400 dark:border-red-600';
                    bgColor = 'bg-red-50 dark:bg-red-900/20';
                  } else {
                    borderColor = 'border-gray-200 dark:border-gray-700 opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleChoice(idx)}
                    disabled={isRevealed}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${borderColor} ${bgColor}`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isRevealed && choice.correct
                            ? 'bg-green-500 text-white'
                            : isRevealed && isSelected && !choice.correct
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {isRevealed && choice.correct ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : isRevealed && isSelected && !choice.correct ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : (
                          String.fromCharCode(65 + idx)
                        )}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 dark:text-gray-200">{choice.text}</p>
                        {isRevealed && (isSelected || choice.correct) && (
                          <p
                            className={`text-xs mt-2 leading-relaxed ${
                              choice.correct
                                ? 'text-green-700 dark:text-green-400'
                                : 'text-red-700 dark:text-red-400'
                            }`}
                          >
                            {choice.consequence}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Red Flags */}
            {showRedFlags && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-bold text-red-700 dark:text-red-400">Red Flags to Watch For</span>
                </div>
                <ul className="space-y-1.5">
                  {step.redFlags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                      <span className="mt-0.5 flex-shrink-0 text-red-400">--</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Button */}
            {selectedChoice !== null && (
              <div className="flex justify-end">
                <button
                  onClick={nextStep}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-colors"
                >
                  {currentStep < scenario.steps.length - 1 ? 'Next Step' : 'View Results'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results View */}
        {activeTab === 'sandbox' && sandboxView === 'results' && scenario && results[scenario.id] && (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Score Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{scenario.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Scenario Complete</p>

              <div className="mt-4">
                {(() => {
                  const grade = getGrade(results[scenario.id].score, results[scenario.id].total);
                  return (
                    <>
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${grade.bg}`}>
                        <span className={`text-4xl font-black ${grade.color}`}>{grade.letter}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">{grade.label}</div>
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-1">
                        {results[scenario.id].score} / {results[scenario.id].total} correct
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Per-step breakdown */}
              <div className="mt-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold mb-2">
                  Step-by-Step Breakdown
                </div>
                <div className="flex items-center justify-center gap-2">
                  {results[scenario.id].answers.map((correct, i) => (
                    <div
                      key={i}
                      className={`flex flex-col items-center gap-1`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          correct
                            ? 'bg-green-100 dark:bg-green-900/40'
                            : 'bg-red-100 dark:bg-red-900/40'
                        }`}
                      >
                        {correct ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Step {i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall stats */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-3">
                <div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {results[scenario.id].answers.filter(Boolean).length}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Correct</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    {results[scenario.id].answers.filter(a => !a).length}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Incorrect</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {Math.round((results[scenario.id].score / results[scenario.id].total) * 100)}%
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Accuracy</div>
                </div>
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-1.5 mb-2">
                <Star className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Key Takeaways</span>
              </div>
              <ul className="space-y-1.5">
                {scenario.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
                    <CheckCircle2 className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Red flags summary from all steps */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span className="text-xs font-bold text-red-700 dark:text-red-400">All Red Flags From This Scenario</span>
              </div>
              <ul className="space-y-1">
                {scenario.steps.flatMap(s => s.redFlags).map((flag, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                    <span className="mt-0.5 flex-shrink-0">--</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 justify-center pb-2">
              <button
                onClick={() => startScenario(scenario.id)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Scenario
              </button>
              <button
                onClick={backToList}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                All Scenarios
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
