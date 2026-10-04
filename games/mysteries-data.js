// Two-minute mysteries: every clue needed is in the story. `clue` is the phrase highlighted in the reveal.
const MINI_MYSTERIES = [
  {
    title: 'Still Warm',
    story: `At two in the morning someone smashed the window of Khun Somchai's noodle shop and took the cash box.

Twenty minutes later, Sergeant Malee knocked on the door of Anan, who had argued loudly with Somchai that afternoon. Anan answered in a T-shirt and sarong, rubbing his eyes.

"I've been asleep since ten," he yawned. "Haven't left the house all night."

Malee glanced at the carport. Anan's motorbike sat in its usual spot, and in the quiet street she could hear a soft tick... tick... tick coming from its engine.

She smiled. "Get your shoes, Anan."`,
    question: 'Why didn\'t Malee believe Anan?',
    options: ['He was rubbing his eyes too much', 'The motorbike engine was still ticking', 'He was wearing a sarong', 'He had argued with Somchai'],
    answer: 1,
    clue: 'tick... tick... tick',
    reveal: 'A motorbike engine ticks as the hot metal cools down, and it only does that for a while after a ride. If Anan had really been asleep since ten, the engine would have gone cold and silent hours ago.',
  },
  {
    title: 'Breaking News',
    story: `On Tuesday evening the whole valley around Ban Mae Rim lost power at eight o'clock. The lights didn't come back until ten.

That same night, someone slipped into Grandma Noi's house and took her gold necklace from the dresser.

Her nephew Krit was quick to explain where he'd been. "At home, watching TV. I watched the eight o'clock news, then the football. Liverpool won 2–1. The second goal was at about half past nine, brilliant header."

Grandma Noi patted his hand. "Krit, dear. You are a very bad liar."`,
    question: 'How did Grandma Noi know?',
    options: ['Liverpool actually lost', 'The news is on at seven', 'There was no electricity from eight until ten', 'Krit doesn\'t like football'],
    answer: 2,
    clue: 'lost power at eight o\'clock',
    reveal: 'The whole valley had no power from eight until ten, so nobody could have been watching the news or the football on TV. Krit invented his evening.',
  },
  {
    title: 'Paid in Full',
    story: `Mr. Chai swore he had paid back the 50,000 baht he borrowed from his old friend Wichai. Wichai's family said he hadn't.

Chai produced a handwritten note, signed by Wichai: "Received 50,000 baht from Chai. Debt paid in full. 31 April 2025."

"There," said Chai. "Proof."

The lawyer read the note twice, then handed it back. "This proves something, Khun Chai. Just not what you think."`,
    question: 'What was wrong with the note?',
    options: ['Wichai never signed notes', 'There is no 31st of April', 'It should be in Thai Buddhist years', '50,000 baht is too much'],
    answer: 1,
    clue: '31 April 2025',
    reveal: 'April only has 30 days. Nobody writing a real receipt would date it the 31st of April. The note was forged.',
  },
  {
    title: 'Bone Dry',
    story: `It had been pouring in Bangkok since six o'clock, the kind of rain that floods the sois in minutes.

At 7:40 a laptop vanished from an office on the 12th floor. At 8:00 the security guard stopped Mr. Weerapong in the lobby.

"I've only just arrived," Weerapong said. "I walked here from the BTS station ten minutes ago to pick up some files."

He held up his umbrella as if to prove it. It was neatly folded, strapped shut, and completely dry. So were his shoes.`,
    question: 'Why was the guard suspicious?',
    options: ['The BTS doesn\'t stop nearby', 'His umbrella and shoes were dry after "walking in the rain"', 'He works on a different floor', 'Nobody picks up files at night'],
    answer: 1,
    clue: 'completely dry',
    reveal: 'Anyone who had just walked ten minutes through a Bangkok downpour would have a dripping umbrella and wet shoes. Weerapong had been inside the building all along.',
  },
  {
    title: 'On the Rocks',
    story: `It was a sticky, airless night. At 11:30 the police arrived at the garden house where Mrs. Pim's diamond ring had gone missing.

Her guest, Jasper, was relaxing in the garden. "We had drinks at nine," he said. "Pim felt sleepy and went to bed at half past. I've been out here reading ever since."

On the garden table sat his glass, the one he said he'd poured at nine. Three ice cubes floated in it, their edges still sharp.`,
    question: 'What gave Jasper away?',
    options: ['He was reading in the dark', 'The ice cubes were barely melted', 'Mrs. Pim doesn\'t drink', 'He was still awake at 11:30'],
    answer: 1,
    clue: 'their edges still sharp',
    reveal: 'On a hot night, ice melts away in well under an hour. Sharp-edged cubes meant the drink had just been poured. Jasper hadn\'t been sitting in the garden all evening at all.',
  },
  {
    title: 'The Quiet Night',
    story: `Khun Dao has a small, fluffy chihuahua with very big opinions. He lives with her above her bakery and barks at every single stranger who comes near the gate. He does not stop until they leave.

On Saturday night someone came through the gate and took the takings from the bakery's back room.

There were three suspects: a new delivery driver who had never been to the bakery, a stranger in a cap seen in the street at eleven, and Dao's cousin Ton, who visits every weekend and always brings the dog a treat.

The neighbours all agreed on one thing: the night was perfectly quiet. Not a single bark.`,
    question: 'Who took the money?',
    options: ['The new delivery driver', 'The stranger in the cap', 'Cousin Ton', 'Nobody, it was misplaced'],
    answer: 2,
    clue: 'Not a single bark',
    reveal: 'The chihuahua barks at every stranger, so whoever came through the gate was someone he knew well. Only cousin Ton, the weekend visitor with the treats, could get past him in silence.',
  },
  {
    title: 'Wet Paint',
    story: `The park keeper repainted the green benches by the lake that morning and hung signs on each one: WET PAINT. DRY BY EVENING.

That afternoon, a handbag was snatched from a café across town.

Mr. Kittisak had an alibi ready. "I sat on the green bench by the lake from one until four, feeding the ducks. I didn't move once."

He was wearing white trousers, which were spotless.`,
    question: 'Why didn\'t his alibi hold up?',
    options: ['Ducks don\'t come out in the afternoon', 'His white trousers had no paint on them', 'The lake is closed on weekdays', 'He couldn\'t have seen the café from there'],
    answer: 1,
    clue: 'which were spotless',
    reveal: 'The benches were freshly painted and wouldn\'t dry until evening. Three hours sitting on one would have left green stripes all over his white trousers.',
  },
  {
    title: 'Window Seat',
    story: `On a short flight from Bangkok to Chiang Mai, a passenger's wallet disappeared from the overhead bin above row 14.

On this plane, every row has six seats, A to F, with A and F next to the windows.

The cabin crew asked Mr. Lek, who had been sitting in row 14, whether he'd seen anything.

"Sorry, I slept the whole flight with my head against the window," he said, pointing at his boarding pass. "Seat 14C. I never got up."`,
    question: 'What was wrong with Mr. Lek\'s story?',
    options: ['Row 14 doesn\'t exist on planes', 'Seat C is an aisle seat, not a window', 'Nobody can sleep on a short flight', 'Wallets aren\'t allowed in overhead bins'],
    answer: 1,
    clue: 'A and F next to the windows',
    reveal: 'With seats A to F and the windows at A and F, seat C is on the aisle, right under the overhead bins and nowhere near a window to lean on.',
  },
  {
    title: 'Page Forty-One',
    story: `During Miss Hattie's book club party, her sapphire brooch went missing from the downstairs sitting room.

Florence said she couldn't have taken it. "I spent the whole evening upstairs in the reading room. I finished the entire novel, all three hundred pages. Couldn't put it down!"

She handed Miss Hattie the book as proof. A neat paper bookmark peeked out from between the pages. It was at page 41.`,
    question: 'Why didn\'t Miss Hattie believe Florence?',
    options: ['The book has fewer than 300 pages', 'Her bookmark was only at page 41', 'There is no reading room upstairs', 'Florence doesn\'t like novels'],
    answer: 1,
    clue: 'It was at page 41',
    reveal: 'Someone who had just finished a 300-page book wouldn\'t leave the bookmark at page 41. Florence hadn\'t been reading all evening.',
  },
  {
    title: 'Long Shadows',
    story: `A jewellery shop in Bangkok was robbed at exactly twelve noon.

Suspect Mr. Boon had a photo to prove he was 200 km away in Hua Hin. "Taken at noon on the dot," he said proudly. "Me, the beach, the palm trees."

It was a lovely photo. The palm trees threw long, thin shadows right across the sand.`,
    question: 'What was wrong with the photo?',
    options: ['Hua Hin has no palm trees', 'At noon in Thailand shadows are short, not long', 'The sea is the wrong colour', 'Photos can\'t prove anything'],
    answer: 1,
    clue: 'long, thin shadows',
    reveal: 'In Thailand at noon the sun is almost straight overhead, so shadows are short. Long shadows mean early morning or late afternoon. The photo wasn\'t taken at noon.',
  },
  {
    title: 'Fresh Mud',
    story: `It rained all night in the village and stopped at six in the morning.

At half past six, the vicar discovered that the silver candlesticks were missing from the little church. The only way in was through the churchyard, along a muddy path.

The gardener, Tom, said he hadn't set foot outside his cottage since the evening before. His cottage is reached by a gravel path.

By his front door stood his boots, caked in fresh, wet mud.`,
    question: 'What gave Tom away?',
    options: ['Gardeners always wear boots', 'Wet mud on his boots, though his path is gravel', 'He lives next to the church', 'The vicar didn\'t like him'],
    answer: 1,
    clue: 'caked in fresh, wet mud',
    reveal: 'Tom\'s own path is gravel, and the rain only stopped at six. Fresh wet mud on his boots means he had walked somewhere muddy that morning, like the churchyard.',
  },
  {
    title: 'Sunset at the Cape',
    story: `Witnesses place a pickpocket in Patong at 8:30pm. Suspect Mr. Nop has a friend who swears he was somewhere else.

"We were at Promthep Cape all evening," the friend said. "We watched the sunset together. It went down at about half past eight, it was beautiful."

The officer, who had lived in Phuket for twenty years and watched the sunset crowds leave the cape before seven every evening, put down her pen.`,
    question: 'Why didn\'t the officer believe the friend?',
    options: ['Promthep Cape faces east', 'In Thailand the sun sets around 6:30, not 8:30', 'Friends always lie', 'It was a cloudy day'],
    answer: 1,
    clue: 'leave the cape before seven every evening',
    reveal: 'Thailand is close to the equator, so the sun sets around half past six all year round. Nobody watched the sunset at 8:30 because it had already been dark for two hours.',
  },
  {
    title: 'Grandpa\'s Letter',
    story: `Grandpa Somsak died in 2017. Since then, his family has argued over who should get his old teak house.

One day, cousin Daeng produced a letter in Grandpa's handwriting: "I leave the teak house to Daeng." He said Grandpa had written it back in 1990.

The letter was dated in the Thai way, using Buddhist Era years: 12 May 2563.`,
    question: 'Why is the letter a fake?',
    options: ['Grandpa couldn\'t write', 'B.E. 2563 is the year 2020, after Grandpa died', 'Letters must be typed', 'May is the wrong month'],
    answer: 1,
    clue: '12 May 2563',
    reveal: 'Buddhist Era years are 543 ahead of the Western calendar. B.E. 2563 is 2020, three years after Grandpa died. 1990 would have been B.E. 2533.',
  },
  {
    title: 'Cold Tea',
    story: `Old Mr. Whitcombe was found asleep in his armchair with his safe wide open and his gold watch gone.

His housekeeper said the thief must have come in moments earlier. "I brought him his tea only five minutes ago, and he was perfectly fine."

The inspector looked at the cup on the side table. It was full to the brim, stone cold, and a wrinkled skin had formed on top of the milk.`,
    question: 'What does the tea tell the inspector?',
    options: ['Mr. Whitcombe doesn\'t like tea', 'The tea had been sitting there for a long time', 'The housekeeper makes bad tea', 'Someone added sleeping pills'],
    answer: 1,
    clue: 'stone cold, and a wrinkled skin had formed',
    reveal: 'Tea poured five minutes earlier would still be warm. A cold cup with a skin on the milk had been sitting for an hour or more. The housekeeper was lying about the time.',
  },
  {
    title: 'Clear Glasses',
    story: `A gold chain was taken from a stall in the hot, sticky night market at ten o'clock.

Suspect Mr. Pakorn said he'd spent the whole evening in his bedroom with the air-con turned right down to 18 degrees. "It's freezing in there. I only just came out."

The detective led him straight out onto the humid veranda to talk. Pakorn's glasses stayed perfectly clear.`,
    question: 'Why was the detective suspicious?',
    options: ['Nobody sets the air-con to 18', 'Glasses fog up going from a cold room into humid air', 'He wasn\'t wearing a jumper', 'The night market closes at nine'],
    answer: 1,
    clue: 'stayed perfectly clear',
    reveal: 'Cold lenses fog up the moment they hit warm, humid air. Anyone who\'d really been in an 18-degree room would have walked out completely blind. Pakorn had been outside all along.',
  },
  {
    title: 'Postcard from Paris',
    story: `Mrs. Lamai received a postcard of the Eiffel Tower: "Greetings from Paris! Sorry I missed your party, I've been in France all month. Love, Jib."

Then Lamai noticed her pearl earrings were gone, the ones that had been on the hall table during the party.

She turned the postcard over and looked closely at the stamp. It showed the King of Thailand.`,
    question: 'What gave Jib away?',
    options: ['The Eiffel Tower is in London', 'A postcard sent from France would have a French stamp', 'Jib never writes postcards', 'Paris is closed in summer'],
    answer: 1,
    clue: 'It showed the King of Thailand',
    reveal: 'A postcard posted in France would carry a French stamp. A Thai stamp means it was posted in Thailand, so Jib was never in Paris and could easily have been at the party.',
  },
  {
    title: 'Dead Battery',
    story: `Somebody keyed the side of Khun Ratana's new car in the condo car park between 9:00 and 9:30pm.

Her ex, Phum, said he couldn't have been there. "My phone died at nine. I was stuck at the bar with no battery until I got home at midnight. Ask anyone."

Ratana's friend showed the police a Grab receipt she'd found on the car park floor, near the car: "Ride booked 9:42pm. Passenger: Phum."`,
    question: 'Why doesn\'t Phum\'s story work?',
    options: ['Bars don\'t have phone chargers', 'You can\'t book a Grab with a dead phone', 'Grab doesn\'t work at night', 'He has no car'],
    answer: 1,
    clue: 'Ride booked 9:42pm',
    reveal: 'A Grab ride is booked on a phone. If Phum\'s phone had been dead since nine, he couldn\'t have booked a ride at 9:42, and certainly not from the car park.',
  },
];

