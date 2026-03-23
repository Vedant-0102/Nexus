import React, { useState, useCallback } from 'react';
import {
  Shield, Lock, CheckCircle, Server, AlertTriangle, Award,
  ChevronRight, RotateCcw, BookOpen, Cpu, Target, ArrowRight,
  XCircle, Info, Layers, Database, Wifi, HardDrive, Zap
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

type MainTab = 'learn' | 'sandbox';
type Pillar = 'confidentiality' | 'integrity' | 'availability';
type SandboxMode = 'triangle' | 'scenarios' | 'controls' | 'quiz';

interface Scenario {
  id: string;
  description: string;
  violatedPillar: Pillar;
  explanation: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface SecurityControl {
  name: string;
  pillar: Pillar;
  placed: Pillar | null;
}

// ─── Pillar Metadata ────────────────────────────────────────────────────────────

const PILLAR_META: Record<Pillar, {
  label: string;
  letter: string;
  color: string;
  bg: string;
  border: string;
  text: string;
  activeBg: string;
  activeText: string;
  hoverBorder: string;
}> = {
  confidentiality: {
    label: 'Confidentiality',
    letter: 'C',
    color: 'bg-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-400',
    activeBg: 'bg-blue-500',
    activeText: 'text-white',
    hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-500',
  },
  integrity: {
    label: 'Integrity',
    letter: 'I',
    color: 'bg-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-300 dark:border-green-700',
    text: 'text-green-700 dark:text-green-400',
    activeBg: 'bg-green-500',
    activeText: 'text-white',
    hoverBorder: 'hover:border-green-400 dark:hover:border-green-500',
  },
  availability: {
    label: 'Availability',
    letter: 'A',
    color: 'bg-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-300 dark:border-orange-700',
    text: 'text-orange-700 dark:text-orange-400',
    activeBg: 'bg-orange-500',
    activeText: 'text-white',
    hoverBorder: 'hover:border-orange-400 dark:hover:border-orange-500',
  },
};

const PILLARS: Pillar[] = ['confidentiality', 'integrity', 'availability'];

// ─── Scenarios (10+) ────────────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  { id: 's1', description: 'An employee leaves their company laptop unlocked in a taxi. A stranger opens it and photographs client financial records from the screen.', violatedPillar: 'confidentiality', explanation: 'Sensitive client data was exposed to an unauthorized person. This is a confidentiality breach caused by physical security negligence -- the data was never meant to be viewed by outsiders.' },
  { id: 's2', description: 'A disgruntled database administrator silently alters salary figures in the payroll database before quitting, causing incorrect payments to be issued for weeks.', violatedPillar: 'integrity', explanation: 'The payroll data was deliberately modified without authorization. Data integrity was compromised because the records no longer reflect the true, approved salary amounts.' },
  { id: 's3', description: 'A massive DDoS attack floods a hospital\'s electronic health records system with traffic, preventing doctors from pulling up patient histories during emergency surgeries.', violatedPillar: 'availability', explanation: 'The system was rendered inaccessible to authorized medical staff at a critical time. This is an availability violation -- the data still exists and is unmodified, but nobody can reach it.' },
  { id: 's4', description: 'A phishing email tricks a human resources employee into forwarding a spreadsheet containing Social Security numbers, home addresses, and salary data for all 2,000 company employees to an external attacker.', violatedPillar: 'confidentiality', explanation: 'Personally identifiable information was disclosed to an unauthorized external party through social engineering. This is a classic confidentiality breach with serious regulatory implications under laws like GDPR and state breach notification statutes.' },
  { id: 's5', description: 'A supply chain attack injects malicious code into a widely-used open-source library. When companies download and integrate the compromised package, their build artifacts are silently backdoored.', violatedPillar: 'integrity', explanation: 'The software distribution was tampered with at the source. The integrity of the package was violated because users received code that had been secretly modified from its legitimate version.' },
  { id: 's6', description: 'Ransomware encrypts every file on a law firm\'s network, including all case files, contracts, and correspondence. The firm has no recent offline backups and operations grind to a halt.', violatedPillar: 'availability', explanation: 'While the data is technically still present on disk, it is completely inaccessible without the decryption key. This is primarily an availability violation as the firm cannot access or use its own data.' },
  { id: 's7', description: 'An attacker exploits a SQL injection vulnerability on an e-commerce site and dumps the entire customer database, including hashed passwords and credit card tokens, to a dark web forum.', violatedPillar: 'confidentiality', explanation: 'Customer credentials and payment information were extracted and publicly exposed. Even though passwords were hashed, the unauthorized disclosure of the data constitutes a confidentiality breach.' },
  { id: 's8', description: 'A man-in-the-middle attacker intercepts API calls between a mobile banking app and the bank\'s server, altering transfer amounts before they reach the backend processing system.', violatedPillar: 'integrity', explanation: 'The transaction data was modified in transit without detection. Integrity was violated because the data received by the bank no longer matched what the customer actually submitted.' },
  { id: 's9', description: 'A construction crew accidentally severs the primary and backup fiber optic cables running into a data center, taking an entire cloud region offline for six hours.', violatedPillar: 'availability', explanation: 'Physical infrastructure damage severed connectivity, making all hosted services unreachable. This is an availability failure caused by inadequate physical path diversity for network connections.' },
  { id: 's10', description: 'An insider at a healthcare company copies 50,000 patient medical records onto a personal USB drive and sells them to a data broker, violating HIPAA regulations.', violatedPillar: 'confidentiality', explanation: 'Protected health information (PHI) was stolen and sold by an authorized insider who abused their access. This is a severe confidentiality breach with both criminal and regulatory consequences under HIPAA.' },
  { id: 's11', description: 'An attacker gains access to a company\'s DNS management console and modifies A-records to point the corporate website to a phishing clone that harvests employee credentials.', violatedPillar: 'integrity', explanation: 'DNS records were tampered with, causing users to be redirected to a fraudulent site. The integrity of the DNS infrastructure was compromised, enabling further credential theft.' },
  { id: 's12', description: 'A cloud provider\'s storage system experiences cascading hardware failures across multiple availability zones, destroying customer data that had not been replicated to another region.', violatedPillar: 'availability', explanation: 'Data was permanently lost due to infrastructure failure without sufficient geographic redundancy. This is an availability violation that also impacts integrity, as the data no longer exists to be accessed.' },
];

// ─── Quiz Questions (8+) ────────────────────────────────────────────────────────

const QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: 'q1', question: 'A company deploys AES-256 encryption for all customer data stored in its databases. Which CIA pillar does this primarily protect?', options: ['Confidentiality', 'Integrity', 'Availability', 'All three equally'], correctIndex: 0, explanation: 'Encryption at rest primarily protects confidentiality. Even if an attacker gains access to the raw storage, they cannot read the data without the decryption key.' },
  { id: 'q2', question: 'An organization uses SHA-256 checksums published alongside every software download. Which CIA pillar does this primarily protect?', options: ['Confidentiality', 'Integrity', 'Availability', 'None of them'], correctIndex: 1, explanation: 'Checksums allow users to verify that downloaded files have not been tampered with or corrupted. This directly protects data integrity.' },
  { id: 'q3', question: 'A hospital deploys redundant servers with automatic failover so that if one server crashes, another immediately takes over patient record requests. Which pillar does this protect?', options: ['Confidentiality', 'Integrity', 'Availability', 'Confidentiality and Integrity'], correctIndex: 2, explanation: 'Redundancy and automatic failover ensure continuous access to systems and data, directly protecting availability.' },
  { id: 'q4', question: 'What does the "D" in the DAD triad stand for?', options: ['Defense', 'Disclosure', 'Deterrence', 'Decryption'], correctIndex: 1, explanation: 'The DAD triad (Disclosure, Alteration, Destruction) represents the opposite threats to the CIA triad. Disclosure threatens Confidentiality, Alteration threatens Integrity, and Destruction threatens Availability.' },
  { id: 'q5', question: 'Which of the following is a potential conflict between CIA pillars?', options: ['Encryption improves both confidentiality and availability', 'Strong access controls can reduce availability if they are too restrictive', 'Backups always improve integrity', 'Load balancers primarily protect confidentiality'], correctIndex: 1, explanation: 'Overly restrictive access controls protect confidentiality but can hurt availability by making it harder for legitimate users to access resources. Balancing the pillars is a constant challenge in security design.' },
  { id: 'q6', question: 'In the Parkerian Hexad, which three properties are added beyond the traditional CIA triad?', options: ['Possession, Authenticity, Utility', 'Authentication, Authorization, Accounting', 'Privacy, Accountability, Non-repudiation', 'Resilience, Scalability, Maintainability'], correctIndex: 0, explanation: 'The Parkerian Hexad extends CIA with three additional attributes: Possession (control over data), Authenticity (genuineness of data), and Utility (usefulness of data). These provide a more nuanced framework.' },
  { id: 'q7', question: 'A bank requires both a password and a fingerprint scan to access vault records. This multi-factor authentication primarily protects which pillar?', options: ['Integrity', 'Availability', 'Confidentiality', 'It does not relate to CIA'], correctIndex: 2, explanation: 'Multi-factor authentication restricts access to authorized personnel only, directly protecting the confidentiality of the vault records.' },
  { id: 'q8', question: 'An ISP deploys anti-DDoS mitigation appliances at all network ingress points. Which CIA pillar does this primarily protect?', options: ['Confidentiality', 'Integrity', 'Availability', 'Integrity and Confidentiality'], correctIndex: 2, explanation: 'DDoS mitigation prevents volumetric and application-layer attacks from overwhelming services, directly protecting availability for legitimate users.' },
  { id: 'q9', question: 'Digital signatures on software updates primarily protect which pillar?', options: ['Confidentiality', 'Integrity', 'Availability', 'None'], correctIndex: 1, explanation: 'Digital signatures prove that software has not been altered after it was signed by the publisher. They directly protect integrity by enabling tamper detection.' },
  { id: 'q10', question: 'Which of the following is NOT a common threat to availability?', options: ['DDoS attacks', 'Hardware failure', 'SQL injection', 'Natural disasters'], correctIndex: 2, explanation: 'SQL injection is primarily a threat to confidentiality (data exfiltration) and integrity (data modification). DDoS attacks, hardware failures, and natural disasters all directly threaten system availability.' },
];

