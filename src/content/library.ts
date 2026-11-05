import type { Language } from '../types';
import {
  STUDIES_FR,
  RESOURCES_FR,
  MYTHS_FR,
  NICOTINE_TIMELINE_FR,
  CANNABIS_TIMELINE_FR,
  QUOTE_LIBRARY_FR,
} from './frenchTranslations';

export type StudyTopic = 'Quitting' | 'Nicotine' | 'Cannabis' | 'Vaping' | 'Sleep' | 'Mindset' | 'Habits';

export interface StudyItem {
  id: string;
  topic: StudyTopic;
  title: string;
  source: string;
  year: number;
  finding: string;
  takeaway: string;
}

export const STUDIES: StudyItem[] = [
  { id: 's1', topic: 'Quitting', title: 'Mortality in relation to smoking: 50 years of observations on male British doctors', source: 'Doll, Peto et al., BMJ', year: 2004, finding: 'Lifelong smokers lost about 10 years of life compared with non-smokers. Stopping at 30 avoided almost all of the excess risk; at 40 it regained about 9 years, at 50 about 6 and at 60 about 3.', takeaway: 'It is never too late, but sooner is dramatically better.' },
  { id: 's2', topic: 'Quitting', title: 'Time for a smoke? One cigarette reduces your life by 11 minutes', source: 'Shaw, Mitchell & Dorling, BMJ', year: 2000, finding: 'Using UK mortality data, researchers estimated that each cigarette smoked shortens life by roughly 11 minutes on average. A 20-a-day habit is about 3.5 hours of life lost per day.', takeaway: 'This is an average estimate, but it makes the daily cost of the habit concrete.' },
  { id: 's3', topic: 'Quitting', title: '21st-century hazards of smoking and benefits of cessation in the United States', source: 'Jha et al., New England Journal of Medicine', year: 2013, finding: 'Smokers lost at least a decade of life. People who quit at ages 25–34 gained about 10 years, at 35–44 about 9 years and at 45–54 about 6 years.', takeaway: 'Every year you stay smoke-free gives life back.' },
  { id: 's4', topic: 'Quitting', title: 'Abrupt versus gradual smoking cessation: a randomized trial', source: 'Lindson-Hawley et al., Annals of Internal Medicine', year: 2016, finding: 'Quitting abruptly produced higher abstinence than cutting down gradually: about 49% vs 39% at four weeks and 22% vs 15.5% at six months.', takeaway: 'A clean break works better for most people than slowly tapering.' },
  { id: 's5', topic: 'Quitting', title: 'Estimating the number of quit attempts it takes to quit smoking successfully', source: 'Chaiton et al., BMJ Open', year: 2016, finding: 'This analysis estimated that smokers make many quit attempts, around 30 on average in the data studied, before quitting for good.', takeaway: 'A slip is part of the normal path. Persistence is the real predictor of success.' },
  { id: 's6', topic: 'Mindset', title: 'Change in mental health after smoking cessation: systematic review and meta-analysis', source: 'Taylor et al., BMJ', year: 2014, finding: 'Compared with continuing to smoke, quitting was associated with lower anxiety, depression and stress, and with better mood and quality of life.', takeaway: 'Cigarettes do not relieve stress. Withdrawal creates it.' },
  { id: 's7', topic: 'Mindset', title: 'Mindfulness training for smoking cessation: results from a randomized controlled trial', source: 'Brewer et al., Drug and Alcohol Dependence', year: 2011, finding: 'Mindfulness training reached about 31% abstinence at 17 weeks compared with about 6% for the standard American Lung Association programme.', takeaway: 'Observing a craving without acting on it is a trainable skill.' },
  { id: 's8', topic: 'Mindset', title: 'Surfing the urge: brief mindfulness-based intervention for college student smokers', source: 'Bowen & Marlatt, Psychology of Addictive Behaviors', year: 2009, finding: 'A short "urge surfing" instruction reduced cigarette use in the following week compared with a control group.', takeaway: 'Watching a craving rise and fall removes its power to command you.' },
  { id: 's9', topic: 'Mindset', title: 'Self-efficacy: toward a unifying theory of behavioral change', source: 'Albert Bandura, Psychological Review', year: 1977, finding: 'The belief that you can perform a behaviour strongly predicts whether you start it and keep going when it gets hard. Early successes raise that belief.', takeaway: 'This is why PuffinLess celebrates the first hour: small wins build the belief that carries you.' },
  { id: 's10', topic: 'Habits', title: 'How are habits formed: modelling habit formation in the real world', source: 'Lally et al., European Journal of Social Psychology', year: 2010, finding: 'Automaticity took on average 66 days to form, with a wide range from 18 to 254 days. Missing one occasional day did not materially derail the process.', takeaway: 'Expect about two months to rewire a routine. One slip does not erase progress.' },
  { id: 's11', topic: 'Habits', title: 'Implementation intentions and goal achievement: a meta-analysis', source: 'Gollwitzer & Sheeran, Advances in Experimental Social Psychology', year: 2006, finding: 'Specific "if X happens, then I will do Y" plans had a medium-to-large effect on reaching goals across 94 studies.', takeaway: 'Write your if-then plan for each trigger before the craving arrives.' },
  { id: 's12', topic: 'Nicotine', title: 'Nicotine addiction', source: 'Neal Benowitz, New England Journal of Medicine', year: 2010, finding: 'Inhaled nicotine reaches the brain within seconds, binds nicotinic receptors and triggers dopamine release. Repeated exposure causes receptor up-regulation and tolerance, which drives dependence.', takeaway: 'Addiction is a physical adaptation of the brain, not a lack of character.' },
  { id: 's13', topic: 'Nicotine', title: 'Cigarette smoking saturates brain α4β2 nicotinic acetylcholine receptors', source: 'Brody et al., Archives of General Psychiatry', year: 2006, finding: 'PET imaging showed that smoking a single cigarette occupied the large majority (around 88%) of these key nicotine receptors.', takeaway: 'Each cigarette strongly re-engages the system you are trying to calm down.' },
  { id: 's14', topic: 'Nicotine', title: 'Effects of abstinence from tobacco: valid symptoms and time course', source: 'John Hughes, Nicotine & Tobacco Research', year: 2007, finding: 'Withdrawal symptoms such as irritability, restlessness and craving begin within hours, peak in the first week and mostly fade over two to four weeks.', takeaway: 'The worst is temporary and has a known end date.' },
  { id: 's15', topic: 'Nicotine', title: 'The global tobacco epidemic: tobacco fact sheet', source: 'World Health Organization', year: 2023, finding: 'Tobacco kills more than 8 million people every year, including around 1.3 million non-smokers exposed to second-hand smoke.', takeaway: 'Quitting protects the people around you too.' },
  { id: 's16', topic: 'Sleep', title: 'Effects of nicotine on sleep during consumption, withdrawal and replacement therapy', source: 'Jaehne et al., Sleep Medicine Reviews', year: 2009, finding: 'Nicotine is stimulating: smokers tend to take longer to fall asleep, sleep more lightly and wake more often. Sleep disturbance can also occur during early withdrawal before improving.', takeaway: 'If sleep feels worse in week one, it is temporary and usually improves.' },
  { id: 's17', topic: 'Sleep', title: 'Cigarette smoking and nocturnal sleep architecture', source: 'Zhang et al., American Journal of Epidemiology', year: 2006, finding: 'In a large sleep study, smokers had lighter sleep with less slow-wave (deep) sleep than non-smokers.', takeaway: 'Deep sleep is where your body repairs itself. Smoking cuts into it.' },
  { id: 's18', topic: 'Cannabis', title: 'Adverse health effects of marijuana use', source: 'Volkow et al., New England Journal of Medicine', year: 2014, finding: 'About 9% of people who try cannabis become dependent, rising to around 1 in 6 for those who start in adolescence and 25–50% for daily users. Regular use is linked to impaired memory and respiratory symptoms.', takeaway: 'Cannabis dependence is common and real, even if it feels harmless.' },
  { id: 's19', topic: 'Cannabis', title: 'Review of the validity and significance of cannabis withdrawal syndrome', source: 'Budney et al., American Journal of Psychiatry', year: 2004, finding: 'Cannabis withdrawal includes irritability, anxiety, sleep difficulty, vivid dreams and reduced appetite. It typically starts within a day or two, peaks within the first week and fades over one to three weeks.', takeaway: 'Vivid dreams and bad sleep after quitting are signs of recovery, not a reason to relapse.' },
  { id: 's20', topic: 'Cannabis', title: 'Cannabis, cannabinoids and sleep: a review of the literature', source: 'Babson, Sottile & Morabito, Current Psychiatry Reports', year: 2017, finding: 'Cannabis may shorten the time to fall asleep in the short term, but tolerance develops quickly and long-term heavy use is associated with poorer sleep quality. Stopping often disrupts sleep temporarily.', takeaway: 'The idea that weed helps you sleep stops being true with regular use.' },
  { id: 's21', topic: 'Vaping', title: 'Electronic cigarette smoking increases aortic stiffness and blood pressure in young smokers', source: 'Vlachopoulos et al., Journal of the American College of Cardiology', year: 2016, finding: 'Vaping with nicotine acutely raised arterial stiffness and blood pressure in young adults.', takeaway: 'Nicotine strains your blood vessels whatever device delivers it.' },
  { id: 's22', topic: 'Vaping', title: 'Cardiovascular effects of electronic cigarettes', source: 'Benowitz & Fraiman, Nature Reviews Cardiology', year: 2017, finding: 'E-cigarettes likely carry lower risk than combustible cigarettes for current smokers, but nicotine itself increases heart rate and blood pressure, so they are not harmless, and long-term data are still limited.', takeaway: 'Less harmful than cigarettes is not the same as harmless. Quitting nicotine fully is the goal.' },
  { id: 's23', topic: 'Quitting', title: 'Relapse prevention: maintenance strategies in the treatment of addictive behaviors', source: 'Marlatt & Gordon (abstinence violation effect)', year: 1985, finding: 'People who treat a single lapse as total failure are far more likely to continue using. People who view a lapse as a learning event recover faster.', takeaway: 'After a slip, restart immediately. The next hour matters more than the last one.' },
];

