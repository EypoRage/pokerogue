
const typeEffectiveness: { [key: string]: { [key: string]: number } } = {
  NORMAL: { ROCK: 0.5, GHOST: 0, STEEL: 0.5, STELLAR: 1 },
  FIRE: { FIRE: 0.5, WATER: 0.5, GRASS: 2, ICE: 2, BUG: 2, ROCK: 0.5, DRAGON: 0.5, STEEL: 2, STELLAR: 1 },
  WATER: { FIRE: 2, WATER: 0.5, GRASS: 0.5, GROUND: 2, ROCK: 2, DRAGON: 0.5, STELLAR: 1 },
  ELECTRIC: { WATER: 2, ELECTRIC: 0.5, GRASS: 0.5, GROUND: 0, FLYING: 2, DRAGON: 0.5, STELLAR: 1 },
  GRASS: { FIRE: 0.5, WATER: 2, GRASS: 0.5, POISON: 0.5, GROUND: 2, FLYING: 0.5, BUG: 0.5, ROCK: 2, DRAGON: 0.5, STEEL: 0.5, STELLAR: 1 },
  ICE: { FIRE: 0.5, WATER: 0.5, GRASS: 2, ICE: 0.5, GROUND: 2, FLYING: 2, DRAGON: 2, STEEL: 0.5, STELLAR: 1 },
  FIGHTING: { NORMAL: 2, ICE: 2, POISON: 0.5, FLYING: 0.5, PSYCHIC: 0.5, BUG: 0.5, ROCK: 2, GHOST: 0, DARK: 2, STEEL: 2, FAIRY: 0.5, STELLAR: 1 },
  POISON: { GRASS: 2, POISON: 0.5, GROUND: 0.5, ROCK: 0.5, GHOST: 0.5, STEEL: 0, FAIRY: 2, STELLAR: 1 },
  GROUND: { FIRE: 2, ELECTRIC: 2, GRASS: 0.5, POISON: 2, FLYING: 0, BUG: 0.5, ROCK: 2, STEEL: 2, STELLAR: 1 },
  FLYING: { ELECTRIC: 0.5, GRASS: 2, FIGHTING: 2, BUG: 2, ROCK: 0.5, STEEL: 0.5, STELLAR: 1 },
  PSYCHIC: { FIGHTING: 2, PSYCHIC: 0.5, DARK: 0, STEEL: 0.5, STELLAR: 1 },
  BUG: { FIRE: 0.5, GRASS: 2, FIGHTING: 0.5, POISON: 0.5, FLYING: 0.5, PSYCHIC: 2, GHOST: 0.5, DARK: 2, STEEL: 0.5, FAIRY: 0.5, STELLAR: 1 },
  ROCK: { FIRE: 2, ICE: 2, FIGHTING: 0.5, GROUND: 0.5, FLYING: 2, BUG: 2, STEEL: 0.5, STELLAR: 1 },
  GHOST: { NORMAL: 0, PSYCHIC: 2, GHOST: 2, DARK: 0.5, STELLAR: 1 },
  DRAGON: { DRAGON: 2, STEEL: 0.5, FAIRY: 0, STELLAR: 1 },
  DARK: { FIGHTING: 0.5, PSYCHIC: 2, GHOST: 2, DARK: 0.5, FAIRY: 0.5, STELLAR: 1 },
  STEEL: { FIRE: 0.5, WATER: 0.5, ELECTRIC: 0.5, ICE: 2, ROCK: 2, STEEL: 0.5, FAIRY: 2, STELLAR: 1 },
  FAIRY: { FIRE: 0.5, FIGHTING: 2, POISON: 0.5, DRAGON: 2, DARK: 2, STEEL: 0.5, STELLAR: 1 },
  STELLAR: { NORMAL: 1, FIRE: 1, WATER: 1, ELECTRIC: 1, GRASS: 1, ICE: 1, FIGHTING: 1, POISON: 1, GROUND: 1, FLYING: 1, PSYCHIC: 1, BUG: 1, ROCK: 1, GHOST: 1, DRAGON: 1, DARK: 1, STEEL: 1, FAIRY: 1 }  // Define interactions of Stellar type with other types
};


export function calculateAndSortDamageMultipliers(defenderTypes: string[]) {
  const result: { [key: string]: string[] } = {
    x4: [],
    x2: [],
    x1: [],
    x05: [],
    x025: [],
    x0: []
  };

  for (const moveType in typeEffectiveness) {
    let multiplier = 1;
    for (const defenderType of defenderTypes) {
      if (defenderType === undefined) {
        continue;
      }
      const upperCaseDefenderType = defenderType.toUpperCase();
      if (typeEffectiveness[moveType] && typeEffectiveness[moveType][upperCaseDefenderType] !== undefined) {
        multiplier *= typeEffectiveness[moveType][upperCaseDefenderType];
      } else {
        multiplier *= 1;  // Neutral effectiveness if no specific interaction is defined
      }
    }

    if (multiplier === 4) {
      result.x4.push(moveType);
    } else if (multiplier === 2) {
      result.x2.push(moveType);
    } else if (multiplier === 1) {
      result.x1.push(moveType);
    } else if (multiplier === 0.5) {
      result.x05.push(moveType);
    } else if (multiplier === 0.25) {
      result.x025.push(moveType);
    } else if (multiplier === 0) {
      result.x0.push(moveType);
    }
  }
  return result
}







