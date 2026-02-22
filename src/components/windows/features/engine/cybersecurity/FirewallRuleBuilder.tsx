import React, { useState, useCallback } from 'react';
import { Shield, Plus, Trash2, Edit3, GripVertical, Play, RotateCcw, ChevronDown, ChevronUp, Check, X, ArrowDownToLine, ArrowUpFromLine, Zap, BarChart3, ScrollText, Layers } from 'lucide-react';

type Action = 'ALLOW' | 'DENY';
type Protocol = 'TCP' | 'UDP' | 'ICMP' | 'ANY';
type Direction = 'IN' | 'OUT' | 'BOTH';
type TabId = 'learn' | 'sandbox';

interface FirewallRule {
  id: string;
  priority: number;
  action: Action;
  protocol: Protocol;
  sourceIp: string;
  destIp: string;
  sourcePort: string;
  destPort: string;
  direction: Direction;
  enabled: boolean;
  label: string;
}

interface TestPacket {
  sourceIp: string;
  destIp: string;
  sourcePort: string;
  destPort: string;
  protocol: Protocol;
  direction: 'IN' | 'OUT';
}

interface SimResult {
  matched: boolean;
  ruleId: string | null;
  action: Action;
  reason: string;
}

interface TrafficLogEntry {
  id: string;
  packet: TestPacket;
  result: SimResult;
  timestamp: string;
}

interface RuleTemplate {
  name: string;
  description: string;
  rules: Omit<FirewallRule, 'id' | 'priority'>[];
}

const RULE_TEMPLATES: RuleTemplate[] = [
  {
    name: 'Web Server',
    description: 'Allow HTTP/HTTPS inbound, deny everything else',
    rules: [
      { action: 'ALLOW', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '80', direction: 'IN', enabled: true, label: 'Allow HTTP inbound' },
      { action: 'ALLOW', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '443', direction: 'IN', enabled: true, label: 'Allow HTTPS inbound' },
      { action: 'ALLOW', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '*', direction: 'OUT', enabled: true, label: 'Allow all outbound' },
    ],
  },
  {
    name: 'Database Server',
    description: 'Allow DB ports from private subnet only',
    rules: [
      { action: 'ALLOW', protocol: 'TCP', sourceIp: '10.0.0.0/8', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '3306', direction: 'IN', enabled: true, label: 'Allow MySQL from private net' },
      { action: 'ALLOW', protocol: 'TCP', sourceIp: '10.0.0.0/8', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '5432', direction: 'IN', enabled: true, label: 'Allow PostgreSQL from private net' },
      { action: 'DENY', protocol: 'ANY', sourceIp: '0.0.0.0/0', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '3306', direction: 'IN', enabled: true, label: 'Block MySQL from public' },
      { action: 'DENY', protocol: 'ANY', sourceIp: '0.0.0.0/0', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '5432', direction: 'IN', enabled: true, label: 'Block PostgreSQL from public' },
    ],
  },
  {
    name: 'SSH Only',
    description: 'Allow SSH from trusted IPs only',
    rules: [
      { action: 'ALLOW', protocol: 'TCP', sourceIp: '192.168.1.0/24', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '22', direction: 'IN', enabled: true, label: 'Allow SSH from trusted LAN' },
      { action: 'DENY', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '22', direction: 'IN', enabled: true, label: 'Deny SSH from all others' },
    ],
  },
  {
    name: 'Mail Server',
    description: 'Allow SMTP, IMAP, POP3 inbound',
    rules: [
      { action: 'ALLOW', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '25', direction: 'IN', enabled: true, label: 'Allow SMTP' },
      { action: 'ALLOW', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '143', direction: 'IN', enabled: true, label: 'Allow IMAP' },
      { action: 'ALLOW', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '993', direction: 'IN', enabled: true, label: 'Allow IMAPS' },
      { action: 'ALLOW', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '587', direction: 'IN', enabled: true, label: 'Allow SMTPS submission' },
    ],
  },
  {
    name: 'DNS Server',
    description: 'Allow DNS queries on TCP/UDP port 53',
    rules: [
      { action: 'ALLOW', protocol: 'UDP', sourceIp: '0.0.0.0/0', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '53', direction: 'IN', enabled: true, label: 'Allow DNS (UDP)' },
      { action: 'ALLOW', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '53', direction: 'IN', enabled: true, label: 'Allow DNS (TCP)' },
    ],
  },
];

