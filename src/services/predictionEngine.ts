import { emojiDictionary } from './emojiDictionary';

// Top 500+ most common English and tech-related words, sorted by frequency
const DICTIONARY: string[] = [
  "the", "of", "to", "and", "a", "in", "is", "it", "you", "that", "he", "was", "for", "on", "are", "as", "with", "his", "they", "i", 
  "at", "be", "this", "have", "from", "or", "one", "had", "by", "word", "but", "not", "what", "all", "were", "we", "when", "your", 
  "can", "said", "there", "use", "an", "each", "which", "she", "do", "how", "their", "if", "will", "up", "other", "about", "out", 
  "many", "then", "them", "these", "so", "some", "her", "would", "make", "like", "him", "into", "time", "has", "look", "two", 
  "more", "write", "go", "see", "number", "no", "way", "could", "people", "my", "than", "first", "water", "been", "call", "who", 
  "oil", "its", "now", "find", "long", "down", "day", "did", "get", "come", "made", "may", "part", "over", "new", "sound", 
  "take", "only", "little", "work", "know", "place", "year", "live", "me", "back", "give", "most", "very", "after", "thing", 
  "our", "just", "name", "good", "sentence", "man", "think", "say", "great", "where", "help", "through", "much", "before", 
  "line", "right", "too", "mean", "old", "any", "same", "tell", "boy", "follow", "came", "want", "show", "also", "around", 
  "form", "three", "small", "set", "end", "another", "large", "must", "big", "even", "such", "because", "turn", "here", 
  "why", "ask", "went", "men", "read", "need", "land", "different", "home", "us", "move", "try", "kind", "hand", "picture", 
  "again", "change", "off", "play", "spell", "air", "away", "animal", "house", "point", "page", "letter", "mother", "answer", 
  "found", "study", "still", "learn", "should", "america", "world", "high", "every", "near", "add", "food", "between", "own", 
  "below", "country", "plant", "last", "school", "father", "keep", "tree", "never", "start", "city", "earth", "eye", "light", 
  "thought", "head", "under", "story", "saw", "left", "few", "while", "along", "might", "close", "something", "seem", "next", 
  "hard", "open", "example", "begin", "life", "always", "those", "both", "paper", "together", "got", "group", "often", "run", 
  "important", "until", "children", "side", "feet", "car", "mile", "night", "walk", "white", "sea", "pattern", "grow", "took", 
  "river", "four", "state", "once", "book", "hear", "stop", "without", "second", "late", "carry", "later", "miss", "idea", 
  "enough", "eat", "face", "watch", "far", "really", "almost", "let", "above", "girl", "sometimes", "mountain", "cut", "young", 
  "talk", "soon", "list", "song", "being", "leave", "family", "it's", "program", "developer", "software", "application", "system", 
  "windows", "computer", "keyboard", "typing", "screen", "game", "roblox", "discord", "chrome", "vscode", "react", "electron", 
  "tailwind", "css", "html", "javascript", "typescript", "function", "const", "class", "import", "export", "let", "return", 
  "await", "async", "promise", "object", "array", "string", "number", "boolean", "null", "undefined", "project", "design", 
  "beautiful", "premium", "futuristic", "sleek", "modern", "animated", "dynamic", "island", "touchbar", "glassmorphism", 
  "about", "above", "across", "action", "activity", "actually", "add", "addition", "additional", "advice", "affect", "afraid", 
  "after", "afternoon", "again", "against", "age", "ago", "agree", "agreement", "ahead", "air", "allow", "almost", "alone", 
  "along", "already", "also", "alternative", "although", "always", "amazing", "america", "american", "among", "amount", 
  "analysis", "analyze", "ancient", "and", "animal", "another", "answer", "anxiety", "any", "anybody", "anyone", "anything", 
  "anyway", "anywhere", "apart", "apartment", "apology", "apparent", "apparently", "appeal", "appear", "appearance", 
  "apple", "application", "apply", "appoint", "appointment", "appreciate", "approach", "appropriate", "approval", "approve", 
  "approximate", "architect", "architecture", "area", "argue", "argument", "arise", "arm", "army", "around", "arrange", 
  "arrangement", "arrest", "arrival", "arrive", "art", "article", "artist", "artistic", "as", "ashamed", "asia", "asian", 
  "aside", "ask", "asleep", "aspect", "assault", "assert", "assess", "assessment", "asset", "assign", "assignment", 
  "assist", "assistance", "assistant", "associate", "association", "assume", "assumption", "assurance", "assure", 
  "at", "athlete", "athletic", "atmosphere", "attach", "attachment", "attack", "attempt", "attend", "attendance", 
  "attention", "attitude", "attorney", "attract", "attraction", "attractive", "attribute", "audience", "august", "aunt", 
  "author", "authority", "authorize", "auto", "automatic", "automatically", "automobile", "autumn", "avail", "available", 
  "average", "avoid", "await", "awake", "award", "aware", "awareness", "away", "awesome", "awful", "baby", "back", 
  "background", "backward", "bacon", "bad", "badly", "bag", "bake", "baker", "bakery", "balance", "ball", "balloon", 
  "ban", "banana", "band", "bang", "bank", "bar", "barrier", "base", "baseball", "basic", "basically", "basis", "basket", 
  "basketball", "bath", "bathroom", "battery", "battle", "bay", "be", "beach", "beam", "bean", "bear", "beard", "beast", 
  "beat", "beautiful", "beauty", "because", "become", "bed", "bedroom", "bee", "beef", "beer", "before", "beg", "begin", 
  "beginner", "beginning", "behalf", "behave", "behavior", "behind", "being", "belief", "believe", "bell", "belong", 
  "below", "belt", "bench", "bend", "beneath", "benefit", "bent", "beside", "besides", "best", "bet", "better", "between", 
  "beyond", "bible", "bicycle", "big", "bike", "bill", "billion", "bind", "biography", "biology", "bird", "birth", "birthday", 
  "biscuit", "bit", "bite", "bitter", "black", "blade", "blame", "blank", "blanket", "blast", "bleed", "blend", "bless", 
  "blind", "block", "blog", "blonde", "blood", "bloom", "blow", "blue", "board", "boast", "boat", "body", "boil", "bold", 
  "bomb", "bond", "bone", "book", "bookcase", "booking", "boost", "boot", "border", "bore", "bored", "boring", "born", 
  "borrow", "boss", "both", "bother", "bottle", "bottom", "bounce", "bound", "boundary", "bow", "bowl", "box", "boy", 
  "boyfriend", "brain", "brake", "branch", "brand", "brave", "bread", "break", "breakfast", "breast", "breath", "breathe", 
  "breed", "breeze", "brick", "bridge", "brief", "briefly", "bright", "brilliant", "bring", "broad", "broadcast", "broken", 
  "bronze", "brother", "brown", "brush", "bubble", "bucket", "budget", "buffer", "bug", "build", "builder", "building", 
  "bullet", "bunch", "burden", "bureau", "burn", "burst", "bury", "bus", "bush", "business", "busy", "but", "butter", 
  "button", "buy", "buyer", "by", "cab", "cabin", "cabinet", "cable", "cafe", "cage", "cake", "calculate", "calculation", 
  "calendar", "call", "calm", "camera", "camp", "campaign", "campus", "can", "canal", "cancel", "cancer", "candidate", 
  "candle", "candy", "cane", "canvas", "cap", "capability", "capable", "capacity", "cape", "capital", "captain", "caption", 
  "capture", "car", "card", "care", "career", "careful", "carefully", "careless", "cargo", "carpet", "carriage", "carrier", 
  "carrot", "carry", "cart", "cartoon", "carve", "case", "cash", "cast", "castle", "casual", "cat", "catalog", "catch", 
  "category", "cater", "cathedral", "cattle", "cause", "caution", "cave", "ceiling", "celebrate", "celebration", "celebrity", 
  "cell", "cellar", "cement", "cemetery", "sensor", "central", "centre", "century", "cereal", "ceremony", "certain", 
  "certainly", "certificate", "chain", "chair", "chairman", "challenge", "chamber", "champion", "championship", "chance", 
  "change", "channel", "chaos", "chapel", "chapter", "character", "characteristic", "charge", "charity", "charm", "charming", 
  "chart", "chase", "chat", "cheap", "cheat", "check", "cheek", "cheer", "cheerful", "cheese", "chef", "chemical", 
  "chemistry", "chest", "chew", "chicken", "chief", "child", "childhood", "children", "chill", "chimney", "chin", "china", 
  "chip", "chocolate", "choice", "choir", "choose", "chop", "chorus", "christ", "christian", "christmas", "chrome", 
  "church", "cigarette", "cinema", "circle", "circuit", "circular", "circumstance", "circus", "citizen", "city", "civil", 
  "civilian", "claim", "clap", "clarify", "clash", "class", "classic", "classical", "classification", "classify", 
  "classroom", "clay", "clean", "cleaner", "clear", "clearly", "clerk", "clever", "click", "client", "cliff", "climate", 
  "climb", "clinic", "clip", "clock", "close", "closed", "closely", "closet", "cloth", "clothes", "clothing", "cloud", 
  "cloudy", "club", "clue", "cluster", "coach", "coal", "coast", "coat", "code", "coffee", "coin", "cold", "collaborate", 
  "collapse", "collar", "colleague", "collect", "collection", "collective", "collector", "college", "collision", "colony", 
  "color", "colored", "colorful", "column", "combat", "combination", "combine", "come", "comedy", "comfort", "comfortable", 
  "comic", "command", "commander", "commence", "comment", "commerce", "commercial", "commission", "commit", "commitment", 
  "committee", "common", "commonly", "communicate", "communication", "community", "companion", "company", "comparable", 
  "comparative", "compare", "comparison", "compass", "compel", "compensate", "compensation", "compete", "competent", 
  "competition", "competitive", "competitor", "compile", "complain", "complaint", "complete", "completely", "complex", 
  "complexity", "compliance", "complicate", "complicated", "comply", "component", "compose", "composer", "composition", 
  "compound", "comprehensive", "compress", "compromise", "compute", "computer", "comrade", "conceal", "concede", 
  "conceive", "concentrate", "concentration", "concept", "concern", "concerned", "concert", "conclude", "conclusion", 
  "concrete", "condition", "conduct", "conductor", "conference", "confess", "confession", "confidence", "confident", 
  "confine", "confirm", "confirmation", "conflict", "conform", "confront", "confuse", "confused", "confusion", 
  "congratulate", "congratulation", "congress", "connect", "connection", "conquer", "conscience", "conscious", "consciousness", 
  "consent", "consequence", "consequently", "conservation", "conservative", "consider", "considerable", "considerably", 
  "consideration", "consist", "consistent", "console", "consolidate", "consonant", "conspiracy", "constable", "constant", 
  "constantly", "constitute", "constitution", "constitutional", "constrain", "constraint", "construct", "construction", 
  "consult", "consultant", "consultation", "consume", "consumer", "consumption", "contact", "contain", "container", 
  "contemporary", "contempt", "contend", "content", "contest", "context", "continent", "continual", "continually", 
  "continue", "continuous", "contract", "contractor", "contradict", "contradiction", "contrary", "contrast", "contribute", 
  "contribution", "contributor", "control", "controversial", "controversy", "convenience", "convenient", "convention", 
  "conventional", "conversation", "conversion", "convert", "convey", "convict", "conviction", "convince", "convinced", 
  "cook", "cooker", "cookie", "cooking", "cool", "cooperate", "cooperation", "cooperative", "coordinate", "coordinator", 
  "cop", "cope", "copper", "copy", "copyright", "cord", "core", "corn", "corner", "corporation", "correct", "correction", 
  "correctly", "correlate", "correlation", "correspond", "correspondence", "correspondent", "corridor", "corrupt", 
  "corruption", "cost", "costly", "costume", "cottage", "cotton", "couch", "cough", "could", "council", "counsel", 
  "counselor", "count", "counter", "counterpart", "countess", "country", "countryside", "county", "couple", "courage", 
  "course", "court", "courtesy", "cousin", "cover", "coverage", "cow", "coward", "crab", "crack", "cradle", "craft", 
  "crash", "crater", "crawl", "crazy", "cream", "create", "creation", "creative", "creativity", "creator", "creature", 
  "credentials", "credibility", "credible", "credit", "creep", "crew", "cricket", "crime", "criminal", "crisis", 
  "crisp", "criteria", "critic", "critical", "criticism", "criticize", "crop", "cross", "crossing", "crow", "crowd", 
  "crowded", "crown", "crucial", "crude", "cruel", "cruelty", "cruise", "crush", "cry", "crystal", "cube", "cucumber", 
  "cultivate", "cultural", "culture", "cup", "cupboard", "cure", "curiosity", "curious", "curl", "currency", "current", 
  "currently", "curriculum", "curry", "curtain", "curve", "cushion", "custody", "custom", "customer", "customary", 
  "customize", "cut", "cute", "cycle", "cynic"
];

