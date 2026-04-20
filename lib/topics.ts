export type Subject = "biology" | "physics" | "chemistry";

export interface Topic {
  id: string;
  name: string;
  subtopics?: string[];
}

export interface SubjectData {
  name: string;
  color: string;
  code: string;
  topics: Topic[];
}

export const SUBJECTS: Record<Subject, SubjectData> = {
  biology: {
    name: "Biology",
    color: "green",
    code: "0610",
    topics: [
      { id: "bio-1", name: "Cell Structure and Organisation", subtopics: ["Plant and Animal Cells", "Cell Specialisation", "Biological Molecules"] },
      { id: "bio-2", name: "Movement In and Out of Cells", subtopics: ["Diffusion", "Osmosis", "Active Transport"] },
      { id: "bio-3", name: "Biological Molecules", subtopics: ["Carbohydrates", "Proteins", "Lipids", "Enzymes"] },
      { id: "bio-4", name: "Enzymes", subtopics: ["Enzyme Action", "Factors Affecting Enzymes"] },
      { id: "bio-5", name: "Plant Nutrition", subtopics: ["Photosynthesis", "Leaf Structure", "Mineral Salts"] },
      { id: "bio-6", name: "Human Nutrition", subtopics: ["Diet", "Digestive System", "Absorption"] },
      { id: "bio-7", name: "Transport in Plants", subtopics: ["Xylem", "Phloem", "Transpiration"] },
      { id: "bio-8", name: "Transport in Animals", subtopics: ["Heart", "Blood Vessels", "Blood", "Lymphatic System"] },
      { id: "bio-9", name: "Diseases and Immunity", subtopics: ["Pathogens", "Immune System", "Vaccines", "Antibiotics"] },
      { id: "bio-10", name: "Gas Exchange", subtopics: ["Lungs", "Breathing", "Smoking"] },
      { id: "bio-11", name: "Respiration", subtopics: ["Aerobic Respiration", "Anaerobic Respiration"] },
      { id: "bio-12", name: "Excretion", subtopics: ["Kidneys", "Kidney Function", "Dialysis"] },
      { id: "bio-13", name: "Coordination and Response", subtopics: ["Nervous System", "Hormones", "Homeostasis", "Eye"] },
      { id: "bio-14", name: "Reproduction", subtopics: ["Sexual Reproduction", "Asexual Reproduction", "Human Reproduction", "Flowering Plants"] },
      { id: "bio-15", name: "Inheritance", subtopics: ["DNA", "Cell Division", "Monohybrid Inheritance", "Genetic Diagrams"] },
      { id: "bio-16", name: "Variation and Natural Selection", subtopics: ["Variation", "Natural Selection", "Evolution"] },
      { id: "bio-17", name: "Organisms and Their Environment", subtopics: ["Food Webs", "Energy Flow", "Carbon Cycle", "Water Cycle", "Nitrogen Cycle"] },
      { id: "bio-18", name: "Human Influences on Ecosystems", subtopics: ["Pollution", "Conservation", "Deforestation"] },
      { id: "bio-19", name: "Biotechnology", subtopics: ["Genetic Engineering", "Selective Breeding", "Microorganisms"] },
    ],
  },
  physics: {
    name: "Physics",
    color: "blue",
    code: "0625",
    topics: [
      { id: "phy-1", name: "General Physics", subtopics: ["Measurements", "Length and Time", "Speed and Velocity", "Acceleration"] },
      { id: "phy-2", name: "Motion", subtopics: ["Distance-Time Graphs", "Velocity-Time Graphs", "Equations of Motion"] },
      { id: "phy-3", name: "Forces and Dynamics", subtopics: ["Newton's Laws", "Weight and Mass", "Friction", "Terminal Velocity", "Momentum"] },
      { id: "phy-4", name: "Turning Effects", subtopics: ["Moments", "Principle of Moments", "Centre of Gravity"] },
      { id: "phy-5", name: "Pressure", subtopics: ["Pressure in Solids", "Pressure in Liquids", "Atmospheric Pressure"] },
      { id: "phy-6", name: "Energy", subtopics: ["Energy Forms", "Energy Conservation", "Efficiency", "Energy Sources"] },
      { id: "phy-7", name: "Work and Power", subtopics: ["Work Done", "Power", "Kinetic Energy", "Potential Energy"] },
      { id: "phy-8", name: "Kinetic Particle Theory", subtopics: ["States of Matter", "Changes of State", "Evaporation"] },
      { id: "phy-9", name: "Thermal Physics", subtopics: ["Thermal Expansion", "Thermometers", "Specific Heat Capacity", "Latent Heat"] },
      { id: "phy-10", name: "Waves", subtopics: ["Wave Properties", "Transverse and Longitudinal Waves", "Wave Speed"] },
      { id: "phy-11", name: "Sound", subtopics: ["Sound Waves", "Speed of Sound", "Ultrasound", "Echoes"] },
      { id: "phy-12", name: "Light", subtopics: ["Reflection", "Refraction", "Total Internal Reflection", "Lenses", "Dispersion"] },
      { id: "phy-13", name: "Electromagnetic Spectrum", subtopics: ["Types of EM Waves", "Uses and Hazards"] },
      { id: "phy-14", name: "Static Electricity", subtopics: ["Electric Charge", "Electric Fields", "Hazards"] },
      { id: "phy-15", name: "Electric Circuits", subtopics: ["Current", "Voltage", "Resistance", "Series and Parallel Circuits", "Ohm's Law"] },
      { id: "phy-16", name: "Electrical Energy", subtopics: ["Electrical Power", "Energy Calculations", "Domestic Electricity"] },
      { id: "phy-17", name: "Magnetism", subtopics: ["Magnets", "Magnetic Fields", "Electromagnets"] },
      { id: "phy-18", name: "Electromagnetic Induction", subtopics: ["Induced EMF", "Generators", "Transformers"] },
      { id: "phy-19", name: "Nuclear Physics", subtopics: ["Atomic Structure", "Radioactive Decay", "Half-Life", "Fission and Fusion"] },
    ],
  },
  chemistry: {
    name: "Chemistry",
    color: "purple",
    code: "0620",
    topics: [
      { id: "chem-1", name: "States of Matter", subtopics: ["Kinetic Theory", "Changes of State", "Diffusion"] },
      { id: "chem-2", name: "Atomic Structure", subtopics: ["Sub-atomic Particles", "Electron Configuration", "Isotopes"] },
      { id: "chem-3", name: "Chemical Bonding", subtopics: ["Ionic Bonding", "Covalent Bonding", "Metallic Bonding", "Giant Structures"] },
      { id: "chem-4", name: "Stoichiometry", subtopics: ["Mole Concept", "Chemical Formulae", "Chemical Equations", "Relative Masses"] },
      { id: "chem-5", name: "Electricity and Chemistry", subtopics: ["Electrolysis", "Electrodes", "Industrial Electrolysis"] },
      { id: "chem-6", name: "Chemical Energetics", subtopics: ["Exothermic Reactions", "Endothermic Reactions", "Bond Energies"] },
      { id: "chem-7", name: "Chemical Reactions", subtopics: ["Rates of Reaction", "Catalysts", "Reversible Reactions", "Equilibrium"] },
      { id: "chem-8", name: "Acids, Bases and Salts", subtopics: ["pH Scale", "Acids", "Alkalis", "Titration", "Preparation of Salts"] },
      { id: "chem-9", name: "The Periodic Table", subtopics: ["Periodic Trends", "Group 1", "Group 7", "Transition Metals", "Noble Gases"] },
      { id: "chem-10", name: "Metals", subtopics: ["Properties of Metals", "Reactivity Series", "Metal Extraction", "Corrosion"] },
      { id: "chem-11", name: "Air and Water", subtopics: ["Composition of Air", "Pollution", "Water Treatment"] },
      { id: "chem-12", name: "Sulfur", subtopics: ["Sulfur Dioxide", "Sulfuric Acid", "Contact Process"] },
      { id: "chem-13", name: "Carbonates", subtopics: ["Carbon Cycle", "Limestone", "Calcium Compounds"] },
      { id: "chem-14", name: "Organic Chemistry", subtopics: ["Alkanes", "Alkenes", "Polymers", "Ethanol", "Carboxylic Acids"] },
    ],
  },
};

export function getSubject(s: string): Subject | null {
  if (s === "biology" || s === "physics" || s === "chemistry") return s;
  return null;
}