export interface ResourceItem {
  id: string;
  type: 'Talk' | 'Documentary' | 'Book' | 'Free help';
  title: string;
  creator: string;
  year?: number;
  why: string;
  youtubeId?: string; // YouTube Video ID for embedded in-app mini player
  url?: string;
}

export const RESOURCES: ResourceItem[] = [
  { id: 'r1', type: 'Talk', title: 'A simple way to break a bad habit', creator: 'Dr. Judson Brewer, TED', year: 2015, why: 'A Brown & Yale psychiatrist shows how curiosity about a craving can replace willpower and break the habit loop.', youtubeId: '_MO-xxQdMtE' },
  { id: 'r2', type: 'Talk', title: 'Everything you think you know about addiction is wrong', creator: 'Johann Hari, TED', year: 2015, why: 'Explores why authentic connection, meaning, and lifestyle protect the human brain from chemical addiction.', youtubeId: 'PY9DcIMGxMs' },
  { id: 'r3', type: 'Talk', title: 'Sleep is your superpower', creator: 'Dr. Matthew Walker, TED', year: 2019, why: 'Why Stage-4 deep sleep matters for prefrontal willpower, neuroplasticity, and how nicotine steals it.', youtubeId: '5MuIMqhT8DM' },
  { id: 'r18', type: 'Talk', title: 'Nicotine\'s Effects on the Brain & Body & How to Quit', creator: 'Dr. Andrew Huberman, Huberman Lab', year: 2022, why: 'Stanford neurobiology breakdown of acetylcholine, dopamine circuits, withdrawal peaks, and clinical cessation tools.', youtubeId: 'uXqDDoqGoY8' },
  { id: 'r19', type: 'Talk', title: 'The Effects of Cannabis on the Brain & Body', creator: 'Dr. Andrew Huberman, Huberman Lab', year: 2022, why: 'Clinical analysis of CB1 receptors, memory retrieval, dopamine reward baselines, and THC detox timelines.', youtubeId: 'gXvuJuEDDL4' },
  { id: 'r20', type: 'Talk', title: 'Understanding Dopamine & The Addiction Spectrum', creator: 'Dr. Anna Lembke (Stanford)', year: 2021, why: 'How the neurochemical pleasure-pain balance operates and how 30-day dopamine resets restore natural vitality.', youtubeId: 'p3JLaF_4Tz8' },
  { id: 'r21', type: 'Talk', title: 'The Science of Trauma & The Roots of Addiction', creator: 'Dr. Gabor Maté', year: 2020, why: 'Deep psychological exploration of why substances temporarily soothe inner pain and how self-compassion unlocks freedom.', youtubeId: 'BVg2bfqblGI' },
  { id: 'r4', type: 'Documentary', title: 'Merchants of Doubt', creator: 'Robert Kenner', year: 2014, why: 'How industries, including tobacco, manufactured doubt about health science.' },
  { id: 'r5', type: 'Documentary', title: 'Addiction (HBO series with the NIH)', creator: 'HBO / NIDA', year: 2007, why: 'A science-led series on how addiction changes the brain and how recovery works.' },
  { id: 'r6', type: 'Documentary', title: 'The Insider', creator: 'Michael Mann (film)', year: 1999, why: 'A dramatised true story of the tobacco whistleblower who exposed nicotine manipulation.' },
  { id: 'r7', type: 'Book', title: 'The Easy Way to Stop Smoking', creator: 'Allen Carr', why: 'Reframes quitting as escaping a trap rather than a sacrifice. Millions have successfully broken free with it.' },
  { id: 'r8', type: 'Book', title: 'The Craving Mind', creator: 'Dr. Judson Brewer', year: 2017, why: 'The neuroscience of craving and how mindfulness interrupts the habit loop.' },
  { id: 'r9', type: 'Book', title: 'Atomic Habits', creator: 'James Clear', year: 2018, why: 'Practical systems for replacing routines, identity reframing, and habit friction architecture.' },
  { id: 'r10', type: 'Book', title: 'The Power of Habit', creator: 'Charles Duhigg', year: 2012, why: 'The cue, routine, reward loop and how to rewrite it.' },
  { id: 'r11', type: 'Book', title: 'Dopamine Nation', creator: 'Dr. Anna Lembke', year: 2021, why: 'Why pleasure and pain balance in the brain, and how to reset neurotransmitter baselines.' },
  { id: 'r12', type: 'Book', title: 'Why We Sleep', creator: 'Dr. Matthew Walker', year: 2017, why: 'A deep dive into how restorative REM and slow-wave sleep drives willpower and emotional stability.' },
  { id: 'r13', type: 'Book', title: 'Breath: The New Science of a Lost Art', creator: 'James Nestor', year: 2020, why: 'How conscious nasal breathing resets the autonomic nervous system and relieves chronic stress.' },
  { id: 'r22', type: 'Book', title: 'The Body Keeps the Score', creator: 'Dr. Bessel van der Kolk', year: 2014, why: 'Groundbreaking book on how stress is stored in neurobiology and how physical breath rewires trauma.' },
  { id: 'r23', type: 'Book', title: 'Man\'s Search for Meaning', creator: 'Viktor E. Frankl', year: 1946, why: 'Between stimulus and response lies human freedom. The timeless classic on choosing sovereignty over circumstance.' },
  { id: 'r24', type: 'Book', title: 'In the Realm of Hungry Ghosts', creator: 'Dr. Gabor Maté', year: 2008, why: 'Compassionate medical exploration of addiction, attachment biology, and lasting emotional healing.' },
  { id: 'r14', type: 'Free help', title: 'Smokefree.gov (US National Cancer Institute)', creator: 'Free quit plan, text programmes and tips', why: 'Free, evidence-based tools and text-message support.' },
  { id: 'r15', type: 'Free help', title: '1-800-QUIT-NOW (US)', creator: 'Free quitline', why: 'Free confidential coaching from trained counsellors in the US.' },
  { id: 'r16', type: 'Free help', title: 'NHS Better Health: Quit Smoking (UK)', creator: 'Free support and tools', why: 'Free quit plan and local stop-smoking services in the UK.' },
  { id: 'r17', type: 'Free help', title: 'SAMHSA National Helpline: 1-800-662-4357 (US)', creator: 'Free, 24/7, confidential', why: 'Treatment referrals for cannabis or other substance use.' },
];

