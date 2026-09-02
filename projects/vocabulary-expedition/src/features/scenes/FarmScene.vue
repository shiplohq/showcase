<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0

Farm gouache plate — viewBox 1200x800, item groups on their JSON bbox centres.
-->
<template>
  <svg class="scene-art" viewBox="0 0 1200 800" aria-hidden="true" focusable="false">
    <!-- sky, sun, hills, grass -->
    <rect width="1200" height="800" fill="#bcd9e8" />
    <circle cx="620" cy="86" r="48" fill="#f2c14e" />
    <path d="M280 120 q30 -26 60 0 q30 -26 60 0 l0 -120 l-120 0 z" fill="#e8d9bd" opacity="0.9" />
    <path d="M840 100 q30 -26 60 0 q30 -26 60 0 l0 -100 l-120 0 z" fill="#e8d9bd" opacity="0.9" />
    <path d="M0 420 q240 -120 480 -30 q200 70 360 -10 q200 -100 360 10 L1200 800 L0 800 Z" fill="#a4bf6b" />
    <path d="M0 520 q300 -70 600 0 t600 -6" stroke="#8ba657" stroke-width="4" fill="none" opacity="0.5" />
    <!-- pond -->
    <ellipse cx="1080" cy="668" rx="150" ry="52" fill="#8fb6c4" />
    <ellipse cx="1080" cy="668" rx="110" ry="34" fill="#a9c8d4" opacity="0.7" />
    <!-- fence -->
    <path d="M40 470 h360 M40 510 h360" stroke="#c89a66" stroke-width="12" />
    <path d="M60 450 l-6 90 M150 450 l-6 90 M240 450 l-6 90 M330 450 l-6 90 M400 452 l-4 84" stroke="#b98f63" stroke-width="10" stroke-linecap="round" />
    <!-- hay bales (decor) -->
    <g transform="translate(560 660)">
      <circle r="34" fill="#e0c27a" />
      <circle r="34" fill="none" stroke="#c9a95c" stroke-width="5" />
      <circle r="16" fill="none" stroke="#c9a95c" stroke-width="5" />
    </g>

    <!-- barn [6,8,20,26] → c(192,176) -->
    <g id="item-barn" transform="translate(192 176)">
      <path d="M-110 40 L0 -108 L110 40 Z" fill="#c0504a" />
      <path d="M-110 40 L0 -108 L110 40 Z" fill="none" stroke="#a8453f" stroke-width="6" />
      <rect x="-100" y="40" width="200" height="170" fill="#c0504a" />
      <path d="M-100 40 h200 v16 h-200 z" fill="#a8453f" />
      <path d="M-64 96 h52 v114 h-52 z M12 96 h52 v114 h-52 z" fill="#8a6b4f" />
      <path d="M-38 96 v114" stroke="#a8453f" stroke-width="5" />
      <path d="M38 96 v114" stroke="#a8453f" stroke-width="5" />
      <path d="M-90 -8 q90 22 180 0" stroke="#e8d9bd" stroke-width="0" fill="none" />
      <path d="M-26 -46 l26 -14 26 14 -6 12 h-40 z" fill="#e8d9bd" />
      <path d="M-20 -34 h40" stroke="#8a6b4f" stroke-width="5" />
      <path d="M-100 210 h200" stroke="#8a6b4f" stroke-width="8" />
    </g>

    <!-- tractor [76,18,20,22] → c(1032,232) -->
    <g id="item-tractor" transform="translate(1032 232)">
      <path d="M-96 44 q-6 -40 30 -44 l60 -6 q26 -2 34 22 l8 28 z" fill="#e08a3c" />
      <rect x="-58" y="-44" width="72" height="34" rx="8" fill="#c97430" />
      <rect x="-48" y="-38" width="52" height="24" rx="5" fill="#bcd9e8" />
      <path d="M-96 44 h196" stroke="#c97430" stroke-width="10" />
      <circle cx="-58" cy="62" r="34" fill="#4a3527" />
      <circle cx="-58" cy="62" r="14" fill="#e8d9bd" />
      <circle cx="52" cy="74" r="24" fill="#4a3527" />
      <circle cx="52" cy="74" r="10" fill="#e8d9bd" />
      <path d="M84 30 q10 30 -6 48" stroke="#8a6b4f" stroke-width="8" fill="none" stroke-linecap="round" />
      <rect x="-12" y="30" width="26" height="16" rx="4" fill="#c0504a" />
    </g>

    <!-- horse [58,30,20,24] → c(816,336) -->
    <g id="item-horse" transform="translate(816 336)">
      <ellipse cx="0" cy="96" rx="110" ry="12" fill="#4a3527" opacity="0.08" />
      <path d="M-96 42 q-10 -60 34 -66 q10 -34 34 -18 q10 6 6 24 l44 6 q14 -30 36 -12 q14 12 0 30 l-8 36 q14 8 10 20 h-30 q-16 -18 -44 -20 l-6 0 q-24 2 -38 20 h-30 q-6 -14 8 -26 z" fill="#a5713f" />
      <path d="M-62 -24 q-16 -26 4 -34 q16 -6 20 12 l2 16 q20 0 40 4 l4 -20 q6 -20 24 -10 q12 8 2 24" stroke="#8c5c31" stroke-width="6" fill="none" />
      <path d="M-96 42 q-14 24 -4 52 h14 q-2 -28 8 -44 z M-30 52 q-10 26 -2 42 h14 q0 -24 8 -38 z M40 54 q-8 24 0 40 h14 q0 -22 8 -36 z" fill="#a5713f" />
      <path d="M-40 -44 q-20 -22 -6 -30 q12 -6 22 10" stroke="#8c5c31" stroke-width="6" fill="none" stroke-linecap="round" />
      <path d="M44 -26 q22 -10 28 6" stroke="#8c5c31" stroke-width="6" fill="none" stroke-linecap="round" />
      <circle cx="-14" cy="-38" r="4" fill="#4a3527" />
      <path d="M6 -30 q14 6 26 2" stroke="#4a3527" stroke-width="4" fill="none" stroke-linecap="round" />
    </g>

    <!-- cow [10,42,24,26] → c(264,440) -->
    <g id="item-cow" transform="translate(264 440)">
      <ellipse cx="0" cy="104" rx="130" ry="13" fill="#4a3527" opacity="0.08" />
      <rect x="-118" y="-44" width="212" height="108" rx="46" fill="#eef3ec" />
      <path d="M-70 -44 q30 30 6 60 q-24 28 6 48 h-40 q-16 -50 4 -74 q12 -16 24 -34 z" fill="#4a3527" opacity="0.85" />
      <ellipse cx="40" cy="10" rx="34" ry="26" fill="#4a3527" opacity="0.85" />
      <ellipse cx="-20" cy="48" rx="26" ry="18" fill="#4a3527" opacity="0.6" />
      <path d="M94 -50 q26 -14 44 4 l-8 12 q-18 -10 -36 2 z" fill="#eef3ec" />
      <ellipse cx="128" cy="-46" rx="26" ry="18" fill="#e8d9bd" />
      <circle cx="124" cy="-50" r="3.5" fill="#4a3527" />
      <circle cx="136" cy="-44" r="3.5" fill="#4a3527" />
      <ellipse cx="128" cy="-32" rx="14" ry="9" fill="#d98f89" />
      <path d="M100 -62 q4 -14 16 -8 M124 -66 q8 -8 16 0" stroke="#8a6b4f" stroke-width="5" fill="none" stroke-linecap="round" />
      <path d="M-100 60 l-8 44 M-60 64 l-4 42 M20 64 l4 42 M66 62 l8 44" stroke="#d9cbb0" stroke-width="16" stroke-linecap="round" />
      <path d="M-108 104 q4 8 10 0 M-68 106 q4 8 10 0 M16 106 q4 8 10 0 M74 104 q4 8 10 0" fill="#4a3527" />
    </g>

    <!-- sheep [40,52,18,18] → c(588,496) -->
    <g id="item-sheep" transform="translate(588 496)">
      <ellipse cx="0" cy="72" rx="90" ry="10" fill="#4a3527" opacity="0.08" />
      <ellipse cx="-6" cy="0" rx="82" ry="54" fill="#f5efdd" />
      <circle cx="-84" cy="-18" r="24" fill="#f5efdd" />
      <circle cx="-66" cy="-38" r="24" fill="#f5efdd" />
      <circle cx="-36" cy="-48" r="24" fill="#f5efdd" />
      <circle cx="-2" cy="-46" r="24" fill="#f5efdd" />
      <circle cx="30" cy="-32" r="24" fill="#f5efdd" />
      <circle cx="48" cy="-8" r="24" fill="#f5efdd" />
      <ellipse cx="74" cy="-16" rx="30" ry="26" fill="#4a3527" />
      <circle cx="84" cy="-22" r="3.5" fill="#fffdf4" />
      <path d="M66 -34 q10 -10 22 -6" stroke="#fffdf4" stroke-width="4" fill="none" stroke-linecap="round" />
      <ellipse cx="72" cy="-2" rx="12" ry="8" fill="#d9c8b0" />
      <path d="M96 -26 q10 2 10 12" stroke="#4a3527" stroke-width="4" fill="none" stroke-linecap="round" />
      <path d="M-64 48 l-6 26 M-28 52 l-2 24 M14 52 l4 24 M48 46 l8 26" stroke="#4a3527" stroke-width="11" stroke-linecap="round" />
    </g>

    <!-- chicken [66,58,12,14] → c(864,544) -->
    <g id="item-chicken" transform="translate(864 544)">
      <ellipse cx="0" cy="56" rx="66" ry="8" fill="#4a3527" opacity="0.08" />
      <ellipse cx="-4" cy="8" rx="56" ry="42" fill="#f5efdd" />
      <path d="M-44 18 q-10 24 4 38 h22 q-12 -20 -4 -38 z" fill="#e8dcc2" />
      <circle cx="42" cy="-18" r="24" fill="#f5efdd" />
      <path d="M50 -42 q10 -14 24 -6 q-2 12 -14 14 z" fill="#c0504a" />
      <path d="M66 -22 q16 2 14 12 q-14 6 -20 -2 z" fill="#f2c14e" />
      <circle cx="44" cy="-24" r="4" fill="#4a3527" />
      <path d="M28 -44 q8 8 20 6" stroke="#8a6b4f" stroke-width="0" fill="none" />
      <path d="M-24 -30 q-14 4 -12 18 q12 6 20 -4 z" fill="#4a3527" opacity="0.75" />
      <path d="M-40 50 l-2 10 M-6 54 l0 8 M30 50 l4 10" stroke="#e0ad3a" stroke-width="7" stroke-linecap="round" />
      <path d="M-30 6 q-20 2 -18 18 q16 8 30 -2 z" fill="#e8dcc2" />
    </g>

    <!-- duck [86,66,11,10] → c(1098,616) -->
    <g id="item-duck" transform="translate(1098 616)">
      <ellipse cx="0" cy="26" rx="60" ry="7" fill="#4a3527" opacity="0.08" />
      <ellipse cx="-4" cy="-2" rx="46" ry="26" fill="#f5efdd" />
      <path d="M-38 8 q-8 16 4 20 q18 4 34 -6 q18 -10 34 -2 q10 4 10 -8 q-14 -10 -34 -4 q-20 6 -48 0 z" fill="#e8dcc2" />
      <circle cx="38" cy="-26" r="17" fill="#f5efdd" />
      <path d="M46 -44 q8 -10 18 -4 q-2 10 -12 10 z" fill="#5f8f3e" />
      <path d="M54 -26 q12 2 10 10 q-10 4 -16 -2 z" fill="#f2c14e" />
      <circle cx="40" cy="-30" r="3" fill="#4a3527" />
      <path d="M14 -50 q6 4 12 2" stroke="#8a6b4f" stroke-width="0" fill="none" />
      <path d="M-14 -20 q-10 0 -12 8 q8 6 16 0 z" fill="#4a3527" opacity="0.7" />
    </g>
  </svg>
</template>