// ─── Security Controls for Mapper ───────────────────────────────────────────────

const INITIAL_CONTROLS: SecurityControl[] = [
  { name: 'Firewall', pillar: 'confidentiality', placed: null },
  { name: 'AES-256 Encryption', pillar: 'confidentiality', placed: null },
  { name: 'Access Control Lists', pillar: 'confidentiality', placed: null },
  { name: 'VPN Tunnel', pillar: 'confidentiality', placed: null },
  { name: 'SHA-256 Checksum', pillar: 'integrity', placed: null },
  { name: 'Digital Signatures', pillar: 'integrity', placed: null },
  { name: 'Version Control (Git)', pillar: 'integrity', placed: null },
  { name: 'Input Validation', pillar: 'integrity', placed: null },
  { name: 'Load Balancer', pillar: 'availability', placed: null },
  { name: 'Backup & Recovery', pillar: 'availability', placed: null },
  { name: 'DDoS Protection', pillar: 'availability', placed: null },
  { name: 'Redundant Power (UPS)', pillar: 'availability', placed: null },
];

// ─── Learn Tab Section Component ────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="mb-5">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
    </div>
    <div className="text-[11.5px] leading-relaxed text-gray-700 dark:text-gray-300 space-y-2 ml-0.5">
      {children}
    </div>
  </div>
);

