import type { Badge, Language, UserProfile } from '../types';

export interface MilestoneExplanation {
  meaning: string;
  personalMessage: string;
}

export function getMilestoneExplanation(
  badge: Badge,
  profile: UserProfile,
  language: Language = 'fr',
  moneySaved: number = 0
): MilestoneExplanation {
  const isFr = language === 'fr';
  const name = profile.name && profile.name.trim().length > 0 ? profile.name.trim() : (isFr ? 'Champion' : 'Champion');
  const currency = profile.currency || '€';

  // Specific explanations based on badge ID
  switch (badge.id) {
    case 'b-first-hour':
    case 'badge-first-step':
      return {
        meaning: isFr
          ? 'La première heure sans fumée marque la rupture de l\'automatisme le plus violent. Vos bronches cessent d\'être irritées par des gaz à plus de 800 °C et votre rythme cardiaque amorce sa décélération physiologique vers son niveau de repos naturel.'
          : 'Your first smoke-free hour breaks the hardest automatic reflex loop. Airway thermal irritation ceases instantly, and your pulse begins decelerating toward its resting baseline.',
        personalMessage: isFr
          ? `Bravo ${name} ! C'est ici que votre liberté commence. La décision la plus difficile est toujours la première : vous venez de prouver à votre cerveau que vous êtes désormais aux commandes.`
          : `Well done ${name}! Your freedom journey starts right here. The hardest step is always the first one: you just proved to your brain that you are in control.`,
      };

    case 'b-24h':
    case 'badge-day-one':
      return {
        meaning: isFr
          ? 'En 24 heures complètes, 100 % du monoxyde de carbone a été évacué de vos globules rouges, remplacé par de l\'oxygène pur. Vos poumons ont déjà activé leurs mécanismes d\'autonettoyage et le surrisque d\'infarctus aigu commence sa trajectoire descendante.'
          : 'Within 24 full hours, 100% of carbon monoxide has cleared from your red blood cells, replaced by pure oxygen. Ciliary mucus clearance activates, and acute coronary risk begins dropping.',
        personalMessage: isFr
          ? `C'est un jalon monumental, ${name} ! Franchir 24 heures sans céder est un exploit biologique. Vous avez traversé une journée entière de déclencheurs habituels sans plier. Respirez à pleins poumons, vous pouvez être immensément fier !`
          : `A monumental milestone, ${name}! Completing 24 hours smoke-free is a true biological feat. You navigated an entire day of routine triggers without bending. Breathe deeply and stand proud!`,
      };

    case 'b-3d':
    case 'badge-3days':
      return {
        meaning: isFr
          ? 'Le cap des 72 heures correspond au pic maximal du sevrage physique. À cet instant précis, la totalité de la nicotine a été métabolisée et éliminée de votre organisme. Vos bronches se détendent et le volume d\'air inspiré augmente nettement.'
          : '72 hours marks the absolute physiological peak of withdrawal. At this exact point, 100% of nicotine has cleared your bloodstream. Bronchial tubes relax and oxygen uptake jumps noticeably.',
        personalMessage: isFr
          ? `Respect infini ${name} ! Vous venez de franchir le cap le plus redouté de toute l\'addictologie. La tempête physique est derrière vous : chaque jour à venir sera physiologiquement plus facile que les trois derniers.`
          : `Huge respect, ${name}! You have conquered the steepest physical summit in addiction science. The chemical storm is behind you: every upcoming day will be easier than the last three.`,
      };

    case 'b-1w':
    case 'badge-1week':
      return {
        meaning: isFr
          ? 'Une semaine entière de souffle pur ! Vos papilles gustatives et vos terminaisons olfactives ont entamé une régénération spectaculaire : la saveur des aliments et les parfums redeviennent intenses. La microcirculation capillaire périphérique est réactivée.'
          : 'A full week of clean air! Gustatory and olfactory nerve endings undergo rapid rejuvenation: food flavors and scents become vibrant. Peripheral capillary circulation is restored.',
        personalMessage: isFr
          ? `Félicitations chaleureuses ${name} ! Une semaine entière sans fumer prouve que vous n'êtes plus esclave de la routine. Vous avez déjà économisé de l'argent réel et offert 7 jours de répit absolu à votre cœur.`
          : `Warm congratulations ${name}! One full week proves you are no longer enslaved by routine. You have saved real money and granted 7 uninterrupted days of recovery to your heart.`,
      };

    case 'b-2w':
      return {
        meaning: isFr
          ? 'Deux semaines consécutives marquent l\'extinction définitive du manque physique. La circulation sanguine générale s\'est accrue de 15 %, votre endurance à la marche et au sport décolle, et les cils bronchiques reprennent leur balayage antibactérien.'
          : 'Two continuous weeks mark the complete expiration of physical withdrawal. Systemic circulation improves by 15%, stamina surges, and bronchial cilia resume antibacterial sweeping.',
        personalMessage: isFr
          ? `${name}, vous êtes en pleine renaissance biologique ! Votre teint est plus lumineux, votre souffle est plus profond et votre sommeil se consolide. Vous êtes en train de vous forger une santé d'acier.`
          : `${name}, you are undergoing a true biological rebirth! Your skin is brighter, breathing is deeper, and restorative sleep is returning. You are building ironclad health.`,
      };

    case 'b-1m':
    case 'badge-1month':
      return {
        meaning: isFr
          ? 'Un mois complet sans toxines ! La densité des récepteurs nicotiniques dans votre cerveau a chuté de plus de 80 %, rejoignant le profil d\'un non-fumeur. Les envies impulsives sont devenues rares et facilement maîtrisables.'
          : 'One full month toxin-free! Nicotinic acetylcholine receptor density in your brain has plunged by over 80%, mirroring non-smoker neurobiology. Acute cravings are now rare and easily deflected.',
        personalMessage: isFr
          ? `Chapeau bas ${name} ! Atteindre 30 jours est la marque distinctive de ceux qui se libèrent pour toujours. Vous avez déjà préservé ${currency}${Math.round(moneySaved)} et reconquis votre liberté mentale. Vous êtes invincible !`
          : `Hats off, ${name}! Reaching 30 days is the hallmark of those who quit permanently. You have already preserved ${currency}${Math.round(moneySaved)} and reclaimed mental clarity. Unstoppable!`,
      };

    case 'b-3m':
      return {
        meaning: isFr
          ? 'Trois mois de pureté pulmonaire. Votre capacité respiratoire globale a progressé de 10 %. La toux matinale chronique, les sinus encombrés et l\'essoufflement à l\'effort font définitivement partie du passé. Votre système immunitaire est réarmé.'
          : 'Three months of lung rejuvenation. Overall respiratory capacity has increased by up to 10%. Morning cough, sinus congestion, and shortness of breath are gone. Immunity is fully re-armed.',
        personalMessage: isFr
          ? `${name}, 90 jours représentent un tournant identitaire majeur. Vous n'êtes plus quelqu'un qui "tente d'arrêter", vous êtes désormais un non-fumeur épanoui et rayonnant d'énergie. Savourez cette victoire !`
          : `${name}, 90 days is a major identity shift. You are no longer someone "trying to quit" — you are a confident, energetic non-smoker. Savor every breath of this triumph!`,
      };

    case 'b-6m':
      return {
        meaning: isFr
          ? 'Six mois sans céder ! Les cils bronchiques sont totalement reconstitués et nettoient activement vos poumons. Le risque d\'accident vasculaire cérébral et de crise cardiaque a diminué de moitié par rapport à votre niveau d\'origine.'
          : 'Six months without relapsing! Bronchial cilia are fully renewed, continuously clearing deep lung tissue. Relative risk of stroke and cardiac events has plummeted toward baseline.',
        personalMessage: isFr
          ? `Vous êtes devenu une inspiration vivante ${name}. Six mois de victoires quotidiennes forcent l'admiration de tous vos proches. Vous avez démontré une résilience mentale hors du commun.`
          : `You have become a true inspiration, ${name}. Six months of daily victories commands respect. You have shown extraordinary mental strength and self-mastery.`,
      };

    case 'b-1y':
      return {
        meaning: isFr
          ? 'Un an entier de triomphe absolu : 365 jours de vie regagnée ! Le surrisque de maladie coronarienne est divisé par deux. Votre espérance de vie globale a gagné plusieurs années de vitalité et de liberté.'
          : 'One full year of total triumph: 365 days of reclaimed life! Excess risk of coronary heart disease is halved. Your life expectancy has expanded by multiple years of vibrant health.',
        personalMessage: isFr
          ? `${name}, vous entrez dans la légende de votre propre existence ! Un an sans tabac est un accomplissement qui transformera toutes les sphères de votre avenir. Félicitations pour ce chef-d'œuvre de volonté !`
          : `${name}, you enter the hall of champions of your own life! One year smoke-free will elevate every dimension of your future. Congratulations on this masterclass of discipline!`,
      };

    case 'b-crave-10':
    case 'badge-cravings-5':
      return {
        meaning: isFr
          ? 'Chaque pulsion désamorcée avec succès affaiblit physiquement les connexions synaptiques de l\'automatisme dans votre cerveau. En surmontant ces envies grâce au souffle et à l\'ancrage, vous avez reprogrammé votre système nerveux autonome.'
          : 'Every resisted craving physically weakens the neural wiring of automated chemical dependency. By conquering acute urges with breathwork and grounding, you rewired your autonomic nervous system.',
        personalMessage: isFr
          ? `Quelle maîtrise de soi ${name} ! Là où d'autres auraient allumé par réflexe, vous avez pris du recul et vous avez triomphé. Cette discipline émotionnelle est un super-pouvoir qui vous servira toute votre vie.`
          : `Remarkable self-command, ${name}! Where others would light up on impulse, you stepped back, breathed, and conquered. This emotional discipline is a superpower that will serve you forever.`,
      };

    case 'b-save-100':
    case 'b-save-500':
    case 'badge-save-50':
    case 'badge-save-250':
    case 'badge-save-1000':
      return {
        meaning: isFr
          ? 'Cet argent n\'est pas parti en fumée ni dans les caisses de l\'industrie du tabac. Il s\'agit d\'un capital réel, net d\'impôt, préservé dans votre compte bancaire pour récompenser vos efforts et financer vos passions.'
          : 'This money was not incinerated or handed to tobacco cartels. It is pure post-tax wealth preserved in your wallet to reward your efforts and fuel your real life passions.',
        personalMessage: isFr
          ? `${name}, votre argent travaille enfin pour votre bien-être et vos rêves ! Offrez-vous un cadeau symbolique ou investissez ce capital : vous avez mérité chaque centime de cette liberté financière.`
          : `${name}, your money is finally working for your health and dreams! Treat yourself to something meaningful: you earned every single cent of this hard-won freedom.`,
      };

    case 'badge-cigs-100':
      return {
        meaning: isFr
          ? 'Plus de 100 cigarettes ou équivalents évités ! Cela représente plus de 1 000 bouffées toxiques, 800 mg de goudrons et des milliers de composés chimiques cancérigènes qui ne pénétreront jamais dans vos poumons.'
          : 'Over 100 cigarettes or equivalents avoided! That represents over 1,000 toxic inhalations and hundreds of milligrams of carcinogenic tar that will never enter your lungs.',
        personalMessage: isFr
          ? `Cent fois vous avez dit non à l'illusion de la nicotine ${name} ! Vous avez épargné vos alvéoles et protégé vos artères. Vous êtes en train de réécrire l'histoire de votre santé.`
          : `One hundred times you said no to the nicotine trap, ${name}! You protected your alveoli and spared your arteries. You are rewriting your health history.`,
      };

    default:
      return {
        meaning: isFr
          ? 'Ce jalon symbolise une étape cruciale de régénération biologique. Chaque jour sans inhalation toxique permet à vos cellules de réparer leur ADN, à votre cœur de retrouver sa sérénité et à votre cerveau de restaurer sa sensibilité naturelle à la dopamine.'
          : 'This milestone symbolizes an essential phase of biological renewal. Every day without toxic smoke enables cellular DNA repair, cardiac rhythm restoration, and native dopamine sensitivity.',
        personalMessage: isFr
          ? `Félicitations pour votre détermination constante, ${name} ! Chaque victoire renforce votre identité de personne libre. Continuez à honorer votre engagement, vous êtes sur la voie royale.`
          : `Congratulations on your steadfast determination, ${name}! Every victory reinforces your identity as a free person. Keep honoring your commitment; you are on the royal path.`,
      };
  }
}