// Common typo corrections map
const AUTOCORRECT_MAP: Record<string, string> = {
  "teh": "the",
  "recieve": "receive",
  "recieved": "received",
  "dont": "don't",
  "cant": "can't",
  "wont": "won't",
  "yuo": "you",
  "taht": "that",
  "tiem": "time",
  "whit": "with",
  "becuase": "because",
  "definately": "definitely",
  "seperate": "separate",
  "goverment": "government",
  "occured": "occurred",
  "untill": "until",
  "truely": "truly",
  "wierd": "weird",
  "acheive": "achieve",
  "alot": "a lot",
  "colleague": "colleague",
  "tommorrow": "tomorrow",
  "suprise": "surprise",
  "beleive": "believe",
  "gonna": "going to",
  "wanna": "want to",
  "im": "I'm",
  "id": "I'd",
  "ive": "I've",
  "ill": "I'll",
  "theyre": "they're",
  "youre": "you're",
  "weve": "we've",
  "shouldnt": "shouldn't",
  "couldnt": "couldn't",
  "wouldnt": "wouldn't",
  "isnt": "isn't",
  "arent": "aren't",
  "wasnt": "wasn't",
  "werent": "weren't",
  "hasnt": "hasn't",
  "havent": "haven't",
  "hadnt": "hadn't",
  "doesnt": "doesn't",
  "didnt": "didn't",
  "thats": "that's",
  "whats": "what's",
  "wheres": "where's",
  "whys": "why's",
  "hows": "how's",
  "theres": "there's",
  "its": "its", // wait, "its" vs "it's" is context specific, we suggest it's or let user type
  "itsa": "it's a",
  "programing": "programming",
  "developement": "development",
  "libary": "library",
  "goverment": "government",
  "enviroment": "environment",
  "posibility": "possibility",
  "neccessary": "necessary",
  "unneccessary": "unnecessary",
  "arguement": "argument",
  "existance": "existence"
};

