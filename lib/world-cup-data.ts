export interface BracketSlot {
  label: string;
  sub: string;
}

export interface BracketMatch {
  id: string;
  home: BracketSlot;
  away: BracketSlot;
}

function groupSlot(letter: string, position: "1st" | "2nd"): BracketSlot {
  return { label: `Group ${letter}`, sub: position };
}

function thirdPlaceSlot(index: number): BracketSlot {
  return { label: "Best 3rd-placed", sub: `#${index}` };
}

// Round of 32: 24 group winners/runners-up + 8 best third-placed teams.
export const round32: BracketMatch[] = [
  { id: "R32-1", home: groupSlot("A", "1st"), away: groupSlot("B", "2nd") },
  { id: "R32-2", home: groupSlot("B", "1st"), away: groupSlot("A", "2nd") },
  { id: "R32-3", home: groupSlot("C", "1st"), away: groupSlot("D", "2nd") },
  { id: "R32-4", home: groupSlot("D", "1st"), away: groupSlot("C", "2nd") },
  { id: "R32-5", home: groupSlot("E", "1st"), away: groupSlot("F", "2nd") },
  { id: "R32-6", home: groupSlot("F", "1st"), away: groupSlot("E", "2nd") },
  { id: "R32-7", home: groupSlot("G", "1st"), away: groupSlot("H", "2nd") },
  { id: "R32-8", home: groupSlot("H", "1st"), away: groupSlot("G", "2nd") },
  { id: "R32-9", home: groupSlot("I", "1st"), away: groupSlot("J", "2nd") },
  { id: "R32-10", home: groupSlot("J", "1st"), away: groupSlot("I", "2nd") },
  { id: "R32-11", home: groupSlot("K", "1st"), away: groupSlot("L", "2nd") },
  { id: "R32-12", home: groupSlot("L", "1st"), away: groupSlot("K", "2nd") },
  { id: "R32-13", home: thirdPlaceSlot(1), away: thirdPlaceSlot(2) },
  { id: "R32-14", home: thirdPlaceSlot(3), away: thirdPlaceSlot(4) },
  { id: "R32-15", home: thirdPlaceSlot(5), away: thirdPlaceSlot(6) },
  { id: "R32-16", home: thirdPlaceSlot(7), away: thirdPlaceSlot(8) },
];

function nextRound(previous: BracketMatch[], prefix: string): BracketMatch[] {
  const matches: BracketMatch[] = [];
  for (let i = 0; i < previous.length; i += 2) {
    matches.push({
      id: `${prefix}-${matches.length + 1}`,
      home: { label: "Winner", sub: previous[i].id },
      away: { label: "Winner", sub: previous[i + 1].id },
    });
  }
  return matches;
}

export const round16 = nextRound(round32, "R16");
export const quarterFinals = nextRound(round16, "QF");
export const semiFinals = nextRound(quarterFinals, "SF");
export const final = nextRound(semiFinals, "F");
