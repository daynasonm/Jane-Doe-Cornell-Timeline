export const scenes = [
  {
    id: 'alcohol-ketamine',
    label: 'ALCOHOL / KETAMINE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <g fill="none" stroke="#000" stroke-width="10" stroke-linejoin="round">
        <path d="M31 25h32v40l16 23v116H15V88l16-23Z"/>
        <path d="M31 43h32M15 117h64M15 174h64"/>
        <path d="M102 121h67l-8 83h-51Z"/>
        <path d="M106 161h59"/>
        <rect x="184" y="91" width="35" height="109" rx="17.5" transform="rotate(24 201.5 145.5)"/>
        <path d="m184 138 34 15"/>
      </g>
    </svg>`,
  },
  {
    id: 'chi-phi',
    label: 'CHI PHI',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <g fill="#000">
        <path d="M20 43h23l49 154H68ZM69 43h23L43 197H20Z"/>
        <path d="M159 25h20v190h-20Z"/>
      </g>
      <ellipse cx="169" cy="120" rx="48" ry="62" fill="none" stroke="#000" stroke-width="17"/>
    </svg>`,
  },
  {
    id: 'snapchat',
    label: 'SNAPCHAT',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <g fill="none" stroke="#000" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
        <rect x="44" y="15" width="152" height="211" rx="19"/>
        <path d="M98 36h44M105 205h30"/>
        <path d="M120 62c-19 0-30 15-30 35v21l-15-5c-7-2-10 7-3 11l15 7c-3 16-12 25-24 29 5 7 14 9 23 9l4 13 16-5 14 5 14-5 16 5 4-13c9 0 18-2 23-9-12-4-21-13-24-29l15-7c7-4 4-13-3-11l-15 5V97c0-20-11-35-30-35Z"/>
      </g>
      <g fill="#000"><circle cx="103" cy="108" r="5"/><circle cx="120" cy="108" r="5"/><circle cx="137" cy="108" r="5"/></g>
    </svg>`,
  },
  {
    id: 'frat-house',
    label: 'FRAT HOUSE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <g fill="none" stroke="#000" stroke-width="11" stroke-linecap="square" stroke-linejoin="miter">
        <path d="M19 86 120 23l101 63ZM34 88v119h172V88M18 213h204M28 102h184"/>
        <path d="M51 107v94M82 107v94M158 107v94M189 107v94"/>
        <path d="M101 206v-60h38v60M111 71h18"/>
      </g>
      <g fill="#000"><path d="M47 118h39v12H47ZM154 118h39v12h-39ZM47 181h39v12H47ZM154 181h39v12h-39Z"/></g>
    </svg>`,
  },
  {
    id: 'police',
    label: 'POLICE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <path d="M120 22c-24 17-53 23-82 20v71c0 47 30 79 82 105 52-26 82-58 82-105V42c-29 3-58-3-82-20Z" fill="none" stroke="#000" stroke-width="12" stroke-linejoin="round"/>
      <path d="m120 66 14 31 34 4-25 25 6 35-29-17-29 17 6-35-25-25 34-4Z" fill="none" stroke="#000" stroke-width="10" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'title-ix',
    label: 'TITLE IX INVESTIGATION',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <g fill="none" stroke="#000" stroke-width="10" stroke-linejoin="round">
        <path d="M35 20h100l35 35v146H35ZM135 20v35h35M59 166h53M59 185h36"/>
        <circle cx="163" cy="152" r="36"/>
        <path d="m189 178 33 33" stroke-width="15" stroke-linecap="round"/>
      </g>
      <g fill="#000"><path d="M56 80h30v10h-8v45h8v10H56v-10h8V90h-8ZM93 80h15l26 65h-15ZM119 80h15l-26 65H93Z"/></g>
    </svg>`,
  },
  {
    id: 'tri-delta',
    label: 'TRI DELTA',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <g fill="none" stroke="#000" stroke-width="10" stroke-linejoin="miter">
        <path d="m42 64 31 108H11ZM120 64l31 108H89ZM198 64l31 108h-62Z"/>
      </g>
    </svg>`,
  },
];

// Original editorial symbols, rendered by the same silver pixel animation engine.
const symbol = (id, label, paths) => ({id, label, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><g fill="none" stroke="#000" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`});
scenes.push(
  symbol('crime-alert', 'Campus safety alert', '<path d="M120 25 220 205H20Z"/><path d="M120 87v56"/><circle cx="120" cy="172" r="5" fill="#000"/>'),
  symbol('documents', 'Reviewed documents', '<path d="M40 24h112l35 35v137H40Z M152 24v35h35 M67 85h92 M67 112h92 M67 139h58 M67 166h69 M66 215h141V69"/>'),
  symbol('interview', 'Witness interview', '<path d="M28 32h148v101H91l-39 32v-32H28Z M96 162h93l24 26V91h-20"/><circle cx="67" cy="81" r="5" fill="#000"/><circle cx="103" cy="81" r="5" fill="#000"/><circle cx="139" cy="81" r="5" fill="#000"/>'),
  symbol('justice', 'Independent legal inquiry', '<path d="M120 30v174 M67 211h106 M48 66h144 M48 66 21 125h54Z M192 66l-27 59h54Z"/><circle cx="120" cy="56" r="10"/>'),
  symbol('lawsuit', 'Civil lawsuit', '<path d="M30 27h112l29 30v150H30Z M142 27v30h29 M53 85h85 M53 112h64 M103 179h106 M111 202h90"/><path d="m136 106 43 43 M123 113l20-20 42 42-20 20Z M170 139l37 37"/>'),
  symbol('rugby', 'Cornell Rugby', '<ellipse cx="120" cy="120" rx="90" ry="61" transform="rotate(-35 120 120)"/><path d="m75 150 90-60 M94 117l16 22 M113 103l16 22 M132 89l16 22 M46 141c12 27 34 46 62 54 M132 45c29 8 50 28 62 54"/>'),
  symbol('community', 'Student community', '<circle cx="120" cy="68" r="25"/><circle cx="50" cy="105" r="20"/><circle cx="190" cy="105" r="20"/><path d="M76 182v-39c0-26 19-44 44-44s44 18 44 44v39Z M76 133c-26-17-58-1-58 27v41h45 M164 133c26-17 58-1 58 27v41h-45"/>'),
);
