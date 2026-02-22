import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Search,
  Shield,
  Terminal,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Activity,
  Info,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type PortStatus = 'open' | 'closed' | 'filtered' | 'unchecked' | 'scanning';
type ScanType = 'quick' | 'full' | 'custom';
type ScanState = 'idle' | 'scanning' | 'complete';
type TabId = 'learn' | 'sandbox';

interface PortInfo {
  port: number;
  service: string;
  version: string;
  description: string;
  protocol: string;
  commonVulnerabilities: string[];
  status: PortStatus;
}

// ─── Port Database ───────────────────────────────────────────────────────────

const COMMON_PORTS: PortInfo[] = [
  { port: 20, service: 'FTP Data', version: 'vsftpd 3.0.3', description: 'File Transfer Protocol data transfer channel. Carries the actual file data during FTP sessions while port 21 handles commands.', protocol: 'TCP', commonVulnerabilities: ['Cleartext credential transmission', 'FTP bounce attacks for port scanning', 'Anonymous access misconfiguration allowing data exfiltration'], status: 'unchecked' },
  { port: 21, service: 'FTP', version: 'vsftpd 3.0.3', description: 'File Transfer Protocol command/control channel. Used to authenticate and issue file transfer commands. Sends passwords in cleartext.', protocol: 'TCP', commonVulnerabilities: ['Cleartext authentication sniffable on network', 'Directory traversal (CVE-2015-3306)', 'Anonymous login enabled by default on some configs', 'Brute force attacks on weak credentials'], status: 'unchecked' },
  { port: 22, service: 'SSH', version: 'OpenSSH 8.9p1', description: 'Secure Shell provides encrypted remote login, command execution, and tunneling. Replaces insecure Telnet and rlogin protocols.', protocol: 'TCP', commonVulnerabilities: ['Brute force and credential stuffing attacks', 'Weak key exchange algorithms (diffie-hellman-group1-sha1)', 'Outdated versions vulnerable to CVE-2023-38408', 'Username enumeration via timing attacks'], status: 'unchecked' },
  { port: 23, service: 'Telnet', version: 'Linux telnetd', description: 'Unencrypted remote login protocol. All data including passwords transmitted in cleartext. Considered obsolete and insecure.', protocol: 'TCP', commonVulnerabilities: ['All traffic sent in cleartext including credentials', 'No encryption making MitM attacks trivial', 'Credential sniffing with tools like Wireshark', 'Should be replaced with SSH in all cases'], status: 'unchecked' },
  { port: 25, service: 'SMTP', version: 'Postfix 3.7.0', description: 'Simple Mail Transfer Protocol for sending and relaying email between mail servers. Port 587 is preferred for authenticated submission.', protocol: 'TCP', commonVulnerabilities: ['Open relay allowing spam distribution', 'Email spoofing without SPF/DKIM/DMARC', 'Buffer overflow exploits in older MTAs', 'VRFY/EXPN user enumeration commands'], status: 'unchecked' },
  { port: 53, service: 'DNS', version: 'BIND 9.18.1', description: 'Domain Name System resolves human-readable domain names to IP addresses. Uses UDP for queries and TCP for zone transfers.', protocol: 'TCP/UDP', commonVulnerabilities: ['DNS zone transfer leaking internal records (AXFR)', 'DNS amplification for DDoS attacks', 'Cache poisoning to redirect traffic', 'DNS tunneling for data exfiltration'], status: 'unchecked' },
  { port: 80, service: 'HTTP', version: 'Apache 2.4.54', description: 'HyperText Transfer Protocol serves web pages in cleartext. All data including cookies and form submissions are unencrypted.', protocol: 'TCP', commonVulnerabilities: ['Man-in-the-middle attacks on unencrypted traffic', 'Session hijacking via cookie theft', 'Cleartext credential exposure', 'Web application vulnerabilities (XSS, SQLi, CSRF)'], status: 'unchecked' },
  { port: 110, service: 'POP3', version: 'Dovecot 2.3.19', description: 'Post Office Protocol v3 retrieves email from a mail server. Downloads messages and typically deletes them from the server.', protocol: 'TCP', commonVulnerabilities: ['Cleartext credential transmission', 'Brute force password attacks', 'Buffer overflow in older implementations', 'Use POP3S (port 995) or IMAP instead'], status: 'unchecked' },
  { port: 135, service: 'MSRPC', version: 'Microsoft Windows RPC', description: 'Microsoft Remote Procedure Call endpoint mapper. Windows services register their dynamic port assignments here.', protocol: 'TCP', commonVulnerabilities: ['Remote code execution (MS03-026 Blaster worm)', 'Information disclosure of running services', 'Worm propagation vector (Conficker)', 'Should be blocked at network perimeter'], status: 'unchecked' },
  { port: 139, service: 'NetBIOS', version: 'Samba 4.17.0', description: 'NetBIOS Session Service used for Windows file and printer sharing over NetBIOS. Legacy protocol often found alongside SMB.', protocol: 'TCP', commonVulnerabilities: ['Null session enumeration of users and shares', 'Unauthorized share access', 'Information leakage via NetBIOS name queries', 'Should be disabled if SMB over TCP (445) is available'], status: 'unchecked' },
  { port: 143, service: 'IMAP', version: 'Dovecot 2.3.19', description: 'Internet Message Access Protocol retrieves email while keeping messages synchronized on the server. Supports folders and search.', protocol: 'TCP', commonVulnerabilities: ['Cleartext authentication without STARTTLS', 'Brute force password attacks', 'Buffer overflow in older implementations', 'Prefer IMAPS (port 993) for encryption'], status: 'unchecked' },
  { port: 443, service: 'HTTPS', version: 'nginx 1.24.0', description: 'HTTP Secure encrypts web traffic using TLS/SSL. Standard port for secure web communications, e-commerce, and banking.', protocol: 'TCP', commonVulnerabilities: ['Outdated TLS 1.0/1.1 still enabled', 'Heartbleed (CVE-2014-0160) in OpenSSL', 'Weak cipher suites (RC4, DES)', 'Certificate misconfiguration or expiration'], status: 'unchecked' },
  { port: 445, service: 'SMB', version: 'Samba 4.17.0', description: 'Server Message Block protocol for Windows file sharing directly over TCP/IP. Critical for Windows networks and Active Directory.', protocol: 'TCP', commonVulnerabilities: ['EternalBlue (MS17-010) used by WannaCry ransomware', 'Ransomware propagation vector', 'Null session attacks for enumeration', 'SMBv1 should be completely disabled'], status: 'unchecked' },
  { port: 993, service: 'IMAPS', version: 'Dovecot 2.3.19', description: 'IMAP over TLS/SSL providing encrypted email retrieval. Preferred over plaintext IMAP on port 143.', protocol: 'TCP', commonVulnerabilities: ['TLS downgrade attacks (POODLE, BEAST)', 'Weak cipher suite negotiation', 'Certificate validation bypass', 'Brute force still possible over encrypted channel'], status: 'unchecked' },
  { port: 995, service: 'POP3S', version: 'Dovecot 2.3.19', description: 'POP3 over TLS/SSL providing encrypted email retrieval. Preferred over plaintext POP3 on port 110.', protocol: 'TCP', commonVulnerabilities: ['Weak cipher configuration', 'TLS downgrade attacks', 'Certificate pinning issues', 'Legacy protocol - consider IMAPS instead'], status: 'unchecked' },
  { port: 1433, service: 'MSSQL', version: 'SQL Server 2019', description: 'Microsoft SQL Server database listener. Primary port for database connections and queries from applications.', protocol: 'TCP', commonVulnerabilities: ['SQL injection through application layer', 'Default SA account with blank or weak password', 'Brute force authentication attacks', 'xp_cmdshell for OS command execution'], status: 'unchecked' },
  { port: 1521, service: 'Oracle DB', version: 'Oracle 19c', description: 'Oracle Database TNS Listener accepts incoming database connection requests and routes them to the database instance.', protocol: 'TCP', commonVulnerabilities: ['TNS poisoning (CVE-2012-1675)', 'Default credentials (SCOTT/TIGER, SYS/CHANGE_ON_INSTALL)', 'Remote code execution via Java stored procedures', 'Listener password not set by default'], status: 'unchecked' },
  { port: 3306, service: 'MySQL', version: 'MySQL 8.0.33', description: 'MySQL relational database service. Most popular open-source database, powers many web applications and CMS platforms.', protocol: 'TCP', commonVulnerabilities: ['Remote root login without password', 'SQL injection through application layer', 'Weak authentication plugins', 'User-defined function (UDF) for command execution'], status: 'unchecked' },
  { port: 3389, service: 'RDP', version: 'Microsoft Terminal Services', description: 'Remote Desktop Protocol provides graphical remote access to Windows desktops. Critical target for attackers.', protocol: 'TCP', commonVulnerabilities: ['BlueKeep (CVE-2019-0708) - wormable RCE', 'Brute force with tools like Hydra and Crowbar', 'Man-in-the-middle if NLA not enforced', 'DejaBlue (CVE-2019-1181/1182)'], status: 'unchecked' },
  { port: 5432, service: 'PostgreSQL', version: 'PostgreSQL 15.3', description: 'PostgreSQL advanced open-source relational database. Known for standards compliance and extensibility.', protocol: 'TCP', commonVulnerabilities: ['Weak pg_hba.conf allowing trust authentication', 'SQL injection through application layer', 'Default trust authentication on localhost', 'COPY TO/FROM for file system access'], status: 'unchecked' },
  { port: 5900, service: 'VNC', version: 'RealVNC 6.7', description: 'Virtual Network Computing provides graphical remote desktop access. Platform-independent alternative to RDP.', protocol: 'TCP', commonVulnerabilities: ['Weak or no authentication required', 'Unencrypted session data by default', 'Brute force with only 8-char password limit', 'Multiple CVEs in various VNC implementations'], status: 'unchecked' },
  { port: 6379, service: 'Redis', version: 'Redis 7.0.11', description: 'Redis in-memory data structure store used as database, cache, and message broker. Extremely fast key-value storage.', protocol: 'TCP', commonVulnerabilities: ['No authentication required by default', 'Remote code execution via EVAL Lua scripting', 'Arbitrary file write via CONFIG SET', 'Data exposure when bound to 0.0.0.0'], status: 'unchecked' },
  { port: 8080, service: 'HTTP-Alt', version: 'Apache Tomcat 9.0', description: 'Alternative HTTP port commonly used for web proxies, development servers, and application servers like Tomcat.', protocol: 'TCP', commonVulnerabilities: ['Tomcat manager with default credentials', 'Proxy misconfiguration for SSRF', 'Debug interfaces left enabled in production', 'Information exposure via server status pages'], status: 'unchecked' },
  { port: 8443, service: 'HTTPS-Alt', version: 'Apache Tomcat 9.0', description: 'Alternative HTTPS port commonly used for management interfaces, web application servers, and admin panels.', protocol: 'TCP', commonVulnerabilities: ['Admin panel exposed to the internet', 'Weak TLS configuration', 'Default credentials on management consoles', 'Self-signed certificates accepted without warning'], status: 'unchecked' },
  { port: 27017, service: 'MongoDB', version: 'MongoDB 6.0.6', description: 'MongoDB NoSQL document database. Stores data in flexible JSON-like documents instead of traditional rows and columns.', protocol: 'TCP', commonVulnerabilities: ['No authentication enabled by default (pre-4.0)', 'NoSQL injection attacks', 'Database exposed directly to internet', 'Ransomware targeting unsecured MongoDB instances'], status: 'unchecked' },
];