const DEFAULT_RULES: FirewallRule[] = [
  { id: 'r1', priority: 1, action: 'ALLOW', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '10.0.0.1', sourcePort: '*', destPort: '443', direction: 'IN', enabled: true, label: 'Allow HTTPS inbound' },
  { id: 'r2', priority: 2, action: 'ALLOW', protocol: 'TCP', sourceIp: '10.0.0.0/24', destIp: '0.0.0.0/0', sourcePort: '*', destPort: '80', direction: 'OUT', enabled: true, label: 'Allow HTTP outbound from LAN' },
  { id: 'r3', priority: 3, action: 'DENY', protocol: 'TCP', sourceIp: '192.168.1.100', destIp: '10.0.0.1', sourcePort: '*', destPort: '22', direction: 'IN', enabled: true, label: 'Block SSH from suspicious IP' },
  { id: 'r4', priority: 4, action: 'ALLOW', protocol: 'UDP', sourceIp: '0.0.0.0/0', destIp: '10.0.0.1', sourcePort: '*', destPort: '53', direction: 'IN', enabled: true, label: 'Allow DNS queries' },
];

function generateId(): string {
  return 'r' + Math.random().toString(36).substring(2, 9);
}

function ipToNum(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let num = 0;
  for (const p of parts) {
    const n = parseInt(p, 10);
    if (isNaN(n) || n < 0 || n > 255) return null;
    num = (num << 8) | n;
  }
  return num >>> 0;
}

function ipMatchesCIDR(ip: string, cidr: string): boolean {
  if (cidr === '0.0.0.0/0' || cidr === '*' || cidr === 'any') return true;
  if (cidr === ip) return true;
  const cidrParts = cidr.split('/');
  if (cidrParts.length !== 2) return ip === cidr;
  const cidrIp = cidrParts[0];
  const mask = parseInt(cidrParts[1], 10);
  if (isNaN(mask)) return false;
  const ipNum = ipToNum(ip);
  const cidrNum = ipToNum(cidrIp);
  if (ipNum === null || cidrNum === null) return false;
  const maskBits = (~0 << (32 - mask)) >>> 0;
  return (ipNum & maskBits) === (cidrNum & maskBits);
}

function portMatches(rulePort: string, packetPort: string): boolean {
  if (rulePort === '*' || rulePort === 'any' || rulePort === '0') return true;
  if (rulePort.includes('-')) {
    const [lo, hi] = rulePort.split('-').map(Number);
    const p = parseInt(packetPort, 10);
    return p >= lo && p <= hi;
  }
  if (rulePort.includes(',')) {
    return rulePort.split(',').map(s => s.trim()).includes(packetPort);
  }
  return rulePort === packetPort;
}

