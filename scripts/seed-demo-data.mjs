#!/usr/bin/env node
/**
 * Demo data seeder for local BetSocial testing.
 * Usage: node scripts/seed-demo-data.mjs
 */
const API = process.env.API_URL || 'http://localhost:6001/api';

async function req(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
    const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const detail =
      typeof json.message === 'string'
        ? json.message
        : JSON.stringify(json.message || json);
    throw new Error(`${method} ${path} -> ${res.status}: ${detail}`);
  }
  return json;
}

async function ensureUser(email, name, password) {
  try {
    await req('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
  } catch {
    // already exists
  }
  const login = await req('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return {
    token: login.data.accessToken,
    user: login.data.user,
  };
}

function deadlineDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

const MARKETS = [
  {
    title: 'Will Bitcoin close above $100k this month?',
    description: 'Based on Coinbase BTC-USD daily close (UTC).',
    category: 'CRYPTO',
    country: 'US',
    initial_stake: 40,
    initial_side: 'BACK',
    days: 12,
  },
  {
    title: 'Will the US Fed cut rates at the next meeting?',
    description: 'Official FOMC statement is the source of truth.',
    category: 'POLITICS',
    country: 'US',
    initial_stake: 25,
    initial_side: 'OPPOSE',
    days: 20,
  },
  {
    title: 'Will Chelsea finish top-4 in Premier League?',
    description: 'Final Premier League table after last matchday.',
    category: 'SPORTS',
    country: 'GB',
    initial_stake: 30,
    initial_side: 'BACK',
    days: 45,
  },
  {
    title: 'Will Nigeria win AFCON 2026?',
    description: 'Tournament champion only; runner-up does not count.',
    category: 'SPORTS',
    country: 'NG',
    initial_stake: 20,
    initial_side: 'BACK',
    days: 60,
  },
  {
    title: 'Will a major Hollywood film break $1B box office this quarter?',
    description: 'Worldwide box office tracked by Box Office Mojo.',
    category: 'ENTERTAINMENT',
    country: 'GLOBAL',
    initial_stake: 15,
    initial_side: 'BACK',
    days: 25,
  },
  {
    title: 'Will Canada CPI stay under 3% next print?',
    description: 'Official Statistics Canada CPI YoY release.',
    category: 'PUBLIC_ISSUES',
    country: 'CA',
    initial_stake: 18,
    initial_side: 'OPPOSE',
    days: 18,
  },
  {
    title: 'Who wins UEFA Champions League this season?',
    description: 'Pick one club. Multi-outcome market.',
    category: 'SPORTS',
    country: 'GB',
    bet_type: 'CUSTOM',
    outcomes: ['Real Madrid', 'Manchester City', 'Bayern Munich', 'PSG'],
    initial_outcome: 'Real Madrid',
    initial_stake: 35,
    days: 90,
  },
  {
    title: 'Private friends bet: Who cooks better BBQ?',
    description: 'Invite-only weekend cook-off.',
    category: 'PUBLIC_ISSUES',
    country: 'US',
    is_private: true,
    initial_stake: 10,
    initial_side: 'BACK',
    days: 7,
  },
];

async function main() {
  console.log('Seeding demo users + markets against', API);

  const alice = await ensureUser(
    'alice@betsocial.test',
    'Alice Bettor',
    'Password123!',
  );
  const bob = await ensureUser(
    'bob@betsocial.test',
    'Bob Challenger',
    'Password123!',
  );
  const tester = await ensureUser(
    'tester1794386833@example.com',
    'Test User',
    'Password123!',
  );

  for (const u of [alice, bob, tester]) {
    await req('/wallet/deposit', {
      method: 'POST',
      token: u.token,
      body: {
        amount: 500,
        payment_method: 'CARD',
        description: 'Demo seed top-up',
      },
    });
  }

  const creators = [alice, bob, tester];
  for (let i = 0; i < MARKETS.length; i++) {
    const m = MARKETS[i];
    const creator = creators[i % creators.length];
    const body = {
      title: m.title,
      description: m.description,
      category: m.category,
      country: m.country,
      deadline: deadlineDays(m.days),
      initial_stake: m.initial_stake,
      is_private: m.is_private ?? false,
      bet_type: m.bet_type ?? 'BINARY',
      outcomes: m.outcomes,
      initial_outcome: m.initial_outcome,
      initial_side: m.initial_side ?? 'BACK',
    };
    const created = await req('/bets', {
      method: 'POST',
      token: creator.token,
      body,
    });
    const betId = created.data?.id;
    console.log('Created:', m.title, betId);

    // Opposing stake from another user for liquidity (binary only)
    if (betId && (m.bet_type ?? 'BINARY') === 'BINARY') {
      const opponent = creators[(i + 1) % creators.length];
      const side = (m.initial_side ?? 'BACK') === 'BACK' ? 'OPPOSE' : 'BACK';
      try {
        await req(`/bets/${betId}/stake`, {
          method: 'POST',
          token: opponent.token,
          body: {
            stake: Math.max(10, Math.round(m.initial_stake * 0.6)),
            side,
          },
        });
        console.log('  + opposing stake from', opponent.user?.name || 'opponent');
      } catch (e) {
        console.warn('  stake skipped:', e.message);
      }
    }
  }

  console.log('\nDemo accounts:');
  console.log('  alice@betsocial.test / Password123!');
  console.log('  bob@betsocial.test / Password123!');
  console.log('  tester1794386833@example.com / Password123!');
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
