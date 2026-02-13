import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Download, Copy, Link, Mail, Phone, Wifi, MapPin, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

type QRType = 'text' | 'url' | 'email' | 'phone' | 'wifi' | 'sms' | 'location';
type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

const EC_DESCRIPTIONS = {
  L: 'Low - 7% recovery',
  M: 'Medium - 15% recovery',
  Q: 'Quartile - 25% recovery',
  H: 'High - 30% recovery'
};

const EC_DETAILS = {
  L: { recovery: '7%', use: 'Clean environments, printed materials' },
  M: { recovery: '15%', use: 'General purpose, standard use' },
  Q: { recovery: '25%', use: 'Industrial, outdoor applications' },
  H: { recovery: '30%', use: 'Critical data, damaged surfaces' }
};

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
  
  const [qrSize, setQrSize] = useState(300);
  const [margin, setMargin] = useState(4);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('M');
  const [copied, setCopied] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getQRData = (): string => {
    switch (qrType) {
      case 'url':
        return url;
      case 'email':
        let emailData = `mailto:${email}`;
        if (emailSubject || emailBody) {
          emailData += '?';
          if (emailSubject) emailData += `subject=${encodeURIComponent(emailSubject)}`;
          if (emailSubject && emailBody) emailData += '&';
          if (emailBody) emailData += `body=${encodeURIComponent(emailBody)}`;
        }
        return emailData;
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
      
      try {
        const data = getQRData();
        await QRCode.toCanvas(canvasRef.current, data, {
          width: qrSize,
          margin: margin,
          color: {
            dark: fgColor,
            light: bgColor
          },
          errorCorrectionLevel: errorCorrection
        });
      } catch (err) {
        console.error('QR Code generation error:', err);
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
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const renderTypeIcon = () => {
    switch (qrType) {
      case 'url': return <Link className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'wifi': return <Wifi className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'location': return <MapPin className="h-4 w-4" />;
      default: return <QrCode className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <QrCode className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">QR Code Generator</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Left Panel - QR Type & Content */}
          <Card className="p-6 space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">QR Code Type</Label>
              <Tabs value={qrType} onValueChange={(v) => setQrType(v as QRType)} className="w-full">
                <TabsList className="grid grid-cols-4 gap-1 h-auto p-1">
                  <TabsTrigger value="text" className="text-xs">Text</TabsTrigger>
                  <TabsTrigger value="url" className="text-xs">URL</TabsTrigger>
                  <TabsTrigger value="email" className="text-xs">Email</TabsTrigger>
                  <TabsTrigger value="phone" className="text-xs">Phone</TabsTrigger>
                </TabsList>
                <TabsList className="grid grid-cols-3 gap-1 h-auto p-1 mt-1">
                  <TabsTrigger value="sms" className="text-xs">SMS</TabsTrigger>
                  <TabsTrigger value="wifi" className="text-xs">WiFi</TabsTrigger>
                  <TabsTrigger value="location" className="text-xs">Location</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="text">Text Content</Label>
                    <Input
                      id="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Enter text..."
                      className="mt-2"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="url" className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="url">Website URL</Label>
                    <Input
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="mt-2"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="email" className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject (Optional)</Label>
                    <Input
                      id="subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="body">Message (Optional)</Label>
                    <Input
                      id="body"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Email body"
                      className="mt-2"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="phone" className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1234567890"
                      className="mt-2"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="sms" className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="smsNumber">Phone Number</Label>
                    <Input
                      id="smsNumber"
                      value={smsNumber}
                      onChange={(e) => setSmsNumber(e.target.value)}
                      placeholder="+1234567890"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smsMessage">Message (Optional)</Label>
                    <Input
                      id="smsMessage"
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      placeholder="SMS message"
                      className="mt-2"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="wifi" className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="ssid">Network Name (SSID)</Label>
                    <Input
                      id="ssid"
                      value={wifiSSID}
                      onChange={(e) => setWifiSSID(e.target.value)}
                      placeholder="MyNetwork"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="password123"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="encryption">Encryption</Label>
                    <Select value={wifiEncryption} onValueChange={setWifiEncryption}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WPA">WPA/WPA2</SelectItem>
                        <SelectItem value="WEP">WEP</SelectItem>
                        <SelectItem value="nopass">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hidden">Hidden Network</Label>
                    <Switch
                      id="hidden"
                      checked={wifiHidden}
                      onCheckedChange={setWifiHidden}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="location" className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="40.7128"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="-74.0060"
                      className="mt-2"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>

          {/* Center Panel - QR Code Display */}
          <Card className="p-6 flex flex-col items-center justify-center">
            <div className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
              <canvas
                ref={canvasRef}
                className="rounded"
              />
            </div>
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {renderTypeIcon()}
                <span className="capitalize">{qrType} QR Code</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Scan with your phone camera
              </div>
            </div>
          </Card>

          {/* Right Panel - Customization */}
          <Card className="p-6 space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">Customization</Label>
              
              <div className="space-y-4">
                <div>
                  <Label>Size: {qrSize}px</Label>
                  <Slider
                    value={[qrSize]}
                    onValueChange={(value) => setQrSize(value[0])}
                    min={200}
                    max={500}
                    step={50}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Margin: {margin}</Label>
                  <Slider
                    value={[margin]}
                    onValueChange={(value) => setMargin(value[0])}
                    min={0}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Error Correction</Label>
                  <Select value={errorCorrection} onValueChange={(v) => setErrorCorrection(v as ErrorCorrectionLevel)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[999999]">
                      <SelectItem value="L">{EC_DESCRIPTIONS.L}</SelectItem>
                      <SelectItem value="M">{EC_DESCRIPTIONS.M}</SelectItem>
                      <SelectItem value="Q">{EC_DESCRIPTIONS.Q}</SelectItem>
                      <SelectItem value="H">{EC_DESCRIPTIONS.H}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">
                    {EC_DETAILS[errorCorrection].use}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Colors</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="fg" className="text-xs">Foreground</Label>
                      <div className="flex gap-2 mt-1">
                        <input
                          id="fg"
                          type="color"
                          value={fgColor}
                          onChange={(e) => setFgColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border"
                        />
                        <Input
                          value={fgColor}
                          onChange={(e) => setFgColor(e.target.value)}
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bg" className="text-xs">Background</Label>
                      <div className="flex gap-2 mt-1">
                        <input
                          id="bg"
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border"
                        />
                        <Input
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-sm font-semibold mb-2 block">Error Correction Levels</Label>
              <div className="space-y-2">
                {Object.entries(EC_DETAILS).map(([level, details]) => (
                  <div
                    key={level}
                    className={`text-xs p-2 rounded transition-colors ${
                      errorCorrection === level
                        ? 'bg-purple-100 dark:bg-purple-900 border border-purple-300 dark:border-purple-700'
                        : 'bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold">{level} - {details.recovery}</div>
                    <div className="text-slate-600 dark:text-slate-400">{details.use}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