export interface MythFact {
  id: string;
  myth: string;
  fact: string;
}

export const MYTHS: MythFact[] = [
  { id: 'm1', myth: 'Smoking relaxes me.', fact: 'Nicotine is a stimulant. The calm you feel is the relief of withdrawal ending. Between cigarettes, smokers are actually more tense, and ex-smokers report lower stress after quitting.' },
  { id: 'm2', myth: 'Weed helps me sleep.', fact: 'It can speed up falling asleep at first, but with regular use sleep quality drops and stopping triggers insomnia for a while. The brain misses the dreaming it was suppressing.' },
  { id: 'm3', myth: 'Vaping is just water vapour.', fact: 'The aerosol contains nicotine, ultrafine particles and chemicals from heated flavourings. Nicotine salts deliver high doses that make dependence strong.' },
  { id: 'm4', myth: 'I have smoked for too long for quitting to matter.', fact: 'Heart-attack risk falls within the first year and lung function improves within weeks. Quitting even in your 60s adds years of life.' },
  { id: 'm5', myth: 'I will just cut down gradually.', fact: 'Trials show that quitting on a set day beats gradual reduction for most people. Each cigarette keeps the cycle alive.' },
  { id: 'm6', myth: 'One cigarette will not hurt.', fact: 'One cigarette re-saturates most of your nicotine receptors and often restarts the full habit. Most relapses begin with "just one".' },
  { id: 'm7', myth: 'Cannabis is not addictive.', fact: 'Around 1 in 10 users become dependent, and up to half of daily users. Withdrawal is real, with irritability, poor sleep and low appetite.' },
  { id: 'm8', myth: 'If I slip, I have failed.', fact: 'Most people quit successfully only after several attempts. A slip is information about a trigger. Restart right away and keep your streak history.' },
  { id: 'm9', myth: 'I need willpower to quit.', fact: 'Plans beat willpower. Remove cues, prepare if-then responses and use tools like breathing and urge surfing so you rarely rely on grit.' },
];

