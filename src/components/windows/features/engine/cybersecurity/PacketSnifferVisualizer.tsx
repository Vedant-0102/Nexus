import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Square, Trash2, ChevronDown, ChevronRight, Monitor,
  Server, ArrowRight, Shield, Lock, Unlock, Eye, X, BarChart3
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Protocol = 'HTTP' | 'HTTPS' | 'DNS' | 'TCP' | 'UDP';
type TabId = 'learn' | 'sandbox';
type LearnSection =
  | 'what-is'
  | 'osi-model'
  | 'tcp-ip'
  | 'packet-structure'
  | 'protocols'
  | 'tcp-handshake'
  | 'legitimate-uses'
  | 'malicious-uses'
  | 'encryption'
  | 'tools';

interface PacketLayer2 {
  srcMac: string;
  dstMac: string;
  etherType: string;
}

interface PacketLayer3 {
  srcIp: string;
  dstIp: string;
  ttl: number;
  protocol: string;
  version: string;
  headerLen: number;
  totalLen: number;
}

interface PacketLayer4 {
  srcPort: number;
  dstPort: number;
  flags: string[];
  seqNum: number;
  ackNum: number;
  windowSize: number;
  transportProto: string;
}

interface PacketLayer7 {
  appProto: string;
  detail: string;
}

interface CapturedPacket {
  id: number;
  timestamp: number;
  src: string;
  dst: string;
  protocol: Protocol;
  length: number;
  info: string;
  layer2: PacketLayer2;
  layer3: PacketLayer3;
  layer4: PacketLayer4;
  layer7: PacketLayer7;
  rawHex: string;
}