// ---------------------------------------------------------------------------
// Case files: interview suspects, examine evidence, catch lies, then accuse.
// A statement can be challenged with evidence; `lies` says which evidence breaks which statement.
const CASES = [
  {
    id: 'larkspur',
    title: 'The Last Cup at Larkspur Cottage',
    tagline: 'A cozy village poisoning',
    intro: [
      'You\'ve come to the village of Little Wendham for a quiet weekend. Everyone here knows you as the person who finishes the newspaper\'s cryptic crossword before the kettle boils.',
      'Your host was supposed to be your old friend Edmund Fairweather, a retired antiques dealer who lives at No. 4 Mill Lane, a cottage called Larkspur. Edmund loved puzzles almost as much as you do.',
      'But at a quarter past five this afternoon, his housekeeper found him slumped over his desk, his teacup tipped onto the blotter.',
      'Dr Ashby, the village doctor (and, everyone will tell you, the man whose foxgloves win first prize at the flower show every summer), was called at once. "Heart failure," he announced. Edmund had a weak heart and took digitalis drops for it. "The poor old fellow must have muddled his dose."',
      'Constable Pike is happy to call it an accident. You are not. Something about that teacup bothers you.',
      'Talk to the people in the house, look at the evidence, and when someone tells you something that isn\'t true, challenge them with proof.',
    ],
    people: {
      agnes: { name: 'Agnes Pryor', role: 'Housekeeper, twenty years at Larkspur', icon: '🧹' },
      lionel: { name: 'Lionel Gale', role: 'Antiques dealer, Edmund\'s rival. Always has a pipe in his mouth', icon: '🎩' },
      clara: { name: 'Clara Fairweather', role: 'Edmund\'s niece, who inherits the cottage', icon: '👒' },
      ashby: { name: 'Dr Philip Ashby', role: 'Village doctor, prize-winning gardener', icon: '🩺' },
    },
    talks: [
      { id: 'a1', who: 'agnes', q: 'What happened this afternoon?', a: 'I took tea to the study at half past four, for Mr Edmund and that Mr Gale. At a quarter past five I went to collect the tray and found him... like that. I called the doctor straight away.' },
      { id: 'a2', who: 'agnes', q: 'How did Edmund take his tea?', a: 'Strong, with a big spoon of honey. Nobody else in this house touches honey. Miss Clara and I take sugar.', note: 'Only Edmund ever had honey in his tea.' },
      { id: 'a3', who: 'agnes', q: 'Where does the honey come from?', a: 'From Wendham Stores, same as always.', statement: true },
      { id: 'a4', who: 'agnes', q: 'Did Edmund have any secrets?', a: 'He kept a little notebook in some kind of code. Used to tap his nose and say the key to his secrets was his own front door.', note: 'Edmund said the key to his code was his front door.' },
      { id: 'a5', who: 'agnes', q: 'Who left the honey, then?', req: 'lie_agnes', a: 'I don\'t know, and that\'s the truth! The jar was on the doorstep this morning with a little card. Bert the milkman left a note about it in the empty bottle. I kept both in the kitchen drawer.', note: 'The honey was a "gift" left on the doorstep this morning.' },

      { id: 'l1', who: 'lionel', q: 'Why were you visiting Edmund?', a: 'Business. He sold me a carriage clock last month that turned out to be a fake. Forty pounds! I came to get my money back.' },
      { id: 'l2', who: 'lionel', q: 'When did you leave?', a: 'Before tea. A quarter past four. I never touched a drop.', statement: true },
      { id: 'l3', who: 'lionel', q: 'What really happened at tea?', req: 'lie_lionel', a: 'Fine! I stayed until ten to five. We argued, yes, but he was alive when I left, I swear it. He even grumbled that the new honey tasted bitter. I thought it was just his temper.', note: 'Lionel: Edmund said the new honey tasted bitter.' },
      { id: 'l4', who: 'lionel', q: 'Did you want him dead?', a: 'Over a clock? Don\'t be absurd. I wanted my forty pounds back, and now I\'ll never see it.', statement: true },

      { id: 'c1', who: 'clara', q: 'When did you arrive in the village?', a: 'On the 5:30 train. I came straight from the station and found everyone in a terrible state.', statement: true },
      { id: 'c2', who: 'clara', q: 'You inherit the cottage?', a: 'Yes, and his debts. Uncle Edmund had more debts than antiques, you know.' },
      { id: 'c3', who: 'clara', q: 'Did you send your uncle a present?', a: 'A present? I can barely afford the train fare.', statement: true },
      { id: 'c4', who: 'clara', q: 'Where were you really this afternoon?', req: 'lie_clara', a: 'I came early, on the 3:10. I went to the surgery to ask Dr Ashby whether Uncle\'s heart was getting worse. He wasn\'t in, so I waited in his garden. All his prize foxgloves had been cut right down to the stalks. Odd, with the flower show next week.', note: 'Clara: Dr Ashby\'s prize foxgloves had all been cut down.' },

      { id: 'd1', who: 'ashby', q: 'What killed him?', a: 'His heart. He was on digitalis drops. The forgetful old fellow must have taken far too many.', statement: true },
      { id: 'd2', who: 'ashby', q: 'Then where did the poison come from?', req: 'lie_ashby1', a: 'I... I have no idea. I haven\'t been anywhere near Larkspur Cottage in weeks.', statement: true },
      { id: 'd3', who: 'ashby', q: 'Why were you on the doorstep at seven?', req: 'lie_ashby2', a: '...I may have dropped by early to see how he was. That is all. I didn\'t even ring the bell.' },
      { id: 'd4', who: 'ashby', q: 'Tell me about your garden.', a: 'My foxgloves? Prize-winners. Digitalis purpurea, the very plant his heart drops are made from, as it happens. Beautiful and deadly, like most things worth growing.', note: 'Foxgloves are where digitalis comes from.' },
      { id: 'd5', who: 'ashby', q: 'How well did you know Edmund?', a: 'We played chess on Thursdays. He also did a little valuation work for me now and then. Jewellery, mostly.' },
    ],
    evidence: {
      tray: { name: 'Tea tray', icon: '🫖', text: 'From the study. A teapot, milk jug, sugar bowl, the honey jar, and two used cups. The second saucer has a little heap of grey pipe ash on it.' },
      honey: { name: 'Honey jar', icon: '🍯', text: 'Half-empty jar of dark honey tied with a red ribbon. It has no label. Every jar from Wendham Stores carries their green-and-gold label. It smells oddly bitter.' },
      bottle: { name: 'Heart drops', icon: '💊', text: 'Edmund\'s medicine: "Digitalis tincture, 3 drops daily. Dr P. Ashby." It was refilled on Tuesday, and the bottle is still almost completely full. The label is handwritten, and the doctor writes his e\'s like backwards 3s.' },
      ticket: { name: 'Clara\'s ticket', icon: '🎫', text: 'A return ticket to Little Wendham, found in Clara\'s coat on the hall stand. Stamped 15:10 today.' },
      letter: { name: 'Clara\'s letter', icon: '✉️', text: 'A letter Clara sent her uncle last month, in neat, round handwriting with perfectly ordinary e\'s. Signed "Love, C."' },
      notebook: { name: 'Coded notebook', icon: '📓', cipher: true, text: 'Edmund\'s pocket notebook. The latest entry is written in some kind of letter-shift code.' },
      card: { name: 'Gift card', icon: '🏷️', req: 'lie_agnes', text: 'Found in the kitchen drawer: "A little something sweet for your heart. From C." Every e is written like a backwards 3.' },
      milk: { name: 'Milkman\'s note', icon: '🥛', req: 'lie_agnes', text: '"Mrs P, your visitor at seven left a jar on the step. Gent in a long coat with a black doctor\'s bag. Didn\'t ring, thought someone was poorly. Bert"' },
    },
    lies: [
      { id: 'lie_lionel', talk: 'l2', evidence: 'tray', reveal: 'Two used cups, and pipe ash on the second saucer. Lionel Gale is never without his pipe. He was there for tea.' },
      { id: 'lie_agnes', talk: 'a3', evidence: 'honey', reveal: 'Wendham Stores labels every jar. This one has no label at all. It didn\'t come from the shop.' },
      { id: 'lie_clara', talk: 'c1', evidence: 'ticket', reveal: 'Her ticket is stamped 15:10. Clara was in the village more than two hours before she says she was.' },
      { id: 'lie_ashby1', talk: 'd1', evidence: 'bottle', reveal: 'The bottle was refilled on Tuesday and is still almost full. Edmund didn\'t overdose on his drops. The digitalis came from somewhere else.' },
      { id: 'lie_ashby2', talk: 'd2', evidence: 'milk', reveal: 'A gentleman in a long coat with a black doctor\'s bag left the jar on the doorstep at seven this morning.' },
    ],
    cipher: {
      shift: 4,
      plain: 'ASHBY SOLD ME LADY WENDHAMS RUBY BROOCH. IT WAS STOLEN FROM HIS OWN PATIENT. I SHALL TELL THE CONSTABLE ON MONDAY. I THINK HE KNOWS I KNOW.',
      note: 'Edmund\'s notebook: Ashby sold him a ruby brooch stolen from his own patient, and Edmund was going to tell the constable on Monday.',
    },
    accuse: {
      who: { q: 'Who poisoned Edmund?', options: ['Agnes Pryor', 'Lionel Gale', 'Clara Fairweather', 'Dr Philip Ashby'], answer: 3 },
      how: { q: 'How?', options: ['He took too many heart drops', 'Foxglove poison in the honey jar', 'Poison in the teapot', 'Arsenic in the sugar bowl'], answer: 1 },
      why: { q: 'Why?', options: ['To inherit the cottage', 'Over the fake carriage clock', 'To stop Edmund reporting the stolen brooch', 'Jealousy over the flower show'], answer: 2 },
    },
    solution: [
      'It was Dr Philip Ashby.',
      'Edmund\'s coded notebook gives the motive. Ashby had stolen Lady Wendham\'s ruby brooch from his own patient and sold it to Edmund, who did his valuations. Edmund worked it out and planned to tell the constable on Monday.',
      'So Ashby cut down his prize foxgloves, the plant digitalis comes from, and stewed them into a jar of honey. He knew Edmund was the only person in the house who took honey.',
      'At seven this morning he left the jar on the doorstep, where Bert the milkman saw a gent in a long coat with a doctor\'s bag. He added a card signed "From C" to point the finger at Clara, who inherits. But the card\'s backwards-3 e\'s match the handwriting on Edmund\'s prescription, not Clara\'s round, ordinary ones.',
      'Then he waited to be called, and announced that Edmund had muddled his heart drops. It would have worked, except the bottle, refilled on Tuesday, was still almost full.',
      'Lionel lied because he\'d argued with Edmund and feared he\'d be blamed. Agnes lied to hide that she\'d served an unlabelled jar from the doorstep. Clara lied because she\'d been at the doctor\'s house. None of them was the killer, but each lie hid a clue.',
    ],
  },
];