export interface WithdrawalStage {
  when: string;
  what: string;
  tip: string;
}

export const NICOTINE_TIMELINE: WithdrawalStage[] = [
  { when: '4–24 hours', what: 'Cravings begin. Irritability, restlessness, difficulty concentrating.', tip: 'Drink water, move for 5 minutes and use the Craving button at the first wave.' },
  { when: 'Days 2–3', what: 'Withdrawal climbs toward its peak. Headaches, strong cravings, poor sleep.', tip: 'Cut caffeine in half, keep evenings busy and sleep as much as you can.' },
  { when: 'Days 3–7', what: 'Peak intensity, then it starts to ease. Nicotine is out of your body.', tip: 'This is the hardest stretch. Stay away from alcohol and from your usual smoking spots.' },
  { when: 'Weeks 2–4', what: 'Physical symptoms fade. Mood and sleep recover. Cravings are shorter.', tip: 'Triggers are now mostly habit. Rehearse your if-then plans.' },
  { when: 'Months 2–3', what: 'Occasional cues still trigger cravings. Lung function and energy noticeably improve.', tip: 'Celebrate. Do not test yourself with "just one".' },
];

export const CANNABIS_TIMELINE: WithdrawalStage[] = [
  { when: 'Days 1–2', what: 'Irritability, anxiety, restlessness and reduced appetite start.', tip: 'Eat regular meals and take daily walks.' },
  { when: 'Days 2–6', what: 'Peak symptoms: insomnia, vivid dreams, sweating, mood swings.', tip: 'Keep a fixed bedtime, avoid screens late and use the 4-7-8 breathing exercise.' },
  { when: 'Weeks 2–3', what: 'Most symptoms fade. Sleep begins to normalise, dreams settle.', tip: 'Replace the evening ritual with tea, a shower or stretching.' },
  { when: 'Weeks 4+', what: 'Clearer thinking and memory. Cravings now mostly tied to cues and routines.', tip: 'Track your sleep and energy: the improvement is measurable.' },
];