const BulletList: React.FC<{ items: string[]; colorClass?: string }> = ({ items, colorClass = 'text-gray-600 dark:text-gray-400' }) => (
  <ul className="space-y-1 mt-1.5">
    {items.map((item, i) => (
      <li key={i} className={`flex items-start gap-2 text-[11px] ${colorClass}`}>
        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-60" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

// ─── Main Component ─────────────────────────────────────────────────────────────

export const CIATriadExplainer: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTab>('sandbox');
  const [sandboxMode, setSandboxMode] = useState<SandboxMode>('triangle');
  const [activePillar, setActivePillar] = useState<Pillar | null>(null);
  const [learnExpandedPillar, setLearnExpandedPillar] = useState<Pillar | null>(null);

  // Scenario state
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioAnswer, setScenarioAnswer] = useState<Pillar | null>(null);
  const [scenarioRevealed, setScenarioRevealed] = useState(false);
  const [scenarioScore, setScenarioScore] = useState(0);
  const [scenarioAttempts, setScenarioAttempts] = useState(0);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAttempts, setQuizAttempts] = useState(0);

  // Controls mapper state
  const [controls, setControls] = useState<SecurityControl[]>(INITIAL_CONTROLS.map(c => ({ ...c })));
  const [selectedControl, setSelectedControl] = useState<number | null>(null);
  const [controlsScore, setControlsScore] = useState(0);
  const [controlsAttempts, setControlsAttempts] = useState(0);

  // Combined score
  const totalScore = scenarioScore + quizScore + controlsScore;
  const totalAttempts = scenarioAttempts + quizAttempts + controlsAttempts;

  // ─── Scenario Handlers ──────────────────────────────────────────────────────

  const handleScenarioAnswer = useCallback((pillar: Pillar) => {
    if (scenarioRevealed) return;
    setScenarioAnswer(pillar);
    setScenarioRevealed(true);
    setScenarioAttempts(a => a + 1);
    if (pillar === SCENARIOS[scenarioIndex].violatedPillar) {
      setScenarioScore(s => s + 1);
    }
  }, [scenarioIndex, scenarioRevealed]);

  const nextScenario = useCallback(() => {
    setScenarioIndex(i => (i + 1) % SCENARIOS.length);
    setScenarioAnswer(null);
    setScenarioRevealed(false);
  }, []);

  // ─── Quiz Handlers ──────────────────────────────────────────────────────────

  const handleQuizAnswer = useCallback((optionIndex: number) => {
    if (quizRevealed) return;
    setQuizAnswer(optionIndex);
    setQuizRevealed(true);
    setQuizAttempts(a => a + 1);
    if (optionIndex === QUIZ_QUESTIONS[quizIndex].correctIndex) {
      setQuizScore(s => s + 1);
    }
  }, [quizIndex, quizRevealed]);

  const nextQuiz = useCallback(() => {
    setQuizIndex(i => (i + 1) % QUIZ_QUESTIONS.length);
    setQuizAnswer(null);
    setQuizRevealed(false);
  }, []);

  // ─── Controls Mapper Handlers ───────────────────────────────────────────────

  const handlePlaceControl = useCallback((pillar: Pillar) => {
    if (selectedControl === null) return;
    const ctrl = controls[selectedControl];
    if (ctrl.placed !== null) return;
    const isCorrect = ctrl.pillar === pillar;
    setControls(prev => prev.map((c, i) => i === selectedControl ? { ...c, placed: pillar } : c));
    setControlsAttempts(a => a + 1);
    if (isCorrect) setControlsScore(s => s + 1);
    setSelectedControl(null);
  }, [selectedControl, controls]);

  const resetControls = useCallback(() => {
    setControls(INITIAL_CONTROLS.map(c => ({ ...c })));
    setSelectedControl(null);
    setControlsScore(0);
    setControlsAttempts(0);
  }, []);

  const resetAllScores = useCallback(() => {
    setScenarioScore(0);
    setScenarioAttempts(0);
    setQuizScore(0);
    setQuizAttempts(0);
    resetControls();
  }, [resetControls]);

  // ─── Answer Button Styling ──────────────────────────────────────────────────

  const getPillarBtnClass = (pillar: Pillar, answer: Pillar | null, correct: Pillar, revealed: boolean): string => {
    const base = 'w-full px-3 py-2.5 text-xs rounded-lg font-medium transition-all border-2 text-left ';
    if (!revealed) return base + 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer';
    if (pillar === correct) return base + 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-2 ring-green-300 dark:ring-green-700';
    if (pillar === answer && pillar !== correct) return base + 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    return base + 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500';
  };

  const getQuizBtnClass = (idx: number, answer: number | null, correctIdx: number, revealed: boolean): string => {
    const base = 'w-full px-3 py-2.5 text-xs rounded-lg font-medium transition-all border-2 text-left ';
    if (!revealed) return base + 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer';
    if (idx === correctIdx) return base + 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-2 ring-green-300 dark:ring-green-700';
    if (idx === answer && idx !== correctIdx) return base + 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    return base + 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500';
  };

  // ─── Render: Learn Tab ────────────────────────────────────────────────────────

  const renderLearnTab = () => (
    <div className="space-y-1">
      {/* Introduction */}
      <Section title="What is the CIA Triad?" icon={<Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}>
        <p>
          The CIA Triad is the foundational model underlying all of information security. Developed as a framework for evaluating
          the security posture of systems and organizations, it defines three core objectives that every security measure, policy,
          and architecture decision should address: <strong>Confidentiality</strong>, <strong>Integrity</strong>, and <strong>Availability</strong>.
        </p>
        <p>
          Whether you are designing a firewall rule, writing an access control policy, responding to an incident, or architecting a
          cloud-native application, each decision maps back to protecting one or more of these three pillars. The triad provides a
          common vocabulary for security professionals, auditors, compliance officers, and engineers to discuss risk and prioritize
          defensive measures.
        </p>
        <p>
          The CIA Triad first emerged from early work in computer security research during the 1970s and 1980s, and has since been
          codified in standards such as ISO/IEC 27001, NIST SP 800-53, and the CISSP Common Body of Knowledge. Despite its simplicity,
          it remains the single most referenced model in security education and practice today.
        </p>
      </Section>

      {/* Confidentiality */}
      <Section title="Confidentiality" icon={<Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />}>
        <p>
          <strong>Definition:</strong> Confidentiality ensures that information is disclosed only to authorized individuals, entities,
          and processes. It is about preventing unauthorized access to sensitive data, whether at rest, in transit, or in use.
        </p>
        <p><strong>Key mechanisms:</strong></p>
        <BulletList colorClass="text-blue-700 dark:text-blue-400" items={[
          'Encryption (AES-256, RSA, ChaCha20) -- transforms readable data into ciphertext that requires a key to decode. Applied both at rest (disk encryption, database-level encryption) and in transit (TLS/SSL, VPNs, IPSec tunnels).',
          'Access Controls -- role-based access control (RBAC), attribute-based access control (ABAC), mandatory access control (MAC), and discretionary access control (DAC) restrict who can read or interact with resources.',
          'Data Classification -- labeling data as Public, Internal, Confidential, or Top Secret determines the handling procedures, encryption requirements, and access restrictions applied to each tier.',
          'Authentication mechanisms -- passwords, biometrics, smart cards, and multi-factor authentication (MFA) verify identity before granting access to confidential resources.',
          'Network segmentation and firewalls -- isolate sensitive systems from general-purpose networks to limit exposure.',
        ]} />
        <p className="mt-2"><strong>Real-world examples:</strong></p>
        <BulletList colorClass="text-blue-700 dark:text-blue-400" items={[
          'HIPAA requires healthcare organizations to encrypt patient health records (PHI) and restrict access to minimum necessary personnel. Violations can result in fines up to $1.5M per incident category per year.',
          'Banking institutions use end-to-end encryption for wire transfers and require MFA for online banking access, protecting account holder financial data.',
          'Government agencies classify documents (Confidential, Secret, Top Secret) and enforce clearance-based access, with physical and digital controls at every layer.',
          'Tech companies use data loss prevention (DLP) tools to scan outbound communications and block emails containing credit card numbers, SSNs, or other PII.',
        ]} />
      </Section>

      {/* Integrity */}
      <Section title="Integrity" icon={<CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />}>
        <p>
          <strong>Definition:</strong> Integrity ensures that data remains accurate, complete, and trustworthy throughout its entire
          lifecycle. It guards against unauthorized modification -- whether malicious (attacks) or accidental (bugs, human error).
        </p>
        <p><strong>Key mechanisms:</strong></p>
        <BulletList colorClass="text-green-700 dark:text-green-400" items={[
          'Hashing algorithms (SHA-256, SHA-3, BLAKE3) -- produce a fixed-size fingerprint of data. Any modification to the source, even a single bit flip, produces a completely different hash, enabling tamper detection.',
          'Checksums and CRC -- lightweight verification codes appended to data blocks to catch accidental corruption during transmission or storage.',
          'Digital Signatures (RSA, ECDSA, EdDSA) -- cryptographically bind a document or message to its author, proving both authenticity and that the content has not been modified since signing.',
          'Version control systems (Git, SVN) -- track every change to source code with full history, author attribution, diffs, and the ability to revert unauthorized modifications.',
          'Database constraints, triggers, and referential integrity rules -- enforce data validity at the schema level, preventing invalid states even if application logic fails.',
          'Input validation and parameterized queries -- prevent injection attacks (SQL injection, XSS) that could modify data or inject malicious content.',
        ]} />
        <p className="mt-2"><strong>Real-world examples:</strong></p>
        <BulletList colorClass="text-green-700 dark:text-green-400" items={[
          'Linux distributions publish SHA-256 checksums alongside ISO downloads so users can verify the image was not tampered with during download.',
          'Certificate authorities sign TLS certificates, allowing browsers to verify a website\'s identity and detect man-in-the-middle attacks.',
          'Financial regulators require audit trails with tamper-evident logging (write-once media, blockchain-based logs) to ensure transaction records cannot be retroactively altered.',
          'Software update systems (Windows Update, apt, Homebrew) verify digital signatures on packages before installation to prevent supply chain attacks.',
        ]} />
      </Section>

      {/* Availability */}
      <Section title="Availability" icon={<Server className="w-4 h-4 text-orange-600 dark:text-orange-400" />}>
        <p>
          <strong>Definition:</strong> Availability ensures that systems, networks, and data are accessible and operational when
          authorized users need them. Downtime directly translates to lost revenue, impaired safety, and eroded trust.
        </p>
        <p><strong>Key mechanisms:</strong></p>
        <BulletList colorClass="text-orange-700 dark:text-orange-400" items={[
          'Redundancy -- deploying duplicate servers, network paths, power supplies, and storage arrays so that the failure of any single component does not cause an outage.',
          'Failover and clustering -- hot-standby, warm-standby, and active-active configurations automatically redirect traffic when primary systems fail.',
          'DDoS mitigation -- CDN-based scrubbing, rate limiting, traffic analysis, and anycast networks absorb or deflect volumetric and application-layer denial-of-service attacks.',
          'Backup and disaster recovery -- regular backups (full, incremental, differential) stored offsite or in different cloud regions, with tested restoration procedures and defined RTO/RPO targets.',
          'Service Level Agreements (SLAs) -- contractual uptime commitments (e.g., 99.99% = ~52 minutes downtime per year) that drive architecture decisions for redundancy and monitoring.',
          'Uninterruptible Power Supplies (UPS) and generator systems -- protect against power outages, brownouts, and surges that could take down physical infrastructure.',
        ]} />
        <p className="mt-2"><strong>Real-world examples:</strong></p>
        <BulletList colorClass="text-orange-700 dark:text-orange-400" items={[
          'AWS, Azure, and GCP offer multi-AZ and multi-region deployments with automatic failover, targeting "five nines" (99.999%) availability for critical workloads.',
          'Major DNS providers use anycast to distribute DNS resolution globally, ensuring domain resolution even if entire data centers go offline.',
          'Hospitals maintain backup generators and redundant network connections to ensure life-critical systems remain operational during emergencies.',
          'Financial exchanges implement circuit breakers and auto-scaling to handle sudden spikes in trading volume without service degradation.',
        ]} />
      </Section>

      {/* Pillar Interactions */}
      <Section title="How the Pillars Interact and Conflict" icon={<Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />}>
        <p>
          The three pillars are interdependent but can also conflict. Security architects must constantly balance trade-offs:
        </p>
        <BulletList items={[
          'Confidentiality vs. Availability: Heavy encryption and strict access controls protect data but add latency, complexity, and potential points of failure. If an encryption key management system goes down, encrypted data becomes inaccessible -- hurting availability while ostensibly protecting confidentiality.',
          'Integrity vs. Availability: Extensive integrity checks (multi-layer checksums, consensus protocols) slow down data processing and can create bottlenecks. Blockchain systems, for example, provide strong integrity but sacrifice throughput and speed.',
          'Confidentiality vs. Integrity: An overly compartmentalized system where even administrators lack full access may hinder the ability to perform integrity audits or detect unauthorized modifications.',
          'The goal is not to maximize all three simultaneously (which is often impossible) but to find the right balance for the specific system, its risk profile, and regulatory requirements.',
        ]} />
      </Section>

      {/* DAD Triad */}
      <Section title="The DAD Triad -- The Inverse" icon={<AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />}>
        <p>
          The DAD triad represents the three categories of threats that directly oppose the CIA objectives:
        </p>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800">
            <div className="text-[11px] font-bold text-red-700 dark:text-red-400 mb-1">Disclosure</div>
            <div className="text-[10px] text-red-600 dark:text-red-400 opacity-80">Opposes Confidentiality. Unauthorized exposure of information -- data breaches, leaks, eavesdropping.</div>
          </div>
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800">
            <div className="text-[11px] font-bold text-red-700 dark:text-red-400 mb-1">Alteration</div>
            <div className="text-[10px] text-red-600 dark:text-red-400 opacity-80">Opposes Integrity. Unauthorized modification of data -- tampering, corruption, injection attacks.</div>
          </div>
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800">
            <div className="text-[11px] font-bold text-red-700 dark:text-red-400 mb-1">Destruction</div>
            <div className="text-[10px] text-red-600 dark:text-red-400 opacity-80">Opposes Availability. Rendering data or systems unusable -- DDoS, ransomware, physical destruction.</div>
          </div>
        </div>
      </Section>

      {/* Parkerian Hexad */}
      <Section title="Parkerian Hexad -- Extending CIA" icon={<Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}>
        <p>
          Proposed by Donn B. Parker in 1998, the Parkerian Hexad expands the CIA Triad with three additional attributes for a
          more nuanced security analysis framework:
        </p>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/15 border border-indigo-200 dark:border-indigo-800">
            <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 mb-1">Possession</div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 opacity-80">Control over the physical or digital medium containing data. A stolen (but encrypted) laptop violates possession even if confidentiality is maintained.</div>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/15 border border-indigo-200 dark:border-indigo-800">
            <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 mb-1">Authenticity</div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 opacity-80">Verifying that data, transactions, or communications genuinely originate from their claimed source. Related to but distinct from integrity.</div>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/15 border border-indigo-200 dark:border-indigo-800">
            <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 mb-1">Utility</div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 opacity-80">Data must be in a usable format. Encrypted data without the key is available (it exists) and has integrity (unchanged), but has zero utility.</div>
          </div>
        </div>
      </Section>

      {/* Controls Mapped to CIA */}
      <Section title="Security Controls Mapped to CIA" icon={<Target className="w-4 h-4 text-teal-600 dark:text-teal-400" />}>
        <p>Every security control can be mapped back to the CIA pillar(s) it primarily protects:</p>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div>
            <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 mb-1.5 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Confidentiality
            </div>
            <BulletList colorClass="text-blue-600 dark:text-blue-400" items={['Firewalls', 'Encryption (AES, RSA)', 'Access Control Lists', 'VPN / TLS tunnels', 'Data masking', 'MFA']} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-green-700 dark:text-green-400 mb-1.5 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Integrity
            </div>
            <BulletList colorClass="text-green-600 dark:text-green-400" items={['SHA-256 checksums', 'Digital signatures', 'Version control', 'Input validation', 'Database constraints', 'Audit logs']} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-orange-700 dark:text-orange-400 mb-1.5 flex items-center gap-1">
              <Server className="w-3 h-3" /> Availability
            </div>
            <BulletList colorClass="text-orange-600 dark:text-orange-400" items={['Load balancers', 'Backup & recovery', 'DDoS protection', 'Redundant infra', 'UPS / generators', 'Auto-scaling']} />
          </div>
        </div>
      </Section>

      {/* Case Study */}
      <Section title="Case Study: Analyzing a Breach Through the CIA Lens" icon={<BookOpen className="w-4 h-4 text-rose-600 dark:text-rose-400" />}>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-2">
          <div className="text-xs font-bold text-gray-900 dark:text-white mb-1">The 2017 Equifax Breach</div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            In September 2017, Equifax disclosed that attackers had exploited an unpatched Apache Struts vulnerability (CVE-2017-5638)
            to access the personal data of approximately 147 million consumers, including Social Security numbers, birth dates,
            addresses, and driver's license numbers.
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400">C</span>
            </div>
            <p className="text-[11px] text-gray-700 dark:text-gray-300">
              <strong>Confidentiality failure:</strong> 147 million records containing SSNs, birth dates, and financial data were
              exfiltrated. The breach was caused by a failure to patch a known vulnerability within two months of disclosure, compounded
              by expired SSL certificates on internal security monitoring tools that prevented detection of the data exfiltration.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-green-700 dark:text-green-400">I</span>
            </div>
            <p className="text-[11px] text-gray-700 dark:text-gray-300">
              <strong>Integrity concern:</strong> While the attackers primarily exfiltrated data rather than modifying it, the integrity
              of Equifax's vulnerability management process was fundamentally broken. The company could not reliably track which systems
              had been patched, and its internal audit processes failed to flag the gap.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-orange-700 dark:text-orange-400">A</span>
            </div>
            <p className="text-[11px] text-gray-700 dark:text-gray-300">
              <strong>Availability impact:</strong> While core credit reporting services remained online, Equifax had to take impacted
              systems offline for forensic investigation, and its consumer-facing breach notification website experienced severe availability
              issues under traffic load, ironically undermining the incident response itself.
            </p>
          </div>
        </div>
        <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-2 italic">
          Lesson: A single unpatched vulnerability cascaded into failures across all three CIA pillars. Defense in depth -- layered
          controls across C, I, and A -- is essential because any single control can fail.
        </p>
      </Section>
    </div>
  );

  // ─── Render: Sandbox -- Triangle ────────────────────────────────────────────

  const renderTriangle = () => (
    <div className="space-y-3">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-center">
          <svg viewBox="0 0 400 330" className="w-full max-w-[380px] h-auto">
            <polygon points="200,35 45,285 355,285" fill="none" stroke="currentColor" className="text-gray-300 dark:text-gray-600" strokeWidth="2" />
            <line x1="200" y1="35" x2="200" y2="180" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="1" strokeDasharray="5,5" />
            <line x1="45" y1="285" x2="200" y2="180" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="1" strokeDasharray="5,5" />
            <line x1="355" y1="285" x2="200" y2="180" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="1" strokeDasharray="5,5" />
            <text x="200" y="185" textAnchor="middle" className="text-[11px] font-bold fill-gray-400 dark:fill-gray-500">CIA</text>

            {/* Confidentiality vertex */}
            <g onClick={() => setActivePillar(activePillar === 'confidentiality' ? null : 'confidentiality')} className="cursor-pointer">
              <circle cx="200" cy="35" r="30" className={`transition-all duration-300 ${activePillar === 'confidentiality' ? 'fill-blue-500 stroke-blue-300 dark:stroke-blue-400' : 'fill-blue-100 dark:fill-blue-900/40 stroke-blue-400 dark:stroke-blue-600'}`} strokeWidth="2.5" />
              <text x="200" y="40" textAnchor="middle" className={`text-[12px] font-bold transition-all ${activePillar === 'confidentiality' ? 'fill-white' : 'fill-blue-700 dark:fill-blue-400'}`}>C</text>
              <text x="200" y="10" textAnchor="middle" className="text-[10px] font-semibold fill-blue-600 dark:fill-blue-400">Confidentiality</text>
            </g>

            {/* Integrity vertex */}
            <g onClick={() => setActivePillar(activePillar === 'integrity' ? null : 'integrity')} className="cursor-pointer">
              <circle cx="45" cy="285" r="30" className={`transition-all duration-300 ${activePillar === 'integrity' ? 'fill-green-500 stroke-green-300 dark:stroke-green-400' : 'fill-green-100 dark:fill-green-900/40 stroke-green-400 dark:stroke-green-600'}`} strokeWidth="2.5" />
              <text x="45" y="290" textAnchor="middle" className={`text-[12px] font-bold transition-all ${activePillar === 'integrity' ? 'fill-white' : 'fill-green-700 dark:fill-green-400'}`}>I</text>
              <text x="45" y="325" textAnchor="middle" className="text-[10px] font-semibold fill-green-600 dark:fill-green-400">Integrity</text>
            </g>

            {/* Availability vertex */}
            <g onClick={() => setActivePillar(activePillar === 'availability' ? null : 'availability')} className="cursor-pointer">
              <circle cx="355" cy="285" r="30" className={`transition-all duration-300 ${activePillar === 'availability' ? 'fill-orange-500 stroke-orange-300 dark:stroke-orange-400' : 'fill-orange-100 dark:fill-orange-900/40 stroke-orange-400 dark:stroke-orange-600'}`} strokeWidth="2.5" />
              <text x="355" y="290" textAnchor="middle" className={`text-[12px] font-bold transition-all ${activePillar === 'availability' ? 'fill-white' : 'fill-orange-700 dark:fill-orange-400'}`}>A</text>
              <text x="355" y="325" textAnchor="middle" className="text-[10px] font-semibold fill-orange-600 dark:fill-orange-400">Availability</text>
            </g>

            {/* Edge labels */}
            <text x="113" y="150" textAnchor="middle" transform="rotate(-56, 113, 150)" className="text-[8px] fill-gray-400 dark:fill-gray-500">Protect data access</text>
            <text x="287" y="150" textAnchor="middle" transform="rotate(56, 287, 150)" className="text-[8px] fill-gray-400 dark:fill-gray-500">Ensure uptime + secrecy</text>
            <text x="200" y="303" textAnchor="middle" className="text-[8px] fill-gray-400 dark:fill-gray-500">Accurate + Accessible</text>
          </svg>
        </div>
        <p className="text-center text-[10px] text-gray-500 dark:text-gray-400 mt-1">Click each vertex to explore that pillar</p>
      </div>

      {/* Pillar detail panel */}
      {activePillar && (
        <div className={`${PILLAR_META[activePillar].bg} rounded-xl border ${PILLAR_META[activePillar].border} p-4 transition-all duration-300`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-7 h-7 rounded-lg ${PILLAR_META[activePillar].color} flex items-center justify-center`}>
              {activePillar === 'confidentiality' && <Lock className="w-4 h-4 text-white" />}
              {activePillar === 'integrity' && <CheckCircle className="w-4 h-4 text-white" />}
              {activePillar === 'availability' && <Server className="w-4 h-4 text-white" />}
            </div>
            <div>
              <h3 className={`text-sm font-bold ${PILLAR_META[activePillar].text}`}>{PILLAR_META[activePillar].label}</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {activePillar === 'confidentiality' && 'Ensuring data is only accessible to authorized parties'}
                {activePillar === 'integrity' && 'Ensuring data accuracy and preventing unauthorized modifications'}
                {activePillar === 'availability' && 'Ensuring systems and data are accessible when needed'}
              </p>
            </div>
          </div>
          <div className={`space-y-2 text-[11px] ${PILLAR_META[activePillar].text} opacity-90`}>
            {activePillar === 'confidentiality' && <>
              <p>Confidentiality protects sensitive information from unauthorized disclosure. It is enforced through encryption, access controls, authentication, and data classification policies.</p>
              <p>Common threats include data breaches, social engineering, insider threats, and eavesdropping on unencrypted channels.</p>
              <p><strong>Key controls:</strong> AES/RSA encryption, role-based access control, multi-factor authentication, VPN tunnels, data loss prevention, network segmentation.</p>
            </>}
            {activePillar === 'integrity' && <>
              <p>Integrity ensures data has not been tampered with and remains accurate and trustworthy. It covers both intentional attacks (man-in-the-middle, injection) and accidental corruption.</p>
              <p>Common threats include SQL injection, unauthorized data modification, bit rot, and supply chain tampering.</p>
              <p><strong>Key controls:</strong> SHA-256 hashing, digital signatures, version control, input validation, database constraints, write-once audit logs, code signing.</p>
            </>}
            {activePillar === 'availability' && <>
              <p>Availability ensures authorized users can access systems and data whenever needed. Downtime costs organizations money, reputation, and in critical sectors like healthcare, can endanger lives.</p>
              <p>Common threats include DDoS attacks, hardware failure, ransomware, natural disasters, and power outages.</p>
              <p><strong>Key controls:</strong> Load balancers, redundant servers, backup and disaster recovery, DDoS mitigation, UPS/generators, auto-scaling, SLA monitoring.</p>
            </>}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Render: Sandbox -- Scenarios ───────────────────────────────────────────

  const renderScenarios = () => {
    const scenario = SCENARIOS[scenarioIndex];
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Which CIA pillar is violated?
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Score: <span className="font-bold text-cyan-600 dark:text-cyan-400">{scenarioScore}/{scenarioAttempts}</span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4 border border-gray-200 dark:border-gray-700">
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">Scenario {scenarioIndex + 1} of {SCENARIOS.length}</div>
          <p className="text-[12px] text-gray-800 dark:text-gray-200 font-medium leading-relaxed">{scenario.description}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {PILLARS.map(p => (
            <button
              key={p}
              onClick={() => handleScenarioAnswer(p)}
              disabled={scenarioRevealed}
              className={getPillarBtnClass(p, scenarioAnswer, scenario.violatedPillar, scenarioRevealed)}
            >
              <div className="flex items-center justify-center gap-1.5">
                {p === 'confidentiality' && <Lock className="w-3.5 h-3.5" />}
                {p === 'integrity' && <CheckCircle className="w-3.5 h-3.5" />}
                {p === 'availability' && <Server className="w-3.5 h-3.5" />}
                {PILLAR_META[p].label}
              </div>
            </button>
          ))}
        </div>

        {scenarioRevealed && (
          <div className={`p-3 rounded-lg border mb-3 ${scenarioAnswer === scenario.violatedPillar
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
            }`}>
            <div className={`text-xs font-bold mb-1 flex items-center gap-1.5 ${scenarioAnswer === scenario.violatedPillar ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {scenarioAnswer === scenario.violatedPillar
                ? <><CheckCircle className="w-3.5 h-3.5" /> Correct!</>
                : <><XCircle className="w-3.5 h-3.5" /> Incorrect. The answer is {PILLAR_META[scenario.violatedPillar].label}.</>
              }
            </div>
            <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">{scenario.explanation}</p>
          </div>
        )}

        <button onClick={nextScenario} className="px-4 py-2 text-xs bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-semibold transition-colors flex items-center gap-1.5">
          Next Scenario <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // ─── Render: Sandbox -- Controls Mapper ─────────────────────────────────────

  const renderControlsMapper = () => {
    const unplaced = controls.filter(c => c.placed === null);
    const allPlaced = unplaced.length === 0;
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <Database className="w-4 h-4 text-teal-500" />
            Controls Mapper
          </h3>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Score: <span className="font-bold text-cyan-600 dark:text-cyan-400">{controlsScore}/{controlsAttempts}</span>
            </div>
            <button onClick={resetControls} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
          Select a security control below, then click the CIA pillar it primarily protects.
        </p>

        {/* Unplaced controls */}
        {unplaced.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Unclassified Controls</div>
            <div className="flex flex-wrap gap-1.5">
              {controls.map((ctrl, idx) => {
                if (ctrl.placed !== null) return null;
                const isSelected = selectedControl === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedControl(isSelected ? null : idx)}
                    className={`px-2.5 py-1.5 text-[11px] rounded-lg border-2 font-medium transition-all ${isSelected
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 ring-2 ring-cyan-300 dark:ring-cyan-700'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                  >
                    {ctrl.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Drop targets */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {PILLARS.map(p => {
            const meta = PILLAR_META[p];
            const placed = controls.filter(c => c.placed === p);
            return (
              <button
                key={p}
                onClick={() => handlePlaceControl(p)}
                disabled={selectedControl === null || allPlaced}
                className={`p-3 rounded-lg border-2 border-dashed transition-all min-h-[100px] flex flex-col ${selectedControl !== null
                  ? `${meta.border} ${meta.bg} ${meta.hoverBorder} cursor-pointer`
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                  }`}
              >
                <div className={`text-xs font-bold mb-2 ${meta.text}`}>
                  {meta.label}
                </div>
                <div className="space-y-1 flex-1">
                  {placed.map((ctrl, i) => {
                    const isCorrect = ctrl.pillar === p;
                    return (
                      <div key={i} className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${isCorrect
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                        {isCorrect ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                        {ctrl.name}
                      </div>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>

        {allPlaced && (
          <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
            <div className="text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4" /> All Controls Classified!
            </div>
            <p className="text-[11px] text-cyan-600 dark:text-cyan-400">
              You correctly placed {controlsScore} out of {controls.length} controls.
              {controlsScore === controls.length ? ' Perfect score!' : ' Review the red items to see which ones were misclassified.'}
            </p>
          </div>
        )}
      </div>
    );
  };

  // ─── Render: Sandbox -- Quiz ────────────────────────────────────────────────

  const renderQuiz = () => {
    const question = QUIZ_QUESTIONS[quizIndex];
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-yellow-500" />
            Quiz Mode
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Score: <span className="font-bold text-cyan-600 dark:text-cyan-400">{quizScore}/{quizAttempts}</span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4 border border-gray-200 dark:border-gray-700">
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">Question {quizIndex + 1} of {QUIZ_QUESTIONS.length}</div>
          <p className="text-[12px] text-gray-800 dark:text-gray-200 font-medium leading-relaxed">{question.question}</p>
        </div>

        <div className="space-y-2 mb-3">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleQuizAnswer(i)}
              disabled={quizRevealed}
              className={getQuizBtnClass(i, quizAnswer, question.correctIndex, quizRevealed)}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </div>
            </button>
          ))}
        </div>

        {quizRevealed && (
          <div className={`p-3 rounded-lg border mb-3 ${quizAnswer === question.correctIndex
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
            }`}>
            <div className={`text-xs font-bold mb-1 flex items-center gap-1.5 ${quizAnswer === question.correctIndex ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {quizAnswer === question.correctIndex
                ? <><CheckCircle className="w-3.5 h-3.5" /> Correct!</>
                : <><XCircle className="w-3.5 h-3.5" /> Incorrect. The answer is {question.options[question.correctIndex]}.</>
              }
            </div>
            <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">{question.explanation}</p>
          </div>
        )}

        <button onClick={nextQuiz} className="px-4 py-2 text-xs bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-semibold transition-colors flex items-center gap-1.5">
          Next Question <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // ─── Render: Sandbox Tab ────────────────────────────────────────────────────

  const renderSandboxTab = () => (
    <div className="space-y-3">
      {/* Quick Start */}
      <div className="flex items-start gap-2 px-3 py-2 bg-cyan-50 dark:bg-cyan-950/40 rounded-lg border border-cyan-200 dark:border-cyan-700 text-xs">
        <span className="font-bold text-cyan-700 dark:text-cyan-400 flex-shrink-0 mt-0.5">How to use:</span>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-gray-700 dark:text-gray-300 leading-relaxed">
          <span><span className="font-semibold text-cyan-700 dark:text-cyan-400">Triangle:</span> Click each pillar (<strong>Confidentiality</strong>, <strong>Integrity</strong>, <strong>Availability</strong>) to learn what it means and how it can be attacked</span>
          <span className="text-gray-400">·</span>
          <span><span className="font-semibold text-cyan-700 dark:text-cyan-400">Scenarios:</span> Real-world breaches — identify which CIA pillar was violated</span>
          <span className="text-gray-400">·</span>
          <span><span className="font-semibold text-cyan-700 dark:text-cyan-400">Controls:</span> Match security measures to the pillar they protect</span>
          <span className="text-gray-400">·</span>
          <span><span className="font-semibold text-cyan-700 dark:text-cyan-400">Quiz:</span> Test your knowledge with multiple-choice questions</span>
        </div>
      </div>
      {/* Sandbox sub-navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {([
            { id: 'triangle' as SandboxMode, label: 'Triangle', icon: <Layers className="w-3 h-3" /> },
            { id: 'scenarios' as SandboxMode, label: 'Scenarios', icon: <AlertTriangle className="w-3 h-3" /> },
            { id: 'controls' as SandboxMode, label: 'Controls', icon: <Database className="w-3 h-3" /> },
            { id: 'quiz' as SandboxMode, label: 'Quiz', icon: <Zap className="w-3 h-3" /> },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setSandboxMode(tab.id)}
              className={`px-2.5 py-1.5 text-[11px] rounded-md font-medium transition-colors flex items-center gap-1 ${sandboxMode === tab.id
                ? 'bg-cyan-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Combined score */}
        {totalAttempts > 0 && (
          <div className="flex items-center gap-2">
            <div className="text-[10px] text-gray-400 dark:text-gray-500">
              Total: <span className="font-bold text-cyan-600 dark:text-cyan-400">{totalScore}/{totalAttempts}</span>
              {totalAttempts >= 5 && (
                <span className="ml-1">
                  ({Math.round((totalScore / totalAttempts) * 100)}%)
                </span>
              )}
            </div>
            <button onClick={resetAllScores} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-0.5" title="Reset all scores">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Sandbox content */}
      {sandboxMode === 'triangle' && renderTriangle()}
      {sandboxMode === 'scenarios' && renderScenarios()}
      {sandboxMode === 'controls' && renderControlsMapper()}
      {sandboxMode === 'quiz' && renderQuiz()}
    </div>
  );

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-gray-950 dark:to-cyan-950 p-3 overflow-hidden">
      {/* Header -- plain text, no icon */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">CIA Triad Explainer</h2>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Confidentiality, Integrity, Availability</p>
        </div>

        {/* Main tab switcher */}
        <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          <button
            onClick={() => setMainTab('learn')}
            className={`px-3 py-1.5 text-[11px] rounded-md font-medium transition-colors flex items-center gap-1.5 ${mainTab === 'learn'
              ? 'bg-cyan-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Learn
          </button>
          <button
            onClick={() => setMainTab('sandbox')}
            className={`px-3 py-1.5 text-[11px] rounded-md font-medium transition-colors flex items-center gap-1.5 ${mainTab === 'sandbox'
              ? 'bg-cyan-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Try It
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-auto">
        {mainTab === 'learn' && renderLearnTab()}
        {mainTab === 'sandbox' && renderSandboxTab()}
      </div>
    </div>
  );
};