// Calculate Levenshtein Distance (useful for smart auto-correction suggestions)
function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export interface SmartSuggestions {
  original: string;
  autocorrect?: string;
  predictions: string[];
  emojis: string[];
}

export class PredictionEngine {
  private currentWordBuffer: string = "";
  private keypressTimestamps: number[] = [];
  private activeApp: string = "";

  // Resets the current typing buffer
  public clearBuffer() {
    this.currentWordBuffer = "";
  }

  public getBuffer(): string {
    return this.currentWordBuffer;
  }

  public setActiveApp(appName: string) {
    this.activeApp = appName;
  }

  public getActiveApp(): string {
    return this.activeApp;
  }

  // Record a keypress and update typing speed (WPM)
  public recordKeypress(key: string, character: string) {
    const now = Date.now();
    this.keypressTimestamps.push(now);

    // Keep only timestamps from the last 5 seconds to calculate current speed
    this.keypressTimestamps = this.keypressTimestamps.filter(t => now - t < 5000);

    // Process character in buffer
    if (key === "Backspace") {
      if (this.currentWordBuffer.length > 0) {
        this.currentWordBuffer = this.currentWordBuffer.slice(0, -1);
      }
    } else if (key === "Space" || key === "Enter") {
      // Space/Enter completes/clears active word buffer
      this.currentWordBuffer = "";
    } else if (character && character.length === 1) {
      // Check if it's a character we want to track (skip punctuation/symbols for simple prefix search)
      const isAlphanumeric = /^[a-zA-Z0-9']$/.test(character);
      if (isAlphanumeric) {
        this.currentWordBuffer += character.toLowerCase();
      } else {
        // Punctuation resets the current word
        this.currentWordBuffer = "";
      }
    } else if (key === "Escape" || key === "Left" || key === "Right" || key === "Up" || key === "Down") {
      // Navigation keys reset typing buffer
      this.currentWordBuffer = "";
    }
  }

  // Calculate WPM based on characters typed in the last 5 seconds
  public calculateWPM(): number {
    const now = Date.now();
    this.keypressTimestamps = this.keypressTimestamps.filter(t => now - t < 5000);

    if (this.keypressTimestamps.length < 2) return 0;

    // standard definition: 1 word = 5 characters
    const wordsTyped = this.keypressTimestamps.length / 5;
    // extrapolate from 5 seconds to 1 minute (multiply by 12)
    const wpm = Math.round(wordsTyped * 12);
    return Math.min(wpm, 200); // Caps at 200 WPM to avoid extreme initial spikes
  }

  // Generate real-time autocorrect, word predictions, and emojis
  public getSuggestions(
    enableAutoCorrect: boolean = true,
    enablePredictions: boolean = true,
    enableEmojis: boolean = true
  ): SmartSuggestions {
    const original = this.currentWordBuffer.trim();

    if (!original) {
      return { original, predictions: [], emojis: [] };
    }

    let autocorrect: string | undefined = undefined;
    let predictions: string[] = [];
    let emojis: string[] = [];

    // 1. Get Emoji Suggestions
    if (enableEmojis) {
      // check direct match
      if (emojiDictionary[original]) {
        emojis.push(...emojiDictionary[original]);
      } else {
        // check if key starts with current typing prefix
        for (const [key, icons] of Object.entries(emojiDictionary)) {
          if (key.startsWith(original)) {
            emojis.push(...icons);
            if (emojis.length >= 4) break;
          }
        }
      }
      emojis = Array.from(new Set(emojis)).slice(0, 5);
    }

    // 2. Get Auto-Correct suggestions
    if (enableAutoCorrect) {
      if (AUTOCORRECT_MAP[original]) {
        autocorrect = AUTOCORRECT_MAP[original];
      } else if (original.length >= 4 && !DICTIONARY.includes(original)) {
        // Find close words using edit distance (Levenshtein distance == 1)
        for (const dictWord of DICTIONARY) {
          if (Math.abs(dictWord.length - original.length) <= 1) {
            const distance = getLevenshteinDistance(original, dictWord);
            if (distance === 1) {
              autocorrect = dictWord;
              break;
            }
          }
        }
      }
    }

    // 3. Get Word Prefix Predictions
    if (enablePredictions) {
      // Find dictionary words matching prefix, prioritizing shorter matches
      const matches = DICTIONARY.filter(word => word.startsWith(original) && word !== original);
      
      // Sort matches by length (closer fits first) and then keep top 4
      predictions = matches.slice(0, 4);

      // If we don't have enough matches, suggest other words
      if (predictions.length < 3 && autocorrect) {
        predictions.unshift(autocorrect);
      }
    }

    // Remove duplicates
    predictions = Array.from(new Set(predictions.filter(p => p !== original))).slice(0, 4);

    return {
      original,
      autocorrect,
      predictions,
      emojis
    };
  }
}
