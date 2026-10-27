export interface EventItem {
  id: string;
  title: string;
  category: 'Hackathons' | 'Workshops';
  description: string;
  deadline: string;
  status: 'Open' | 'Upcoming' | 'Closed';
  bannerBg: string;
}

export const DEFAULT_EVENTS: EventItem[] = [
  {
    id: 'ai-for-good',
    title: 'AI for Good Hackathon',
    category: 'Hackathons',
    description: 'Build innovative AI solutions to solve real-world social and environmental challenges.',
    deadline: '22 Oct 2026',
    status: 'Open',
    bannerBg: 'from-emerald-950 via-slate-900 to-teal-950',
  },
  {
    id: 'design-the-future',
    title: 'Design the Future',
    category: 'Hackathons',
    description: 'A 48-hour challenge to design impactful solutions for tomorrow\'s world.',
    deadline: '25 Oct 2026',
    status: 'Open',
    bannerBg: 'from-amber-950 via-slate-900 to-orange-950',
  },
  {
    id: 'greentech-buildathon',
    title: 'GreenTech Buildathon',
    category: 'Hackathons',
    description: 'Build scalable solutions for a more sustainable and climate-resilient future.',
    deadline: '29 Oct 2026',
    status: 'Open',
    bannerBg: 'from-green-950 via-slate-900 to-emerald-950',
  },
];

export interface VerifyAdminResult {
  success: boolean;
  token?: string;
  admin?: {
    role: string;
    username: string;
    institute?: string;
  };
  error?: string;
  isRateLimited?: boolean;
  retryAfter?: number;
}

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // In browser, use same-origin relative URL so Next.js proxies to backend seamlessly
    return '';
  }
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:5000'
  );
};

/**
 * Fetch active events from backend API (/api/events)
 * Falls back to default curated events list on network disconnect
 */
export async function fetchActiveEvents(): Promise<EventItem[]> {
  const apiUrl = getApiBaseUrl();

  try {
    const response = await fetch(`${apiUrl}/api/events`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return DEFAULT_EVENTS;
  } catch (error) {
    console.warn('Backend events API unreachable, using default active events:', error);
    return DEFAULT_EVENTS;
  }
}

/**
 * Verify admin credentials and 6-digit TOTP code against backend (/api/admin/verify)
/**
 * Verify admin credentials and 6-digit TOTP code against the Next.js auth endpoint (/api/admin/auth)
 * The endpoint handles backend validation, rate limiting, and issues an HttpOnly signed JWT cookie.
 */
export async function verifyAdminTOTP(
  email: string,
  password: string,
  totpCode: string
): Promise<VerifyAdminResult> {
  const cleanEmail = (email || '').trim();
  const cleanPassword = (password || '').trim();
  const cleanTotp = (totpCode || '').trim();

  // Strict check: all credentials must be non-empty
  if (!cleanEmail || !cleanPassword || cleanTotp.length !== 6) {
    return {
      success: false,
      error: 'Administrator email, password, and 6-digit TOTP code are required.',
    };
  }

  try {
    // Send to Next.js same-origin route handler to establish HttpOnly signed cookie
    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        password: cleanPassword,
        totp: cleanTotp,
        totpCode: cleanTotp,
      }),
    });

    // Handle HTTP 429 Too Many Requests (Brute-force rate limiting)
    if (response.status === 429) {
      const retryHeader = response.headers.get('Retry-After');
      const retryAfter = retryHeader ? parseInt(retryHeader, 10) : 60;
      return {
        success: false,
        error: `Too many authentication attempts. Rate limit exceeded. Please wait ${retryAfter} seconds before retrying.`,
        isRateLimited: true,
        retryAfter,
      };
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Access denied: Invalid credentials or TOTP authentication code.',
      };
    }

    return {
      success: true,
      token: data.token,
      admin: data.admin,
    };
  } catch (error: any) {
    // Production behavior: Always fail closed on network errors. Zero hardcoded bypasses.
    return {
      success: false,
      error: error?.message || 'Authentication service unreachable.',
    };
  }
}


