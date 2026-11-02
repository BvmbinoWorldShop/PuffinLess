import type { PsychologyLesson, Language } from '../types';
import { MORE_LESSONS } from '../content/moreLessons';
import { LESSONS_FR } from '../content/frenchTranslations';

export const PSYCHOLOGY_LESSONS: PsychologyLesson[] = [
  {
    id: 'psy-1',
    title: 'The Biological Trap: Why Quitting Feels Impossible',
    subtitle: 'The Dopamine Hijack & Delta-FosB Neural Rewiring',
    duration: '5 min masterclass',
    category: 'Biology of Craving',
    iconName: 'BrainCircuit',
    summary: 'Addiction is not a weakness of character; it is a molecular chemical hijacking of your survival circuitry.',
    keyInsights: [
      'Inhaled nicotine and cannabis reach your ventral tegmental area (VTA) within 7 to 10 seconds, sparking unnatural bursts of dopamine.',
      'To prevent neurotoxicity, your brain down-regulates its native dopamine D2 receptors, making everyday joys feel dull without a puff.',
      'A persistent protein called Delta-FosB accumulates in your neurons, acting as an epigenetic "craving switch" that persists for weeks before fading.',
    ],
    biologicalDeepDive: [
      'When you smoke or vape, you flood the nucleus accumbens with dopamine at 300% above normal physiological levels. Your brain interprets this chemical surge as a survival imperative, equating it with water, food, or shelter.',
      'When you stop, your dopamine drops below baseline. This is called the "dopamine trough." Your amygdala triggers an emergency panic response (restlessness, irritability, brain fog).',
      'The good news: Neuroplasticity is real. Human PET scans prove that after 21 to 30 days without intake, dopamine D2 receptors upregulate back to healthy, vibrant levels.',
    ],
    actionableMicroSteps: [
      'Reframe the panic: When an intense craving hits, remind yourself: "This is not me needing nicotine; this is my starving receptors crying out before they die."',
      'Engage in 20 seconds of intense cold water on your face (Dive Reflex) to instantly slow heart rate and flood the brain with norepinephrine.',
      'Consume 20-30g of protein in the morning to supply L-tyrosine, the natural amino acid precursor to dopamine.',
    ],
  },
  {
    id: 'psy-2',
    title: 'The Habit Loop: Cue, Routine & Dopamine Anticipation',
    subtitle: 'Breaking the Automated Hand-to-Mouth Loop',
    duration: '4 min masterclass',
    category: 'Habit Rewiring',
    iconName: 'Repeat',
    summary: 'Over 80% of cigarettes, puffs, or evening joints are consumed on pure autopilot without conscious intent.',
    keyInsights: [
      'Habits live in the basal ganglia, outside of your conscious prefrontal thinking.',
      'The brain releases dopamine NOT when you take the drag, but the moment you see the Cue (e.g. coffee, car, finished meal, stress ping).',
      'You cannot delete a habit loop; you can only replace the Routine while preserving the Reward.',
    ],
    biologicalDeepDive: [
      'Neuroscientist Ann Graybiel discovered "chunking": when a behavior is repeated hundreds of times, the prefrontal cortex goes to sleep, and the basal ganglia executes the routine automatically.',
      'Every smoker develops dozens of subconscious cues: starting the car, stepping onto the balcony, finishing an email, feeling lonely, or opening drinks.',
      'When the cue fires, your brain anticipates the physical hand-to-mouth and respiratory release. If you do nothing, tension skyrockets.',
    ],
    actionableMicroSteps: [
      'Audit your top 3 cues: Write down exactly when you reach for a smoke/puff (e.g., Morning coffee, Post-lunch, Driving).',
      'Substitute the Routine: Keep the cue (morning coffee) and the reward (pause, deep breath), but replace the routine with a glass of ice-cold sparkling water or a 4-7-8 breathing cycle.',
      'Break tactile continuity: Hold a stress stone, pen, or toothpicks in the hand that usually holds the cigarette.',
    ],
  },
  {
    id: 'psy-3',
    title: 'Prefrontal Willpower vs. Limbic Hunger',
    subtitle: 'Why Willpower Runs Out by 7:00 PM',
    duration: '6 min masterclass',
    category: 'Identity & Mindset',
    iconName: 'ShieldAlert',
    summary: 'Relying purely on willpower is a losing battle. Discover how to eliminate friction before your brain gets tired.',
    keyInsights: [
      'Your prefrontal cortex (the seat of discipline) runs on limited glucose and cognitive stamina. By evening, it is depleted.',
      'The limbic system (emotional, impulsive, primitive) never gets tired. It attacks when your defenses are low.',
      'Environmental design is 10x more effective than willpower. Removing access removes the internal debate.',
    ],
    biologicalDeepDive: [
      'Roy Baumeister’s research on "ego depletion" shows that every decision you make during the day (answering messages, resisting snacks, work deadlines) drains your executive control.',
      'When evening arrives, the primitive amygdala says: "You worked hard, you deserve a puff." If cigarettes, vapes, or weed are within arm’s reach, relapse occurs in seconds.',
      'Top performers don’t have superhuman willpower—they design an environment where temptation cannot reach them.',
    ],
    actionableMicroSteps: [
      'Throw away every lighter, rolling paper, ashtray, pod, and stash right now. Make access require at least 20 minutes of effort.',
      'Pre-commit your evenings: Plan specific relaxing activities (warm shower, herbal tea, sauna, gym, reading) so boredom never invites a craving.',
      'Never debate the craving: When your mind whispers "Just one puff won’t hurt," recognize it as the addicted limbic brain, not your true voice.',
    ],
  },
  {
    id: 'psy-4',
    title: 'The Identity Shift: Non-Smoker vs. Quitting Smoker',
    subtitle: 'The Linguistic Secret to Permanent Freedom',
    duration: '4 min masterclass',
    category: 'Identity & Mindset',
    iconName: 'Sparkles',
    summary: 'Saying "I cannot smoke" implies sacrifice. Saying "I don’t smoke" asserts sovereign power.',
    keyInsights: [
      'Behavior that is incongruent with your self-identity will never last.',
      'When you view quitting as deprivation, you remain a smoker in psychological exile.',
      'When you realize you sacrificed nothing and escaped a scam, quitting feels like victory.',
    ],
    biologicalDeepDive: [
      'In a famous study by Patrick & Hagtvedt, participants who used the phrase "I don’t" were 8 times more successful at resisting temptation than those who said "I can’t."',
      '"I can’t" implies an external rule forcing you to hold back what you secretly desire. It breeds resentment and eventual failure.',
      '"I don’t" signals an internal boundary, identity, and standard. It shuts down mental negotiation before it starts.',
    ],
    actionableMicroSteps: [
      'Erase the word "quitting": Say "I am a non-smoker" rather than "I am trying to quit."',
      'Write your personal manifesto: "I am someone who breathes crisp, pure air, values my cardiovascular health, and protects my financial freedom."',
      'Celebrate every craving: Each urge is not a penalty; it is the death rattle of your old addiction.',
    ],
  },
  {
    id: 'psy-5',
    title: 'Urge Surfing: Riding the 3-Minute Wave',
    subtitle: 'The Clinical Mindfulness Protocol by Dr. Alan Marlatt',
    duration: '5 min masterclass',
    category: 'Dopamine & Brain',
    iconName: 'Waves',
    summary: 'Cravings are like ocean waves. You cannot stop the wave, but you can learn to surf it without drowning.',
    keyInsights: [
      'An acute craving reaches peak intensity within 90 to 180 seconds, then organically subsides.',
      'Fighting a craving with panic intensifies blood pressure and makes the urge feel eternal.',
      'Observing the physical sensations with detached curiosity dissolves the urgency.',
    ],
    biologicalDeepDive: [
      'Dr. Alan Marlatt at the University of Washington developed "Urge Surfing" for substance dependencies with phenomenal clinical outcomes.',
      'When a craving hits, notice the physical sensations in your body: tight chest, dry throat, restless hands, stomach flutter.',
      'Instead of reacting, mentally narrate the sensation without judgment: "My chest feels tight right now. My pulse is elevated. This is just a chemical ripple. I am watching it crest and fade."',
    ],
    actionableMicroSteps: [
      'Open the PuffinLess SOS Crave button the moment you feel the wave.',
      'Do 3 cycles of 4-7-8 breathing while mentally picturing the craving as a wave breaking safely against a rocky shore.',
      'Track your victories: Every wave you surf without smoking permanently weakens future waves.',
    ],
  },
];

export function getLessons(lang: Language = 'en'): PsychologyLesson[] {
  return lang === 'fr' ? LESSONS_FR : [...PSYCHOLOGY_LESSONS, ...MORE_LESSONS];
}