const LEARN_SECTIONS = [
  {
    title: 'What is a Firewall?',
    content: `A firewall is a network security device or software that monitors and controls incoming and outgoing network traffic based on a set of predefined security rules. It acts as a barrier between a trusted internal network and untrusted external networks, such as the internet.

Think of a firewall like a security guard at a building entrance. The guard checks every person (network packet) against a list of rules: who is allowed in, who is denied, and under what conditions. Just as the guard inspects IDs and compares them against a list, a firewall inspects packet headers and compares them against its rule set.

Firewalls operate at various layers of the OSI model, from the network layer (Layer 3) up to the application layer (Layer 7), depending on the type. They are one of the most fundamental components of any security architecture and are deployed in virtually every enterprise network, cloud environment, and even on individual workstations.`,
  },
  {
    title: 'Types of Firewalls',
    content: `Packet Filtering Firewalls: The simplest type. They examine each packet in isolation and compare it against a set of rules based on source/destination IP, port numbers, and protocol. They operate at the network layer (Layer 3) and transport layer (Layer 4). They are fast but cannot track the state of connections.

Stateful Inspection Firewalls: These maintain a state table that tracks active connections. When a packet arrives, the firewall checks whether it belongs to an established connection. This allows the firewall to understand context -- for example, allowing a response packet that corresponds to an outgoing request, even if no explicit rule permits inbound traffic on that port.

Application-Layer Firewalls (Proxy Firewalls): These operate at Layer 7 and can inspect the actual content of network traffic. They can detect and block specific application-level attacks like SQL injection in HTTP requests, malicious file uploads, or protocol violations. They act as intermediaries, terminating and re-establishing connections.

Next-Generation Firewalls (NGFW): Modern firewalls that combine traditional firewall capabilities with advanced features like deep packet inspection (DPI), intrusion prevention systems (IPS), application awareness, SSL/TLS inspection, and threat intelligence feeds. Examples include Palo Alto Networks, Fortinet FortiGate, and Cisco Firepower.`,
  },
  {
    title: 'How Firewall Rules Work',
    content: `Firewall rules are processed in a specific order, and this ordering is critical to how traffic is handled:

Rule Ordering (First-Match): Rules are evaluated from highest priority (lowest number) to lowest priority. The first rule that matches a packet determines the action taken. Once a match is found, no further rules are checked. This is why rule ordering matters enormously -- a broad "allow all" rule placed before a specific "deny" rule will effectively nullify the deny rule.

Default Policy: Every firewall has a default policy that applies when no explicit rule matches a packet. This is typically either "default deny" (block everything not explicitly allowed) or "default allow" (permit everything not explicitly blocked). Security best practice strongly favors default deny.

Chain of Rules: Rules form a sequential chain. Each packet enters at the top of the chain and is compared against rules one by one. The packet "falls through" rules that don't match until it either hits a matching rule or reaches the default policy at the bottom. In iptables, these chains are named INPUT, OUTPUT, and FORWARD.`,
  },
  {
    title: 'Rule Components',
    content: `Every firewall rule consists of several key components:

Action (ALLOW/DENY): Determines whether matching traffic is permitted or blocked. Some firewalls also support "LOG" (record but don't block), "REJECT" (block and send an error response), or "DROP" (block silently).

Protocol: Specifies which network protocol the rule applies to -- typically TCP, UDP, ICMP, or ANY. TCP is used for reliable connections (HTTP, SSH, FTP), UDP for fast connectionless communication (DNS, streaming), and ICMP for network diagnostics (ping, traceroute).

Source IP Address: The IP address or range where the traffic originates. Can be a single IP (192.168.1.50), a CIDR range (10.0.0.0/8), or a wildcard (0.0.0.0/0 meaning any address).

Destination IP Address: The IP address or range where the traffic is headed. Same format options as source IP.

Port Numbers: Source port (where the connection originates) and destination port (the service being accessed). Common ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 53 (DNS), 3306 (MySQL), 5432 (PostgreSQL).

Direction: Whether the rule applies to inbound traffic (entering the network), outbound traffic (leaving the network), or both.`,
  },
  {
    title: 'CIDR Notation Explained',
    content: `CIDR (Classless Inter-Domain Routing) notation is a compact way to specify IP address ranges. It uses the format: IP_ADDRESS/PREFIX_LENGTH.

The prefix length (the number after the slash) indicates how many bits of the IP address are fixed (the network portion). The remaining bits can vary (the host portion).

Examples:
  192.168.1.0/24 -- The first 24 bits are fixed. This covers 192.168.1.0 through 192.168.1.255 (256 addresses). The /24 mask is 255.255.255.0.

  10.0.0.0/8 -- The first 8 bits are fixed. This covers 10.0.0.0 through 10.255.255.255 (16.7 million addresses). This is the entire Class A private range.

  172.16.0.0/12 -- Covers 172.16.0.0 through 172.31.255.255 (1 million+ addresses). This is the Class B private range.

  192.168.1.128/25 -- The first 25 bits are fixed, leaving 7 bits for hosts. This covers 192.168.1.128 through 192.168.1.255 (128 addresses).

  0.0.0.0/0 -- Zero bits are fixed, meaning ALL IP addresses match. Used as a wildcard or to represent "any" address.

  10.0.0.5/32 -- All 32 bits are fixed. This matches exactly one IP address: 10.0.0.5.

Quick reference: /8 = 16M hosts, /16 = 65K hosts, /24 = 256 hosts, /32 = 1 host.`,
  },
  {
    title: 'Common Firewall Strategies',
    content: `Default Deny (Whitelisting): Start by blocking all traffic, then explicitly allow only what is needed. This is the gold standard for security. Any traffic not matching an explicit allow rule is dropped. This approach follows the principle of least privilege.

Default Allow (Blacklisting): Start by allowing all traffic, then block known threats. This is easier to manage but far less secure, as it requires you to anticipate every possible threat. New attack vectors will bypass your rules until you add specific blocks.

Whitelisting vs Blacklisting: Whitelisting is more secure but more operationally demanding. Blacklisting is convenient but leaves gaps. Most modern security architectures use whitelisting as the foundation, sometimes combined with blacklisting for known-bad indicators.

Zone-Based Policies: Networks are divided into security zones (e.g., DMZ, internal, external, guest). Traffic between zones is controlled by firewall policies, with stricter rules between less-trusted and more-trusted zones.

Micro-Segmentation: A modern approach where firewall rules are applied at a very granular level, potentially between individual workloads or containers. This limits the blast radius of a breach.`,
  },
  {
    title: 'Stateless vs Stateful Firewalls',
    content: `Stateless Firewalls examine each packet independently with no knowledge of previous packets. Every packet is evaluated against the rule set from scratch. This means you need separate rules for both directions of a conversation -- for example, one rule to allow outbound HTTP requests and another to allow the inbound responses.

Advantages of stateless: Very fast, low resource usage, predictable behavior, simple to understand.
Disadvantages: Cannot detect connection-based attacks, requires more rules, cannot distinguish between a legitimate response and an unsolicited inbound packet.

Stateful Firewalls maintain a connection state table. When an outbound connection is initiated, the firewall records the connection details (source/dest IP, ports, protocol). Return traffic that matches an existing connection is automatically allowed without needing a separate rule.

Advantages of stateful: Fewer rules needed, can detect out-of-state packets (e.g., a TCP ACK without a preceding SYN), better security against certain attacks, supports complex protocols like FTP that use dynamic ports.
Disadvantages: Higher resource usage (memory for state table), can be overwhelmed by state-table exhaustion attacks, more complex to troubleshoot.

Most modern firewalls are stateful, with cloud security groups (AWS, Azure, GCP) being notable examples of stateful implementations.`,
  },
  {
    title: 'Real-World Examples',
    content: `Linux iptables:
  iptables -A INPUT -p tcp --dport 22 -s 192.168.1.0/24 -j ACCEPT
  iptables -A INPUT -p tcp --dport 80 -j ACCEPT
  iptables -A INPUT -p tcp --dport 443 -j ACCEPT
  iptables -P INPUT DROP

This allows SSH from the local subnet, HTTP and HTTPS from anywhere, and drops everything else by default.

Windows Firewall (PowerShell):
  New-NetFirewallRule -DisplayName "Allow SSH" -Direction Inbound -Protocol TCP -LocalPort 22 -Action Allow -RemoteAddress 192.168.1.0/24
  Set-NetFirewallProfile -DefaultInboundAction Block

AWS Security Groups:
  Security groups are stateful. An inbound rule allowing port 443 automatically permits the return traffic. Rules are specified as: Type (e.g. HTTPS), Protocol (TCP), Port Range (443), Source (0.0.0.0/0 or a specific CIDR). Unlike traditional firewalls, security groups only support ALLOW rules -- there are no explicit DENY rules. Anything not allowed is implicitly denied.

Azure Network Security Groups (NSG):
  Similar to AWS but support both allow and deny rules with explicit priority ordering (100-4096). Lower priority numbers are evaluated first.`,
  },
  {
    title: 'Best Practices',
    content: `Principle of Least Privilege: Only allow the minimum traffic necessary for legitimate operations. If a server only needs to serve HTTPS, don't open HTTP, SSH, or any other ports to the public. Each unnecessary open port is an additional attack surface.

Logging and Monitoring: Enable logging for denied traffic at minimum, and ideally for all traffic. Logs are invaluable for incident response, forensics, and detecting anomalous patterns. Forward firewall logs to a SIEM (Security Information and Event Management) system.

Regular Audits: Review firewall rules periodically (at least quarterly). Remove rules that are no longer needed. Overly permissive or stale rules accumulate over time and create security gaps. Document the purpose of each rule.

Rule Documentation: Every rule should have a clear label or comment explaining why it exists, who requested it, and when it was created. Undocumented rules become impossible to manage at scale.

Defense in Depth: Firewalls should be one layer in a multi-layered security strategy. Combine network firewalls with host-based firewalls, intrusion detection systems, endpoint protection, and application-level security controls.

Change Management: All firewall rule changes should go through a formal change management process with peer review, approval, testing, and rollback procedures. Unauthorized or untested changes are a leading cause of security incidents.

Segmentation: Use firewalls to segment your network. Don't rely on a single perimeter firewall. Internal firewalls between network segments limit lateral movement if an attacker breaches the perimeter.`,
  },
];

