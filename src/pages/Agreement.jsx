import React from 'react';
import { FileSignature } from 'lucide-react';
import InfoLayout, { InfoSection } from '@/components/InfoLayout';

const SECTIONS = [
  { n: 1, title: 'Acceptance of Agreement', body: 'By registering an account, depositing funds, or playing any game on Golden Bounty, you acknowledge that you have read, understood, and agreed to be bound by this Player Agreement along with the Terms & Conditions and Privacy Policy. If you do not agree, you must not use the Platform.' },
  { n: 2, title: 'Eligibility & Age', body: 'You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to register and play. By using the Platform you confirm that online gambling is legal in your country of residence. Golden Bounty is authorized for markets outside the territory of Paraguay under CONAJZAR Resolution No. 07/2026.' },
  { n: 3, title: 'Account Rules', body: 'Each player may hold only one account. Registration requires a valid @gmail.com email address. You are responsible for keeping your login credentials secure. Accounts found to be duplicated, fraudulent, or shared may be suspended and balances forfeited.' },
  { n: 4, title: 'Deposits', body: 'The minimum deposit is $3.00. Accepted methods include USDT (TRC20, ERC20, BEP20), other cryptocurrencies (BTC, ETH), Binance Pay, Trust Wallet, and TON (Tonkeeper). Deposits are credited after admin approval or on-chain verification. Deposits unlock VIP levels, the daily Stack profit rate, and BOUNTY token allocation.' },
  { n: 5, title: 'Stacking (Daily Profit)', body: 'Funds placed in the Stack earn a daily profit rate based on your VIP tier. Staked funds are locked for the plan duration shown at the time of stacking. Pending profit can be claimed once the lock period ends. Staking is not available in Demo mode — only real balance can be stacked.' },
  { n: 6, title: 'Wagering Requirements', body: 'Before requesting a withdrawal, a portion of your deposit must be played through in games or stacked. The exact remaining wagering amount and current withdrawable balance are displayed on the Dashboard and Withdraw page. Withdrawals that do not meet the play-through requirement will be blocked until the requirement is fulfilled.' },
  { n: 7, title: 'Withdrawals', body: 'Withdrawals are submitted as requests and sent after admin approval. You must provide a valid wallet address for the selected network (USDT TRC20/ERC20/BEP20, BTC, ETH, TON) or a Binance UID. Only winnings above your locked deposit balance are withdrawable. Withdrawal status (Pending, Confirmed, Rejected) is shown on the Profile page.' },
  { n: 8, title: 'Bonuses & Free Spin', body: 'New players receive one Free Spin upon successful registration and email verification. Welcome bonuses, daily bonuses, and deposit bonuses may carry wagering requirements stated in the promotion. Golden Bounty reserves the right to modify, suspend, or cancel any bonus or promotion at any time.' },
  { n: 9, title: 'Game Rules — General', body: 'All game outcomes are determined by a certified random engine. Golden Bounty does not guarantee any outcome, win rate, or return-to-player percentage to any individual player. Results of each spin, round, or bet are final once confirmed by the system. The Platform reserves the right to adjust game settings (minimum/maximum bet, enabled status) at any time.' },
  { n: 10, title: 'Game Rules — Slots', body: 'Slot games (Super Ace, Wild Bounty, Gates of Olympus, Crown Coins, Big Brown, Argonauts) pay based on matching symbols on active paylines or ways. Wild symbols substitute for other symbols; scatter symbols trigger free spins or bonus rounds. Multipliers and cascade/tumble features apply only to qualifying spins as defined in each game’s individual rules and paytable.' },
  { n: 11, title: 'Game Rules — Hi-Lo', body: 'In High or Low, you predict whether the next card will be higher or lower than the current card. A correct prediction pays the shown multiplier; an incorrect prediction loses the wager. Card rankings follow standard poker order (Ace high). Ties result in a push unless otherwise stated in the in-game rules.' },
  { n: 12, title: 'Game Rules — Plinko', body: 'In Plinko, a ball drops through a field of pegs and lands in a multiplier bucket. The payout is determined by the bucket in which the ball settles. Risk level and row count affect the multiplier distribution. The outcome is final once the ball settles.' },
  { n: 13, title: 'Game Rules — Mines', body: 'In Mines, you reveal tiles on a grid to collect multipliers while avoiding hidden mines. Each safe reveal increases the current multiplier; hitting a mine ends the round and forfeits the wager. You may cash out at any time before revealing the next tile.' },
  { n: 14, title: 'Game Rules — Rocket Crash (Aviator)', body: 'In Rocket Crash, a multiplier rises from 1.00× and can crash at any random point. You must cash out before the rocket crashes to lock in the current multiplier. If the rocket crashes before you cash out, the wager is lost. Cash-out is final once confirmed.' },
  { n: 15, title: 'Game Rules — Thimbles', body: 'In Thimbles, a ball is hidden under one of several cups which are then shuffled. You must identify the cup containing the ball to win the displayed payout. An incorrect choice loses the wager.' },
  { n: 16, title: 'Game Rules — Lucky Wheel (Free Spin)', body: 'The Lucky Wheel grants one free spin every 24 hours. The prize segment on which the wheel stops determines the reward. Free Spin rewards may be subject to wagering requirements before withdrawal.' },
  { n: 17, title: 'Demo Mode', body: 'Demo Mode provides a $1,000 practice balance for trying games without risking real funds. Winnings and losses in Demo Mode are not real and cannot be withdrawn. Deposits, withdrawals, and staking are disabled while Demo Mode is active.' },
  { n: 18, title: 'Referrals & Promo Codes', body: 'Each user receives a unique promo code. New players who register with your code receive a $1 Stack bonus. You earn 5% commission on every deposit your referrals make. Commission earnings can be tracked on the Referrals page. Abuse of the referral system (self-referral, fake accounts) will result in forfeiture of commissions and possible account suspension.' },
  { n: 19, title: 'Airdrop (BOUNTY Token)', body: 'BOUNTY tokens are allocated based on USDT deposits and referral earnings. Claimable tokens equal total allocation minus tokens already claimed. Golden Bounty reserves the right to adjust allocation rules, token value, and claim availability at any time. BOUNTY tokens have no guaranteed monetary value.' },
  { n: 20, title: 'Prohibited Activities', body: 'You may not: use multiple accounts; exploit bugs or glitches; use automated bots or scripts; collude with other players; abuse bonuses; reverse-engineer the random engine; or engage in money laundering. Violations result in account suspension, balance forfeiture, and possible legal action.' },
  { n: 21, title: 'Responsible Gaming', body: 'You are responsible for controlling your gambling activity. Golden Bounty provides self-exclusion and deposit-limit tools. If gambling is affecting your wellbeing, please seek help. Gambling should be treated as entertainment, not a source of income.' },
  { n: 22, title: 'Limitation of Liability', body: 'The Platform is provided "as is". Golden Bounty is not liable for any direct, indirect, or consequential losses arising from the use of the Platform, including losses from game outcomes, network delays, or service interruptions, except where required by applicable law.' },
  { n: 23, title: 'Changes to this Agreement', body: 'Golden Bounty may update this Player Agreement at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Agreement. The "Last updated" date below reflects the most recent revision.' },
  { n: 24, title: 'Contact', body: 'For any questions regarding this Agreement, contact our 24/7 Support team via the Live Support page or the in-app Bounty Bot assistant.' },
];

export default function Agreement() {
  return (
    <InfoLayout title="Player Agreement" subtitle="Last updated: 6 August 2026" icon={FileSignature}>
      <div className="flex flex-col gap-3">
        {SECTIONS.map(s => (
          <InfoSection key={s.n} n={s.n} title={s.title}>
            {s.body}
          </InfoSection>
        ))}
      </div>
    </InfoLayout>
  );
}