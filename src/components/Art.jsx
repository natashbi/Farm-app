// Hand-made flat illustrations in the app palette (no external images needed).

export function FarmerAvatar({ size = 44, bg = '#9aae3f', skin = '#b9784a', className }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="50" fill={bg} />
      <path d="M18 100c2-20 16-30 32-30s30 10 32 30z" fill="#2e4a40" />
      <path d="M40 70h20l-3 10h-14z" fill={skin} />
      <circle cx="50" cy="54" r="19" fill={skin} />
      <circle cx="43" cy="54" r="2.4" fill="#1f2a24" />
      <circle cx="57" cy="54" r="2.4" fill="#1f2a24" />
      <path d="M44 62c3 3 9 3 12 0" stroke="#1f2a24" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {/* salakot hat */}
      <path d="M14 43L50 20l36 23c-10 4-24 6-36 6s-26-2-36-6z" fill="#f6c945" />
      <path d="M14 43c10 4 24 6 36 6s26-2 36-6" stroke="#c9922a" strokeWidth="2.5" fill="none" />
      <path d="M50 20l-12 26M50 20l12 26M50 20v28" stroke="#c9922a" strokeWidth="1.5" opacity="0.6" />
      <circle cx="50" cy="20" r="3" fill="#c9922a" />
    </svg>
  )
}

export function HeroBudgetArt(props) {
  return (
    <svg viewBox="0 0 200 170" aria-hidden="true" {...props}>
      <ellipse cx="120" cy="160" rx="80" ry="10" fill="#000" opacity="0.12" />
      {/* rice sack */}
      <path d="M70 60c-8 20-12 50-8 90h86c4-40 0-70-8-90z" fill="#f4f0dc" />
      <path d="M70 60c10-8 60-8 70 0-10 6-60 6-70 0z" fill="#e2d9b3" />
      <path d="M86 52c6-10 32-10 38 0" stroke="#c9922a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="82" y="92" width="46" height="34" rx="6" fill="#9aae3f" />
      <text x="105" y="116" textAnchor="middle" fontSize="18" fontWeight="700" fill="#2e4a40" fontFamily="Arial, sans-serif">
        ₱
      </text>
      {/* sprout */}
      <path d="M104 52V26" stroke="#9aae3f" strokeWidth="5" strokeLinecap="round" />
      <path d="M104 34c0-14 12-22 26-22 0 14-12 22-26 22z" fill="#9aae3f" />
      <path d="M104 40c0-12-10-18-22-18 0 12 10 18 22 18z" fill="#b8c957" />
      {/* coins */}
      <g>
        <ellipse cx="160" cy="150" rx="22" ry="7" fill="#c9922a" />
        <rect x="138" y="132" width="44" height="18" fill="#f6c945" />
        <ellipse cx="160" cy="132" rx="22" ry="7" fill="#ffd966" />
        <ellipse cx="160" cy="132" rx="12" ry="3.5" fill="none" stroke="#c9922a" strokeWidth="2" />
      </g>
      <circle cx="168" cy="94" r="16" fill="#f26a1b" />
      <text x="168" y="100" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">
        ₱
      </text>
      <circle cx="46" cy="120" r="10" fill="#f6c945" />
      <circle cx="46" cy="120" r="5" fill="none" stroke="#c9922a" strokeWidth="2" />
    </svg>
  )
}

export function HeroDoctorArt(props) {
  return (
    <svg viewBox="0 0 200 170" aria-hidden="true" {...props}>
      <ellipse cx="110" cy="160" rx="80" ry="10" fill="#000" opacity="0.12" />
      {/* plant */}
      <path d="M100 160V70" stroke="#9aae3f" strokeWidth="6" strokeLinecap="round" />
      <path d="M100 100c0-26 20-40 46-40 0 26-20 40-46 40z" fill="#9aae3f" />
      <path d="M100 118c0-22-18-34-40-34 0 22 18 34 40 34z" fill="#b8c957" />
      <path d="M100 76c0-20 12-34 30-40 2 20-10 34-30 40z" fill="#b8c957" />
      <circle cx="126" cy="80" r="4" fill="#c2410c" />
      <circle cx="116" cy="88" r="3" fill="#c2410c" />
      <circle cx="72" cy="100" r="3.5" fill="#f6c945" />
      {/* pot */}
      <path d="M72 140h56l-6 24H78z" fill="#f26a1b" />
      <rect x="68" y="134" width="64" height="10" rx="4" fill="#c9520e" />
      {/* magnifier */}
      <circle cx="150" cy="112" r="22" fill="#f4f0dc" fillOpacity="0.25" stroke="#f4f0dc" strokeWidth="7" />
      <path d="M166 128l18 18" stroke="#f6c945" strokeWidth="10" strokeLinecap="round" />
      <path d="M142 104c3-4 8-6 12-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </svg>
  )
}

