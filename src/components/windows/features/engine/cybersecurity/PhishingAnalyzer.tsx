import React, { useState, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Globe,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Search,
  Mail,
  Shield,
  ShieldAlert,
  Link,
  BookOpen,
  FlaskConical,
  Trophy,
  Target,
  Users,
  Phone,
  MessageSquare,
  Copy,
  Lock,
  Unlock,
  FileWarning,
  Info,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type MainTab = 'learn' | 'sandbox';
type SandboxView = 'email' | 'url' | 'quiz';

interface PhishingIndicator {
  id: string;
  label: string;
  description: string;
  found: boolean;
  severity: 'high' | 'medium' | 'low';
}

interface EmailLine {
  text: string;
  suspicious: boolean;
  reason?: string;
}

interface MockEmail {
  id: string;
  label: string;
  from: string;
  replyTo: string;
  to: string;
  subject: string;
  date: string;
  body: EmailLine[];
}

interface QuizScenario {
  id: number;
  description: string;
  optionA: { label: string; from: string; subject: string; url: string; body: string };
  optionB: { label: string; from: string; subject: string; url: string; body: string };
  phishingOption: 'A' | 'B';
  explanation: string;
}

interface LearnSection {
  id: string;
  title: string;
  icon: React.ReactNode;
}

// ─── Learn Content Sections ──────────────────────────────────────────────────

const LEARN_SECTIONS: LearnSection[] = [
  { id: 'what', title: 'What is Phishing?', icon: <Info className="w-4 h-4" /> },
  { id: 'types', title: 'Types of Phishing', icon: <Target className="w-4 h-4" /> },
  { id: 'anatomy', title: 'Anatomy of an Attack', icon: <Search className="w-4 h-4" /> },
  { id: 'redflags', title: 'Red Flags to Watch For', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'stats', title: 'Statistics and Breaches', icon: <FileWarning className="w-4 h-4" /> },
  { id: 'verify', title: 'How to Verify Legitimacy', icon: <CheckCircle className="w-4 h-4" /> },
  { id: 'prevention', title: 'Prevention Strategies', icon: <Shield className="w-4 h-4" /> },
];

// ─── Mock Phishing Emails ────────────────────────────────────────────────────

const MOCK_EMAILS: MockEmail[] = [
  {
    id: 'paypal',
    label: 'PayPal Scam',
    from: 'security@paypa1-support.com',
    replyTo: 'phisher.recv@gmail.com',
    to: 'victim@email.com',
    subject: 'URGENT: Your PayPal Account Has Been Compromised!',
    date: 'February 20, 2026',
    body: [
      { text: 'Dear Valued Customer,', suspicious: true, reason: 'Generic greeting -- legitimate services use your real name' },
      { text: '', suspicious: false },
      { text: 'We have detected unauthorized activity on your PayPal account. Your account has been temporarily limited.', suspicious: true, reason: 'Fear-inducing language designed to cause panic' },
      { text: '', suspicious: false },
      { text: 'You must verify your identity within 24 hours or your account will be permanently suspended.', suspicious: true, reason: 'Artificial deadline creates urgency to act without thinking' },
      { text: '', suspicious: false },
      { text: 'Click here to verify your account: https://secure-paypa1.com/verify', suspicious: true, reason: 'Misspelled domain -- "paypa1" uses number 1 instead of letter l' },
      { text: '', suspicious: false },
      { text: 'If you do not take action immediately, we will have no choice but to close your account and forfeit any remaining balance.', suspicious: true, reason: 'Threatening consequences to pressure immediate action' },
      { text: '', suspicious: false },
      { text: 'Sincerely,', suspicious: false },
      { text: 'PayPal Security Team', suspicious: true, reason: 'Impersonating a trusted brand\'s security team' },
      { text: 'paypa1-support.com', suspicious: true, reason: 'Fake domain in the email signature' },
    ],
  },
  {
    id: 'microsoft',
    label: 'Microsoft 365 Scam',
    from: 'admin@micros0ft-365.com',
    replyTo: 'collector.data@proton.me',
    to: 'employee@company.com',
    subject: 'Action Required: Your Microsoft 365 Password Expires Today',
    date: 'February 18, 2026',
    body: [
      { text: 'Hello User,', suspicious: true, reason: 'Generic "User" instead of your actual name' },
      { text: '', suspicious: false },
      { text: 'Your Microsoft 365 password will expire in 2 hours. To avoid losing access to your email, files, and Teams, you must update your password immediately.', suspicious: true, reason: 'Extremely short deadline (2 hours) to prevent rational thinking' },
      { text: '', suspicious: false },
      { text: 'Update your password now: https://micros0ft-365.com/password-reset', suspicious: true, reason: 'Domain uses "micros0ft" with zero instead of "o" -- classic typosquatting' },
      { text: '', suspicious: false },
      { text: 'Failure to update will result in permanent account lockout and all data will be deleted.', suspicious: true, reason: 'Extreme threat (data deletion) is disproportionate and unrealistic' },
      { text: '', suspicious: false },
      { text: 'This is an automated message from Microsoft IT Support.', suspicious: true, reason: 'Claims to be automated to discourage replying to verify' },
      { text: 'Do not reply to this email.', suspicious: true, reason: 'Prevents you from contacting the sender to verify authenticity' },
    ],
  },
  {
    id: 'amazon',
    label: 'Amazon Prize Scam',
    from: 'rewards@amaz0n-prizes.club',
    replyTo: 'info@random-server.xyz',
    to: 'lucky-winner@email.com',
    subject: 'Congratulations! You Won a $1,000 Amazon Gift Card!!!',
    date: 'February 15, 2026',
    body: [
      { text: 'CONGRATULATIONS!!!', suspicious: true, reason: 'Excessive capitalization and exclamation marks signal spam' },
      { text: '', suspicious: false },
      { text: 'You have been randomly selected as the winner of our monthly Amazon Customer Appreciation Giveaway!', suspicious: true, reason: 'Unsolicited prize claims are almost always scams' },
      { text: '', suspicious: false },
      { text: 'Your prize: $1,000 Amazon Gift Card', suspicious: true, reason: 'Too-good-to-be-true offers are a hallmark of phishing' },
      { text: '', suspicious: false },
      { text: 'To claim your reward, click below and enter your shipping address and payment details for verification:', suspicious: true, reason: 'Requesting payment information to "claim" a prize is a red flag' },
      { text: 'https://amaz0n-prizes.club/claim?winner=true&id=8827361', suspicious: true, reason: '"amaz0n" with zero, .club TLD, suspicious query parameters' },
      { text: '', suspicious: false },
      { text: 'This offer expires in 1 hour. Act now!', suspicious: true, reason: 'Extremely short expiry to prevent you from researching the offer' },
      { text: '', suspicious: false },
      { text: 'Amazon Rewards Team', suspicious: true, reason: 'Amazon does not have a "Rewards Team" that sends unsolicited prizes' },
    ],
  },
];

// ─── Quiz Scenarios ──────────────────────────────────────────────────────────

const QUIZ_SCENARIOS: QuizScenario[] = [
  {
    id: 1,
    description: 'You receive an email about suspicious login activity on your Google account. One is real and one is fake. Which is the phishing attempt?',
    optionA: {
      label: 'Email A',
      from: 'no-reply@accounts.google.com',
      subject: 'Security alert: New sign-in on Windows',
      url: 'https://myaccount.google.com/notifications',
      body: 'Hi John, Someone just signed in to your Google Account from a new Windows device. If this was you, no action is needed. If not, review your account activity.',
    },
    optionB: {
      label: 'Email B',
      from: 'security@google-account-verify.com',
      subject: 'URGENT: Unauthorized Access Detected!!!',
      url: 'https://google-account-verify.com/secure-login',
      body: 'Dear User, We detected unauthorized access to your Google Account. Click below immediately to secure your account or it will be suspended within 24 hours.',
    },
    phishingOption: 'B',
    explanation: 'Email B is phishing. The domain "google-account-verify.com" is not owned by Google (Google uses google.com). It uses "Dear User" instead of your name, excessive urgency with "URGENT" and "!!!", and threatens suspension. Email A uses the legitimate accounts.google.com domain, addresses you by name, and uses a calm, informative tone.',
  },
  {
    id: 2,
    description: 'Your company IT department sends a password reset notification. Which email is legitimate?',
    optionA: {
      label: 'Email A',
      from: 'it-helpdesk@yourcompany-secure.net',
      subject: 'MANDATORY: Reset Your Password NOW',
      url: 'http://yourcompany-secure.net/reset-password',
      body: 'All employees must reset their passwords immediately by clicking the link below. Failure to do so within 1 hour will result in account termination. Do not reply to this email.',
    },
    optionB: {
      label: 'Email B',
      from: 'it-support@yourcompany.com',
      subject: 'Scheduled Password Update Required',
      url: 'https://sso.yourcompany.com/password-change',
      body: 'Hi Sarah, As part of our quarterly security update, please reset your password by Friday. You can do this through the SSO portal or contact IT at ext. 4501 if you need help.',
    },
    phishingOption: 'A',
    explanation: 'Email A is phishing. It uses an unofficial domain (yourcompany-secure.net instead of yourcompany.com), HTTP instead of HTTPS, extreme urgency ("NOW", "1 hour"), and discourages communication ("Do not reply"). Email B uses the correct company domain, HTTPS, addresses you by name, gives a reasonable deadline, and provides an alternative contact method.',
  },
  {
    id: 3,
    description: 'You get a shipping notification about a package delivery. Which one is the phishing email?',
    optionA: {
      label: 'Email A',
      from: 'tracking@ups.com',
      subject: 'UPS: Your Package Is Out for Delivery',
      url: 'https://www.ups.com/track?tracknum=1Z999AA10123456784',
      body: 'Your package (tracking: 1Z999AA10123456784) is out for delivery today. Expected delivery: Feb 22, 2026 by 5:00 PM. Track your package on ups.com.',
    },
    optionB: {
      label: 'Email B',
      from: 'delivery@ups-tracking-service.tk',
      subject: 'UPS: Delivery Failed - Immediate Action Required!',
      url: 'http://ups-tracking-service.tk/reschedule?id=77291&fee=true',
      body: 'Dear Customer, Your package could not be delivered. You must pay a $2.99 redelivery fee to reschedule. Click below to pay immediately or your package will be returned to sender within 24 hours.',
    },
    phishingOption: 'B',
    explanation: 'Email B is phishing. It uses a .tk domain (free domain commonly used for scams), HTTP instead of HTTPS, requests payment for redelivery (UPS does not charge this way), uses urgency tactics, and includes suspicious query parameters ("fee=true"). Email A uses the official ups.com domain, HTTPS, contains a real tracking number format, and provides specific delivery details without requesting action.',
  },
  {
    id: 4,
    description: 'You receive a notification from your bank about a new statement. Which email is suspicious?',
    optionA: {
      label: 'Email A',
      from: 'alerts@chase.com',
      subject: 'Your January 2026 Statement is Ready',
      url: 'https://secure.chase.com/web/auth/dashboard#/statements',
      body: 'Hi Michael, Your January statement is now available. Log in to chase.com or the Chase Mobile app to view your statement. If you have questions, call us at 1-800-935-9935.',
    },
    optionB: {
      label: 'Email B',
      from: 'support@chase-banking-secure.com',
      subject: 'ALERT: Unusual Charges on Your Account - Verify Now',
      url: 'https://chase-banking-secure.com/verify-transactions',
      body: 'Dear Chase Customer, We noticed unusual charges on your account. To prevent your account from being frozen, please verify your recent transactions by clicking the secure link below. You must verify within 12 hours.',
    },
    phishingOption: 'B',
    explanation: 'Email B is phishing. The domain "chase-banking-secure.com" is not the real Chase domain (chase.com). It uses generic greeting "Dear Chase Customer", urgency with a 12-hour deadline, and threatens account freezing. Email A uses the legitimate chase.com domain with a proper secure subdomain, addresses you by name, and provides an official phone number for verification.',
  },
  {
    id: 5,
    description: 'You get two LinkedIn connection notifications. Which one is an attempt to steal your credentials?',
    optionA: {
      label: 'Email A',
      from: 'messages@linkedin-professional.net',
      subject: 'CEO of Fortune 500 Company Wants to Connect!',
      url: 'http://linkedin-professional.net/accept?token=x8jk2m',
      body: 'Amazing opportunity! The CEO of a Fortune 500 company viewed your profile and wants to connect. Accept now to unlock this exclusive networking opportunity. Your profile was viewed 500 times this week!',
    },
    optionB: {
      label: 'Email B',
      from: 'notifications-noreply@linkedin.com',
      subject: 'David Chen wants to connect with you',
      url: 'https://www.linkedin.com/comm/mynetwork/invite-accept/invitationId=7890123456',
      body: 'Hi Alex, David Chen, Software Engineer at Anthropic, has sent you a connection request. "We met at the AI conference last month. Would love to stay connected." View profile on LinkedIn.',
    },
    phishingOption: 'A',
    explanation: 'Email A is phishing. It uses "linkedin-professional.net" instead of linkedin.com, HTTP instead of HTTPS, makes exaggerated claims (Fortune 500 CEO, 500 profile views), and uses excitement to rush you into clicking. Email B uses the legitimate linkedin.com domain, HTTPS, provides specific details (real name, company, context for the connection), and has a calm, professional tone.',
  },
];

// ─── URL Parsing and Scoring ─────────────────────────────────────────────────

function parseURL(urlString: string): {
  protocol: string; subdomain: string; domain: string; tld: string;
  port: string; path: string; query: string; fragment: string; valid: boolean;
} {
  const result = { protocol: '', subdomain: '', domain: '', tld: '', port: '', path: '', query: '', fragment: '', valid: false };
  try {
    let normalised = urlString.trim();
    if (!normalised.includes('://')) normalised = 'https://' + normalised;
    const url = new URL(normalised);
    result.protocol = url.protocol.replace(':', '');
    result.port = url.port;
    result.path = url.pathname;
    result.query = url.search;
    result.fragment = url.hash;

    const hostParts = url.hostname.split('.');
    if (hostParts.length >= 3) {
      result.tld = hostParts.slice(-1).join('.');
      result.domain = hostParts.slice(-2, -1).join('.');
      result.subdomain = hostParts.slice(0, -2).join('.');
    } else if (hostParts.length === 2) {
      result.tld = hostParts[1];
      result.domain = hostParts[0];
    } else {
      result.domain = hostParts[0];
    }
    result.valid = true;
  } catch {
    result.valid = false;
  }
  return result;
}

function scoreURL(url: string): { score: number; indicators: PhishingIndicator[] } {
  const indicators: PhishingIndicator[] = [];
  const parsed = parseURL(url);
  let score = 0;

  if (!parsed.valid) {
    return { score: 0, indicators: [{ id: 'invalid', label: 'Invalid URL', description: 'The URL could not be parsed.', found: true, severity: 'high' }] };
  }

  if (parsed.protocol === 'http') {
    indicators.push({ id: 'http', label: 'No HTTPS', description: 'Uses HTTP instead of HTTPS -- data is transmitted unencrypted and can be intercepted.', found: true, severity: 'high' });
    score += 20;
  } else {
    indicators.push({ id: 'http', label: 'Uses HTTPS', description: 'The URL uses HTTPS for encrypted communication. Note: HTTPS alone does not guarantee legitimacy.', found: false, severity: 'high' });
  }

  const suspiciousTLDs = ['tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'club', 'top', 'work', 'buzz', 'cc', 'icu', 'cam', 'monster'];
  if (suspiciousTLDs.includes(parsed.tld.toLowerCase())) {
    indicators.push({ id: 'tld', label: 'Suspicious TLD', description: `The .${parsed.tld} TLD is commonly used in phishing due to free or cheap registration.`, found: true, severity: 'high' });
    score += 20;
  } else {
    indicators.push({ id: 'tld', label: 'Standard TLD', description: `The .${parsed.tld} TLD is a commonly used top-level domain.`, found: false, severity: 'high' });
  }

  const hasLookalike = /[0-9]/.test(parsed.domain) && /[a-z]/i.test(parsed.domain);
  if (hasLookalike) {
    indicators.push({ id: 'lookalike', label: 'Lookalike Characters', description: 'Domain mixes letters and numbers, possibly substituting characters (e.g., "paypa1" for "paypal", "g00gle" for "google").', found: true, severity: 'high' });
    score += 20;
  } else {
    indicators.push({ id: 'lookalike', label: 'No Lookalike Characters', description: 'No suspicious character substitutions detected in the domain name.', found: false, severity: 'high' });
  }

  const subdomainParts = parsed.subdomain.split('.').filter(Boolean);
  if (subdomainParts.length > 1) {
    indicators.push({ id: 'subdomains', label: 'Excessive Subdomains', description: `Found ${subdomainParts.length} subdomain levels. Multiple subdomains can hide the real domain in long URLs.`, found: true, severity: 'medium' });
    score += 10;
  } else {
    indicators.push({ id: 'subdomains', label: 'Normal Subdomain Structure', description: 'The URL has a typical subdomain structure.', found: false, severity: 'medium' });
  }

  if (parsed.domain.includes('-') || (parsed.subdomain && parsed.subdomain.includes('-'))) {
    indicators.push({ id: 'hyphens', label: 'Hyphens in Domain', description: 'Hyphens in domain names are common in phishing URLs that mimic legitimate brands (e.g., "paypal-security.com").', found: true, severity: 'medium' });
    score += 10;
  } else {
    indicators.push({ id: 'hyphens', label: 'No Suspicious Hyphens', description: 'No suspicious hyphens found in the domain name.', found: false, severity: 'medium' });
  }

  if (url.length > 75) {
    indicators.push({ id: 'length', label: 'Unusually Long URL', description: `URL is ${url.length} characters. Very long URLs can obfuscate the true destination domain.`, found: true, severity: 'low' });
    score += 5;
  } else {
    indicators.push({ id: 'length', label: 'Normal URL Length', description: `URL length (${url.length} chars) is within the normal range.`, found: false, severity: 'low' });
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.domain + '.' + parsed.tld)) {
    indicators.push({ id: 'ip', label: 'IP Address Domain', description: 'Uses an IP address instead of a domain name. Legitimate services almost always use domain names.', found: true, severity: 'high' });
    score += 25;
  } else {
    indicators.push({ id: 'ip', label: 'Proper Domain Name', description: 'URL uses a proper domain name, not a raw IP address.', found: false, severity: 'high' });
  }

  const keywords = ['login', 'verify', 'secure', 'account', 'update', 'confirm', 'signin', 'banking', 'password', 'credential', 'suspend', 'locked'];
  const pathLower = (parsed.path + parsed.query).toLowerCase();
  const foundKw = keywords.filter(k => pathLower.includes(k));
  if (foundKw.length > 0) {
    indicators.push({ id: 'keywords', label: 'Sensitive Path Keywords', description: `Path contains: ${foundKw.join(', ')}. Phishing URLs frequently include these terms to appear legitimate.`, found: true, severity: 'low' });
    score += 5 * Math.min(foundKw.length, 3);
  } else {
    indicators.push({ id: 'keywords', label: 'No Suspicious Keywords', description: 'No sensitive authentication-related keywords detected in the URL path.', found: false, severity: 'low' });
  }

  const atSign = url.includes('@');
  if (atSign) {
    indicators.push({ id: 'atsign', label: '@ Symbol in URL', description: 'An @ symbol in a URL can be used to trick browsers into showing a fake domain before the real one.', found: true, severity: 'high' });
    score += 20;
  }

  return { score: Math.min(score, 100), indicators };
}

// ─── Component ───────────────────────────────────────────────────────────────

export const PhishingAnalyzer: React.FC = () => {
  // Top-level tab state
  const [mainTab, setMainTab] = useState<MainTab>('learn');

  // Learn tab state
  const [expandedSection, setExpandedSection] = useState<string | null>('what');

  // Sandbox tab state
  const [sandboxView, setSandboxView] = useState<SandboxView>('email');

  // Email analyzer state
  const [selectedEmailIdx, setSelectedEmailIdx] = useState(0);
  const [showHighlights, setShowHighlights] = useState(true);

  // URL scanner state
  const [urlInput, setUrlInput] = useState('');

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<'A' | 'B' | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);

  const selectedEmail = MOCK_EMAILS[selectedEmailIdx];
  const parsedURL = urlInput ? parseURL(urlInput) : null;
  const urlResult = urlInput ? scoreURL(urlInput) : null;
  const currentQuiz = QUIZ_SCENARIOS[quizIndex];

  const toggleSection = useCallback((id: string) => {
    setExpandedSection(prev => (prev === id ? null : id));
  }, []);

  const handleQuizAnswer = useCallback((answer: 'A' | 'B') => {
    setQuizAnswer(answer);
    setQuizTotal(prev => prev + 1);
    if (answer === currentQuiz.phishingOption) {
      setQuizScore(prev => prev + 1);
    }
  }, [currentQuiz]);

  const handleNextQuiz = useCallback(() => {
    setQuizAnswer(null);
    setQuizIndex(prev => (prev + 1) % QUIZ_SCENARIOS.length);
  }, []);

  const handleResetQuiz = useCallback(() => {
    setQuizIndex(0);
    setQuizAnswer(null);
    setQuizScore(0);
    setQuizTotal(0);
  }, []);

  const scoreColor = urlResult ? (urlResult.score >= 60 ? 'text-red-500' : urlResult.score >= 30 ? 'text-yellow-500' : 'text-green-500') : '';
  const scoreBg = urlResult ? (urlResult.score >= 60 ? 'bg-red-500' : urlResult.score >= 30 ? 'bg-yellow-500' : 'bg-green-500') : '';
  const scoreLabel = urlResult ? (urlResult.score >= 60 ? 'High Risk' : urlResult.score >= 30 ? 'Moderate Risk' : 'Low Risk') : '';

  // ── Render helpers ───────────────────────────────────────────────────────

  const renderLearnSection = (sectionId: string) => {
    switch (sectionId) {
      case 'what':
        return (
          <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              <strong>Phishing</strong> is a type of social engineering cyberattack where an attacker impersonates a trusted entity to
              deceive victims into revealing sensitive information such as login credentials, credit card numbers, or personal data.
              The term is a play on "fishing" -- attackers cast out bait (fake messages) and wait for victims to bite.
            </p>
            <p>
              Phishing attacks are the most common initial attack vector for data breaches worldwide. They exploit human psychology
              rather than technical vulnerabilities, making them effective even against organizations with strong technical defenses.
              Attackers prey on trust, urgency, fear, and curiosity to manipulate victims into taking actions that compromise their
              security.
            </p>
            <p>
              These attacks can arrive via email, text messages (SMS), phone calls, social media, or even physical mail. The goal
              is always the same: trick the victim into performing an action that benefits the attacker, whether that is clicking
              a malicious link, downloading malware, transferring money, or handing over credentials.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 mt-2">
              <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Key Insight</p>
              <p className="text-blue-800 dark:text-blue-300">
                Over 90% of successful cyberattacks begin with a phishing email. No matter how advanced your technical security is,
                a single click on a phishing link can compromise an entire organization.
              </p>
            </div>
          </div>
        );

      case 'types':
        return (
          <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            {[
              {
                name: 'Email Phishing',
                icon: <Mail className="w-3.5 h-3.5 text-red-500" />,
                desc: 'The most common form. Attackers send mass emails impersonating trusted organizations (banks, tech companies, government agencies) to large numbers of recipients. These emails typically contain links to fake websites designed to harvest credentials. They rely on volume -- even a small percentage of victims clicking is profitable.',
              },
              {
                name: 'Spear Phishing',
                icon: <Target className="w-3.5 h-3.5 text-orange-500" />,
                desc: 'Highly targeted attacks directed at specific individuals or organizations. Attackers research their victims using LinkedIn, social media, and public information to craft personalized and convincing messages. Because these emails reference real details about the victim\'s life or work, they have a much higher success rate than generic phishing.',
              },
              {
                name: 'Whaling',
                icon: <Users className="w-3.5 h-3.5 text-purple-500" />,
                desc: 'A form of spear phishing that targets high-profile individuals such as CEOs, CFOs, and other executives ("big fish" or "whales"). Whaling emails often impersonate board members, legal counsel, or government authorities and may involve requests for large wire transfers or access to sensitive corporate data.',
              },
              {
                name: 'Smishing (SMS Phishing)',
                icon: <MessageSquare className="w-3.5 h-3.5 text-green-500" />,
                desc: 'Phishing conducted via SMS text messages. Attackers send texts claiming to be from banks, delivery services, or government agencies with links to malicious websites. Smishing is increasingly effective because people tend to trust text messages more than emails and mobile browsers make it harder to inspect URLs.',
              },
              {
                name: 'Vishing (Voice Phishing)',
                icon: <Phone className="w-3.5 h-3.5 text-blue-500" />,
                desc: 'Phishing conducted over phone calls. Attackers use caller ID spoofing to appear as legitimate institutions and pressure victims into revealing sensitive information or making payments. AI-generated voice cloning has made vishing attacks dramatically more convincing in recent years.',
              },
              {
                name: 'Clone Phishing',
                icon: <Copy className="w-3.5 h-3.5 text-teal-500" />,
                desc: 'Attackers take a legitimate email that the victim has previously received, create an identical copy (clone), and replace the links or attachments with malicious versions. Because the email looks exactly like one the victim has already seen and trusted, clone phishing has an exceptionally high success rate.',
              },
            ].map((type) => (
              <div key={type.name} className="flex gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50">
                <div className="mt-0.5 flex-shrink-0">{type.icon}</div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{type.name}</h4>
                  <p>{type.desc}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'anatomy':
        return (
          <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>Understanding the building blocks of a phishing attack helps you recognize them instantly.</p>
            {[
              {
                title: 'Sender Spoofing',
                detail: 'Attackers forge the "From" address to make emails appear to come from trusted sources. They may use domains that look similar to legitimate ones (e.g., "support@paypa1.com" instead of "support@paypal.com") or exploit email protocols that do not verify sender identity. Always check the actual email address, not just the display name.',
              },
              {
                title: 'Urgency and Fear Tactics',
                detail: 'Phishing messages create artificial time pressure: "Your account will be locked in 24 hours," "Immediate action required," or "Unauthorized access detected." This urgency is designed to short-circuit critical thinking and push victims to act before they can evaluate the message rationally.',
              },
              {
                title: 'Fake Links and Lookalike Domains',
                detail: 'Links in phishing emails point to attacker-controlled websites that mimic legitimate ones. Techniques include typosquatting (misspelled domains), homograph attacks (using visually similar Unicode characters), subdomain abuse (login.bank.com.evil.com), and URL shorteners to hide the true destination.',
              },
              {
                title: 'Brand Impersonation',
                detail: 'Attackers replicate the logos, color schemes, email templates, and writing style of trusted brands to make their messages look authentic. They often copy real emails from these companies and modify only the links. Modern phishing pages can be pixel-perfect copies of login pages for Google, Microsoft, banks, and other services.',
              },
            ].map((item, i) => (
              <div key={i} className="border-l-2 border-red-400 dark:border-red-600 pl-3 py-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.title}</h4>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        );

      case 'redflags':
        return (
          <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            <p className="mb-2">Watch for these warning signs in any communication claiming to be from a trusted source:</p>
            {[
              { flag: 'Urgency and Threats', desc: '"Act now!", "Your account will be suspended!", "You have 24 hours!" -- legitimate organizations rarely impose extreme deadlines for routine tasks.' },
              { flag: 'Misspellings and Grammar Errors', desc: 'Professional organizations have editorial standards. Typos, awkward phrasing, and grammatical errors in official-sounding emails are a strong indicator of phishing.' },
              { flag: 'Suspicious Links', desc: 'Hover over links (without clicking) to see the actual URL. Look for misspelled domains, unusual TLDs (.tk, .xyz), and URLs that do not match the claimed sender.' },
              { flag: 'Generic Greetings', desc: '"Dear Customer", "Dear User", "Dear Account Holder" -- legitimate companies that have your account will typically address you by name.' },
              { flag: 'Too-Good-To-Be-True Offers', desc: '"You won $1,000!", "Free iPhone!", "Exclusive reward!" -- unsolicited prizes and unrealistic offers are almost always scams.' },
              { flag: 'Requests for Sensitive Information', desc: 'Legitimate organizations will never ask for passwords, full credit card numbers, or Social Security numbers via email or text.' },
              { flag: 'Mismatched Sender Information', desc: 'The display name says "PayPal" but the email address is security@paypa1-support.com. Always check the actual email address, not the display name.' },
              { flag: 'Unexpected Attachments', desc: 'Unsolicited attachments, especially .exe, .zip, .docm, or .js files, may contain malware. Do not open attachments you were not expecting.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-2 p-2 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-red-700 dark:text-red-400">{item.flag}: </span>
                  <span>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { stat: '3.4B+', label: 'Phishing emails sent daily worldwide' },
                { stat: '90%', label: 'Of data breaches start with phishing' },
                { stat: '$4.76M', label: 'Average cost of a phishing-caused breach' },
                { stat: '36%', label: 'Of breaches involved phishing in 2023' },
              ].map((s, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700/50">
                  <div className="text-lg font-black text-red-600 dark:text-red-400">{s.stat}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Notable Phishing Breaches</h4>
            {[
              {
                name: 'Google and Facebook ($100M, 2013-2015)',
                desc: 'A Lithuanian hacker sent fraudulent invoices impersonating a hardware manufacturer (Quanta Computer) to both Google and Facebook. Over two years, he stole over $100 million before being caught. This demonstrated that even the most tech-savvy companies are vulnerable to phishing.',
              },
              {
                name: 'Sony Pictures (2014)',
                desc: 'Attackers sent spear-phishing emails to Sony employees, gaining access to the corporate network. The breach resulted in the leak of unreleased films, employee personal data, executive emails, and salary information. Estimated damages exceeded $100 million.',
              },
              {
                name: 'Colonial Pipeline (2021)',
                desc: 'A single compromised password (likely obtained through phishing) led to a ransomware attack that shut down the largest fuel pipeline in the United States for six days, causing fuel shortages across the East Coast. The company paid $4.4 million in ransom.',
              },
              {
                name: 'Twitter (2020)',
                desc: 'Attackers used phone-based spear phishing (vishing) to trick Twitter employees into providing access to internal tools. They then hijacked verified accounts of public figures including Barack Obama, Elon Musk, and Apple to run a cryptocurrency scam.',
              },
            ].map((breach, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50">
                <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{breach.name}</h5>
                <p>{breach.desc}</p>
              </div>
            ))}
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-2.5 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>When you receive a suspicious message, use these techniques to verify its legitimacy before taking any action:</p>
            {[
              { title: 'Hover Over Links', desc: 'Before clicking any link, hover your mouse over it to preview the actual destination URL. On mobile, long-press the link. Verify that the domain matches the organization that supposedly sent the message. Look for subtle differences like misspellings or extra subdomains.' },
              { title: 'Check the Sender Address', desc: 'Look at the full email address, not just the display name. Anyone can set their display name to "PayPal Support" but the actual email address will reveal the truth. Compare it against known legitimate addresses from that organization.' },
              { title: 'Contact the Organization Directly', desc: 'If an email claims to be from your bank or a service provider, do not use any contact information provided in the email. Instead, navigate to the organization\'s official website directly (type it into your browser) or call the number on your bank card or statement.' },
              { title: 'Search for the Email Content', desc: 'Copy a unique phrase from the suspicious email and search for it online. Phishing campaigns often use the same templates, and you may find reports from others who received the same message.' },
              { title: 'Check Email Headers', desc: 'Advanced users can examine full email headers to verify the actual sending server, SPF/DKIM authentication results, and the true origin of the message. Mismatches between the "From" address and the actual sending infrastructure are strong indicators of spoofing.' },
              { title: 'Verify with the Sender Through a Separate Channel', desc: 'If you receive an unexpected request from a colleague, boss, or friend, verify it by contacting them through a different communication channel (phone call, in-person, separate chat) rather than replying to the suspicious message.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-2 p-2 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-green-700 dark:text-green-400">{item.title}: </span>
                  <span>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'prevention':
        return (
          <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>A multi-layered defense strategy is essential to protect against phishing attacks at both individual and organizational levels.</p>
            {[
              {
                title: 'Email Filtering and Gateway Security',
                icon: <Mail className="w-3.5 h-3.5 text-blue-500" />,
                desc: 'Deploy advanced email filtering solutions that use machine learning to detect phishing patterns, check sender reputation, analyze URLs in real-time, and sandbox suspicious attachments. Configure SPF, DKIM, and DMARC records to prevent email spoofing of your domain.',
              },
              {
                title: 'Two-Factor Authentication (2FA)',
                icon: <Lock className="w-3.5 h-3.5 text-green-500" />,
                desc: 'Enable 2FA on all accounts, preferably using hardware security keys (FIDO2/WebAuthn) or authenticator apps rather than SMS. Even if credentials are stolen through phishing, 2FA provides an additional barrier. Hardware security keys are phishing-resistant because they verify the site\'s domain.',
              },
              {
                title: 'Security Awareness Training',
                icon: <BookOpen className="w-3.5 h-3.5 text-purple-500" />,
                desc: 'Conduct regular phishing simulation exercises and training for all staff. Training should cover how to identify phishing attempts, proper reporting procedures, and the consequences of successful attacks. Studies show that regular training reduces phishing susceptibility by 75% or more.',
              },
              {
                title: 'Browser and DNS Protection',
                icon: <Globe className="w-3.5 h-3.5 text-orange-500" />,
                desc: 'Use browsers with built-in phishing protection (Google Safe Browsing, Microsoft SmartScreen). Deploy DNS-level filtering to block access to known phishing domains. Consider using a password manager, which will not auto-fill credentials on fake lookalike sites.',
              },
              {
                title: 'Incident Response Plan',
                icon: <Shield className="w-3.5 h-3.5 text-red-500" />,
                desc: 'Establish clear procedures for reporting and responding to phishing attempts. Make it easy for employees to report suspicious emails with a one-click button. Have a rapid response team ready to contain compromised accounts, rotate credentials, and assess damage.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50">
                <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // ── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-red-50 dark:from-gray-950 dark:to-red-950/20 p-3 overflow-hidden">
      {/* Header */}
      <div className="mb-3 flex-shrink-0">
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Phishing Analyzer</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Learn to identify and defend against phishing attacks</p>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 mb-3 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        <button
          onClick={() => setMainTab('learn')}
          className={`flex-1 px-3 py-1.5 text-xs rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
            mainTab === 'learn'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Learn
        </button>
        <button
          onClick={() => setMainTab('sandbox')}
          className={`flex-1 px-3 py-1.5 text-xs rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
            mainTab === 'sandbox'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" /> Sandbox
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {/* ════════════════════════ LEARN TAB ════════════════════════ */}
        {mainTab === 'learn' && (
          <div className="space-y-1.5">
            {LEARN_SECTIONS.map((section) => (
              <div key={section.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className="text-red-500 dark:text-red-400 flex-shrink-0">{section.icon}</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex-1">{section.title}</span>
                  {expandedSection === section.id ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedSection === section.id && (
                  <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                    {renderLearnSection(section.id)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════ SANDBOX TAB ════════════════════════ */}
        {mainTab === 'sandbox' && (
          <div className="space-y-3">
            {/* Sandbox Sub-Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {([
                { key: 'email' as SandboxView, label: 'Email Analyzer', icon: <Mail className="w-3 h-3" /> },
                { key: 'url' as SandboxView, label: 'URL Scanner', icon: <Link className="w-3 h-3" /> },
                { key: 'quiz' as SandboxView, label: 'Spot the Phish', icon: <Trophy className="w-3 h-3" /> },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSandboxView(tab.key)}
                  className={`flex-1 px-2 py-1.5 text-[11px] rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                    sandboxView === tab.key
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* ──── EMAIL ANALYZER ──── */}
            {sandboxView === 'email' && (
              <div className="space-y-3">
                {/* Email Selector */}
                <div className="flex gap-1.5 flex-wrap">
                  {MOCK_EMAILS.map((email, idx) => (
                    <button
                      key={email.id}
                      onClick={() => setSelectedEmailIdx(idx)}
                      className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-colors border ${
                        selectedEmailIdx === idx
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700'
                      }`}
                    >
                      {email.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowHighlights(!showHighlights)}
                    className="ml-auto flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
                  >
                    {showHighlights ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {showHighlights ? 'Highlights On' : 'Highlights Off'}
                  </button>
                </div>

                {/* Email Preview */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Email Header */}
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-1.5">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedEmail.subject}</h3>
                    <div className="space-y-1 text-xs">
                      <div className="flex gap-2">
                        <span className="text-gray-500 dark:text-gray-500 w-16 flex-shrink-0">From:</span>
                        <span className={`font-mono ${showHighlights ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-1 rounded' : 'text-gray-700 dark:text-gray-300'}`}>
                          {selectedEmail.from}
                        </span>
                        {showHighlights && <span className="text-[10px] text-red-500 italic flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Spoofed sender domain</span>}
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-500 dark:text-gray-500 w-16 flex-shrink-0">Reply-To:</span>
                        <span className={`font-mono ${showHighlights ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-1 rounded' : 'text-gray-700 dark:text-gray-300'}`}>
                          {selectedEmail.replyTo}
                        </span>
                        {showHighlights && <span className="text-[10px] text-red-500 italic flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Replies go to attacker</span>}
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-500 dark:text-gray-500 w-16 flex-shrink-0">To:</span>
                        <span className="text-gray-700 dark:text-gray-300 font-mono">{selectedEmail.to}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-500 dark:text-gray-500 w-16 flex-shrink-0">Date:</span>
                        <span className="text-gray-700 dark:text-gray-300">{selectedEmail.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="p-4 space-y-1">
                    {selectedEmail.body.map((line, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <p className={`text-xs leading-relaxed flex-1 ${
                          line.suspicious && showHighlights
                            ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded border-l-2 border-red-500'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {line.text || '\u00A0'}
                        </p>
                        {line.suspicious && showHighlights && line.reason && (
                          <span className="text-[10px] text-red-500 dark:text-red-400 whitespace-nowrap flex items-center gap-0.5 flex-shrink-0 max-w-[200px] text-right">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{line.reason}</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phishing vs Legitimate Signs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/50 p-3">
                    <h4 className="text-xs font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Phishing Indicators Found
                    </h4>
                    <ul className="space-y-1.5 text-[11px] text-red-800 dark:text-red-300">
                      <li className="flex items-start gap-1.5"><XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Spoofed sender domain with lookalike characters</li>
                      <li className="flex items-start gap-1.5"><XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Reply-to address goes to unrelated email</li>
                      <li className="flex items-start gap-1.5"><XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Urgent, threatening language throughout</li>
                      <li className="flex items-start gap-1.5"><XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Generic greeting instead of your real name</li>
                      <li className="flex items-start gap-1.5"><XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Artificial deadline pressuring immediate action</li>
                      <li className="flex items-start gap-1.5"><XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Malicious link with misspelled domain</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800/50 p-3">
                    <h4 className="text-xs font-bold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> What Legitimate Emails Do
                    </h4>
                    <ul className="space-y-1.5 text-[11px] text-green-800 dark:text-green-300">
                      <li className="flex items-start gap-1.5"><CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Use the correct, verified sender domain</li>
                      <li className="flex items-start gap-1.5"><CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Reply-to matches the sender domain</li>
                      <li className="flex items-start gap-1.5"><CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Professional tone without threats or panic</li>
                      <li className="flex items-start gap-1.5"><CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Address you by your real name</li>
                      <li className="flex items-start gap-1.5"><CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Reasonable timelines, no artificial urgency</li>
                      <li className="flex items-start gap-1.5"><CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Links point to official, verified domains</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ──── URL SCANNER ──── */}
            {sandboxView === 'url' && (
              <div className="space-y-3">
                {/* Input */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Enter a URL to analyze</label>
                  <div className="flex gap-2">
                    <input
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      placeholder="https://secure-paypa1.com/login?redirect=account"
                      className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      spellCheck={false}
                    />
                    {urlInput && (
                      <button
                        onClick={() => setUrlInput('')}
                        className="px-3 py-2 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* URL Breakdown */}
                {urlInput && parsedURL && parsedURL.valid && (
                  <>
                    <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">URL Breakdown</h3>
                      <div className="flex flex-wrap gap-1 mb-3">
                        <span className="px-2 py-1 rounded text-xs font-mono bg-blue-900/50 text-blue-300 border border-blue-700">{parsedURL.protocol}://</span>
                        {parsedURL.subdomain && (
                          <span className="px-2 py-1 rounded text-xs font-mono bg-purple-900/50 text-purple-300 border border-purple-700">{parsedURL.subdomain}.</span>
                        )}
                        <span className="px-2 py-1 rounded text-xs font-mono bg-yellow-900/50 text-yellow-300 border border-yellow-700 font-bold">{parsedURL.domain}.</span>
                        <span className="px-2 py-1 rounded text-xs font-mono bg-green-900/50 text-green-300 border border-green-700">{parsedURL.tld}</span>
                        {parsedURL.port && (
                          <span className="px-2 py-1 rounded text-xs font-mono bg-red-900/50 text-red-300 border border-red-700">:{parsedURL.port}</span>
                        )}
                        {parsedURL.path && parsedURL.path !== '/' && (
                          <span className="px-2 py-1 rounded text-xs font-mono bg-orange-900/50 text-orange-300 border border-orange-700">{parsedURL.path}</span>
                        )}
                        {parsedURL.query && (
                          <span className="px-2 py-1 rounded text-xs font-mono bg-pink-900/50 text-pink-300 border border-pink-700">{parsedURL.query}</span>
                        )}
                        {parsedURL.fragment && (
                          <span className="px-2 py-1 rounded text-xs font-mono bg-cyan-900/50 text-cyan-300 border border-cyan-700">{parsedURL.fragment}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div><span className="text-blue-400">Protocol:</span> <span className="text-gray-300 font-mono">{parsedURL.protocol}</span></div>
                        <div><span className="text-purple-400">Subdomain:</span> <span className="text-gray-300 font-mono">{parsedURL.subdomain || '(none)'}</span></div>
                        <div><span className="text-yellow-400">Domain:</span> <span className="text-gray-300 font-mono">{parsedURL.domain}</span></div>
                        <div><span className="text-green-400">TLD:</span> <span className="text-gray-300 font-mono">.{parsedURL.tld}</span></div>
                        {parsedURL.port && <div><span className="text-red-400">Port:</span> <span className="text-gray-300 font-mono">{parsedURL.port}</span></div>}
                        {parsedURL.path && parsedURL.path !== '/' && <div><span className="text-orange-400">Path:</span> <span className="text-gray-300 font-mono">{parsedURL.path}</span></div>}
                        {parsedURL.query && <div className="col-span-2"><span className="text-pink-400">Query:</span> <span className="text-gray-300 font-mono">{parsedURL.query}</span></div>}
                      </div>
                    </div>

                    {/* Suspiciousness Score */}
                    {urlResult && (
                      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Suspiciousness Score</h3>
                            <p className={`text-[11px] font-medium mt-0.5 ${scoreColor}`}>{scoreLabel}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-2xl font-black ${scoreColor}`}>{urlResult.score}</span>
                            <span className="text-sm text-gray-400">/100</span>
                          </div>
                        </div>
                        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                          <div className={`h-full rounded-full transition-all duration-500 ${scoreBg}`} style={{ width: `${urlResult.score}%` }} />
                        </div>
                        <div className="space-y-2">
                          {urlResult.indicators.map(ind => (
                            <div key={ind.id} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                              ind.found
                                ? ind.severity === 'high' ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50'
                                : ind.severity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/50'
                                : 'bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50'
                                : 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/50'
                            }`}>
                              {ind.found ? (
                                <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                                  ind.severity === 'high' ? 'text-red-500' : ind.severity === 'medium' ? 'text-yellow-500' : 'text-orange-500'
                                }`} />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-500" />
                              )}
                              <div>
                                <div className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                  {ind.label}
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                    ind.found
                                      ? ind.severity === 'high' ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                                      : ind.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400'
                                      : 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400'
                                      : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                                  }`}>
                                    {ind.found ? ind.severity : 'pass'}
                                  </span>
                                </div>
                                <p className="text-gray-500 dark:text-gray-500 mt-0.5">{ind.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {urlInput && parsedURL && !parsedURL.valid && (
                  <div className="bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/50 p-3 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Could not parse the URL. Please enter a valid URL.
                  </div>
                )}

                {/* Sample URLs */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Try These URLs</h3>
                  <div className="space-y-1.5">
                    {[
                      { url: 'https://secure-paypa1.com/verify-account', label: 'PayPal lookalike' },
                      { url: 'http://fedex-delivery-notification.tk/confirm?id=38291', label: 'FedEx scam' },
                      { url: 'https://www.google.com/search?q=hello', label: 'Legitimate Google' },
                      { url: 'https://login.microsoftonline.com.evil-site.xyz/auth', label: 'Microsoft subdomain abuse' },
                      { url: 'https://github.com/user/repo', label: 'Legitimate GitHub' },
                      { url: 'http://192.168.1.100/admin/login.php', label: 'IP address login' },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => setUrlInput(item.url)}
                        className="w-full text-left p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-mono text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-2"
                      >
                        <Globe className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate flex-1">{item.url}</span>
                        <span className="text-[10px] text-gray-400 font-sans flex-shrink-0">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ──── SPOT THE PHISH QUIZ ──── */}
            {sandboxView === 'quiz' && (
              <div className="space-y-3">
                {/* Score Bar */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Round <span className="font-bold text-gray-900 dark:text-gray-100">{quizIndex + 1}</span> of {QUIZ_SCENARIOS.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Score: </span>
                      <span className="font-bold text-green-600 dark:text-green-400">{quizScore}</span>
                      <span className="text-gray-400">/{quizTotal}</span>
                      {quizTotal > 0 && (
                        <span className="text-[10px] text-gray-400 ml-1">
                          ({Math.round((quizScore / quizTotal) * 100)}%)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleResetQuiz}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                </div>

                {/* Scenario Description */}
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/50 p-3">
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    <span className="font-semibold">Scenario: </span>{currentQuiz.description}
                  </p>
                </div>

                {/* Side-by-Side Emails */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(['optionA', 'optionB'] as const).map((optionKey) => {
                    const option = currentQuiz[optionKey];
                    const letter = optionKey === 'optionA' ? 'A' : 'B';
                    const isSelected = quizAnswer === letter;
                    const isCorrectPhish = letter === currentQuiz.phishingOption;
                    const showResult = quizAnswer !== null;

                    let borderClass = 'border-gray-200 dark:border-gray-700';
                    if (showResult) {
                      if (isCorrectPhish) {
                        borderClass = 'border-red-400 dark:border-red-600 ring-1 ring-red-400/30';
                      } else {
                        borderClass = 'border-green-400 dark:border-green-600 ring-1 ring-green-400/30';
                      }
                    } else if (isSelected) {
                      borderClass = 'border-blue-400 dark:border-blue-600';
                    }

                    return (
                      <div
                        key={letter}
                        className={`bg-white dark:bg-gray-900 rounded-xl border-2 overflow-hidden transition-all ${borderClass} ${
                          !showResult ? 'cursor-pointer hover:border-red-300 dark:hover:border-red-700' : ''
                        }`}
                        onClick={() => !showResult && handleQuizAnswer(letter as 'A' | 'B')}
                      >
                        {/* Option Header */}
                        <div className={`px-3 py-2 border-b flex items-center justify-between ${
                          showResult
                            ? isCorrectPhish
                              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                              : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}>
                          <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{option.label}</span>
                          {showResult && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isCorrectPhish
                                ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                                : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                            }`}>
                              {isCorrectPhish ? 'PHISHING' : 'LEGITIMATE'}
                            </span>
                          )}
                        </div>

                        {/* Email Content */}
                        <div className="p-3 space-y-1.5 text-[11px]">
                          <div className="flex gap-1.5">
                            <span className="text-gray-400 w-12 flex-shrink-0">From:</span>
                            <span className={`font-mono ${showResult && isCorrectPhish ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                              {option.from}
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="text-gray-400 w-12 flex-shrink-0">Subj:</span>
                            <span className={`font-semibold ${showResult && isCorrectPhish ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                              {option.subject}
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="text-gray-400 w-12 flex-shrink-0">URL:</span>
                            <span className={`font-mono break-all ${showResult && isCorrectPhish ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                              {option.url}
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <p className={`leading-relaxed ${showResult && isCorrectPhish ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-400'}`}>
                              {option.body}
                            </p>
                          </div>
                        </div>

                        {/* Click to Select */}
                        {!showResult && (
                          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">Click to select as phishing</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Result Explanation */}
                {quizAnswer !== null && (
                  <div className={`rounded-xl border p-4 ${
                    quizAnswer === currentQuiz.phishingOption
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {quizAnswer === currentQuiz.phishingOption ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`text-sm font-bold ${
                        quizAnswer === currentQuiz.phishingOption
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}>
                        {quizAnswer === currentQuiz.phishingOption ? 'Correct! Well spotted.' : 'Incorrect. Let\'s learn from this.'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{currentQuiz.explanation}</p>
                    <button
                      onClick={handleNextQuiz}
                      className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 transition-colors"
                    >
                      Next Scenario <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Quiz Tips */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <Unlock className="w-3.5 h-3.5 text-gray-500" /> Quick Tips for Spotting Phishing
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                    <div className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" /> Check domains character by character</div>
                    <div className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" /> Look for HTTP vs HTTPS</div>
                    <div className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" /> Notice urgency and threat language</div>
                    <div className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" /> Check for generic vs personalized greetings</div>
                    <div className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" /> Verify TLDs (.com vs .tk, .club, .xyz)</div>
                    <div className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" /> Compare tone: calm vs panicked</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
