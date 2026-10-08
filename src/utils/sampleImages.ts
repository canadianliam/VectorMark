/**
 * Generates lightweight, clean sample canvas images for instant testing
 * when users do not have a file handy.
 */

export interface SampleImageOption {
  id: string;
  title: string;
  subtitle: string;
  width: number;
  height: number;
  generateDataUrl: () => string;
}

export const SAMPLE_IMAGES: SampleImageOption[] = [
  {
    id: 'dashboard',
    title: 'Cloud Analytics Dashboard',
    subtitle: '1200 × 750 px · UI screenshot',
    width: 1200,
    height: 750,
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 750;
      const ctx = canvas.getContext('2d')!;

      // Background
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, 1200, 750);

      // Top bar
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, 1200, 64);
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('AuraCloud Studio', 32, 40);

      // Stat cards
      const cards = [
        { label: 'Active Deployments', val: '1,428', change: '+12.4%', color: '#10B981' },
        { label: 'API Throughput', val: '89.2k req/s', change: '+4.1%', color: '#6366F1' },
        { label: 'Average Latency', val: '18.4 ms', change: '-2.8%', color: '#38BDF8' },
        { label: 'Memory Utilization', val: '64.8%', change: 'Nominal', color: '#F59E0B' },
      ];

      cards.forEach((c, i) => {
        const x = 32 + i * 286;
        const y = 96;
        ctx.fillStyle = '#1E293B';
        ctx.roundRect ? ctx.roundRect(x, y, 266, 120, 8) : ctx.fillRect(x, y, 266, 120);
        ctx.fill();

        ctx.fillStyle = '#94A3B8';
        ctx.font = '14px sans-serif';
        ctx.fillText(c.label, x + 18, y + 36);

        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(c.val, x + 18, y + 74);

        ctx.fillStyle = c.color;
        ctx.font = '13px sans-serif';
        ctx.fillText(c.change, x + 18, y + 100);
      });

      // Chart area
      ctx.fillStyle = '#1E293B';
      ctx.roundRect ? ctx.roundRect(32, 240, 720, 470, 8) : ctx.fillRect(32, 240, 720, 470);
      ctx.fill();

      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Real-time Gateway Traffic (24h)', 56, 280);

      // Draw chart grid & line
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      for (let y = 320; y <= 640; y += 80) {
        ctx.beginPath();
        ctx.moveTo(56, y);
        ctx.lineTo(720, y);
        ctx.stroke();
      }

      // Sine wave chart line
      ctx.beginPath();
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 3;
      for (let x = 56; x <= 720; x += 10) {
        const progress = (x - 56) / (720 - 56);
        const y =
          480 -
          Math.sin(progress * Math.PI * 3) * 70 -
          Math.cos(progress * Math.PI * 5) * 35;
        if (x === 56) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Right inspector card
      ctx.fillStyle = '#1E293B';
      ctx.roundRect ? ctx.roundRect(776, 240, 392, 470, 8) : ctx.fillRect(776, 240, 392, 470);
      ctx.fill();

      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Recent Microservice Alerts', 804, 280);

      const items = [
        'Auth Gateway: Token refresh spike detected',
        'Cache Node 4: Cache hit ratio at 98.6%',
        'Billing Worker: Batch invoice dispatch done',
        'Database Primary: Replication lag 0.4ms',
      ];
      items.forEach((item, idx) => {
        const itemY = 330 + idx * 75;
        ctx.fillStyle = '#334155';
        ctx.roundRect
          ? ctx.roundRect(804, itemY - 24, 336, 54, 6)
          : ctx.fillRect(804, itemY - 24, 336, 54);
        ctx.fill();

        ctx.fillStyle = '#CBD5E1';
        ctx.font = '13px sans-serif';
        ctx.fillText(item, 820, itemY + 8);
      });

      return canvas.toDataURL('image/png');
    },
  },
  {
    id: 'architecture',
    title: 'Distributed System Diagram',
    subtitle: '1000 × 600 px · Architecture flow',
    width: 1000,
    height: 600,
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#0B1120';
      ctx.fillRect(0, 0, 1000, 600);

      // Title
      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Event-Driven Architecture Overview', 40, 50);

      const drawBox = (x: number, y: number, w: number, h: number, title: string, sub: string, color: string) => {
        ctx.fillStyle = '#1E293B';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.roundRect ? ctx.roundRect(x, y, w, h, 8) : ctx.fillRect(x, y, w, h);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(title, x + 16, y + 36);

        ctx.fillStyle = '#94A3B8';
        ctx.font = '12px sans-serif';
        ctx.fillText(sub, x + 16, y + 60);
      };

      drawBox(60, 160, 180, 90, 'Web / Mobile Client', 'Next.js & Native app', '#38BDF8');
      drawBox(320, 160, 180, 90, 'API Edge Gateway', 'Envoy / Reverse Proxy', '#818CF8');
      drawBox(580, 120, 180, 80, 'Auth & Identity', 'OAuth / JWT Tokens', '#34D399');
      drawBox(580, 230, 180, 80, 'Order Processing', 'gRPC Microservice', '#F472B6');
      drawBox(580, 340, 180, 80, 'Inventory Stream', 'Kafka Consumer', '#FBBF24');
      drawBox(820, 230, 140, 190, 'Primary DB', 'PostgreSQL\n+ Redis cache', '#A78BFA');

      // Connecting lines
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      const connect = (x1: number, y1: number, x2: number, y2: number) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      };

      connect(240, 205, 320, 205);
      connect(500, 205, 580, 160);
      connect(500, 205, 580, 270);
      connect(500, 205, 580, 380);
      connect(760, 270, 820, 300);
      connect(760, 380, 820, 350);

      ctx.setLineDash([]);
      return canvas.toDataURL('image/png');
    },
  },
  {
    id: 'document',
    title: 'Product Requirements Doc',
    subtitle: '900 × 650 px · Spec mockup',
    width: 900,
    height: 650,
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 650;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 900, 650);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('PRD: Q4 Collaborative Canvas Release', 60, 70);

      ctx.fillStyle = '#6B7280';
      ctx.font = '14px sans-serif';
      ctx.fillText('Author: Liam Howarth · Last Updated: Today · Status: In Review', 60, 105);

      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, 125);
      ctx.lineTo(840, 125);
      ctx.stroke();

      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('1. Executive Objective', 60, 165);

      ctx.fillStyle = '#4B5563';
      ctx.font = '15px sans-serif';
      ctx.fillText(
        'Enable rapid image markup with outline boxes, circles, directional arrows, and text.',
        60,
        200
      );
      ctx.fillText(
        'Users can annotate screenshots without installing heavy desktop utilities.',
        60,
        230
      );

      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('2. Core Deliverables', 60, 285);

      const items = [
        'Outline boxes, circles, straight lines, and directional arrows with resize anchors.',
        'Real-time color switcher before and after creating markup.',
        'High-resolution clipboard copy & PNG download at 1:1 original pixel scale.',
        'Full undo and redo history stack with keyboard shortcuts.',
        'Image replacement and single-click reset functionality.',
      ];

      items.forEach((txt, idx) => {
        ctx.fillStyle = '#4F46E5';
        ctx.fillRect(64, 325 + idx * 40 - 10, 6, 6);
        ctx.fillStyle = '#374151';
        ctx.font = '15px sans-serif';
        ctx.fillText(txt, 84, 325 + idx * 40);
      });

      return canvas.toDataURL('image/png');
    },
  },
];