export function HeroRecordsArt(props) {
  return (
    <svg viewBox="0 0 200 170" aria-hidden="true" {...props}>
      <ellipse cx="110" cy="160" rx="80" ry="10" fill="#000" opacity="0.12" />
      <rect x="50" y="30" width="110" height="130" rx="10" fill="#f4f0dc" />
      <rect x="50" y="30" width="16" height="130" rx="6" fill="#e2d9b3" />
      <rect x="80" y="110" width="14" height="36" rx="3" fill="#9aae3f" />
      <rect x="100" y="84" width="14" height="62" rx="3" fill="#f26a1b" />
      <rect x="120" y="100" width="14" height="46" rx="3" fill="#9aae3f" />
      <rect x="140" y="120" width="10" height="26" rx="3" fill="#b8c957" />
      <path d="M78 50h60M78 62h44" stroke="#c9c09a" strokeWidth="5" strokeLinecap="round" />
      <path d="M107 84V70" stroke="#2e4a40" strokeWidth="3" />
      <path d="M107 72c0-8 6-12 13-12 0 8-6 12-13 12z" fill="#b8c957" />
      <circle cx="170" cy="46" r="14" fill="#f6c945" />
      <path d="M170 38v16M162 46h16" stroke="#c9922a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function PaddyScene(props) {
  return (
    <svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true" {...props}>
      <rect width="160" height="120" fill="#cfe3a4" />
      <circle cx="126" cy="28" r="14" fill="#f6c945" />
      <path d="M0 58c30-12 60-12 90-4s50 6 70-2v68H0z" fill="#9aae3f" />
      <path d="M0 76c40-10 80-8 160 2v42H0z" fill="#7c9440" />
      <path d="M0 96c50-8 100-6 160 0v24H0z" fill="#2e4a40" />
      {[14, 34, 54, 74, 94, 114, 134, 150].map((x, i) => (
        <g key={x} transform={`translate(${x} ${84 + (i % 2) * 4})`}>
          <path d="M0 10V-4M0 10l-5-12M0 10l5-12" stroke="#b8c957" strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
      <path d="M20 40c4-3 8-3 12 0M36 34c3-2 6-2 9 0" stroke="#2e4a40" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function BugLeafScene(props) {
  return (
    <svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true" {...props}>
      <rect width="160" height="120" fill="#f7e2c7" />
      <path d="M20 110C30 50 80 20 140 20c-6 60-50 94-120 90z" fill="#9aae3f" />
      <path d="M20 110C60 80 100 50 140 20" stroke="#7c9440" strokeWidth="3" fill="none" />
      <circle cx="80" cy="64" r="7" fill="#f4f0dc" />
      <circle cx="104" cy="44" r="5" fill="#f4f0dc" />
      <g transform="translate(58 78)">
        <ellipse rx="12" ry="8" fill="#c2410c" />
        <path d="M0-8V8" stroke="#1f2a24" strokeWidth="1.5" />
        <circle cx="-4" cy="-3" r="1.8" fill="#1f2a24" />
        <circle cx="4" cy="2" r="1.8" fill="#1f2a24" />
        <circle cx="-12" cy="0" r="4" fill="#1f2a24" />
      </g>
      <circle cx="128" cy="92" r="18" fill="none" stroke="#2e4a40" strokeWidth="5" />
      <path d="M140 104l12 12" stroke="#2e4a40" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyFieldArt(props) {
  return (
    <svg viewBox="0 0 160 110" aria-hidden="true" {...props}>
      <ellipse cx="80" cy="96" rx="64" ry="10" fill="currentColor" opacity="0.12" />
      <path d="M80 92V50" stroke="#9aae3f" strokeWidth="5" strokeLinecap="round" />
      <path d="M80 62c0-16 12-26 28-26 0 16-12 26-28 26z" fill="#9aae3f" />
      <path d="M80 72c0-14-10-22-24-22 0 14 10 22 24 22z" fill="#b8c957" />
      <path d="M50 92c8-8 52-8 60 0z" fill="#7c5a3a" />
    </svg>
  )
}
