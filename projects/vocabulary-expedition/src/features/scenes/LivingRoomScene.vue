<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0

Living-room gouache plate — viewBox 1200x800. Every item-<id> group is centred
on the bbox declared in public/data/units.json (bbox % × [12,8] = viewBox
units), so the DOM hotspots overlay lands exactly on the art.
-->
<template>
  <svg class="scene-art" viewBox="0 0 1200 800" aria-hidden="true" focusable="false">
    <!-- wall + wainscot + floor -->
    <rect width="1200" height="800" fill="#f3e2c3" />
    <path d="M0 600 Q 300 588 600 602 T 1200 596 L1200 634 L0 638 Z" fill="#e9d5b1" />
    <path d="M0 630 Q 300 620 600 634 T 1200 628 L1200 800 L0 800 Z" fill="#cea97e" />
    <path d="M90 706 q210 -10 420 2 t440 -6" stroke="#b98f63" stroke-width="3" fill="none" opacity="0.45" />
    <path d="M60 756 q230 -10 460 2 t480 -6" stroke="#b98f63" stroke-width="3" fill="none" opacity="0.45" />

    <!-- window (decor, outside any bbox) -->
    <g transform="translate(165 150)">
      <rect x="-72" y="-80" width="144" height="160" rx="10" fill="#bcd9e8" />
      <path d="M-72 10 q40 -14 72 -2 t72 -8 L72 80 L-72 80 Z" fill="#9fc3d6" />
      <path d="M0 -80 L0 80 M-72 0 L72 0" stroke="#f3e2c3" stroke-width="10" />
      <rect x="-80" y="-88" width="160" height="176" rx="12" fill="none" stroke="#b98f63" stroke-width="9" />
      <path d="M-96 92 q96 18 192 0 l6 16 q-102 18 -204 0 z" fill="#c0504a" />
    </g>

    <!-- picture [20,18,15,15] → c(330,204) -->
    <g id="item-picture" transform="translate(330 204)">
      <rect x="-82" y="-76" width="164" height="150" rx="6" fill="#8a6b4f" />
      <rect x="-64" y="-58" width="128" height="114" rx="3" fill="#bcd9e8" />
      <path d="M-64 26 q34 -22 64 -4 t64 -10 L64 56 L-64 56 Z" fill="#7fa84b" />
      <path d="M-12 -26 l16 -26 16 26 z" fill="#c0504a" />
      <path d="M-36 22 q36 16 72 0 l-9 12 h-54 z" fill="#4a3527" />
      <circle cx="34" cy="-34" r="10" fill="#f2c14e" />
    </g>

    <!-- clock [46,10,11,15] → c(618,140) -->
    <g id="item-clock" transform="translate(618 140)">
      <circle r="58" fill="#fffdf4" />
      <circle r="58" fill="none" stroke="#8a6b4f" stroke-width="8" />
      <path d="M-40 14 q40 -20 80 0" stroke="#e3d2ae" stroke-width="4" fill="none" />
      <path d="M0 0 L0 -34" stroke="#4a3527" stroke-width="5" stroke-linecap="round" />
      <path d="M0 0 L26 10" stroke="#4a3527" stroke-width="5" stroke-linecap="round" />
      <circle r="5" fill="#4a3527" />
      <path d="M-18 -46 l4 -8 4 8 z M18 -46 l4 -8 4 8 z" fill="#8a6b4f" />
    </g>

    <!-- bookshelf [44,38,14,34] → c(612,440) -->
    <g id="item-bookshelf" transform="translate(612 440)">
      <ellipse cx="0" cy="130" rx="80" ry="12" fill="#4a3527" opacity="0.08" />
      <rect x="-76" y="-128" width="152" height="256" rx="8" fill="#c89a66" />
      <rect x="-62" y="-114" width="124" height="70" rx="4" fill="#f3e2c3" />
      <rect x="-62" y="-26" width="124" height="70" rx="4" fill="#f3e2c3" />
      <rect x="-62" y="62" width="124" height="52" rx="4" fill="#f3e2c3" />
      <rect x="-56" y="-108" width="12" height="58" fill="#c0504a" />
      <rect x="-42" y="-100" width="12" height="50" fill="#5f8f3e" />
      <rect x="-28" y="-106" width="12" height="56" fill="#3f7e8c" />
      <rect x="-14" y="-98" width="10" height="48" fill="#e08a3c" />
      <rect x="-52" y="-20" width="12" height="58" fill="#3f7e8c" />
      <rect x="-38" y="-14" width="12" height="52" fill="#c0504a" />
      <rect x="-24" y="-24" width="12" height="62" fill="#f2c14e" />
      <circle cx="10" cy="80" r="14" fill="#e8d9bd" />
      <rect x="26" y="-16" width="42" height="54" rx="4" fill="#8a6b4f" transform="rotate(-8 47 11)" />
    </g>

    <!-- sofa [6,54,36,26] → c(288,536) -->
    <g id="item-sofa" transform="translate(288 536)">
      <ellipse cx="0" cy="98" rx="200" ry="16" fill="#4a3527" opacity="0.08" />
      <rect x="-196" y="-56" width="52" height="140" rx="20" fill="#c0504a" />
      <rect x="144" y="-56" width="52" height="140" rx="20" fill="#c0504a" />
      <rect x="-170" y="-6" width="340" height="88" rx="22" fill="#a8453f" />
      <rect x="-170" y="-64" width="340" height="70" rx="24" fill="#c96f62" />
      <rect x="-152" y="-56" width="140" height="54" rx="18" fill="#e0a294" />
      <rect x="12" y="-56" width="140" height="54" rx="18" fill="#e0a294" />
      <rect x="-176" y="40" width="352" height="44" rx="16" fill="#8a6b4f" />
      <rect x="-160" y="78" width="18" height="24" rx="6" fill="#8a6b4f" />
      <rect x="142" y="78" width="18" height="24" rx="6" fill="#8a6b4f" />
    </g>

    <!-- rug [34,81,26,11] → c(564,692) -->
    <g id="item-rug" transform="translate(564 692)">
      <path d="M-150 -22 q150 -22 300 0 q-10 34 -40 38 q-220 16 -260 -4 q-14 -14 0 -34 z" fill="#b98f63" />
      <path d="M-118 -8 q118 -16 236 0 q-6 18 -30 21 q-170 12 -200 -3 q-10 -10 -6 -18 z" fill="#e08a3c" opacity="0.85" />
      <path d="M-90 4 q90 -10 180 0" stroke="#fff7e4" stroke-width="7" fill="none" opacity="0.6" stroke-linecap="round" />
    </g>

    <!-- lamp [72,26,12,32] → c(936,336) -->
    <g id="item-lamp" transform="translate(936 336)">
      <path d="M-64 -118 q64 -26 128 0 l-18 44 q-46 -14 -92 0 z" fill="#e08a3c" />
      <path d="M-64 -118 q64 -26 128 0 l-4 10 q-60 -24 -120 0 z" fill="#c97430" />
      <rect x="-7" y="-76" width="14" height="230" rx="6" fill="#8a6b4f" />
      <ellipse cx="0" cy="122" rx="58" ry="14" fill="#c0504a" />
      <ellipse cx="0" cy="-66" rx="26" ry="8" fill="#f2c14e" />
    </g>

    <!-- plant [86,56,11,24] → c(1098,544) -->
    <g id="item-plant" transform="translate(1098 544)">
      <ellipse cx="0" cy="86" rx="48" ry="10" fill="#4a3527" opacity="0.08" />
      <path d="M-46 -8 q46 -18 92 0 l-12 84 q-34 12 -68 0 z" fill="#c97430" />
      <path d="M-46 -8 q46 -18 92 0 l-2 8 q-44 -16 -88 0 z" fill="#a85c22" />
      <path d="M0 -14 q-16 -58 -54 -66 q6 52 40 74 z" fill="#5f8f3e" />
      <path d="M0 -14 q18 -56 56 -60 q-10 50 -42 70 z" fill="#7fa84b" />
      <path d="M0 -10 q-6 -44 10 -74 q22 34 12 80 z" fill="#6b9a44" />
      <path d="M-2 -20 q-34 -20 -52 -6 q20 22 54 20 z" fill="#7fa84b" />
    </g>
  </svg>
</template>
