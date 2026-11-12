import type { PsychologyLesson, Language } from '../types/index.ts';
import { MORE_LESSONS } from '../content/moreLessons.ts';
import { LESSONS_FR } from '../content/frenchTranslations.ts';

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
    title: 'Urge Surfing: Riding the Craving Wave',
    subtitle: 'The Mindfulness Practice Introduced by Alan Marlatt',
    duration: '5 min masterclass',
    category: 'Habit Rewiring',
    iconName: 'Waves',
    summary: 'Cravings often behave like ocean waves: they build up, crest, and gradually subside if you pause and observe them.',
    keyInsights: [
      'An acute craving often peaks within a few minutes and then gradually subsides.',
      'Reacting with frustration or panic can make an urge feel much longer than it actually is.',
      'Observing physical sensations calmly helps you ride out the moment without acting on impulse.',
    ],
    biologicalDeepDive: [
      'Alan Marlatt popularized "Urge Surfing" as a practical mindfulness technique to navigate acute impulses.',
      'When a craving hits, notice the sensations in your body: tension, restlessness, or tightness in the chest.',
      'Instead of immediately acting on the urge, take slow breaths and observe the feeling: "I notice this tension right now, and I can allow it to pass."',
    ],
    actionableMicroSteps: [
      'Open the PuffinLess SOS Crave button when you feel an urge rising.',
      'Follow a few cycles of 4-7-8 breathing to ground yourself in the present moment.',
      'Track your victories: Every wave you surf without smoking builds your confidence for future moments.',
    ],
  },
];

export function getLessons(lang: Language = 'en'): PsychologyLesson[] {
  return lang === 'fr' ? LESSONS_FR : [...PSYCHOLOGY_LESSONS, ...MORE_LESSONS];
}