interface AnimDot {
  id: number;
  fromIdx: number;
  toIdx: number;
  progress: number;
  protocol: Protocol;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROTO_COLORS: Record<Protocol, { bg: string; text: string; border: string; dot: string }> = {
  HTTP:  { bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-700 dark:text-red-300',     border: 'border-red-300 dark:border-red-700',     dot: '#ef4444' },
  HTTPS: { bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-300',  border: 'border-green-300 dark:border-green-700',  dot: '#22c55e' },
  DNS:   { bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-300',    border: 'border-blue-300 dark:border-blue-700',    dot: '#3b82f6' },
  TCP:   { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700', dot: '#eab308' },
  UDP:   { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700', dot: '#a855f7' },
};

const NETWORK_HOSTS = [
  { ip: '192.168.1.10',   name: 'PC',          mac: 'AA:BB:CC:11:22:33', x: 0.08, y: 0.5 },
  { ip: '192.168.1.1',    name: 'Router',      mac: 'AA:BB:CC:44:55:66', x: 0.35, y: 0.5 },
  { ip: '8.8.8.8',        name: 'DNS Server',  mac: 'DD:EE:FF:11:22:33', x: 0.62, y: 0.18 },
  { ip: '93.184.216.34',  name: 'Web Server',  mac: 'DD:EE:FF:44:55:66', x: 0.62, y: 0.82 },
];

const MACS = NETWORK_HOSTS.map(h => h.mac);
const IPS  = NETWORK_HOSTS.map(h => h.ip);

function buildHexDump(length: number): string {
  const lines: string[] = [];
  for (let off = 0; off < Math.min(length, 128); off += 16) {
    const offset = off.toString(16).padStart(4, '0');
    const hexParts: string[] = [];
    const asciiParts: string[] = [];
    for (let b = 0; b < 16; b++) {
      if (off + b < length) {
        const v = Math.floor(Math.random() * 256);
        hexParts.push(v.toString(16).padStart(2, '0'));
        asciiParts.push(v >= 32 && v < 127 ? String.fromCharCode(v) : '.');
      } else {
        hexParts.push('  ');
        asciiParts.push(' ');
      }
    }
    lines.push(`${offset}  ${hexParts.slice(0, 8).join(' ')}  ${hexParts.slice(8).join(' ')}  |${asciiParts.join('')}|`);
  }
  return lines.join('\n');
}

const TRAFFIC_TEMPLATES: Array<() => Omit<CapturedPacket, 'id' | 'timestamp'>> = [
  // DNS query
  () => {
    const len = 72;
    return {
      src: IPS[0], dst: IPS[2], protocol: 'DNS', length: len,
      info: 'Standard query A example.com',
      layer2: { srcMac: MACS[0], dstMac: MACS[1], etherType: '0x0800 (IPv4)' },
      layer3: { srcIp: IPS[0], dstIp: IPS[2], ttl: 64, protocol: 'UDP (17)', version: '4', headerLen: 20, totalLen: len },
      layer4: { srcPort: 54321, dstPort: 53, flags: [], seqNum: 0, ackNum: 0, windowSize: 0, transportProto: 'UDP' },
      layer7: { appProto: 'DNS', detail: 'Query: A record for example.com (Transaction ID: 0x1a2b)' },
      rawHex: buildHexDump(len),
    };
  },
  // DNS response
  () => {
    const len = 88;
    return {
      src: IPS[2], dst: IPS[0], protocol: 'DNS', length: len,
      info: 'Standard query response A 93.184.216.34',
      layer2: { srcMac: MACS[2], dstMac: MACS[1], etherType: '0x0800 (IPv4)' },
      layer3: { srcIp: IPS[2], dstIp: IPS[0], ttl: 56, protocol: 'UDP (17)', version: '4', headerLen: 20, totalLen: len },
      layer4: { srcPort: 53, dstPort: 54321, flags: [], seqNum: 0, ackNum: 0, windowSize: 0, transportProto: 'UDP' },
      layer7: { appProto: 'DNS', detail: 'Response: example.com -> 93.184.216.34 (TTL 300s)' },
      rawHex: buildHexDump(len),
    };
  },
  // HTTP GET
  () => {
    const len = 342;
    return {
      src: IPS[0], dst: IPS[3], protocol: 'HTTP', length: len,
      info: 'GET /index.html HTTP/1.1',
      layer2: { srcMac: MACS[0], dstMac: MACS[1], etherType: '0x0800 (IPv4)' },
      layer3: { srcIp: IPS[0], dstIp: IPS[3], ttl: 64, protocol: 'TCP (6)', version: '4', headerLen: 20, totalLen: len },
      layer4: { srcPort: 49153, dstPort: 80, flags: ['PSH', 'ACK'], seqNum: 1, ackNum: 1, windowSize: 65535, transportProto: 'TCP' },
      layer7: { appProto: 'HTTP', detail: 'GET /index.html HTTP/1.1  Host: example.com  User-Agent: Mozilla/5.0' },
      rawHex: buildHexDump(len),
    };
  },
  // HTTP 200 response
  () => {
    const len = 1250;
    return {
      src: IPS[3], dst: IPS[0], protocol: 'HTTP', length: len,
      info: 'HTTP/1.1 200 OK (text/html)',
      layer2: { srcMac: MACS[3], dstMac: MACS[1], etherType: '0x0800 (IPv4)' },
      layer3: { srcIp: IPS[3], dstIp: IPS[0], ttl: 52, protocol: 'TCP (6)', version: '4', headerLen: 20, totalLen: len },
      layer4: { srcPort: 80, dstPort: 49153, flags: ['PSH', 'ACK'], seqNum: 1, ackNum: 343, windowSize: 65535, transportProto: 'TCP' },
      layer7: { appProto: 'HTTP', detail: 'Status: 200 OK  Content-Type: text/html  Content-Length: 1024  Server: nginx/1.21' },
      rawHex: buildHexDump(len),
    };
  },
  // HTTPS TLS ClientHello
  () => {
    const len = 517;
    return {
      src: IPS[0], dst: IPS[3], protocol: 'HTTPS', length: len,
      info: 'TLS 1.3 ClientHello',
      layer2: { srcMac: MACS[0], dstMac: MACS[1], etherType: '0x0800 (IPv4)' },
      layer3: { srcIp: IPS[0], dstIp: IPS[3], ttl: 64, protocol: 'TCP (6)', version: '4', headerLen: 20, totalLen: len },
      layer4: { srcPort: 49200, dstPort: 443, flags: ['PSH', 'ACK'], seqNum: 1, ackNum: 1, windowSize: 65535, transportProto: 'TCP' },
      layer7: { appProto: 'TLS', detail: 'ClientHello  Version: TLS 1.3  Cipher: TLS_AES_256_GCM_SHA384  SNI: example.com' },
      rawHex: buildHexDump(len),
    };
  },
  // HTTPS TLS ServerHello
  () => {
    const len = 1380;
    return {
      src: IPS[3], dst: IPS[0], protocol: 'HTTPS', length: len,
      info: 'TLS 1.3 ServerHello, Certificate',
      layer2: { srcMac: MACS[3], dstMac: MACS[1], etherType: '0x0800 (IPv4)' },
      layer3: { srcIp: IPS[3], dstIp: IPS[0], ttl: 52, protocol: 'TCP (6)', version: '4', headerLen: 20, totalLen: len },
      layer4: { srcPort: 443, dstPort: 49200, flags: ['PSH', 'ACK'], seqNum: 1, ackNum: 518, windowSize: 65535, transportProto: 'TCP' },
      layer7: { appProto: 'TLS', detail: 'ServerHello  Cipher: TLS_AES_256_GCM_SHA384  Certificate: example.com (Let\'s Encrypt)' },
      rawHex: buildHexDump(len),
    };
  },
  // HTTPS encrypted data
  () => {
    const len = 890;
    return {
      src: IPS[0], dst: IPS[3], protocol: 'HTTPS', length: len,
      info: 'Application Data [Encrypted]',
      layer2: { srcMac: MACS[0], dstMac: MACS[1], etherType: '0x0800 (IPv4)' },
      layer3: { srcIp: IPS[0], dstIp: IPS[3], ttl: 64, protocol: 'TCP (6)', version: '4', headerLen: 20, totalLen: len },
      layer4: { srcPort: 49200, dstPort: 443, flags: ['PSH', 'ACK'], seqNum: 518, ackNum: 1381, windowSize: 65535, transportProto: 'TCP' },
      layer7: { appProto: 'TLS', detail: '[Encrypted Application Data - payload not visible to sniffer]' },
      rawHex: buildHexDump(len),
    };
  },
  // TCP SYN
  () => {
    const len = 54;
    return {
      src: IPS[0], dst: IPS[1], protocol: 'TCP', length: len,
      info: '[SYN] Seq=0 Win=65535 MSS=1460',
      layer2: { srcMac: MACS[0], dstMac: MACS[1], etherType: '0x0800 (IPv4)' },
      layer3: { srcIp: IPS[0], dstIp: IPS[1], ttl: 64, protocol: 'TCP (6)', version: '4', headerLen: 20, totalLen: len },
      layer4: { srcPort: 55000, dstPort: 80, flags: ['SYN'], seqNum: 0, ackNum: 0, windowSize: 65535, transportProto: 'TCP' },
      layer7: { appProto: 'N/A', detail: 'TCP handshake initiation - no application data' },
      rawHex: buildHexDump(len),
    };
  },
  // TCP SYN-ACK
  () => {
    const len = 54;
    return {
      src: IPS[1], dst: IPS[0], protocol: 'TCP', length: len,
      info: '[SYN, ACK] Seq=0 Ack=1 Win=65535',
      layer2: { srcMac: MACS[1], dstMac: MACS[0], etherType: '0x0800 (IPv4)' },
      layer3: { srcIp: IPS[1], dstIp: IPS[0], ttl: 64, protocol: 'TCP (6)', version: '4', headerLen: 20, totalLen: len },
      layer4: { srcPort: 80, dstPort: 55000, flags: ['SYN', 'ACK'], seqNum: 0, ackNum: 1, windowSize: 65535, transportProto: 'TCP' },
      layer7: { appProto: 'N/A', detail: 'TCP handshake response - connection accepted' },
      rawHex: buildHexDump(len),
    };
  },
  // TCP ACK
  () => {
    const len = 54;
    return {
      src: IPS[0], dst: IPS[1], protocol: 'TCP', length: len,
      info: '[ACK] Seq=1 Ack=1 Win=65535',
      layer2: { srcMac: MACS[0], dstMac: MACS[1], etherType: '0x0800 (IPv4)' },
      layer3: { srcIp: IPS[0], dstIp: IPS[1], ttl: 64, protocol: 'TCP (6)', version: '4', headerLen: 20, totalLen: len },
      layer4: { srcPort: 55000, dstPort: 80, flags: ['ACK'], seqNum: 1, ackNum: 1, windowSize: 65535, transportProto: 'TCP' },
      layer7: { appProto: 'N/A', detail: 'TCP handshake complete - connection established' },
      rawHex: buildHexDump(len),
    };
  },
  // UDP datagram
  () => {
    const len = 128;
    return {
      src: IPS[0], dst: IPS[3], protocol: 'UDP', length: len,
      info: 'UDP Datagram Len=128',
      layer2: { srcMac: MACS[0], dstMac: MACS[1], etherType: '0x0800 (IPv4)' },
      layer3: { srcIp: IPS[0], dstIp: IPS[3], ttl: 64, protocol: 'UDP (17)', version: '4', headerLen: 20, totalLen: len },
      layer4: { srcPort: 61234, dstPort: 8080, flags: [], seqNum: 0, ackNum: 0, windowSize: 0, transportProto: 'UDP' },
      layer7: { appProto: 'QUIC', detail: 'QUIC Initial handshake over UDP (HTTP/3 transport)' },
      rawHex: buildHexDump(len),
    };
  },
  // UDP response
  () => {
    const len = 256;
    return {
      src: IPS[3], dst: IPS[0], protocol: 'UDP', length: len,
      info: 'UDP Datagram Len=256',
      layer2: { srcMac: MACS[3], dstMac: MACS[1], etherType: '0x0800 (IPv4)' },
      layer3: { srcIp: IPS[3], dstIp: IPS[0], ttl: 52, protocol: 'UDP (17)', version: '4', headerLen: 20, totalLen: len },
      layer4: { srcPort: 8080, dstPort: 61234, flags: [], seqNum: 0, ackNum: 0, windowSize: 0, transportProto: 'UDP' },
      layer7: { appProto: 'QUIC', detail: 'QUIC Handshake response with server parameters' },
      rawHex: buildHexDump(len),
    };
  },
];

let nextPktId = 0;

// ─── Learn Tab Content ────────────────────────────────────────────────────────

const LEARN_SECTIONS: { id: LearnSection; title: string }[] = [
  { id: 'what-is',        title: 'What Is Packet Sniffing?' },
  { id: 'osi-model',      title: 'OSI Model & Sniffing' },
  { id: 'tcp-ip',         title: 'TCP/IP Protocol Stack' },
  { id: 'packet-structure', title: 'Packet Structure' },
  { id: 'protocols',      title: 'Common Protocols' },
  { id: 'tcp-handshake',  title: 'TCP Three-Way Handshake' },
  { id: 'legitimate-uses', title: 'Legitimate Uses' },
  { id: 'malicious-uses', title: 'Malicious Uses' },
  { id: 'encryption',     title: 'Encryption & Protection' },
  { id: 'tools',          title: 'Real-World Tools' },
];

const OSI_LAYERS = [
  { num: 7, name: 'Application',  proto: 'HTTP, FTP, SMTP, DNS',    sniffable: true,  desc: 'End-user data such as web pages, emails, and file transfers.' },
  { num: 6, name: 'Presentation', proto: 'SSL/TLS, JPEG, ASCII',    sniffable: true,  desc: 'Data translation, encryption/decryption, and compression.' },
  { num: 5, name: 'Session',      proto: 'NetBIOS, RPC',            sniffable: true,  desc: 'Manages sessions between communicating applications.' },
  { num: 4, name: 'Transport',    proto: 'TCP, UDP',                sniffable: true,  desc: 'End-to-end delivery, segmentation, flow and error control.' },
  { num: 3, name: 'Network',      proto: 'IP, ICMP, ARP',          sniffable: true,  desc: 'Logical addressing, routing, and packet forwarding.' },
  { num: 2, name: 'Data Link',    proto: 'Ethernet, Wi-Fi (802.11)', sniffable: true,  desc: 'Physical addressing (MAC), frame creation, error detection.' },
  { num: 1, name: 'Physical',     proto: 'Cables, Radio, Hubs',    sniffable: false, desc: 'Raw bit transmission over physical medium.' },
];

const TCP_IP_LAYERS = [
  { name: 'Application',    maps: 'OSI 5-7',  proto: 'HTTP, HTTPS, FTP, DNS, SMTP, SSH', desc: 'Protocols that applications use directly. This is where user-readable data (web pages, emails) lives. Packet sniffers can read unencrypted application data here.' },
  { name: 'Transport',      maps: 'OSI 4',    proto: 'TCP, UDP',                         desc: 'Provides end-to-end communication. TCP ensures reliable, ordered delivery with handshakes and acknowledgments. UDP is faster but unreliable with no connection setup.' },
  { name: 'Internet',       maps: 'OSI 3',    proto: 'IP, ICMP, ARP, IGMP',              desc: 'Handles logical addressing (IP addresses) and routing. Each packet is addressed and routed independently through the network.' },
  { name: 'Network Access', maps: 'OSI 1-2',  proto: 'Ethernet, Wi-Fi, PPP',             desc: 'Deals with the physical network hardware. Frames are created with MAC addresses for local delivery on the same network segment.' },
];

const PROTOCOL_DETAILS = [
  { name: 'TCP',   full: 'Transmission Control Protocol', port: 'Various',   desc: 'Connection-oriented protocol that guarantees reliable, ordered data delivery. Uses a three-way handshake (SYN, SYN-ACK, ACK) to establish connections and acknowledgments to confirm receipt. Used by HTTP, HTTPS, SSH, FTP, and most web traffic.' },
  { name: 'UDP',   full: 'User Datagram Protocol',        port: 'Various',   desc: 'Connectionless protocol with no handshake or delivery guarantee. Faster than TCP since it skips reliability mechanisms. Used by DNS queries, video streaming, VoIP, online gaming, and QUIC (HTTP/3).' },
  { name: 'HTTP',  full: 'Hypertext Transfer Protocol',   port: '80',        desc: 'The foundation of web communication. Sends requests (GET, POST, PUT, DELETE) and receives responses (200 OK, 404 Not Found) in plain text. Because it is unencrypted, a packet sniffer can read every header, cookie, and body in transit.' },
  { name: 'HTTPS', full: 'HTTP Secure (HTTP over TLS)',   port: '443',       desc: 'HTTP wrapped in TLS/SSL encryption. While the packet sniffer can still see the TLS handshake (ClientHello, ServerHello), the actual application payload is encrypted. Only the server name (SNI) may leak in the initial handshake.' },
  { name: 'DNS',   full: 'Domain Name System',            port: '53',        desc: 'Translates human-readable domain names (example.com) into IP addresses (93.184.216.34). Traditional DNS is unencrypted over UDP, making queries visible to sniffers. DNS-over-HTTPS (DoH) and DNS-over-TLS (DoT) encrypt this traffic.' },
  { name: 'ARP',   full: 'Address Resolution Protocol',   port: 'N/A',       desc: 'Maps IP addresses to MAC addresses on a local network. Operates at Layer 2. ARP requests are broadcast to all devices, making them easy to capture. ARP spoofing is a common attack vector for man-in-the-middle attacks.' },
  { name: 'ICMP',  full: 'Internet Control Message Protocol', port: 'N/A',   desc: 'Used for network diagnostics and error reporting. Ping (echo request/reply) and traceroute use ICMP. Sniffers can capture these to map network topology and detect network issues.' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const PacketSnifferVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('learn');
  const [expandedLearn, setExpandedLearn] = useState<Set<LearnSection>>(new Set(['what-is']));

  // Sandbox state
  const [packets, setPackets] = useState<CapturedPacket[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [selectedPkt, setSelectedPkt] = useState<CapturedPacket | null>(null);
  const [protoFilters, setProtoFilters] = useState<Set<Protocol>>(new Set(['HTTP', 'HTTPS', 'DNS', 'TCP', 'UDP']));
  const [showStats, setShowStats] = useState(false);
  const [animDots, setAnimDots] = useState<AnimDot[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrame = useRef<number>(0);
  const dotsRef = useRef<AnimDot[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Helpers ──

  const formatTs = useCallback((ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
  }, []);

  const toggleLearnSection = useCallback((id: LearnSection) => {
    setExpandedLearn(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleProtoFilter = useCallback((p: Protocol) => {
    setProtoFilters(prev => {
      const next = new Set(prev);
      if (next.has(p)) { if (next.size > 1) next.delete(p); } else next.add(p);
      return next;
    });
  }, []);

  const filteredPackets = packets.filter(p => protoFilters.has(p.protocol));

  const stats = {
    total: packets.length,
    byProto: (['HTTP', 'HTTPS', 'DNS', 'TCP', 'UDP'] as Protocol[]).map(p => ({
      proto: p,
      count: packets.filter(pk => pk.protocol === p).length,
      bytes: packets.filter(pk => pk.protocol === p).reduce((s, pk) => s + pk.length, 0),
    })),
    totalBytes: packets.reduce((s, p) => s + p.length, 0),
  };

  // ── Packet generation ──

  const spawnPacket = useCallback(() => {
    const tmpl = TRAFFIC_TEMPLATES[Math.floor(Math.random() * TRAFFIC_TEMPLATES.length)]();
    const pkt: CapturedPacket = { ...tmpl, id: ++nextPktId, timestamp: Date.now() };
    setPackets(prev => {
      const next = [...prev, pkt];
      return next.length > 300 ? next.slice(-300) : next;
    });

    const srcIdx = NETWORK_HOSTS.findIndex(h => h.ip === pkt.src);
    const dstIdx = NETWORK_HOSTS.findIndex(h => h.ip === pkt.dst);
    if (srcIdx >= 0 && dstIdx >= 0) {
      const dot: AnimDot = { id: pkt.id, fromIdx: srcIdx, toIdx: dstIdx, progress: 0, protocol: pkt.protocol };
      dotsRef.current = [...dotsRef.current, dot];
      setAnimDots(prev => [...prev, dot]);
    }
  }, []);

  const handleStart = useCallback(() => setCapturing(true), []);
  const handleStop  = useCallback(() => setCapturing(false), []);
  const handleClear = useCallback(() => {
    setPackets([]); setSelectedPkt(null); setAnimDots([]); dotsRef.current = [];
  }, []);

  useEffect(() => {
    if (capturing) {
      const fire = () => { spawnPacket(); };
      captureTimer.current = setInterval(fire, 700 + Math.random() * 1000);
    } else {
      if (captureTimer.current) clearInterval(captureTimer.current);
    }
    return () => { if (captureTimer.current) clearInterval(captureTimer.current); };
  }, [capturing, spawnPacket]);

  // Auto-scroll packet table
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [filteredPackets.length]);

  // ── Canvas drawing ──

  useEffect(() => {
    if (activeTab !== 'sandbox') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const r = parent.getBoundingClientRect();
      canvas.width = r.width * window.devicePixelRatio;
      canvas.height = r.height * window.devicePixelRatio;
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
    };
    resize();

    const draw = () => {
      const dpr = window.devicePixelRatio;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Connections
      ctx.strokeStyle = 'rgba(100,116,139,0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      for (let i = 0; i < NETWORK_HOSTS.length; i++) {
        for (let j = i + 1; j < NETWORK_HOSTS.length; j++) {
          ctx.beginPath();
          ctx.moveTo(NETWORK_HOSTS[i].x * w, NETWORK_HOSTS[i].y * h);
          ctx.lineTo(NETWORK_HOSTS[j].x * w, NETWORK_HOSTS[j].y * h);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);

      // Host nodes
      NETWORK_HOSTS.forEach((host, _i) => {
        const x = host.x * w;
        const y = host.y * h;

        // Glow
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 28);
        grad.addColorStop(0, 'rgba(99,102,241,0.15)');
        grad.addColorStop(1, 'rgba(99,102,241,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.fill();

        // Node circle
        ctx.fillStyle = 'rgba(15,23,42,0.9)';
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(99,102,241,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Name
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(host.name, x, y - 3);
        // IP
        ctx.fillStyle = '#94a3b8';
        ctx.font = '7px ui-monospace, monospace';
        ctx.fillText(host.ip, x, y + 7);
      });

      // Animated dots
      const alive: AnimDot[] = [];
      dotsRef.current.forEach(d => {
        d.progress += 0.018;
        if (d.progress >= 1) return;
        alive.push(d);

        const src = NETWORK_HOSTS[d.fromIdx];
        const dst = NETWORK_HOSTS[d.toIdx];
        const px = src.x * w + (dst.x - src.x) * w * d.progress;
        const py = src.y * h + (dst.y - src.y) * h * d.progress;
        const col = PROTO_COLORS[d.protocol].dot;

        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Trail
        for (let t = 1; t <= 4; t++) {
          const tp = d.progress - t * 0.025;
          if (tp < 0) continue;
          ctx.globalAlpha = 0.35 - t * 0.07;
          const tx = src.x * w + (dst.x - src.x) * w * tp;
          const ty = src.y * h + (dst.y - src.y) * h * tp;
          ctx.beginPath();
          ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
      dotsRef.current = alive;

      animFrame.current = requestAnimationFrame(draw);
    };

    animFrame.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener('resize', resize);
    };
  }, [activeTab]);

  // ── Sub-renders ──

  const renderSectionContent = (id: LearnSection) => {
    switch (id) {
      case 'what-is':
        return (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              <strong>Packet sniffing</strong> (also called packet analysis or protocol analysis) is the practice of
              intercepting and examining data packets as they travel across a computer network. Every piece of data
              sent over a network -- whether it is an email, a web page request, a file transfer, or a video stream --
              is broken into small units called <em>packets</em>. A packet sniffer captures these packets in real time,
              allowing an analyst to inspect their contents, headers, and metadata.
            </p>
            <p>
              Packet sniffers work by placing a network interface into <strong>promiscuous mode</strong>, which tells
              the network card to capture all traffic on the network segment, not just traffic addressed to the host
              machine. On wireless networks, this is sometimes called <strong>monitor mode</strong>. In either case,
              the sniffer passively listens to all traffic it can see.
            </p>
            <p>
              Packet sniffing is a dual-use capability: it is an essential tool for network administrators,
              security analysts, and developers for diagnosing problems and ensuring security, but it can also
              be weaponized by attackers to steal credentials, intercept sensitive data, or perform reconnaissance.
              Understanding how packet sniffing works is fundamental to both network defense and ethical security research.
            </p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-amber-800 dark:text-amber-300">
                Packet sniffing should only be performed on networks you own or have explicit written authorization to
                monitor. Unauthorized interception of network traffic is illegal under laws such as the U.S. Wiretap Act,
                the CFAA, and the EU's GDPR.
              </span>
            </div>
          </div>
        );

      case 'osi-model':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              The <strong>OSI (Open Systems Interconnection) Model</strong> is a conceptual framework that describes
              how data moves through a network in seven layers. Packet sniffers can capture and decode data at
              Layers 2 through 7. Layer 1 is the raw physical signal and is not directly captured as packet data.
            </p>
            <div className="space-y-1">
              {OSI_LAYERS.map(layer => (
                <div
                  key={layer.num}
                  className={`flex items-center gap-3 p-2 rounded-lg border text-xs ${
                    layer.sniffable
                      ? 'bg-green-50 dark:bg-green-900/15 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {layer.num}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{layer.name}</span>
                      <span className="text-gray-500 dark:text-gray-500 font-mono text-[10px]">{layer.proto}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-[11px] mt-0.5">{layer.desc}</p>
                  </div>
                  {layer.sniffable ? (
                    <Eye className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <span className="text-[10px] text-gray-400 flex-shrink-0">N/A</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              The eye icon indicates layers where packet sniffers can capture and inspect data. Most sniffers
              operate primarily at Layers 2-4 and decode up through Layer 7 for supported protocols.
            </p>
          </div>
        );

      case 'tcp-ip':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              The <strong>TCP/IP model</strong> (also called the Internet Protocol Suite) is the practical model used by
              the internet. It has four layers that map loosely to the OSI model. This is the model that packet sniffers
              actually work with when decoding captured traffic.
            </p>
            <div className="space-y-2">
              {TCP_IP_LAYERS.map((layer, i) => (
                <div key={layer.name} className="p-3 rounded-lg bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                      {4 - i}
                    </span>
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{layer.name}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">Maps to {layer.maps}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">{layer.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {layer.proto.split(', ').map(p => (
                      <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'packet-structure':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Every network packet follows a layered structure. Each layer wraps (encapsulates) the layer above it,
              adding its own header (and sometimes trailer) information. When a packet sniffer captures a frame off
              the wire, it peels back these layers to decode the contents.
            </p>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Ethernet header */}
              <div className="p-2.5 bg-orange-50 dark:bg-orange-900/15 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-bold text-orange-700 dark:text-orange-300">Ethernet Header (14 bytes)</div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                  Destination MAC (6 bytes) | Source MAC (6 bytes) | EtherType (2 bytes).
                  The EtherType field identifies the protocol inside (0x0800 = IPv4, 0x0806 = ARP, 0x86DD = IPv6).
                </p>
              </div>
              {/* IP header */}
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/15 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-bold text-blue-700 dark:text-blue-300">IP Header (20-60 bytes)</div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                  Version | Header Length | Total Length | TTL | Protocol (6=TCP, 17=UDP) |
                  Source IP (4 bytes) | Destination IP (4 bytes) | Options (variable).
                </p>
              </div>
              {/* TCP/UDP header */}
              <div className="p-2.5 bg-green-50 dark:bg-green-900/15 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-bold text-green-700 dark:text-green-300">TCP Header (20-60 bytes) / UDP Header (8 bytes)</div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                  TCP: Source Port | Destination Port | Sequence Number | Acknowledgment Number | Flags (SYN, ACK, FIN, RST, PSH, URG) | Window Size | Checksum.
                  UDP: Source Port | Destination Port | Length | Checksum. Much simpler than TCP.
                </p>
              </div>
              {/* Payload */}
              <div className="p-2.5 bg-purple-50 dark:bg-purple-900/15 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-bold text-purple-700 dark:text-purple-300">Payload / Application Data (variable)</div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                  The actual data being transmitted: HTTP requests/responses, DNS queries, TLS encrypted data, etc.
                  For unencrypted protocols (HTTP, DNS, FTP), this content is fully readable by the sniffer.
                  For encrypted protocols (HTTPS, SSH), the payload appears as opaque ciphertext.
                </p>
              </div>
              {/* Trailer */}
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40">
                <div className="text-xs font-bold text-gray-700 dark:text-gray-300">Ethernet Trailer / FCS (4 bytes)</div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                  Frame Check Sequence -- a CRC32 checksum used to detect bit errors during transmission.
                  Corrupted frames are silently discarded by the network interface before reaching the sniffer.
                </p>
              </div>
            </div>
          </div>
        );

      case 'protocols':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              These are the most common protocols you will encounter when analyzing captured network traffic.
              Understanding each protocol's purpose, port, and visibility to sniffers is essential for effective analysis.
            </p>
            {PROTOCOL_DETAILS.map(p => (
              <div key={p.name} className="p-3 rounded-lg bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    PROTO_COLORS[p.name as Protocol]
                      ? `${PROTO_COLORS[p.name as Protocol].bg} ${PROTO_COLORS[p.name as Protocol].text}`
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>{p.name}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{p.full}</span>
                  <span className="ml-auto text-[10px] font-mono text-gray-400 dark:text-gray-500">Port {p.port}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        );

      case 'tcp-handshake':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Before any data can be exchanged over TCP, a <strong>three-way handshake</strong> must complete.
              This establishes a synchronized, reliable connection between client and server. Packet sniffers
              frequently capture these handshake packets, and understanding them is key to traffic analysis.
            </p>
            <div className="relative p-4 bg-white dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-1">
                    <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Client</span>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-1">
                    <Server className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Server</span>
                </div>
              </div>
              {/* Step 1: SYN */}
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-yellow-600 dark:text-yellow-400">SYN</span>
                  <div className="flex-1 h-px bg-yellow-400 dark:bg-yellow-600 relative">
                    <ArrowRight className="w-3 h-3 text-yellow-500 absolute -right-1 -top-1.5" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 max-w-[180px]">
                  Client sends SYN with initial sequence number (ISN). "I want to connect, my sequence starts at X."
                </p>
              </div>
              {/* Step 2: SYN-ACK */}
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-px bg-green-400 dark:bg-green-600 relative">
                    <ArrowRight className="w-3 h-3 text-green-500 absolute -left-1 -top-1.5 rotate-180" />
                  </div>
                  <span className="text-xs font-mono font-bold text-green-600 dark:text-green-400">SYN-ACK</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 max-w-[180px]">
                  Server responds with SYN-ACK. "Connection accepted. My sequence starts at Y, and I acknowledge your X+1."
                </p>
              </div>
              {/* Step 3: ACK */}
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">ACK</span>
                  <div className="flex-1 h-px bg-blue-400 dark:bg-blue-600 relative">
                    <ArrowRight className="w-3 h-3 text-blue-500 absolute -right-1 -top-1.5" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 max-w-[180px]">
                  Client sends ACK. "Acknowledged your Y+1. Connection established." Data transfer can now begin.
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              After the handshake, both sides have synchronized sequence numbers and can exchange data reliably.
              The handshake also negotiates window sizes for flow control. A failed handshake (no SYN-ACK or
              RST response) indicates the port is closed or filtered by a firewall.
            </p>
          </div>
        );

      case 'legitimate-uses':
        return (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>Packet sniffing is an indispensable tool in network engineering and cybersecurity when used responsibly:</p>
            <div className="grid gap-2">
              {[
                { title: 'Network Troubleshooting', desc: 'Diagnosing connectivity issues, identifying packet loss, measuring latency, and finding misconfigured devices. When a service goes down, packet captures reveal exactly where communication breaks.' },
                { title: 'Security Monitoring & IDS', desc: 'Intrusion Detection Systems (IDS) like Snort and Suricata rely on packet sniffing to detect malicious patterns, suspicious traffic, and policy violations in real time.' },
                { title: 'Digital Forensics', desc: 'After a security incident, saved packet captures (PCAP files) provide an immutable record of what happened on the network. Forensic analysts reconstruct attack timelines from this data.' },
                { title: 'Performance Analysis', desc: 'Measuring application response times, bandwidth utilization, and protocol overhead. Identifying slow queries, retransmissions, and bottlenecks in production networks.' },
                { title: 'Protocol Development', desc: 'Developers building or debugging network protocols use packet captures to verify their implementations produce correct packet formats and follow specifications.' },
                { title: 'Compliance Auditing', desc: 'Verifying that encryption policies are enforced (no plaintext credentials), checking that sensitive data is not leaking, and ensuring regulatory requirements are met.' },
              ].map(item => (
                <div key={item.title} className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                  <div className="text-xs font-semibold text-green-800 dark:text-green-300 mb-1">{item.title}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'malicious-uses':
        return (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              When used without authorization, packet sniffing becomes a powerful attack tool. Understanding these
              threats helps defenders implement proper countermeasures:
            </p>
            <div className="grid gap-2">
              {[
                { title: 'Credential Theft', desc: 'Unencrypted protocols like HTTP, FTP, Telnet, and POP3 transmit usernames and passwords in plain text. An attacker on the same network segment can capture and read these credentials directly from the packet payload.', icon: Unlock },
                { title: 'Session Hijacking', desc: 'By capturing session cookies or tokens from unencrypted HTTP traffic, an attacker can impersonate an authenticated user without knowing their password. This is why HTTPS everywhere became critical.', icon: Eye },
                { title: 'Man-in-the-Middle (MITM)', desc: 'Combined with ARP spoofing or DNS poisoning, an attacker can position themselves between two communicating parties, intercepting and potentially modifying all traffic. Tools like ettercap and bettercap automate this.', icon: Shield },
                { title: 'Reconnaissance & Mapping', desc: 'Passive sniffing reveals network topology, active services, operating systems, user behavior patterns, and internal IP addressing schemes -- all without generating any detectable traffic.', icon: Eye },
              ].map(item => (
                <div key={item.title} className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-semibold text-red-800 dark:text-red-300">{item.title}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'encryption':
        return (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              <strong>Encryption is the primary defense against packet sniffing.</strong> While a sniffer can always
              capture encrypted packets, it cannot read their contents without the decryption keys. TLS (Transport
              Layer Security) and its predecessor SSL are the most widely deployed encryption protocols on the internet.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-1.5 mb-2">
                  <Unlock className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-bold text-red-700 dark:text-red-300">Without Encryption (HTTP)</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <p>GET /login HTTP/1.1</p>
                  <p>Host: example.com</p>
                  <p>Cookie: session=abc123</p>
                  <p className="text-red-600 dark:text-red-400 font-semibold">username=admin&password=secret123</p>
                  <p className="text-red-500 text-[10px] mt-2 italic">Everything is readable by any sniffer on the network</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-1.5 mb-2">
                  <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-bold text-green-700 dark:text-green-300">With Encryption (HTTPS)</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 font-mono">
                  <p>17 03 03 00 1c 8a 3b f2</p>
                  <p>d1 9e 4c 7a 2f 08 b3 e5</p>
                  <p>c4 91 6d aa 55 f7 3e 12</p>
                  <p>b8 02 c3 e9 71 4d 8f a6</p>
                  <p className="text-green-500 text-[10px] mt-2 italic">Payload appears as meaningless ciphertext to sniffers</p>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800">
              <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1.5">How TLS Protects You</div>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                <li><strong>Confidentiality:</strong> Symmetric encryption (AES-256-GCM) makes payload unreadable.</li>
                <li><strong>Integrity:</strong> HMAC/AEAD ensures data has not been tampered with in transit.</li>
                <li><strong>Authentication:</strong> X.509 certificates verify the server's identity, preventing impersonation.</li>
                <li><strong>Forward Secrecy:</strong> Ephemeral Diffie-Hellman keys ensure that compromising a long-term key does not decrypt past sessions.</li>
              </ul>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              Note: Even with HTTPS, a sniffer can still see metadata such as source/destination IPs, packet sizes,
              timing patterns, and the SNI field (server name) in the TLS ClientHello. Encrypted Client Hello (ECH)
              is an emerging standard to protect the SNI.
            </p>
          </div>
        );

      case 'tools':
        return (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>These are the most widely used packet sniffing and analysis tools in professional settings:</p>
            <div className="grid gap-2">
              {[
                { name: 'Wireshark', desc: 'The most popular graphical packet analyzer. Supports hundreds of protocols, powerful display filters (e.g., "tcp.port == 443 && tls.handshake"), packet coloring, stream reassembly, decryption with session keys, and export to various formats. Available on Windows, macOS, and Linux.', tags: ['GUI', 'Cross-Platform', 'Free'] },
                { name: 'tcpdump', desc: 'Command-line packet capture utility for Unix/Linux systems. Lightweight, scriptable, and universally available on Unix-like systems. Uses BPF (Berkeley Packet Filter) syntax for filtering. Commonly used to capture traffic on servers and save PCAP files for later Wireshark analysis.', tags: ['CLI', 'Unix/Linux', 'Free'] },
                { name: 'tshark', desc: 'The command-line version of Wireshark. Combines the protocol decoding power of Wireshark with the scriptability of the command line. Supports all Wireshark display filters and can output structured data (JSON, XML) for automated processing.', tags: ['CLI', 'Cross-Platform', 'Free'] },
                { name: 'Scapy', desc: 'A Python-based packet manipulation library that can sniff, craft, send, and decode packets. Extremely flexible for custom protocol analysis, attack simulation, and security research. Can create packets from scratch or modify captured ones.', tags: ['Python', 'Library', 'Free'] },
                { name: 'NetworkMiner', desc: 'A network forensics tool that extracts files, images, certificates, and credentials from PCAP files. Focuses on host-based analysis rather than packet-by-packet inspection. Useful for incident response and evidence collection.', tags: ['GUI', 'Windows', 'Freemium'] },
              ].map(tool => (
                <div key={tool.name} className="p-3 rounded-lg bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{tool.name}</span>
                    <div className="flex gap-1 ml-auto">
                      {tool.tags.map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{tool.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Detail panel for sandbox ──

  const renderPacketDetail = (pkt: CapturedPacket) => (
    <div className="flex-1 overflow-auto p-3 space-y-3">
      {/* Summary bar */}
      <div className={`flex items-center gap-2 p-2 rounded-lg ${PROTO_COLORS[pkt.protocol].bg} border ${PROTO_COLORS[pkt.protocol].border}`}>
        <span className={`text-xs font-bold ${PROTO_COLORS[pkt.protocol].text}`}>{pkt.protocol}</span>
        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{pkt.info}</span>
      </div>

      {/* Layer 2 - Ethernet */}
      <div>
        <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">Layer 2 -- Ethernet</div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 space-y-0.5 text-xs font-mono">
          <div className="flex gap-2"><span className="text-orange-500 dark:text-orange-400 min-w-[100px]">Src MAC:</span><span className="text-gray-700 dark:text-gray-300">{pkt.layer2.srcMac}</span></div>
          <div className="flex gap-2"><span className="text-orange-500 dark:text-orange-400 min-w-[100px]">Dst MAC:</span><span className="text-gray-700 dark:text-gray-300">{pkt.layer2.dstMac}</span></div>
          <div className="flex gap-2"><span className="text-orange-500 dark:text-orange-400 min-w-[100px]">EtherType:</span><span className="text-gray-700 dark:text-gray-300">{pkt.layer2.etherType}</span></div>
        </div>
      </div>

      {/* Layer 3 - IP */}
      <div>
        <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Layer 3 -- IP</div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 space-y-0.5 text-xs font-mono">
          <div className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 min-w-[100px]">Version:</span><span className="text-gray-700 dark:text-gray-300">IPv{pkt.layer3.version}</span></div>
          <div className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 min-w-[100px]">Src IP:</span><span className="text-gray-700 dark:text-gray-300">{pkt.layer3.srcIp}</span></div>
          <div className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 min-w-[100px]">Dst IP:</span><span className="text-gray-700 dark:text-gray-300">{pkt.layer3.dstIp}</span></div>
          <div className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 min-w-[100px]">TTL:</span><span className="text-gray-700 dark:text-gray-300">{pkt.layer3.ttl}</span></div>
          <div className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 min-w-[100px]">Protocol:</span><span className="text-gray-700 dark:text-gray-300">{pkt.layer3.protocol}</span></div>
          <div className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 min-w-[100px]">Header Len:</span><span className="text-gray-700 dark:text-gray-300">{pkt.layer3.headerLen} bytes</span></div>
          <div className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 min-w-[100px]">Total Len:</span><span className="text-gray-700 dark:text-gray-300">{pkt.layer3.totalLen} bytes</span></div>
        </div>
      </div>

      {/* Layer 4 - TCP/UDP */}
      <div>
        <div className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Layer 4 -- {pkt.layer4.transportProto}</div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 space-y-0.5 text-xs font-mono">
          <div className="flex gap-2"><span className="text-green-500 dark:text-green-400 min-w-[100px]">Src Port:</span><span className="text-gray-700 dark:text-gray-300">{pkt.layer4.srcPort}</span></div>
          <div className="flex gap-2"><span className="text-green-500 dark:text-green-400 min-w-[100px]">Dst Port:</span><span className="text-gray-700 dark:text-gray-300">{pkt.layer4.dstPort}</span></div>
          {pkt.layer4.transportProto === 'TCP' && (
            <>
              <div className="flex gap-2"><span className="text-green-500 dark:text-green-400 min-w-[100px]">Seq Num:</span><span className="text-gray-700 dark:text-gray-300">{pkt.layer4.seqNum}</span></div>
              <div className="flex gap-2"><span className="text-green-500 dark:text-green-400 min-w-[100px]">Ack Num:</span><span className="text-gray-700 dark:text-gray-300">{pkt.layer4.ackNum}</span></div>
              <div className="flex gap-2"><span className="text-green-500 dark:text-green-400 min-w-[100px]">Window:</span><span className="text-gray-700 dark:text-gray-300">{pkt.layer4.windowSize}</span></div>
              {pkt.layer4.flags.length > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="text-green-500 dark:text-green-400 min-w-[100px]">Flags:</span>
                  <div className="flex gap-1">
                    {pkt.layer4.flags.map(f => (
                      <span key={f} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Layer 7 - Application */}
      <div>
        <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Layer 7 -- Application ({pkt.layer7.appProto})</div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-xs font-mono text-gray-700 dark:text-gray-300 leading-relaxed break-all">
          {pkt.layer7.detail}
        </div>
      </div>

      {/* Hex Dump */}
      <div>
        <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Hex Dump</div>
        <pre className="bg-gray-900 rounded-lg p-2.5 text-[10px] font-mono text-green-400 whitespace-pre overflow-x-auto leading-relaxed">
          {pkt.rawHex}
        </pre>
      </div>
    </div>
  );

  // ── Main Render ──

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-gray-950 dark:to-cyan-950/30 p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Packet Sniffer</h2>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {(['learn', 'sandbox'] as TabId[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab === 'learn' ? 'Learn' : 'Sandbox'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Learn Tab ── */}
      {activeTab === 'learn' && (
        <div className="flex-1 min-h-0 overflow-auto space-y-1.5 pr-1">
          {LEARN_SECTIONS.map(section => {
            const isOpen = expandedLearn.has(section.id);
            return (
              <div key={section.id} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900/80">
                <button
                  onClick={() => toggleLearnSection(section.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  }
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{section.title}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800">
                    {renderSectionContent(section.id)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Sandbox Tab ── */}
      {activeTab === 'sandbox' && (
        <div className="flex-1 min-h-0 flex flex-col gap-2">
          {/* Controls bar */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {!capturing ? (
              <button onClick={handleStart} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                <Play className="w-3 h-3" /> Start Capture
              </button>
            ) : (
              <button onClick={handleStop} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
                <Square className="w-3 h-3" /> Stop
              </button>
            )}
            <button onClick={handleClear} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold">
              <Trash2 className="w-3 h-3" /> Clear
            </button>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
            {/* Protocol filters */}
            {(['HTTP', 'HTTPS', 'DNS', 'TCP', 'UDP'] as Protocol[]).map(p => (
              <button
                key={p}
                onClick={() => toggleProtoFilter(p)}
                className={`flex items-center gap-1.5 px-2 py-1 text-[11px] rounded-md font-semibold border transition-all ${
                  protoFilters.has(p)
                    ? `${PROTO_COLORS[p].bg} ${PROTO_COLORS[p].text} ${PROTO_COLORS[p].border}`
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 opacity-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PROTO_COLORS[p].dot, opacity: protoFilters.has(p) ? 1 : 0.3 }} />
                {p}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded-md font-semibold border transition-colors ${
                  showStats
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                }`}
              >
                <BarChart3 className="w-3 h-3" /> Stats
              </button>
              <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                {packets.length} pkts
              </span>
            </div>
          </div>

          {/* Network topology canvas */}
          <div className="relative w-full h-36 flex-shrink-0 bg-gray-900/95 rounded-xl border border-gray-700 overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0" />
            {!capturing && packets.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                Click "Start Capture" to begin sniffing simulated network traffic
              </div>
            )}
          </div>

          {/* Stats panel */}
          {showStats && (
            <div className="flex-shrink-0 grid grid-cols-6 gap-2">
              <div className="col-span-1 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{stats.total}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Total Pkts</div>
                <div className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mt-0.5">{(stats.totalBytes / 1024).toFixed(1)} KB</div>
              </div>
              {stats.byProto.map(s => (
                <div key={s.proto} className={`p-2 rounded-lg border text-center ${PROTO_COLORS[s.proto].bg} ${PROTO_COLORS[s.proto].border}`}>
                  <div className={`text-lg font-bold ${PROTO_COLORS[s.proto].text}`}>{s.count}</div>
                  <div className={`text-[10px] font-semibold ${PROTO_COLORS[s.proto].text}`}>{s.proto}</div>
                  <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400 mt-0.5">{(s.bytes / 1024).toFixed(1)} KB</div>
                </div>
              ))}
            </div>
          )}

          {/* Packet table + detail split */}
          <div className="flex-1 min-h-0 flex gap-2">
            {/* Table */}
            <div className={`${selectedPkt ? 'w-1/2' : 'w-full'} flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all`}>
              <div className="grid grid-cols-[64px_1fr_1fr_56px_48px_1fr] gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-shrink-0">
                <span>Time</span><span>Source</span><span>Destination</span><span>Proto</span><span>Len</span><span>Info</span>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-auto">
                {filteredPackets.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-gray-400 dark:text-gray-500">
                    {capturing ? 'Waiting for packets matching filters...' : 'No packets captured yet'}
                  </div>
                ) : (
                  filteredPackets.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPkt(prev => prev?.id === p.id ? null : p)}
                      className={`w-full grid grid-cols-[64px_1fr_1fr_56px_48px_1fr] gap-1 px-3 py-1 text-left text-[11px] border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        selectedPkt?.id === p.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500' : ''
                      }`}
                    >
                      <span className="text-gray-500 dark:text-gray-500 font-mono truncate">{formatTs(p.timestamp)}</span>
                      <span className="text-gray-700 dark:text-gray-300 font-mono truncate">{p.src}</span>
                      <span className="text-gray-700 dark:text-gray-300 font-mono truncate">{p.dst}</span>
                      <span className={`font-mono font-bold ${PROTO_COLORS[p.protocol].text}`}>{p.protocol}</span>
                      <span className="text-gray-500 dark:text-gray-400 font-mono">{p.length}</span>
                      <span className="text-gray-500 dark:text-gray-400 truncate">{p.info}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Detail panel */}
            {selectedPkt && (
              <div className="w-1/2 flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Packet #{selectedPkt.id} Detail
                  </span>
                  <button onClick={() => setSelectedPkt(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {renderPacketDetail(selectedPkt)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
