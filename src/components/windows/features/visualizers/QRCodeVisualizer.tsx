import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Switch } from '@/components/ui/switch';
import {
  QrCode, Download, Copy, Link, Mail, Phone, Wifi, MapPin, Check,
  MessageSquare, Type, Settings2, Palette, AlertCircle
} from 'lucide-react';

type QRType = 'text' | 'url' | 'email' | 'phone' | 'wifi' | 'sms' | 'location';
type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

const QR_TYPES: { key: QRType; label: string; icon: React.ReactNode }[] = [
  { key: 'text', label: 'Text', icon: <Type className="h-3 w-3" /> },
  { key: 'url', label: 'URL', icon: <Link className="h-3 w-3" /> },
  { key: 'email', label: 'Email', icon: <Mail className="h-3 w-3" /> },
  { key: 'phone', label: 'Phone', icon: <Phone className="h-3 w-3" /> },
  { key: 'sms', label: 'SMS', icon: <MessageSquare className="h-3 w-3" /> },
  { key: 'wifi', label: 'WiFi', icon: <Wifi className="h-3 w-3" /> },
  { key: 'location', label: 'Location', icon: <MapPin className="h-3 w-3" /> },
];

const EC_LEVELS: { level: ErrorCorrectionLevel; label: string; recovery: string }[] = [
  { level: 'L', label: 'Low', recovery: '7%' },
  { level: 'M', label: 'Medium', recovery: '15%' },
  { level: 'Q', label: 'Quartile', recovery: '25%' },
  { level: 'H', label: 'High', recovery: '30%' },
];