export interface QuoteItem {
  id: string;
  quote: string;
  author: string;
  category: 'Resilience' | 'Habits' | 'Health' | 'Calm' | 'Identity' | 'Starting';
}

export const QUOTE_LIBRARY: QuoteItem[] = [
  { id: 'ql1', quote: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear', category: 'Habits' },
  { id: 'ql2', quote: 'Every action you take is a vote for the type of person you wish to become.', author: 'James Clear', category: 'Identity' },
  { id: 'ql3', quote: 'It is not the mountain we conquer, but ourselves.', author: 'Edmund Hillary', category: 'Resilience' },
  { id: 'ql4', quote: 'The only way out is through.', author: 'Robert Frost', category: 'Resilience' },
  { id: 'ql5', quote: 'Fall seven times, stand up eight.', author: 'Japanese proverb', category: 'Resilience' },
  { id: 'ql6', quote: 'A journey of a thousand miles begins with a single step.', author: 'Lao Tzu', category: 'Starting' },
  { id: 'ql7', quote: 'The best time to plant a tree was twenty years ago. The second best time is now.', author: 'Proverb', category: 'Starting' },
  { id: 'ql8', quote: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt', category: 'Starting' },
  { id: 'ql9', quote: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier', category: 'Habits' },
  { id: 'ql10', quote: 'Motivation is what gets you started. Habit is what keeps you going.', author: 'Jim Ryun', category: 'Habits' },
  { id: 'ql11', quote: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn', category: 'Habits' },
  { id: 'ql12', quote: 'Take care of your body. It is the only place you have to live.', author: 'Jim Rohn', category: 'Health' },
  { id: 'ql13', quote: 'Health is not valued till sickness comes.', author: 'Thomas Fuller', category: 'Health' },
  { id: 'ql14', quote: 'The groundwork of all happiness is health.', author: 'Leigh Hunt', category: 'Health' },
  { id: 'ql15', quote: 'Almost everything will work again if you unplug it for a few minutes, including you.', author: 'Anne Lamott', category: 'Calm' },
  { id: 'ql16', quote: 'Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.', author: 'Thich Nhat Hanh', category: 'Calm' },
  { id: 'ql17', quote: 'Pain is inevitable. Suffering is optional.', author: 'Haruki Murakami', category: 'Calm' },
  { id: 'ql18', quote: 'Tough times never last, but tough people do.', author: 'Robert H. Schuller', category: 'Resilience' },
  { id: 'ql19', quote: 'Do not count the days, make the days count.', author: 'Muhammad Ali', category: 'Resilience' },
  { id: 'ql20', quote: 'Strength does not come from physical capacity. It comes from an indomitable will.', author: 'Mahatma Gandhi', category: 'Resilience' },
  { id: 'ql21', quote: 'Rock bottom became the solid foundation on which I rebuilt my life.', author: 'J.K. Rowling', category: 'Resilience' },
  { id: 'ql22', quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Will Durant', category: 'Habits' },
  { id: 'ql23', quote: 'Between stimulus and response there is a space. In that space is our power to choose.', author: 'Attributed to Viktor Frankl', category: 'Identity' },
  { id: 'ql24', quote: 'He who conquers himself is the mightiest warrior.', author: 'Attributed to Confucius', category: 'Identity' },
  { id: 'ql25', quote: 'You can start where you are and change the ending.', author: 'Attributed to C.S. Lewis', category: 'Starting' },
  { id: 'ql26', quote: 'Sleep is the best meditation.', author: 'Attributed to the Dalai Lama', category: 'Calm' },
  { id: 'ql27', quote: 'A craving is a wave. It rises, it peaks, it passes. You do not have to follow it.', author: 'PuffinLess', category: 'Calm' },
  { id: 'ql28', quote: 'You are not giving something up. You are getting your breath, your money and your mornings back.', author: 'PuffinLess', category: 'Identity' },
  { id: 'ql29', quote: 'One hour at a time is a perfectly valid way to quit.', author: 'PuffinLess', category: 'Starting' },
  { id: 'ql30', quote: 'A slip is data. A restart is a decision.', author: 'PuffinLess', category: 'Resilience' },
];

export function getStudies(lang: Language = 'en'): StudyItem[] {
  return lang === 'fr' ? STUDIES_FR : STUDIES;
}

export function getResources(lang: Language = 'en'): ResourceItem[] {
  return lang === 'fr' ? RESOURCES_FR : RESOURCES;
}

export function getMyths(lang: Language = 'en'): MythFact[] {
  return lang === 'fr' ? MYTHS_FR : MYTHS;
}

export function getTimeline(kind: 'nicotine' | 'cannabis', lang: Language = 'en'): WithdrawalStage[] {
  if (kind === 'nicotine') {
    return lang === 'fr' ? NICOTINE_TIMELINE_FR : NICOTINE_TIMELINE;
  }
  return lang === 'fr' ? CANNABIS_TIMELINE_FR : CANNABIS_TIMELINE;
}

export function getQuotes(lang: Language = 'en'): QuoteItem[] {
  return lang === 'fr' ? QUOTE_LIBRARY_FR : QUOTE_LIBRARY;
}