// ─── Learn Tab Content Data ──────────────────────────────────────────────────

interface LearnSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generatePortStatus(): PortStatus {
  const rand = Math.random();
  if (rand < 0.3) return 'open';
  if (rand < 0.85) return 'closed';
  return 'filtered';
}

const statusConfig: Record<PortStatus, { color: string; bg: string; label: string }> = {
  open: { color: 'text-green-500', bg: 'bg-green-500', label: 'Open' },
  closed: { color: 'text-red-500', bg: 'bg-red-500', label: 'Closed' },
  filtered: { color: 'text-yellow-500', bg: 'bg-yellow-500', label: 'Filtered' },
  unchecked: { color: 'text-gray-400', bg: 'bg-gray-400', label: 'Unchecked' },
  scanning: { color: 'text-blue-400', bg: 'bg-blue-400', label: 'Scanning...' },
};

// ─── Collapsible Section Component ───────────────────────────────────────────

const CollapsibleSection: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({
  title,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</span>
      </button>
      {open && (
        <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 bg-white dark:bg-gray-900/40">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Learn Tab Component ─────────────────────────────────────────────────────

const LearnTab: React.FC = () => {
  return (
    <div className="h-full overflow-auto space-y-3 pr-1">
      <CollapsibleSection title="What Is Port Scanning?" defaultOpen={true}>
        <p>
          Port scanning is a technique used to identify open ports and services available on a networked host.
          Every networked device communicates through <strong>ports</strong>, which are logical endpoints for
          TCP and UDP connections. There are 65,535 possible ports for each protocol.
        </p>
        <p>
          Think of an IP address as a building's street address and ports as individual apartment doors.
          Port scanning is like walking down the hallway and checking which doors are open, closed, or locked.
          Security professionals use port scanning to audit their own networks and discover unintended exposure,
          while attackers use it for reconnaissance to find exploitable services.
        </p>
        <p>
          The most popular port scanning tool is <strong>Nmap</strong> (Network Mapper), created by Gordon Lyon (Fyodor).
          It is an open-source utility used by security professionals worldwide for network discovery
          and security auditing.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Port Ranges and Categories">
        <div className="space-y-2">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Well-Known Ports (0 - 1023)</div>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Reserved for common system services and protocols. Assigned by IANA (Internet Assigned Numbers Authority).
              On Unix/Linux, binding to these ports requires root/superuser privileges. Examples include HTTP (80),
              HTTPS (443), SSH (22), DNS (53), and FTP (21).
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Registered Ports (1024 - 49151)</div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Used by software applications and services registered with IANA. Any user-level process can bind to these
              ports. Examples include MySQL (3306), PostgreSQL (5432), RDP (3389), MongoDB (27017),
              and Redis (6379).
            </p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="font-semibold text-purple-800 dark:text-purple-300 mb-1">Dynamic / Ephemeral Ports (49152 - 65535)</div>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              Temporarily assigned by the operating system for client-side connections. When your browser connects
              to a web server on port 443, your OS assigns a random ephemeral port (e.g., 52847) for the local end
              of the connection. These ports are never scanned intentionally as they are transient.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Common Ports and Their Services">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="text-left px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 font-semibold">Port</th>
                <th className="text-left px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 font-semibold">Service</th>
                <th className="text-left px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 font-semibold">Protocol</th>
                <th className="text-left px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {[
                { p: 21, s: 'FTP', pr: 'TCP', d: 'File transfer (cleartext). Use SFTP or SCP instead.' },
                { p: 22, s: 'SSH', pr: 'TCP', d: 'Encrypted remote login and secure file transfer (SCP/SFTP).' },
                { p: 23, s: 'Telnet', pr: 'TCP', d: 'Unencrypted remote login. Obsolete, replaced by SSH.' },
                { p: 25, s: 'SMTP', pr: 'TCP', d: 'Email sending and relay between mail servers.' },
                { p: 53, s: 'DNS', pr: 'TCP/UDP', d: 'Domain name resolution. UDP for queries, TCP for zone transfers.' },
                { p: 80, s: 'HTTP', pr: 'TCP', d: 'Unencrypted web traffic. Should redirect to HTTPS.' },
                { p: 110, s: 'POP3', pr: 'TCP', d: 'Email retrieval (downloads and deletes from server).' },
                { p: 143, s: 'IMAP', pr: 'TCP', d: 'Email retrieval with server-side sync and folder support.' },
                { p: 443, s: 'HTTPS', pr: 'TCP', d: 'TLS-encrypted web traffic. Standard for secure communication.' },
                { p: 445, s: 'SMB', pr: 'TCP', d: 'Windows file sharing. Major target (EternalBlue/WannaCry).' },
                { p: 3306, s: 'MySQL', pr: 'TCP', d: 'MySQL database connections. Never expose to the internet.' },
                { p: 3389, s: 'RDP', pr: 'TCP', d: 'Windows remote desktop access. High-value attack target.' },
                { p: 5432, s: 'PostgreSQL', pr: 'TCP', d: 'PostgreSQL database connections. Restrict via pg_hba.conf.' },
                { p: 6379, s: 'Redis', pr: 'TCP', d: 'In-memory data store. No auth by default - bind to localhost.' },
                { p: 27017, s: 'MongoDB', pr: 'TCP', d: 'NoSQL database. Many instances found exposed online.' },
              ].map(row => (
                <tr key={row.p} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-2 py-1.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">{row.p}</td>
                  <td className="px-2 py-1.5 font-semibold">{row.s}</td>
                  <td className="px-2 py-1.5 text-gray-500">{row.pr}</td>
                  <td className="px-2 py-1.5">{row.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Scan Types Explained">
        <div className="space-y-3">
          <div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-blue-500" /> TCP Connect Scan (-sT)
            </div>
            <p className="text-xs ml-5">
              Completes the full TCP three-way handshake (SYN, SYN-ACK, ACK) with each target port.
              The most reliable scan type but also the noisiest and easiest to detect in logs. Does not
              require elevated privileges since it uses the OS network API (connect() syscall).
            </p>
          </div>
          <div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-green-500" /> SYN / Half-Open Scan (-sS)
            </div>
            <p className="text-xs ml-5">
              Sends a SYN packet and analyzes the response without completing the handshake. If a SYN-ACK
              is received, the port is open and Nmap sends RST to tear down the connection. Called "half-open"
              because a full TCP connection is never established. Faster and stealthier than TCP Connect.
              Requires raw socket privileges (root/admin). This is Nmap's default scan type when run as root.
            </p>
          </div>
          <div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-yellow-500" /> UDP Scan (-sU)
            </div>
            <p className="text-xs ml-5">
              Sends UDP packets to target ports. Since UDP is connectionless, detection relies on ICMP
              "port unreachable" messages for closed ports and absence of response for open/filtered ports.
              Much slower than TCP scans because most OS rate-limit ICMP error messages.
              Critical for finding services like DNS (53), SNMP (161), and DHCP (67/68).
            </p>
          </div>
          <div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-orange-500" /> FIN Scan (-sF)
            </div>
            <p className="text-xs ml-5">
              Sends a TCP packet with only the FIN flag set. Per RFC 793, closed ports should respond with RST
              while open ports should silently drop the packet. Can bypass simple stateless packet-filtering firewalls
              that only block SYN packets. Does not work against Windows systems which send RST regardless of port state.
            </p>
          </div>
          <div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-red-500" /> XMAS Scan (-sX)
            </div>
            <p className="text-xs ml-5">
              Sends a TCP packet with FIN, PSH, and URG flags all set (the packet is "lit up like a Christmas tree").
              Works on the same RFC 793 principle as FIN scan. Closed ports respond with RST, open ports silently
              drop the packet. Useful for firewall evasion but unreliable against Windows and some network devices.
            </p>
          </div>
          <div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-gray-500" /> NULL Scan (-sN)
            </div>
            <p className="text-xs ml-5">
              Sends a TCP packet with no flags set at all. Similar to FIN and XMAS scans, it exploits RFC 793
              to differentiate open and closed ports. Closed ports send RST while open ports drop the packet.
              Stealthy against basic IDS/firewall but ineffective against Windows systems.
            </p>
          </div>
          <div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-purple-500" /> ACK Scan (-sA)
            </div>
            <p className="text-xs ml-5">
              Sends a TCP packet with only the ACK flag set. Does not determine if ports are open or closed;
              instead, it maps firewall rulesets by identifying which ports are filtered vs. unfiltered.
              Unfiltered ports respond with RST (whether open or closed), while filtered ports drop the packet
              or return ICMP unreachable. Useful for probing stateful vs. stateless firewalls.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Port States: Open, Closed, and Filtered">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/15 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-green-800 dark:text-green-300 mb-1">Open</div>
              <p className="text-xs text-green-700 dark:text-green-400">
                An application is actively accepting TCP connections or UDP datagrams on this port.
                This is what attackers are looking for during reconnaissance. Each open port represents a potential
                attack vector. Open ports respond to SYN with SYN-ACK (TCP) or may respond with application
                data (UDP).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/15 rounded-lg border border-red-200 dark:border-red-800">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-800 dark:text-red-300 mb-1">Closed</div>
              <p className="text-xs text-red-700 dark:text-red-400">
                The port is accessible (receives and responds to probe packets) but no application is listening
                on it. The host responds with RST (TCP) or ICMP port unreachable (UDP). While not immediately
                exploitable, closed ports confirm the host is alive and reachable. They could become open later
                if a service is started.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/15 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Filter className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Filtered</div>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                A firewall, packet filter, or other network device is blocking probes so Nmap cannot determine
                whether the port is open. No response is received, or an ICMP unreachable error is returned.
                This is the most secure state from a defender's perspective, as it prevents reconnaissance.
                Probes may be silently dropped (making scans very slow) or rejected with ICMP admin-prohibited.
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Nmap Basics and Common Commands">
        <p className="mb-2">
          Nmap (Network Mapper) is the industry-standard tool for port scanning and network discovery.
          Below are common commands used by security professionals during authorized assessments.
        </p>
        <div className="space-y-2 font-mono text-xs">
          {[
            { cmd: 'nmap 192.168.1.1', desc: 'Basic scan of top 1000 ports on a single host' },
            { cmd: 'nmap -sS 192.168.1.0/24', desc: 'SYN scan of an entire /24 subnet (256 hosts)' },
            { cmd: 'nmap -sV -p 80,443 target.com', desc: 'Version detection on specific ports' },
            { cmd: 'nmap -sU -p 53,161 192.168.1.1', desc: 'UDP scan on DNS and SNMP ports' },
            { cmd: 'nmap -A target.com', desc: 'Aggressive scan: OS detection, version, scripts, traceroute' },
            { cmd: 'nmap -sS -sV -O -p- target.com', desc: 'Full port range SYN scan with OS and version detection' },
            { cmd: 'nmap --script vuln target.com', desc: 'Run vulnerability detection NSE scripts' },
            { cmd: 'nmap -sn 192.168.1.0/24', desc: 'Ping sweep to discover live hosts (no port scan)' },
            { cmd: 'nmap -T4 -F target.com', desc: 'Fast scan with aggressive timing (top 100 ports)' },
            { cmd: 'nmap -oN output.txt target.com', desc: 'Save results to a normal text file' },
          ].map((item, i) => (
            <div key={i} className="p-2 bg-gray-900 dark:bg-gray-950 rounded border border-gray-700">
              <div className="text-green-400 mb-0.5">$ {item.cmd}</div>
              <div className="text-gray-400 text-[11px]">{item.desc}</div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Why Open Ports Are Security Risks">
        <p>
          Every open port is a potential entry point for attackers. The concept of <strong>attack surface</strong> refers
          to the total number of points where an attacker can try to enter or extract data from a system.
          Open ports directly increase this surface.
        </p>
        <div className="mt-2 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs"><strong>Service Exploitation:</strong> Each open port runs a service. Unpatched services contain known vulnerabilities (CVEs) that attackers can exploit for remote code execution, privilege escalation, or data theft.</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs"><strong>Information Disclosure:</strong> Service banners reveal software names and version numbers. Attackers use this information to search for specific exploits (e.g., "Apache 2.4.49 path traversal CVE-2021-41773").</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs"><strong>Lateral Movement:</strong> Once inside a network, attackers scan for internal services (databases, admin panels, file shares) to move deeper into the infrastructure.</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs"><strong>Default Credentials:</strong> Many services ship with default usernames and passwords. Databases (MongoDB, Redis) historically had no authentication by default, leading to mass data breaches.</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs"><strong>Worm Propagation:</strong> Network worms like WannaCry (SMB/445), Blaster (MSRPC/135), and Code Red (HTTP/80) spread automatically through open ports without user interaction.</p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Defense: Securing Your Ports">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs mb-0.5">Principle of Least Exposure</div>
              <p className="text-xs">Close all unnecessary ports and disable unused services. Every service running is a potential vulnerability. Regularly audit with <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[11px]">netstat -tlnp</code> or <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[11px]">ss -tlnp</code> to check what is listening.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs mb-0.5">Firewall Rules (iptables / nftables / Windows Firewall)</div>
              <p className="text-xs">Implement strict ingress and egress filtering. Use a default-deny policy: block all inbound traffic and explicitly allow only required ports. Example: <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[11px]">iptables -P INPUT DROP</code> then allow specific ports.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs mb-0.5">Port Knocking</div>
              <p className="text-xs">A stealth technique where ports remain closed until a specific sequence of connection attempts (knocks) is made. For example, connecting to ports 7000, 8000, 9000 in sequence could open SSH port 22 for 30 seconds. Adds a layer of obscurity on top of security.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs mb-0.5">Network Segmentation</div>
              <p className="text-xs">Isolate critical services (databases, internal tools) on separate network segments/VLANs. Database ports (3306, 5432, 27017) should never be accessible from the internet. Use VPN or bastion hosts for remote access.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs mb-0.5">Regular Patch Management</div>
              <p className="text-xs">Keep all services updated. Most exploits target known CVEs with available patches. Subscribe to vendor security advisories and automate updates where possible. Use vulnerability scanners like OpenVAS or Nessus regularly.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs mb-0.5">Intrusion Detection / Prevention Systems (IDS/IPS)</div>
              <p className="text-xs">Deploy tools like Snort, Suricata, or OSSEC to detect and block port scanning attempts and exploitation. Configure alerts for unusual port activity or connection patterns.</p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Legal and Ethical Considerations">
        <div className="space-y-2">
          <div className="p-3 bg-red-50 dark:bg-red-900/15 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="font-semibold text-red-800 dark:text-red-300 text-xs">Critical Warning</span>
            </div>
            <p className="text-xs text-red-700 dark:text-red-400">
              Port scanning systems you do not own or have explicit written authorization to test is <strong>illegal</strong> in
              most jurisdictions. In the United States, it can violate the Computer Fraud and Abuse Act (CFAA).
              In the UK, it falls under the Computer Misuse Act 1990. Many other countries have similar laws.
            </p>
          </div>
          <div className="text-xs space-y-1.5">
            <p>
              <strong>Always obtain written permission</strong> before scanning any network or system. This applies even
              within organizations - scanning production networks without authorization can trigger security alerts,
              disrupt services, and result in disciplinary action.
            </p>
            <p>
              <strong>Rules of Engagement (RoE)</strong> should define the scope, timing, and methods of any assessment.
              Professional penetration testers always operate under a signed Statement of Work (SoW) that clearly
              defines what is in scope and what liabilities exist.
            </p>
            <p>
              <strong>Practice legally</strong> using intentionally vulnerable environments like Hack The Box, TryHackMe,
              DVWA (Damn Vulnerable Web Application), Metasploitable, or your own home lab. These provide safe and
              legal environments to develop your skills.
            </p>
            <p>
              <strong>Bug Bounty Programs</strong> offered by companies like Google, Microsoft, and HackerOne provide legal
              authorization to test specific assets with defined rules. Always read the program policy carefully before
              testing.
            </p>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};

// ─── Sandbox Tab Component ───────────────────────────────────────────────────

const SandboxTab: React.FC = () => {
  const [scanType, setScanType] = useState<ScanType>('quick');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [ports, setPorts] = useState<PortInfo[]>(COMMON_PORTS.map(p => ({ ...p })));
  const [selectedPort, setSelectedPort] = useState<PortInfo | null>(null);
  const [currentScanPort, setCurrentScanPort] = useState<number | null>(null);
  const [customStart, setCustomStart] = useState('1');
  const [customEnd, setCustomEnd] = useState('100');
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const scanRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scanLog]);

  const resetScan = useCallback(() => {
    scanRef.current.cancelled = true;
    setPorts(COMMON_PORTS.map(p => ({ ...p, status: 'unchecked' as PortStatus })));
    setScanState('idle');
    setCurrentScanPort(null);
    setSelectedPort(null);
    setScanLog([]);
    setScanProgress(0);
  }, []);

  const startScan = useCallback(async () => {
    scanRef.current = { cancelled: false };
    setScanState('scanning');
    setScanLog([]);
    setSelectedPort(null);
    setScanProgress(0);

    let portsToScan: number[] = [];

    if (scanType === 'quick') {
      portsToScan = COMMON_PORTS.map(p => p.port);
    } else if (scanType === 'full') {
      for (let i = 1; i <= 1024; i++) portsToScan.push(i);
    } else {
      const start = Math.max(1, parseInt(customStart) || 1);
      const end = Math.min(65535, parseInt(customEnd) || 100);
      for (let i = start; i <= end; i++) portsToScan.push(i);
    }

    const totalPorts = portsToScan.length;
    const targetIP = '192.168.1.100';

    setScanLog(prev => [
      ...prev,
      `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toLocaleString()}`,
      `Nmap scan report for ${targetIP}`,
      `Host is up (0.0032s latency).`,
      `Scanning ${totalPorts} port${totalPorts > 1 ? 's' : ''}...`,
      '',
      'PORT      STATE    SERVICE         VERSION',
    ]);

    const newPorts = COMMON_PORTS.map(p => ({ ...p, status: 'unchecked' as PortStatus }));

    for (let i = 0; i < portsToScan.length; i++) {
      if (scanRef.current.cancelled) {
        setScanLog(prev => [...prev, '', 'Scan cancelled by user.']);
        setScanState('idle');
        setScanProgress(0);
        return;
      }

      const portNum = portsToScan[i];
      setCurrentScanPort(portNum);
      setScanProgress(Math.round(((i + 1) / totalPorts) * 100));

      const knownIdx = newPorts.findIndex(p => p.port === portNum);

      if (knownIdx !== -1) {
        newPorts[knownIdx] = { ...newPorts[knownIdx], status: 'scanning' };
        setPorts([...newPorts]);
      }

      const delay = scanType === 'quick' ? 140 : scanType === 'full' ? 6 : 30;
      await new Promise(r => setTimeout(r, delay));

      if (scanRef.current.cancelled) {
        setScanLog(prev => [...prev, '', 'Scan cancelled by user.']);
        setScanState('idle');
        setScanProgress(0);
        return;
      }

      const status = generatePortStatus();

      if (knownIdx !== -1) {
        newPorts[knownIdx] = { ...newPorts[knownIdx], status };
        setPorts([...newPorts]);
      }

      if (status === 'open') {
        const known = newPorts.find(p => p.port === portNum);
        const svcName = known ? known.service : 'unknown';
        const version = known ? known.version : '';
        const portStr = `${portNum}/tcp`.padEnd(10);
        const stateStr = 'open'.padEnd(9);
        const svcStr = svcName.padEnd(16);
        setScanLog(prev => [...prev, `${portStr}${stateStr}${svcStr}${version}`]);
      } else if (status === 'filtered') {
        const known = newPorts.find(p => p.port === portNum);
        const svcName = known ? known.service : 'unknown';
        const portStr = `${portNum}/tcp`.padEnd(10);
        const stateStr = 'filtered'.padEnd(9);
        setScanLog(prev => [...prev, `${portStr}${stateStr}${svcName}`]);
      }
    }

    setCurrentScanPort(null);
    setScanProgress(100);
    const openCount = newPorts.filter(p => p.status === 'open').length;
    const closedCount = newPorts.filter(p => p.status === 'closed').length;
    const filteredCount = newPorts.filter(p => p.status === 'filtered').length;

    setScanLog(prev => [
      ...prev,
      '',
      `Nmap done: 1 IP address (1 host up) scanned in ${(totalPorts * 0.02).toFixed(2)}s`,
      `${openCount} open, ${closedCount} closed, ${filteredCount} filtered`,
      `Service detection performed. Results saved to scan_results.xml`,
    ]);

    setScanState('complete');
  }, [scanType, customStart, customEnd]);

  const openPorts = ports.filter(p => p.status === 'open');
  const closedPorts = ports.filter(p => p.status === 'closed');
  const filteredPorts = ports.filter(p => p.status === 'filtered');

  const inputClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        {/* Target IP */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Terminal className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-500">Target:</span>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">192.168.1.100</span>
          <span className="text-[10px] text-gray-400">(simulated)</span>
        </div>

        {/* Scan Mode Selector */}
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
          {(['quick', 'full', 'custom'] as const).map(t => (
            <button
              key={t}
              onClick={() => { if (scanState === 'idle') setScanType(t); }}
              disabled={scanState === 'scanning'}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                scanType === t
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              } disabled:opacity-50`}
            >
              {t === 'quick' ? 'Quick (25 ports)' : t === 'full' ? 'Full (1-1024)' : 'Custom Range'}
            </button>
          ))}
        </div>

        {/* Custom Range Inputs */}
        {scanType === 'custom' && (
          <div className="flex items-center gap-1.5">
            <input
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              placeholder="Start"
              className={`w-20 ${inputClass} text-center text-xs`}
              disabled={scanState === 'scanning'}
            />
            <span className="text-xs text-gray-500">to</span>
            <input
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              placeholder="End"
              className={`w-20 ${inputClass} text-center text-xs`}
              disabled={scanState === 'scanning'}
            />
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={scanState === 'scanning' ? () => { scanRef.current.cancelled = true; } : scanState === 'idle' ? startScan : resetScan}
          className={`px-4 py-1.5 text-xs rounded-lg font-semibold transition-all shadow-sm ${
            scanState === 'scanning'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : scanState === 'complete'
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {scanState === 'scanning' ? 'Stop Scan' : scanState === 'complete' ? 'Reset' : 'Start Scan'}
        </button>

        {/* Scanning Indicator */}
        {scanState === 'scanning' && currentScanPort !== null && (
          <span className="text-xs text-blue-500 dark:text-blue-400 animate-pulse flex items-center gap-1.5">
            <Search className="w-3 h-3" />
            Scanning port {currentScanPort}...
          </span>
        )}
      </div>

      {/* Scan Progress Bar */}
      {scanState === 'scanning' && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Scan Progress</span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">{scanProgress}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {scanState !== 'idle' && (
        <div className="flex items-center gap-4 mb-3 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Results:</div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Open: <strong className="text-green-600 dark:text-green-400">{openPorts.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Closed: <strong className="text-red-600 dark:text-red-400">{closedPorts.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Filtered: <strong className="text-yellow-600 dark:text-yellow-400">{filteredPorts.length}</strong></span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        {/* Left: Port Grid */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            Port Grid - Target 192.168.1.100
          </div>

          <div className="flex-1 overflow-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
              {ports.map(p => {
                const config = statusConfig[p.status];
                const isActive = currentScanPort === p.port;
                const isSelected = selectedPort?.port === p.port;
                return (
                  <button
                    key={p.port}
                    onClick={() => setSelectedPort(p)}
                    className={`relative p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                    } ${isActive ? 'animate-pulse bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-900'}`}
                  >
                    <div className={`text-xs font-bold ${config.color}`}>{p.port}</div>
                    <div className="text-[9px] text-gray-500 dark:text-gray-400 truncate">{p.service}</div>
                    <div
                      className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${config.bg} ${
                        p.status === 'scanning' ? 'animate-ping' : ''
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Details + Log */}
        <div className="w-80 flex flex-col gap-3 overflow-hidden flex-shrink-0">
          {/* Port Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex-shrink-0 max-h-[45%] overflow-auto">
            <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              Port Details
            </div>
            {selectedPort ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-black text-gray-800 dark:text-gray-200">Port {selectedPort.port}</div>
                    <div className="text-xs text-gray-500">{selectedPort.protocol}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      selectedPort.status === 'open'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : selectedPort.status === 'closed'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : selectedPort.status === 'filtered'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {statusConfig[selectedPort.status].label}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Service</div>
                  <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{selectedPort.service}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Detected Version</div>
                  <div className="text-xs font-mono text-blue-700 dark:text-blue-400">{selectedPort.version}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Description</div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{selectedPort.description}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Known Vulnerabilities</div>
                  <ul className="space-y-0.5">
                    {selectedPort.commonVulnerabilities.map((v, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-red-700 dark:text-red-400">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-6">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                Click any port in the grid to view its details, service information, and known vulnerabilities
              </div>
            )}
          </div>

          {/* Scan Log Terminal */}
          <div className="flex-1 min-h-0 bg-gray-950 rounded-xl border border-gray-800 overflow-hidden flex flex-col">
            <div className="px-3 py-1.5 border-b border-gray-800 bg-gray-900 flex items-center gap-2 flex-shrink-0">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <span className="text-[10px] text-gray-500 font-mono">nmap_scan_output.log</span>
            </div>
            <div className="flex-1 overflow-auto p-2 font-mono text-[11px] leading-relaxed">
              {scanLog.length === 0 ? (
                <div className="text-gray-600">
                  <div className="text-green-500">root@kali:~# nmap --help</div>
                  <div className="text-gray-400 mt-1">Nmap 7.94 ( https://nmap.org )</div>
                  <div className="text-gray-500 mt-1">Usage: nmap [Scan Type] [Options] {'<target>'}</div>
                  <div className="text-gray-500 mt-2">Select a scan mode above and click "Start Scan"</div>
                  <div className="text-gray-600 mt-1">  Quick:  Scans 25 common service ports</div>
                  <div className="text-gray-600">  Full:   Scans all ports 1-1024</div>
                  <div className="text-gray-600">  Custom: Specify your own port range</div>
                  <div className="text-gray-500 mt-2">All scans are simulated for educational purposes.</div>
                </div>
              ) : (
                scanLog.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.includes('open') && !line.startsWith('Nmap') && !line.includes('Results')
                        ? 'text-green-400'
                        : line.includes('filtered') && !line.startsWith('Nmap') && !line.includes('Results')
                          ? 'text-yellow-400'
                          : line.startsWith('Nmap') || line.startsWith('Service')
                            ? 'text-blue-400'
                            : line.includes('cancelled')
                              ? 'text-red-400'
                              : line.startsWith('PORT') || line.startsWith('Host')
                                ? 'text-white'
                                : line.includes('Scanning')
                                  ? 'text-cyan-400'
                                  : 'text-gray-500'
                    }
                  >
                    {line || '\u00A0'}
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const PortScannerVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('learn');

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-950 dark:to-emerald-950 p-3 overflow-hidden">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Port Scanner Visualizer</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Explore how port scanning works and practice with a simulated network target
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
          {([
            { id: 'learn' as TabId, label: 'Learn' },
            { id: 'sandbox' as TabId, label: 'Sandbox' },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'learn' ? <LearnTab /> : <SandboxTab />}
      </div>
    </div>
  );
};