export const QRCodeVisualizer: React.FC = () => {
  const [qrType, setQrType] = useState<QRType>('text');
  const [text, setText] = useState('Hello, World!');
  const [url, setUrl] = useState('https://example.com');
  const [email, setEmail] = useState('example@email.com');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [phone, setPhone] = useState('+1234567890');
  const [smsNumber, setSmsNumber] = useState('+1234567890');
  const [smsMessage, setSmsMessage] = useState('');
  const [wifiSSID, setWifiSSID] = useState('MyNetwork');
  const [wifiPassword, setWifiPassword] = useState('password123');
  const [wifiEncryption, setWifiEncryption] = useState('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);
  const [latitude, setLatitude] = useState('40.7128');
  const [longitude, setLongitude] = useState('-74.0060');

  const [qrSize, setQrSize] = useState(256);
  const [margin, setMargin] = useState(4);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('M');
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getQRData = (): string => {
    switch (qrType) {
      case 'url':
        return url;
      case 'email': {
        let data = `mailto:${email}`;
        if (emailSubject || emailBody) {
          data += '?';
          if (emailSubject) data += `subject=${encodeURIComponent(emailSubject)}`;
          if (emailSubject && emailBody) data += '&';
          if (emailBody) data += `body=${encodeURIComponent(emailBody)}`;
        }
        return data;
      }
      case 'phone':
        return `tel:${phone}`;
      case 'sms':
        return `sms:${smsNumber}${smsMessage ? `?body=${encodeURIComponent(smsMessage)}` : ''}`;
      case 'wifi':
        return `WIFI:T:${wifiEncryption};S:${wifiSSID};P:${wifiPassword};H:${wifiHidden};`;
      case 'location':
        return `geo:${latitude},${longitude}`;
      default:
        return text;
    }
  };

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current) return;

      const data = getQRData();

      // Guard against empty data
      if (!data || data.trim().length === 0) {
        setQrError('Enter some content to generate a QR code');
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = qrSize;
          canvasRef.current.height = qrSize;
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, qrSize, qrSize);
        }
        return;
      }

      try {
        await QRCode.toCanvas(canvasRef.current, data, {
          width: qrSize,
          margin,
          color: { dark: fgColor, light: bgColor },
          errorCorrectionLevel: errorCorrection,
        });
        setQrError(null);
      } catch (err) {
        console.error('QR Code generation error:', err);
        setQrError(
          err instanceof Error
            ? `Generation failed: ${err.message}`
            : 'Failed to generate QR code. Try different content.'
        );
        // Clear the canvas to avoid showing stale QR
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = qrSize;
          canvasRef.current.height = qrSize;
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, qrSize, qrSize);
        }
      }
    };
    generateQR();
  }, [qrType, text, url, email, emailSubject, emailBody, phone, smsNumber, smsMessage,
    wifiSSID, wifiPassword, wifiEncryption, wifiHidden, latitude, longitude,
    qrSize, margin, fgColor, bgColor, errorCorrection]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qrcode-${qrType}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const renderInputFields = () => {
    switch (qrType) {
      case 'text':
        return (
          <FieldGroup>
            <FieldRow label="Content">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter any text..." className="h-8 text-xs" />
            </FieldRow>
          </FieldGroup>
        );
      case 'url':
        return (
          <FieldGroup>
            <FieldRow label="Website URL">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="h-8 text-xs" />
            </FieldRow>
          </FieldGroup>
        );
      case 'email':
        return (
          <FieldGroup>
            <FieldRow label="Email address">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" type="email" className="h-8 text-xs" />
            </FieldRow>
            <FieldRow label="Subject" optional>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Subject line" className="h-8 text-xs" />
            </FieldRow>
            <FieldRow label="Body" optional>
              <Input value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Message body" className="h-8 text-xs" />
            </FieldRow>
          </FieldGroup>
        );
      case 'phone':
        return (
          <FieldGroup>
            <FieldRow label="Phone number">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" className="h-8 text-xs" />
            </FieldRow>
          </FieldGroup>
        );
      case 'sms':
        return (
          <FieldGroup>
            <FieldRow label="Phone number">
              <Input value={smsNumber} onChange={(e) => setSmsNumber(e.target.value)} placeholder="+1234567890" className="h-8 text-xs" />
            </FieldRow>
            <FieldRow label="Message" optional>
              <Input value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} placeholder="Your message" className="h-8 text-xs" />
            </FieldRow>
          </FieldGroup>
        );
      case 'wifi':
        return (
          <FieldGroup>
            <FieldRow label="Network name (SSID)">
              <Input value={wifiSSID} onChange={(e) => setWifiSSID(e.target.value)} placeholder="MyNetwork" className="h-8 text-xs" />
            </FieldRow>
            <FieldRow label="Password">
              <Input value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} placeholder="Password" type="password" className="h-8 text-xs" />
            </FieldRow>
            <FieldRow label="Encryption">
              <Select value={wifiEncryption} onValueChange={setWifiEncryption}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA/WPA2</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">None (Open)</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs text-slate-600 dark:text-slate-400">Hidden network</Label>
              <Switch checked={wifiHidden} onCheckedChange={setWifiHidden} />
            </div>
          </FieldGroup>
        );
      case 'location':
        return (
          <FieldGroup>
            <div className="grid grid-cols-2 gap-2">
              <FieldRow label="Latitude">
                <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="40.7128" className="h-8 text-xs" />
              </FieldRow>
              <FieldRow label="Longitude">
                <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="-74.0060" className="h-8 text-xs" />
              </FieldRow>
            </div>
          </FieldGroup>
        );
      default:
        return null;
    }
  };

  const activeTypeInfo = QR_TYPES.find(t => t.key === qrType)!;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      {/* Action Bar */}
      <div className="flex items-center justify-end px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={!!qrError} className="h-7 px-2.5 text-xs gap-1.5">
            {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={!!qrError} className="h-7 px-2.5 text-xs gap-1.5">
            <Download className="h-3 w-3" />
            Download
          </Button>
        </div>
      </div>

      {/* Body - 3 column grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Left Panel - Type & Content */}
          <div className="space-y-4 overflow-y-auto">
            <Card className="p-4 border-slate-200 dark:border-slate-700">
              <Section title="QR Code Type" icon={<QrCode className="h-3 w-3" />}>
                <div className="grid grid-cols-4 gap-1">
                  {QR_TYPES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setQrType(t.key)}
                      className={`flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-md text-[10px] font-medium transition-colors ${
                        qrType === t.key
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-700'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </Section>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-700">
              <Section title="Content" icon={activeTypeInfo.icon}>
                {renderInputFields()}
              </Section>
            </Card>
          </div>

          {/* Center Panel - QR Preview */}
          <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <canvas ref={canvasRef} className="rounded-md block" />
            </div>

            {qrError && (
              <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                <span className="text-[10px] text-red-600 dark:text-red-400">{qrError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 mt-4 text-[10px] text-slate-400 dark:text-slate-500">
              <div className="flex items-center gap-1">
                {activeTypeInfo.icon}
                <span className="capitalize font-medium">{qrType}</span>
              </div>
              <span>|</span>
              <span>{qrSize}x{qrSize}px</span>
              <span>|</span>
              <span>EC: {errorCorrection} ({EC_LEVELS.find(e => e.level === errorCorrection)?.recovery})</span>
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
              Scan with any camera app
            </p>
          </div>

          {/* Right Panel - Customization */}
          <div className="space-y-4 overflow-y-auto">
            <Card className="p-4 border-slate-200 dark:border-slate-700">
              <Section title="Appearance" icon={<Palette className="h-3 w-3" />}>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs text-slate-600 dark:text-slate-400">Size</Label>
                      <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">{qrSize}px</span>
                    </div>
                    <Slider value={[qrSize]} onValueChange={(v) => setQrSize(v[0])} min={128} max={512} step={16} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs text-slate-600 dark:text-slate-400">Margin</Label>
                      <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">{margin}</span>
                    </div>
                    <Slider value={[margin]} onValueChange={(v) => setMargin(v[0])} min={0} max={16} step={1} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block">Colors</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <ColorPicker label="Foreground" value={fgColor} onChange={setFgColor} />
                      <ColorPicker label="Background" value={bgColor} onChange={setBgColor} />
                    </div>
                  </div>
                </div>
              </Section>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-700">
              <Section title="Error Correction" icon={<Settings2 className="h-3 w-3" />}>
                <div className="grid grid-cols-4 gap-1">
                  {EC_LEVELS.map(ec => (
                    <button
                      key={ec.level}
                      onClick={() => setErrorCorrection(ec.level)}
                      className={`flex flex-col items-center py-1.5 rounded-md text-center transition-colors ${
                        errorCorrection === ec.level
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-700'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-xs font-bold">{ec.level}</span>
                      <span className="text-[9px]">{ec.recovery}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                  Higher levels improve scan reliability when damaged
                </p>
              </Section>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Helper Components ──────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div>
    <div className="flex items-center gap-1.5 mb-2">
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
    </div>
    {children}
  </div>
);

const FieldGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="space-y-2">{children}</div>
);

const FieldRow: React.FC<{ label: string; optional?: boolean; children: React.ReactNode }> = ({ label, optional, children }) => (
  <div>
    <Label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
      {label}
      {optional && <span className="text-slate-400 dark:text-slate-500 ml-1 text-[10px]">(optional)</span>}
    </Label>
    {children}
  </div>
);

const ColorPicker: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <Label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">{label}</Label>
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded cursor-pointer border border-slate-300 dark:border-slate-600"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 text-[10px] font-mono flex-1"
      />
    </div>
  </div>
);