export const FirewallRuleBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('learn');
  const [rules, setRules] = useState<FirewallRule[]>(DEFAULT_RULES);
  const [defaultPolicy, setDefaultPolicy] = useState<Action>('DENY');
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [testPacket, setTestPacket] = useState<TestPacket>({
    sourceIp: '192.168.1.100',
    destIp: '10.0.0.1',
    sourcePort: '49152',
    destPort: '22',
    protocol: 'TCP',
    direction: 'IN',
  });
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [trafficLog, setTrafficLog] = useState<TrafficLogEntry[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [expandedLearnSection, setExpandedLearnSection] = useState<number>(0);
  const [showTemplates, setShowTemplates] = useState(false);

  const blankRule = useCallback((): FirewallRule => ({
    id: generateId(),
    priority: rules.length + 1,
    action: 'ALLOW',
    protocol: 'TCP',
    sourceIp: '0.0.0.0/0',
    destIp: '0.0.0.0/0',
    sourcePort: '*',
    destPort: '80',
    direction: 'IN',
    enabled: true,
    label: '',
  }), [rules.length]);

  const [formData, setFormData] = useState<FirewallRule>(blankRule());

  const openAdd = useCallback(() => {
    setEditingRule(null);
    setFormData(blankRule());
    setShowForm(true);
  }, [blankRule]);

  const openEdit = useCallback((rule: FirewallRule) => {
    setEditingRule(rule);
    setFormData({ ...rule });
    setShowForm(true);
  }, []);

  const saveRule = useCallback(() => {
    if (editingRule) {
      setRules(prev => prev.map(r => r.id === editingRule.id ? { ...formData } : r));
    } else {
      setRules(prev => [...prev, { ...formData, priority: prev.length + 1 }]);
    }
    setShowForm(false);
    setSimResult(null);
  }, [editingRule, formData]);

  const deleteRule = useCallback((id: string) => {
    setRules(prev => {
      const filtered = prev.filter(r => r.id !== id);
      return filtered.map((r, i) => ({ ...r, priority: i + 1 }));
    });
    setSimResult(null);
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    setSimResult(null);
  }, []);

  const evaluatePacket = useCallback((packet: TestPacket, currentRules: FirewallRule[], policy: Action): SimResult => {
    const sorted = [...currentRules].sort((a, b) => a.priority - b.priority);
    for (const rule of sorted) {
      if (!rule.enabled) continue;
      if (rule.protocol !== 'ANY' && rule.protocol !== packet.protocol) continue;
      if (rule.direction !== 'BOTH' && rule.direction !== packet.direction) continue;
      if (!ipMatchesCIDR(packet.sourceIp, rule.sourceIp)) continue;
      if (!ipMatchesCIDR(packet.destIp, rule.destIp)) continue;
      if (rule.protocol !== 'ICMP') {
        if (!portMatches(rule.sourcePort, packet.sourcePort)) continue;
        if (!portMatches(rule.destPort, packet.destPort)) continue;
      }
      return {
        matched: true,
        ruleId: rule.id,
        action: rule.action,
        reason: `Matched Rule #${rule.priority}: "${rule.label || 'Unnamed'}" -- ${rule.action}`,
      };
    }
    return {
      matched: false,
      ruleId: null,
      action: policy,
      reason: `No rule matched. Default policy applied: ${policy}`,
    };
  }, []);

  const simulatePacket = useCallback(() => {
    const result = evaluatePacket(testPacket, rules, defaultPolicy);
    setSimResult(result);
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTrafficLog(prev => [{
      id: generateId(),
      packet: { ...testPacket },
      result,
      timestamp,
    }, ...prev].slice(0, 50));
  }, [rules, testPacket, defaultPolicy, evaluatePacket]);

  const applyTemplate = useCallback((template: RuleTemplate) => {
    const newRules: FirewallRule[] = template.rules.map((r, i) => ({
      ...r,
      id: generateId(),
      priority: i + 1,
    }));
    setRules(newRules);
    setSimResult(null);
    setTrafficLog([]);
    setShowTemplates(false);
  }, []);

  const handleDragStart = useCallback((idx: number) => setDragIdx(idx), []);
  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  }, []);
  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setDragOverIdx(null);
  }, []);
  const handleDrop = useCallback((targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    setRules(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(dragIdx, 1);
      copy.splice(targetIdx, 0, moved);
      return copy.map((r, i) => ({ ...r, priority: i + 1 }));
    });
    setDragIdx(null);
    setDragOverIdx(null);
    setSimResult(null);
  }, [dragIdx]);

  const stats = {
    allowed: trafficLog.filter(e => e.result.action === 'ALLOW').length,
    denied: trafficLog.filter(e => e.result.action === 'DENY').length,
    total: trafficLog.length,
  };

  const inputCls = 'px-2 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors';
  const selectCls = inputCls;
  const labelCls = 'text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block';

  const renderLearnTab = () => (
    <div className="space-y-2">
      {LEARN_SECTIONS.map((section, idx) => {
        const isExpanded = expandedLearnSection === idx;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <button
              onClick={() => setExpandedLearnSection(isExpanded ? -1 : idx)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </span>
              </div>
              {isExpanded
                ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              }
            </button>
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
                <div className="mt-3 text-[13px] leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderSandboxTab = () => (
    <div className="space-y-3">
      {/* Toolbar row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Default Policy:</span>
            <button
              onClick={() => { setDefaultPolicy(p => p === 'DENY' ? 'ALLOW' : 'DENY'); setSimResult(null); }}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${defaultPolicy === 'DENY'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
              }`}
            >
              {defaultPolicy}
            </button>
          </div>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Templates
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setRules([]); setSimResult(null); setTrafficLog([]); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear All
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Rule
          </button>
        </div>
      </div>

      {/* Templates panel */}
      {showTemplates && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            Pre-built Rule Templates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {RULE_TEMPLATES.map((template, idx) => (
              <button
                key={idx}
                onClick={() => applyTemplate(template)}
                className="text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                  {template.name}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {template.description}
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  {template.rules.length} rule{template.rules.length !== 1 ? 's' : ''}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-300 dark:border-blue-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-500" />
              {editingRule ? 'Edit Rule' : 'New Rule'}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div>
              <label className={labelCls}>Action</label>
              <select
                value={formData.action}
                onChange={e => setFormData(p => ({ ...p, action: e.target.value as Action }))}
                className={`w-full ${selectCls}`}
              >
                <option value="ALLOW">ALLOW</option>
                <option value="DENY">DENY</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Protocol</label>
              <select
                value={formData.protocol}
                onChange={e => setFormData(p => ({ ...p, protocol: e.target.value as Protocol }))}
                className={`w-full ${selectCls}`}
              >
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
                <option value="ANY">ANY</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Direction</label>
              <select
                value={formData.direction}
                onChange={e => setFormData(p => ({ ...p, direction: e.target.value as Direction }))}
                className={`w-full ${selectCls}`}
              >
                <option value="IN">Inbound</option>
                <option value="OUT">Outbound</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Source IP</label>
              <input
                value={formData.sourceIp}
                onChange={e => setFormData(p => ({ ...p, sourceIp: e.target.value }))}
                placeholder="0.0.0.0/0"
                className={`w-full ${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className={labelCls}>Destination IP</label>
              <input
                value={formData.destIp}
                onChange={e => setFormData(p => ({ ...p, destIp: e.target.value }))}
                placeholder="0.0.0.0/0"
                className={`w-full ${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className={labelCls}>Source Port</label>
              <input
                value={formData.sourcePort}
                onChange={e => setFormData(p => ({ ...p, sourcePort: e.target.value }))}
                placeholder="* (any)"
                className={`w-full ${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className={labelCls}>Dest Port</label>
              <input
                value={formData.destPort}
                onChange={e => setFormData(p => ({ ...p, destPort: e.target.value }))}
                placeholder="80, 1-1024, *"
                className={`w-full ${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className={labelCls}>Label / Description</label>
              <input
                value={formData.label}
                onChange={e => setFormData(p => ({ ...p, label: e.target.value }))}
                placeholder="Rule description..."
                className={`w-full ${inputCls}`}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveRule}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {editingRule ? 'Update Rule' : 'Add Rule'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                <th className="px-2 py-2 text-left font-semibold text-gray-500 dark:text-gray-400 w-6"></th>
                <th className="px-2 py-2 text-left font-semibold text-gray-500 dark:text-gray-400 w-10">#</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Action</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Proto</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Source IP</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Dest IP</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Src Port</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Dst Port</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Dir</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Label</th>
                <th className="px-2 py-2 text-center font-semibold text-gray-500 dark:text-gray-400 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, idx) => {
                const isMatched = simResult?.ruleId === rule.id;
                const rowBg = isMatched
                  ? simResult.action === 'ALLOW'
                    ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-400 ring-inset'
                    : 'bg-red-50 dark:bg-red-900/20 ring-2 ring-red-400 ring-inset'
                  : idx % 2 === 0
                    ? 'bg-white dark:bg-gray-900'
                    : 'bg-gray-50/50 dark:bg-gray-800/30';
                const disabledCls = !rule.enabled ? 'opacity-40' : '';
                const dragOverCls = dragOverIdx === idx ? 'border-t-2 border-blue-500' : '';
                return (
                  <tr
                    key={rule.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    onDrop={() => handleDrop(idx)}
                    className={`${rowBg} ${disabledCls} ${dragOverCls} border-b border-gray-100 dark:border-gray-800 transition-all cursor-grab active:cursor-grabbing`}
                  >
                    <td className="px-2 py-1.5 text-gray-400">
                      <GripVertical className="w-3.5 h-3.5" />
                    </td>
                    <td className="px-2 py-1.5 font-mono font-bold text-gray-600 dark:text-gray-300">{rule.priority}</td>
                    <td className="px-2 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${rule.action === 'ALLOW'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                      }`}>
                        {rule.action}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 font-mono text-gray-700 dark:text-gray-300">{rule.protocol}</td>
                    <td className="px-2 py-1.5 font-mono text-gray-700 dark:text-gray-300 text-[10px]">{rule.sourceIp}</td>
                    <td className="px-2 py-1.5 font-mono text-gray-700 dark:text-gray-300 text-[10px]">{rule.destIp}</td>
                    <td className="px-2 py-1.5 font-mono text-gray-700 dark:text-gray-300">{rule.protocol === 'ICMP' ? '--' : rule.sourcePort}</td>
                    <td className="px-2 py-1.5 font-mono text-gray-700 dark:text-gray-300">{rule.protocol === 'ICMP' ? '--' : rule.destPort}</td>
                    <td className="px-2 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${rule.direction === 'IN'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                        : rule.direction === 'OUT'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {rule.direction}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400 max-w-[120px] truncate">{rule.label || '--'}</td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => toggleRule(rule.id)}
                          title={rule.enabled ? 'Disable' : 'Enable'}
                          className={`p-1 rounded transition-colors ${rule.enabled
                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {rule.enabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => openEdit(rule)}
                          className="p-1 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    No rules defined. Click &quot;Add Rule&quot; or load a template to get started.
                  </td>
                </tr>
              )}
              {/* Default policy row */}
              <tr className={`border-t-2 border-dashed ${defaultPolicy === 'DENY'
                ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-900/10'
                : 'border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10'
              } ${simResult && !simResult.matched
                ? (defaultPolicy === 'DENY' ? 'ring-2 ring-red-400 ring-inset' : 'ring-2 ring-green-400 ring-inset')
                : ''
              }`}>
                <td className="px-2 py-1.5"></td>
                <td className="px-2 py-1.5 font-mono text-gray-400 dark:text-gray-500 text-[10px]">DEF</td>
                <td className="px-2 py-1.5">
                  <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${defaultPolicy === 'ALLOW'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                  }`}>
                    {defaultPolicy}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-gray-400 dark:text-gray-500 italic" colSpan={8}>
                  Default policy (applied when no explicit rule matches)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Packet Simulator */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-500" />
          Packet Simulator
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
          <div>
            <label className={labelCls}>Source IP</label>
            <input
              value={testPacket.sourceIp}
              onChange={e => setTestPacket(p => ({ ...p, sourceIp: e.target.value }))}
              placeholder="192.168.1.100"
              className={`w-full ${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>Dest IP</label>
            <input
              value={testPacket.destIp}
              onChange={e => setTestPacket(p => ({ ...p, destIp: e.target.value }))}
              placeholder="10.0.0.1"
              className={`w-full ${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>Source Port</label>
            <input
              value={testPacket.sourcePort}
              onChange={e => setTestPacket(p => ({ ...p, sourcePort: e.target.value }))}
              placeholder="49152"
              className={`w-full ${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>Dest Port</label>
            <input
              value={testPacket.destPort}
              onChange={e => setTestPacket(p => ({ ...p, destPort: e.target.value }))}
              placeholder="443"
              className={`w-full ${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>Protocol</label>
            <select
              value={testPacket.protocol}
              onChange={e => setTestPacket(p => ({ ...p, protocol: e.target.value as Protocol }))}
              className={`w-full ${selectCls}`}
            >
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Direction</label>
            <select
              value={testPacket.direction}
              onChange={e => setTestPacket(p => ({ ...p, direction: e.target.value as 'IN' | 'OUT' }))}
              className={`w-full ${selectCls}`}
            >
              <option value="IN">Inbound</option>
              <option value="OUT">Outbound</option>
            </select>
          </div>
        </div>
        <button
          onClick={simulatePacket}
          className="flex items-center gap-1.5 px-4 py-2 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
          Simulate Packet
        </button>

        {simResult && (
          <div className={`mt-3 p-3 rounded-lg border-2 flex items-center gap-3 ${simResult.action === 'ALLOW'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600'
            : 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${simResult.action === 'ALLOW'
              ? 'bg-green-200 dark:bg-green-800'
              : 'bg-red-200 dark:bg-red-800'
            }`}>
              {simResult.action === 'ALLOW'
                ? <Check className="w-5 h-5 text-green-700 dark:text-green-300" />
                : <X className="w-5 h-5 text-red-700 dark:text-red-300" />
              }
            </div>
            <div>
              <div className={`text-sm font-bold ${simResult.action === 'ALLOW'
                ? 'text-green-800 dark:text-green-300'
                : 'text-red-800 dark:text-red-300'
              }`}>
                Packet {simResult.action === 'ALLOW' ? 'ALLOWED' : 'BLOCKED'}
              </div>
              <div className={`text-xs ${simResult.action === 'ALLOW'
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
              }`}>
                {simResult.reason}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics and Traffic Log -- side by side */}
      {trafficLog.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Statistics */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Statistics
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Total Packets</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.total}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <ArrowDownToLine className="w-3 h-3" /> Allowed
                  </span>
                  <span className="text-sm font-bold text-green-700 dark:text-green-400">{stats.allowed}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: stats.total > 0 ? `${(stats.allowed / stats.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <ArrowUpFromLine className="w-3 h-3" /> Denied
                  </span>
                  <span className="text-sm font-bold text-red-700 dark:text-red-400">{stats.denied}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-300"
                    style={{ width: stats.total > 0 ? `${(stats.denied / stats.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              {stats.total > 0 && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    Allow Rate: {((stats.allowed / stats.total) * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    Deny Rate: {((stats.denied / stats.total) * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Traffic Log */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-purple-500" />
                Traffic Log
              </h3>
              <button
                onClick={() => setTrafficLog([])}
                className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Clear Log
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {trafficLog.map(entry => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-mono ${entry.result.action === 'ALLOW'
                    ? 'bg-green-50 dark:bg-green-900/10 text-green-800 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-400'
                  }`}
                >
                  <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{entry.timestamp}</span>
                  <span className={`px-1 py-0.5 rounded font-bold text-[9px] flex-shrink-0 ${entry.result.action === 'ALLOW'
                    ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-300'
                    : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-300'
                  }`}>
                    {entry.result.action}
                  </span>
                  <span className="flex-shrink-0">{entry.packet.protocol}</span>
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {entry.packet.direction === 'IN' ? 'IN' : 'OUT'}
                  </span>
                  <span className="truncate">
                    {entry.packet.sourceIp}:{entry.packet.sourcePort} {'->'} {entry.packet.destIp}:{entry.packet.destPort}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 truncate ml-auto flex-shrink-0">
                    {entry.result.matched ? `Rule #${rules.find(r => r.id === entry.result.ruleId)?.priority ?? '?'}` : 'Default'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-orange-50 dark:from-gray-950 dark:to-orange-950 p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Firewall Rule Builder</h2>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Learn how firewalls work and simulate firewall policies interactively
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-3 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        <button
          onClick={() => setActiveTab('learn')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'learn'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Learn
        </button>
        <button
          onClick={() => setActiveTab('sandbox')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'sandbox'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          Sandbox
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'learn' ? renderLearnTab() : renderSandboxTab()}
      </div>
    </div>
  );
};
