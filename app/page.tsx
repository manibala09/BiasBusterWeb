"use client"

import { DialogDescription } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, History, User, LogOut, Shield, Target, Users, Trash2, Mail, Key } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface BiasResult {
  word: string
  category: string
  discriminationType: string
  reason: string
  suggestions: string[]
  rewrite?: string
  position: number
}

interface AnalysisResult {
  score: number
  biasedWords: BiasResult[]
  totalWords: number
  message: string
  completeRewrite?: string
}

interface HistoryItem {
  id: string
  text: string
  score: number
  biasedWords: number
  timestamp: Date
}

interface UserData {
  username: string
  password: string
  email: string
  createdAt: string
  history: HistoryItem[]
}

interface PasswordResetToken {
  email: string
  token: string
  expiresAt: number
  createdAt: number
}

// Simulated backend API calls
const API_BASE = "https://api.biasbuster.com" // This would be your actual API endpoint

const apiCall = async (endpoint: string, method = "GET", data?: any) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000))

  // For demo purposes, we'll still use localStorage but structure it like a real backend
  // In production, this would be actual HTTP requests to your server

  if (endpoint === "/users/register" && method === "POST") {
    const users = JSON.parse(localStorage.getItem("biasbuster-global-users") || "{}")

    if (users[data.email.toLowerCase()]) {
      throw new Error("User already exists")
    }

    const newUser: UserData = {
      username: data.username,
      password: data.password, // In real app, this would be hashed
      email: data.email.toLowerCase(),
      createdAt: new Date().toISOString(),
      history: [],
    }

    users[data.email.toLowerCase()] = newUser
    localStorage.setItem("biasbuster-global-users", JSON.stringify(users))

    return { success: true, user: { email: newUser.email, username: newUser.username } }
  }

  if (endpoint === "/users/login" && method === "POST") {
    const users = JSON.parse(localStorage.getItem("biasbuster-global-users") || "{}")
    const user = users[data.email.toLowerCase()]

    if (!user) {
      throw new Error("User not found")
    }

    if (user.password !== data.password) {
      throw new Error("Invalid password")
    }

    return { success: true, user: { email: user.email, username: user.username } }
  }

  if (endpoint === "/users/profile" && method === "GET") {
    const users = JSON.parse(localStorage.getItem("biasbuster-global-users") || "{}")
    const user = users[data.email.toLowerCase()]

    if (!user) {
      throw new Error("User not found")
    }

    return { user: { email: user.email, username: user.username, history: user.history || [] } }
  }

  if (endpoint === "/users/history" && method === "POST") {
    const users = JSON.parse(localStorage.getItem("biasbuster-global-users") || "{}")
    const user = users[data.email.toLowerCase()]

    if (!user) {
      throw new Error("User not found")
    }

    if (!user.history) {
      user.history = []
    }

    user.history = [data.historyItem, ...user.history].slice(0, 10)
    users[data.email.toLowerCase()] = user
    localStorage.setItem("biasbuster-global-users", JSON.stringify(users))

    return { success: true, history: user.history }
  }

  if (endpoint === "/users/history" && method === "DELETE") {
    const users = JSON.parse(localStorage.getItem("biasbuster-global-users") || "{}")
    const user = users[data.email.toLowerCase()]

    if (!user) {
      throw new Error("User not found")
    }

    if (data.itemId) {
      user.history = (user.history || []).filter((item: HistoryItem) => item.id !== data.itemId)
    } else {
      user.history = []
    }

    users[data.email.toLowerCase()] = user
    localStorage.setItem("biasbuster-global-users", JSON.stringify(users))

    return { success: true, history: user.history }
  }

  if (endpoint === "/users/forgot-password" && method === "POST") {
    const users = JSON.parse(localStorage.getItem("biasbuster-global-users") || "{}")

    if (!users[data.email.toLowerCase()]) {
      throw new Error("User not found")
    }

    const token = generateResetToken()
    const resetData: PasswordResetToken = {
      email: data.email.toLowerCase(),
      token: token,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
      createdAt: Date.now(),
    }

    const resetTokens = JSON.parse(localStorage.getItem("biasbuster-reset-tokens") || "{}")
    resetTokens[token] = resetData
    localStorage.setItem("biasbuster-reset-tokens", JSON.stringify(resetTokens))

    return { success: true, token }
  }

  if (endpoint === "/users/reset-password" && method === "POST") {
    const resetTokens = JSON.parse(localStorage.getItem("biasbuster-reset-tokens") || "{}")
    const tokenData = resetTokens[data.token]

    if (!tokenData || Date.now() > tokenData.expiresAt) {
      throw new Error("Invalid or expired token")
    }

    const users = JSON.parse(localStorage.getItem("biasbuster-global-users") || "{}")
    const user = users[tokenData.email]

    if (!user) {
      throw new Error("User not found")
    }

    user.password = data.newPassword
    users[tokenData.email] = user
    localStorage.setItem("biasbuster-global-users", JSON.stringify(users))

    // Remove used token
    delete resetTokens[data.token]
    localStorage.setItem("biasbuster-reset-tokens", JSON.stringify(resetTokens))

    return { success: true }
  }

  throw new Error("API endpoint not found")
}

// Generate a secure random token
const generateResetToken = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const biasDatabase = {
  gender: {
    rockstar: {
      reason: "Often associated with masculine stereotypes and can exclude other identities",
      suggestions: ["talented professional", "skilled expert", "exceptional performer"],
    },
    aggressive: {
      reason: "Can be perceived as favoring traditionally masculine traits",
      suggestions: ["proactive", "assertive", "results-driven", "determined"],
    },
    dominant: {
      reason: "May imply power dynamics that could exclude collaborative approaches",
      suggestions: ["leading", "influential", "prominent", "key"],
    },
    guys: {
      reason: "Excludes non-male team members in group references",
      suggestions: ["team", "everyone", "colleagues", "folks"],
    },
    "men are": {
      reason: "Making generalizations about gender can perpetuate stereotypes",
      suggestions: ["people are", "individuals are", "professionals are"],
    },
    "women are": {
      reason: "Making generalizations about gender can perpetuate stereotypes",
      suggestions: ["people are", "individuals are", "professionals are"],
    },
    "naturally better": {
      reason: "Implies inherent gender-based superiority, which is biased and incorrect",
      suggestions: ["well-suited", "experienced in", "trained for"],
    },
    "most ceos are men": {
      reason: "While statistically true, this statement can reinforce gender stereotypes",
      suggestions: ["leadership roles are increasingly diverse", "CEO positions benefit from diverse perspectives"],
    },
    manpower: {
      reason: "Gender-exclusive term that ignores non-male contributions",
      suggestions: ["workforce", "personnel", "human resources", "staff"],
    },
    chairman: {
      reason: "Assumes leadership positions are held by men",
      suggestions: ["chairperson", "chair", "presiding officer"],
    },
  },
  race: {
    articulate: {
      reason: "When used to describe people of color, it can imply surprise at their communication skills",
      suggestions: ["well-spoken", "eloquent", "clear communicator"],
    },
    urban: {
      reason: "Often used as a coded reference to race or ethnicity",
      suggestions: ["city-based", "metropolitan", "downtown"],
    },
    exotic: {
      reason: "Othering term that treats non-white features or cultures as foreign",
      suggestions: ["unique", "distinctive", "diverse"],
    },
    primitive: {
      reason: "Derogatory term often applied to non-Western cultures",
      suggestions: ["traditional", "indigenous", "ancestral"],
    },
    ghetto: {
      reason: "Perpetuates negative stereotypes about communities of color",
      suggestions: ["urban community", "neighborhood", "district"],
    },
    whitelist: {
      reason: "Technical term that associates 'white' with good/allowed",
      suggestions: ["allowlist", "approved list", "permitted list"],
    },
    blacklist: {
      reason: "Technical term that associates 'black' with bad/forbidden",
      suggestions: ["blocklist", "denied list", "restricted list"],
    },
  },
  religion: {
    crusade: {
      reason: "Religious warfare reference that can be offensive to some faiths",
      suggestions: ["campaign", "initiative", "mission", "effort"],
    },
    jihad: {
      reason: "Religious term often misused and can perpetuate stereotypes",
      suggestions: ["struggle", "effort", "campaign"],
    },
    "christian values": {
      reason: "Assumes one religion's values are universal or superior",
      suggestions: ["ethical values", "moral principles", "shared values"],
    },
    godless: {
      reason: "Derogatory term for non-religious people",
      suggestions: ["secular", "non-religious", "atheist"],
    },
    heathen: {
      reason: "Derogatory religious term",
      suggestions: ["non-believer", "person of different faith"],
    },
    "all extremists": {
      reason: "Makes sweeping generalizations about religious groups, promoting harmful stereotypes",
      suggestions: ["some individuals may be", "certain people are", "individual beliefs vary"],
    },
    "always violent": {
      reason: "Perpetuates dangerous stereotypes about religious communities",
      suggestions: ["some may be", "individual actions vary", "people differ in their"],
    },
    "naturally radical": {
      reason: "Implies inherent extremism in religious groups, which is false and harmful",
      suggestions: ["some individuals may be", "certain people are", "individual beliefs vary"],
    },
  },
  age: {
    young: {
      reason: "Can discriminate against older candidates or create age bias",
      suggestions: ["energetic", "innovative", "fresh perspective", "dynamic"],
    },
    mature: {
      reason: "May imply age preferences in hiring",
      suggestions: ["experienced", "seasoned", "skilled", "knowledgeable"],
    },
    "digital native": {
      reason: "Assumes age-based technology comfort levels",
      suggestions: ["tech-savvy", "digitally skilled", "technology proficient"],
    },
    "too old": {
      reason: "Direct age discrimination",
      suggestions: ["may lack experience in", "might need training in"],
    },
    "too young": {
      reason: "Direct age discrimination",
      suggestions: ["developing experience in", "growing expertise in"],
    },
    millennial: {
      reason: "Often used with negative connotations about work ethic",
      suggestions: ["young professional", "early-career", "emerging talent"],
    },
    boomer: {
      reason: "Ageist term that can be derogatory",
      suggestions: ["experienced professional", "senior colleague"],
    },
  },
  nationality: {
    "american way": {
      reason: "Assumes American methods are superior or universal",
      suggestions: ["effective approach", "proven method", "best practice"],
    },
    foreign: {
      reason: "Can create us-vs-them mentality",
      suggestions: ["international", "global", "overseas"],
    },
    "third world": {
      reason: "Outdated and potentially offensive term",
      suggestions: ["developing countries", "emerging markets"],
    },
    oriental: {
      reason: "Outdated and offensive term for Asian people",
      suggestions: ["Asian", "East Asian", "specific nationality"],
    },
    "exotic accent": {
      reason: "Othering language that treats non-native speakers as foreign",
      suggestions: ["international background", "multilingual", "global perspective"],
    },
    "north indian": {
      reason: "Can perpetuate regional stereotypes and generalizations",
      suggestions: ["some individuals", "certain people", "people from various backgrounds"],
    },
    "south indian": {
      reason: "Can perpetuate regional stereotypes and generalizations",
      suggestions: ["some individuals", "certain people", "people from various backgrounds"],
    },
    "always loud": {
      reason: "Makes unfounded generalizations about behavioral traits based on origin",
      suggestions: ["may be expressive", "can be vocal", "some individuals are"],
    },
    "andhra pradesh people": {
      reason: "Makes generalizations about people based on their state, ignoring individual diversity",
      suggestions: ["some individuals", "many people", "people from various backgrounds"],
    },
    "telangana people": {
      reason: "Makes generalizations about people based on their state, ignoring individual diversity",
      suggestions: ["some individuals", "many people", "people from various backgrounds"],
    },
    "tamil people": {
      reason: "Makes generalizations about people based on their state/ethnicity, ignoring individual diversity",
      suggestions: ["some individuals", "many people", "people from various backgrounds"],
    },
    "malayali people": {
      reason: "Makes generalizations about people based on their state/ethnicity, ignoring individual diversity",
      suggestions: ["some individuals", "many people", "people from various backgrounds"],
    },
    "gujarati people": {
      reason: "Makes generalizations about people based on their state/ethnicity, ignoring individual diversity",
      suggestions: ["some individuals", "many people", "people from various backgrounds"],
    },
    "punjabi people": {
      reason: "Makes generalizations about people based on their state/ethnicity, ignoring individual diversity",
      suggestions: ["some individuals", "many people", "people from various backgrounds"],
    },
    "bihari people": {
      reason: "Makes generalizations about people based on their state, often perpetuating negative stereotypes",
      suggestions: ["some individuals", "many people", "people from various backgrounds"],
    },
    "only good": {
      reason: "Implies that people from other regions are not good, creating divisive comparisons",
      suggestions: ["talented", "skilled", "capable", "have many positive qualities"],
    },
    "only smart": {
      reason: "Implies that people from other regions lack intelligence, creating harmful comparisons",
      suggestions: ["intelligent", "knowledgeable", "well-educated", "have strong academic backgrounds"],
    },
  },
  politics: {
    "liberal agenda": {
      reason: "Politically charged language that assumes negative intent",
      suggestions: ["progressive policies", "reform initiatives"],
    },
    "conservative values": {
      reason: "Politically charged language that may exclude others",
      suggestions: ["traditional approaches", "established practices"],
    },
    radical: {
      reason: "Often used to dismiss political viewpoints",
      suggestions: ["progressive", "innovative", "transformative"],
    },
    extremist: {
      reason: "Politically charged term that shuts down dialogue",
      suggestions: ["activist", "advocate", "strong supporter"],
    },
  },
  ability: {
    normal: {
      reason: "Implies there is an abnormal, potentially excluding people with disabilities",
      suggestions: ["typical", "standard", "regular", "conventional"],
    },
    crazy: {
      reason: "Can be offensive to people with mental health conditions",
      suggestions: ["innovative", "creative", "unique", "unconventional"],
    },
    "mentally ill": {
      reason: "Stigmatizing language around mental health",
      suggestions: ["person with mental health challenges", "individual experiencing mental health issues"],
    },
    handicapped: {
      reason: "Outdated and potentially offensive term",
      suggestions: ["person with disabilities", "disabled person"],
    },
    "suffers from": {
      reason: "Implies victimhood rather than acknowledging lived experience",
      suggestions: ["has", "lives with", "experiences"],
    },
  },
  education: {
    "private school": {
      reason: "Can perpetuate stereotypes about educational quality based on school type",
      suggestions: ["well-funded schools", "schools with resources", "certain educational environments"],
    },
    "public school": {
      reason: "Can perpetuate negative stereotypes about public education",
      suggestions: ["community schools", "local schools", "neighborhood schools"],
    },
    "charter school": {
      reason: "May imply superiority or inferiority compared to other school types",
      suggestions: ["alternative schools", "specialized schools", "educational options"],
    },
    homeschooled: {
      reason: "Can perpetuate stereotypes about homeschooling quality or social skills",
      suggestions: ["home-educated", "independently educated", "alternative education"],
    },
  },
}

// Add these contextual bias patterns for more sophisticated detection
const contextualBiasPatterns = [
  {
    pattern: /men are (naturally |inherently )?(better|superior|stronger) (at|in|for|than)/gi,
    category: "gender",
    discriminationType: "Gender Discrimination",
    reason: "Makes unfounded generalizations about male superiority",
    suggestions: [
      "Individual abilities vary regardless of gender",
      "Success depends on skills and experience, not gender",
    ],
    rewrite:
      "Leadership ability is determined by individual skills, experience, and qualifications rather than gender. Both men and women can be equally effective leaders.",
  },
  {
    pattern: /women are (naturally |inherently )?(worse|inferior|weaker|too emotional) (at|in|for|than)/gi,
    category: "gender",
    discriminationType: "Gender Discrimination",
    reason: "Makes unfounded generalizations about female capabilities",
    suggestions: [
      "Individual abilities vary regardless of gender",
      "Success depends on skills and experience, not gender",
    ],
    rewrite:
      "Professional capabilities are based on individual skills and experience, not gender. All individuals can develop strong leadership and decision-making abilities.",
  },
  {
    pattern: /(black|african american) people are/gi,
    category: "race",
    discriminationType: "Racial Discrimination",
    reason: "Makes broad generalizations about racial groups",
    suggestions: ["Some individuals are", "Many people are", "Certain people are"],
    rewrite: "Individual characteristics and abilities vary among all people regardless of race or ethnicity.",
  },
  {
    pattern: /(muslims|christians|jews|hindus) are (all|mostly)/gi,
    category: "religion",
    discriminationType: "Religious Discrimination",
    reason: "Makes sweeping generalizations about religious groups",
    suggestions: ["Some people are", "Many individuals are"],
    rewrite: "People of all religious backgrounds have diverse beliefs, values, and characteristics.",
  },
  {
    pattern:
      /(people from|folks from|members of|those from) (that|this|the) (religion|faith|church|mosque|temple) are (all|always|never|naturally|inherently|typically|usually)/gi,
    category: "religion",
    discriminationType: "Religious Discrimination",
    reason: "Makes sweeping generalizations about entire religious groups, promoting harmful stereotypes",
    suggestions: ["Some individuals may be", "Certain people are", "Individual beliefs vary among"],
    rewrite:
      "Religious communities are diverse, with individuals holding varying beliefs and practices. It's important not to generalize about entire faith communities based on the actions of a few.",
  },
  {
    pattern:
      /(muslims|christians|jews|hindus|buddhists|sikhs|catholics|protestants|evangelicals) are (all|always|never|naturally|inherently|typically|usually) (extremists|terrorists|fundamentalists|radicals|violent|peaceful|good|bad)/gi,
    category: "religion",
    discriminationType: "Religious Discrimination",
    reason: "Makes harmful generalizations about religious groups, often perpetuating dangerous stereotypes",
    suggestions: ["Some individuals may be", "Certain people are", "Individual beliefs and actions vary"],
    rewrite:
      "Religious communities contain diverse individuals with varying beliefs, practices, and behaviors. Generalizations about entire faith groups are inaccurate and harmful.",
  },
  {
    pattern:
      /(that|this|the) (religion|faith|church|denomination) (teaches|promotes|encourages) (violence|hatred|extremism|terrorism)/gi,
    category: "religion",
    discriminationType: "Religious Discrimination",
    reason: "Makes broad negative claims about religious teachings without nuance or context",
    suggestions: ["Some interpretations may", "Certain groups might", "Individual understanding varies"],
    rewrite:
      "Religious texts and teachings are interpreted differently by various individuals and communities. It's important to avoid generalizing about entire faith traditions.",
  },
  {
    pattern:
      /(all|most) (religious|faith-based) (people|individuals|folks) are (extremists|fanatics|intolerant|backwards|primitive)/gi,
    category: "religion",
    discriminationType: "Religious Discrimination",
    reason: "Makes sweeping negative generalizations about religious people as a whole",
    suggestions: ["Some individuals may be", "Certain people are", "Individual beliefs vary"],
    rewrite:
      "People of faith, like all individuals, have diverse perspectives, behaviors, and levels of religious observance. Generalizations about religious people are inaccurate and unfair.",
  },
  {
    pattern: /(old|older) (people|workers) (can't|cannot|are unable)/gi,
    category: "age",
    discriminationType: "Age Discrimination",
    reason: "Makes assumptions about capabilities based on age",
    suggestions: ["Some individuals may need", "Training may be helpful for"],
    rewrite:
      "Professional capabilities depend on individual skills and experience rather than age. People of all ages can learn and adapt to new technologies and methods.",
  },
  {
    pattern: /(americans|foreigners) are (naturally|inherently)/gi,
    category: "nationality",
    discriminationType: "National Origin Discrimination",
    reason: "Makes generalizations based on nationality",
    suggestions: ["Some individuals are", "Many people are"],
    rewrite: "Individual characteristics and work styles vary among people regardless of their country of origin.",
  },
  {
    pattern:
      /(private|charter) school (students|kids|children) are (always |naturally |inherently )?(smarter|better|superior|more intelligent) (than|to) (public|state) school/gi,
    category: "education",
    discriminationType: "Educational Discrimination",
    reason: "Makes unfounded generalizations about student intelligence based on school type",
    suggestions: [
      "Students from different educational backgrounds bring diverse strengths",
      "Academic success depends on individual effort and support, not school type",
    ],
    rewrite:
      "Student success depends on individual effort, family support, and educational resources rather than the type of school attended. Students from all educational backgrounds can achieve academic excellence.",
  },
  {
    pattern:
      /(public|state) school (students|kids|children) are (always |naturally |inherently )?(dumber|worse|inferior|less intelligent) (than|to) (private|charter) school/gi,
    category: "education",
    discriminationType: "Educational Discrimination",
    reason: "Makes unfounded generalizations about student intelligence based on school type",
    suggestions: [
      "Students from different educational backgrounds bring diverse strengths",
      "Academic success depends on individual effort and support, not school type",
    ],
    rewrite:
      "Student success depends on individual effort, family support, and educational resources rather than the type of school attended. Students from all educational backgrounds can achieve academic excellence.",
  },
  {
    pattern:
      /(private|charter|public|state|homeschool) (students|kids|children) are (always|never|naturally|inherently)/gi,
    category: "education",
    discriminationType: "Educational Discrimination",
    reason: "Makes broad generalizations about students based on their educational background",
    suggestions: ["Some students are", "Many students are", "Individual students may be"],
    rewrite:
      "Individual student characteristics and abilities vary regardless of educational background. Success depends on personal effort, support systems, and individual circumstances.",
  },
  {
    pattern: /(homeschooled|home.?schooled) (kids|children|students) (are|lack|don't have|can't)/gi,
    category: "education",
    discriminationType: "Educational Discrimination",
    reason: "Perpetuates stereotypes about homeschooled students' social or academic abilities",
    suggestions: ["Some students may", "Individual students might", "Students from various backgrounds"],
    rewrite:
      "Homeschooled students, like all students, have diverse social and academic experiences. Their success depends on individual circumstances, family support, and educational approach rather than schooling method.",
  },
  {
    pattern:
      /(people from|folks from|individuals from) (north|south|east|west) (india|china|america|europe|africa|asia) are (always|never|naturally|inherently|typically)/gi,
    category: "nationality",
    discriminationType: "Regional Discrimination",
    reason: "Makes sweeping generalizations about people based on their geographic region",
    suggestions: ["Some individuals are", "Many people are", "Certain people may be"],
    rewrite:
      "Individual characteristics and behaviors vary greatly among people regardless of their geographic origin. Cultural expressions differ among individuals within any region.",
  },
  {
    pattern:
      /(north|south|east|west) (indians|chinese|americans|europeans|africans|asians) are (always|never|naturally|inherently|typically|usually)/gi,
    category: "nationality",
    discriminationType: "Regional Discrimination",
    reason: "Makes broad generalizations about people based on regional identity",
    suggestions: ["Some people are", "Many individuals are", "Certain people may be"],
    rewrite:
      "People from all regions have diverse personalities, behaviors, and characteristics that vary by individual rather than geographic location.",
  },
  {
    pattern:
      /(loud|quiet|aggressive|passive|smart|dumb|lazy|hardworking) (people from|folks from) (north|south|east|west)/gi,
    category: "nationality",
    discriminationType: "Regional Discrimination",
    reason: "Attributes behavioral or personality traits to entire regional populations",
    suggestions: ["some individuals may be", "certain people can be", "individual traits vary"],
    rewrite:
      "Individual personality traits and behaviors vary widely among people regardless of their regional background.",
  },
  {
    pattern:
      /(people from|folks from|individuals from) (andhra pradesh|telangana|tamil nadu|kerala|karnataka|maharashtra|gujarat|punjab|bihar|uttar pradesh|west bengal|rajasthan|madhya pradesh|odisha|assam|jharkhand|chhattisgarh|uttarakhand|himachal pradesh|haryana|delhi|goa|manipur|meghalaya|mizoram|nagaland|sikkim|tripura|arunachal pradesh) are (only|always|never|naturally|inherently|typically|usually|just) (good|bad|smart|dumb|lazy|hardworking|honest|dishonest|violent|peaceful|rich|poor|educated|uneducated)/gi,
    category: "nationality",
    discriminationType: "Regional Discrimination",
    reason:
      "Makes sweeping generalizations about people based on their state or region, ignoring individual diversity and perpetuating harmful stereotypes",
    suggestions: [
      "Some individuals from various backgrounds are",
      "Many people regardless of origin are",
      "Individual qualities vary among all people",
    ],
    rewrite:
      "People from all regions of India have diverse talents, qualities, and characteristics. Individual abilities and traits vary greatly regardless of geographic origin, and it's important not to generalize about entire populations based on their state or region.",
  },
  {
    pattern:
      /(andhra pradesh|telangana|tamil nadu|kerala|karnataka|maharashtra|gujarat|punjab|bihar|uttar pradesh|west bengal|rajasthan|madhya pradesh|odisha|assam|jharkhand|chhattisgarh|uttarakhand|himachal pradesh|haryana|delhi|goa) (people|folks|individuals) are (only|always|never|naturally|inherently|typically|usually|just)/gi,
    category: "nationality",
    discriminationType: "Regional Discrimination",
    reason:
      "Creates unfair stereotypes about entire populations based on their geographic location, which ignores individual diversity",
    suggestions: ["Some people are", "Many individuals are", "Individual characteristics vary among"],
    rewrite:
      "Individual characteristics, abilities, and qualities vary greatly among people regardless of their regional background. It's important to recognize the diversity within all communities rather than making generalizations.",
  },
  {
    pattern:
      /(north|south|east|west) indian (people|folks|individuals) are (only|always|never|naturally|inherently|typically|usually|just) (good|bad|smart|dumb|lazy|hardworking|honest|dishonest|violent|peaceful)/gi,
    category: "nationality",
    discriminationType: "Regional Discrimination",
    reason:
      "Makes broad generalizations about large populations based on geographic regions, perpetuating harmful stereotypes",
    suggestions: ["Some individuals are", "Many people are", "Individual traits vary among"],
    rewrite:
      "India's diverse population includes people with varying characteristics, abilities, and qualities regardless of their regional background. Individual traits are not determined by geographic location.",
  },
]

export default function BiasBusterApp() {
  const [text, setText] = useState("")
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [user, setUser] = useState<string | null>(null)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showLogin, setShowLogin] = useState(false)
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [authError, setAuthError] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Password reset states
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetMessage, setResetMessage] = useState("")
  const [isProcessingReset, setIsProcessingReset] = useState(false)

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("biasbuster-session-user")
    const savedUsername = localStorage.getItem("biasbuster-session-username")

    if (savedUser && savedUsername) {
      setUser(savedUser)
      setUsername(savedUsername)

      // Load user history from backend
      loadUserHistory(savedUser)
    }

    // Check for password reset token in URL
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get("reset-token")
    const emailParam = urlParams.get("email")

    if (token && emailParam) {
      setResetToken(token)
      setForgotPasswordEmail(emailParam)
      setShowResetPassword(true)
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const loadUserHistory = async (userEmail: string) => {
    try {
      const response = await apiCall("/users/profile", "GET", { email: userEmail })
      setHistory(
        response.user.history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })),
      )
    } catch (error) {
      console.error("Failed to load user history:", error)
    }
  }

  // Simulate sending email (in real app, this would call your backend)
  const simulateEmailSend = (email: string, resetLink: string): void => {
    // In a real application, you would send this via your email service
    const emailContent = `
🔐 BiasBuster Password Reset Request

Hello,

You requested to reset your password for your BiasBuster account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email.

Best regards,
The BiasBuster Team
    `

    console.log("📧 EMAIL SENT TO:", email)
    console.log("📧 EMAIL CONTENT:", emailContent)

    // For demo purposes, show the reset link in an alert
    alert(
      `🔐 Password Reset Email Sent!\n\nFor demo purposes, here's your reset link:\n${resetLink}\n\nIn a real app, this would be sent to your email: ${email}`,
    )
  }

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      setAuthError("Please enter your email address")
      return
    }

    setIsProcessingReset(true)
    setAuthError("")

    try {
      const response = await apiCall("/users/forgot-password", "POST", {
        email: forgotPasswordEmail.toLowerCase(),
      })

      // Create reset link
      const resetLink = `${window.location.origin}${window.location.pathname}?reset-token=${response.token}&email=${encodeURIComponent(forgotPasswordEmail.toLowerCase())}`

      // Simulate sending email
      simulateEmailSend(forgotPasswordEmail, resetLink)

      setResetMessage("Password reset instructions have been sent to your email!")
      setShowForgotPassword(false)
      setForgotPasswordEmail("")
    } catch (error: any) {
      setAuthError(error.message || "An error occurred while processing your request.")
    }

    setIsProcessingReset(false)
  }

  const handlePasswordReset = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setAuthError("Please fill in all fields")
      return
    }

    if (newPassword !== confirmPassword) {
      setAuthError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setAuthError("Password must be at least 6 characters long")
      return
    }

    setIsProcessingReset(true)
    setAuthError("")

    try {
      await apiCall("/users/reset-password", "POST", {
        token: resetToken,
        newPassword: newPassword,
      })

      setResetMessage("Password successfully updated! You can now sign in with your new password.")
      setShowResetPassword(false)
      setNewPassword("")
      setConfirmPassword("")
      setResetToken("")
      setForgotPasswordEmail("")

      // Auto-open login dialog
      setTimeout(() => {
        setShowLogin(true)
        setResetMessage("")
      }, 2000)
    } catch (error: any) {
      setAuthError(error.message || "An error occurred while resetting your password.")
    }

    setIsProcessingReset(false)
  }

  const analyzeText = async () => {
    if (!text.trim()) return

    // Check if user is logged in, if not show login dialog
    if (!user) {
      setShowLogin(true)
      return
    }

    setIsAnalyzing(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const words = text.toLowerCase().split(/\s+/)
    const biasedWords: BiasResult[] = []

    // Check for individual biased words
    Object.entries(biasDatabase).forEach(([category, categoryWords]) => {
      Object.entries(categoryWords).forEach(([word, data]) => {
        const regex = new RegExp(`\\b${word.replace(/\s+/g, "\\s+")}\\b`, "gi")
        const matches = text.match(regex)
        if (matches) {
          matches.forEach((match) => {
            const position = text.toLowerCase().indexOf(word.toLowerCase())
            biasedWords.push({
              word: match,
              category,
              discriminationType: `${category.charAt(0).toUpperCase() + category.slice(1)} Discrimination`,
              reason: data.reason,
              suggestions: data.suggestions,
              position,
            })
          })
        }
      })
    })

    // Check for contextual bias patterns
    contextualBiasPatterns.forEach((pattern) => {
      const matches = text.match(pattern.pattern)
      if (matches) {
        matches.forEach((match) => {
          const position = text.toLowerCase().indexOf(match.toLowerCase())
          biasedWords.push({
            word: match,
            category: pattern.category,
            discriminationType: pattern.discriminationType,
            reason: pattern.reason,
            suggestions: pattern.suggestions,
            rewrite: pattern.rewrite,
            position,
          })
        })
      }
    })

    // Calculate score with heavier penalty for contextual bias
    let penalty = 0
    biasedWords.forEach((bias) => {
      // Contextual bias gets higher penalty
      if (contextualBiasPatterns.some((p) => text.match(p.pattern))) {
        penalty += 3 // Heavy penalty for contextual bias
      } else {
        penalty += 1.5 // Regular penalty for individual words
      }
    })

    const score = Math.max(10 - penalty, 1)

    let message = ""
    if (score >= 9) message = "Excellent! Your text is highly inclusive."
    else if (score >= 7) message = "Good job! Minor improvements could make it even better."
    else if (score >= 5) message = "Fair. Several words could be more inclusive."
    else message = "Needs improvement. Consider revising for better inclusivity."

    // After calculating the result, add complete sentence rewrite
    const generateCompleteRewrite = (originalText: string, biasedWords: BiasResult[]): string => {
      let rewrittenText = originalText

      // Apply contextual rewrites first (for major bias patterns)
      contextualBiasPatterns.forEach((pattern) => {
        if (originalText.match(pattern.pattern) && pattern.rewrite) {
          rewrittenText = pattern.rewrite
        }
      })

      // If no major contextual rewrite was applied, do word-by-word replacement
      if (rewrittenText === originalText) {
        biasedWords.forEach((bias) => {
          if (bias.suggestions.length > 0) {
            const regex = new RegExp(`\\b${bias.word}\\b`, "gi")
            rewrittenText = rewrittenText.replace(regex, bias.suggestions[0])
          }
        })
      }

      return rewrittenText
    }

    const completeRewrite = biasedWords.length > 0 ? generateCompleteRewrite(text, biasedWords) : ""

    const result: AnalysisResult = {
      score: Math.round(score),
      biasedWords,
      totalWords: words.length,
      message,
      completeRewrite, // Add this new field
    }

    setAnalysis(result)
    setIsAnalyzing(false)

    // Save to history via backend
    if (user) {
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        score: result.score,
        biasedWords: result.biasedWords.length,
        timestamp: new Date(),
      }

      try {
        const response = await apiCall("/users/history", "POST", {
          email: user,
          historyItem: historyItem,
        })
        setHistory(
          response.history.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          })),
        )
      } catch (error) {
        console.error("Failed to save history:", error)
      }
    }
  }

  const handleLogin = async () => {
    if (!email.trim() || !password.trim() || (isSignUp && !username.trim())) {
      setAuthError("Please fill in all required fields")
      return
    }

    setIsAuthenticating(true)
    setAuthError("")

    try {
      if (isSignUp) {
        // Register new user
        const response = await apiCall("/users/register", "POST", {
          username: username.trim(),
          email: email.toLowerCase(),
          password: password,
        })

        // Set user session
        setUser(response.user.email)
        setUsername(response.user.username)
        localStorage.setItem("biasbuster-session-user", response.user.email)
        localStorage.setItem("biasbuster-session-username", response.user.username)

        setShowLogin(false)
        resetLoginForm()
        setHistory([]) // New user has no history

        // Add page refresh
        window.location.reload()
      } else {
        // Login existing user
        const response = await apiCall("/users/login", "POST", {
          email: email.toLowerCase(),
          password: password,
        })

        // Set user session
        setUser(response.user.email)
        setUsername(response.user.username)
        localStorage.setItem("biasbuster-session-user", response.user.email)
        localStorage.setItem("biasbuster-session-username", response.user.username)

        setShowLogin(false)
        resetLoginForm()

        // Load user history
        await loadUserHistory(response.user.email)

        // Add page refresh
        window.location.reload()
      }
    } catch (error: any) {
      if (error.message === "User already exists") {
        setAuthError("An account with this email already exists. Please sign in instead.")
      } else if (error.message === "User not found") {
        setAuthError("No account found with this email. Please sign up first.")
      } else if (error.message === "Invalid password") {
        setAuthError("Incorrect password. Please try again.")
      } else {
        setAuthError("An error occurred during authentication. Please try again.")
      }
    }

    setIsAuthenticating(false)
  }

  const resetLoginForm = () => {
    setEmail("")
    setPassword("")
    setUsername("")
    setAuthError("")
    setIsSignUp(false)
  }

  const resetPasswordForms = () => {
    setForgotPasswordEmail("")
    setNewPassword("")
    setConfirmPassword("")
    setResetToken("")
    setAuthError("")
    setResetMessage("")
    setShowForgotPassword(false)
    setShowResetPassword(false)
  }

  const handleLogout = () => {
    setUser(null)
    setUsername("")
    localStorage.removeItem("biasbuster-session-user")
    localStorage.removeItem("biasbuster-session-username")
    setHistory([])
    resetLoginForm()
    resetPasswordForms()
  }

  const clearHistoryItem = async (itemId: string) => {
    if (!user) return

    try {
      const response = await apiCall("/users/history", "DELETE", {
        email: user,
        itemId: itemId,
      })
      setHistory(
        response.history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })),
      )
    } catch (error) {
      console.error("Failed to delete history item:", error)
    }
  }

  const clearAllHistory = async () => {
    if (!user) return

    try {
      const response = await apiCall("/users/history", "DELETE", {
        email: user,
      })
      setHistory([])
    } catch (error) {
      console.error("Failed to clear history:", error)
    }
  }

  const replaceWord = (originalWord: string, replacement: string) => {
    const newText = text.replace(new RegExp(`\\b${originalWord}\\b`, "gi"), replacement)
    setText(newText)
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600"
    if (score >= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBackground = (score: number) => {
    if (score >= 8) return "bg-green-100"
    if (score >= 6) return "bg-yellow-100"
    return "bg-red-100"
  }

  const inspirationalQuotes = [
    "Words have power. Use them wisely to build bridges, not walls.",
    "Inclusive language opens doors that bias keeps closed.",
    "Every word is a choice. Choose inclusion.",
    "Language shapes reality. Make yours welcoming to all.",
    "The best communication includes everyone in the conversation.",
  ]

  const getRandomQuote = () => {
    return inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Reset Message Banner */}
      {resetMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 text-center">
          <CheckCircle className="inline h-4 w-4 mr-2" />
          {resetMessage}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">BiasBuster</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Hello, {username}! 🌟</p>
                    <p className="text-xs text-gray-500 italic">"{getRandomQuote()}"</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Dialog
                  open={showLogin}
                  onOpenChange={(open) => {
                    setShowLogin(open)
                    if (!open) {
                      resetLoginForm()
                      resetPasswordForms()
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader className="text-center">
                      <DialogTitle>Welcome</DialogTitle>
                      <DialogDescription>
                        {isSignUp
                          ? "Create your BiasBuster account to analyze text for bias and save your analysis history"
                          : "Sign in to analyze text for bias and access your analysis history"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {authError && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                          {authError}
                        </div>
                      )}

                      {isSignUp && (
                        <div>
                          <Label htmlFor="username">Name</Label>
                          <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Your name"
                            disabled={isAuthenticating}
                          />
                        </div>
                      )}

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value.toLowerCase())}
                          placeholder="your@email.com"
                          disabled={isAuthenticating}
                        />
                      </div>

                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          disabled={isAuthenticating}
                        />
                      </div>

                      <Button
                        onClick={handleLogin}
                        className="w-full"
                        disabled={
                          isAuthenticating || !email.trim() || !password.trim() || (isSignUp && !username.trim())
                        }
                      >
                        {isAuthenticating ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
                      </Button>

                      {!isSignUp && (
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setShowForgotPassword(true)
                              setAuthError("")
                            }}
                            className="text-sm text-indigo-600 hover:text-indigo-500 underline"
                            disabled={isAuthenticating}
                          >
                            Forgot your password?
                          </button>
                        </div>
                      )}

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSignUp(!isSignUp)
                            setAuthError("")
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-500 underline"
                          disabled={isAuthenticating}
                        >
                          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                        </button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-indigo-600" />
              Reset Your Password
            </DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you instructions to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {authError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{authError}</div>
            )}

            <div>
              <Label htmlFor="forgot-email">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value.toLowerCase())}
                placeholder="your@email.com"
                disabled={isProcessingReset}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForgotPassword(false)
                  setForgotPasswordEmail("")
                  setAuthError("")
                }}
                className="flex-1"
                disabled={isProcessingReset}
              >
                Cancel
              </Button>
              <Button
                onClick={handleForgotPassword}
                className="flex-1"
                disabled={isProcessingReset || !forgotPasswordEmail.trim()}
              >
                {isProcessingReset ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2 text-indigo-600" />
              Create New Password
            </DialogTitle>
            <DialogDescription>
              Enter your new password below. Make sure it's secure and easy for you to remember.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {authError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{authError}</div>
            )}

            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={isProcessingReset}
              />
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={isProcessingReset}
              />
            </div>

            <div className="text-xs text-gray-500">Password must be at least 6 characters long.</div>

            <Button
              onClick={handlePasswordReset}
              className="w-full"
              disabled={isProcessingReset || !newPassword.trim() || !confirmPassword.trim()}
            >
              {isProcessingReset ? "Updating Password..." : "Update Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Write Fair, Write Aware</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Analyze text for bias across multiple dimensions: gender, racial, religious, regional, educational,
            socio-economic, age-related, and more. Get detailed explanations of why content may be biased and receive
            inclusive alternatives. Perfect for job posts, content, and professional communication.
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-indigo-600" />
              Real-time Analysis
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-600" />
              Inclusive Suggestions
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-indigo-600" />
              Privacy Focused
            </div>
          </div>
        </div>

        <Tabs defaultValue="analyzer" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analyzer">Text Analyzer</TabsTrigger>
            <TabsTrigger value="history" disabled={!user}>
              History {!user && "(Login Required)"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyzer" className="space-y-6">
            {/* Main Analyzer */}
            <Card>
              <CardHeader>
                <CardTitle>Analyze Your Text</CardTitle>
                <CardDescription>
                  Paste your content below to analyze for bias across gender, racial, religious, regional, educational,
                  socio-economic, age-related, and other dimensions. Get detailed explanations and inclusive
                  alternatives.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste your job post, content, or any text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[200px]"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {text.length} characters,{" "}
                    {
                      text
                        .trim()
                        .split(/\s+/)
                        .filter((w) => w).length
                    }{" "}
                    words
                  </span>
                  <Button
                    onClick={analyzeText}
                    disabled={!text.trim() || isAnalyzing}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isAnalyzing ? "Analyzing..." : "Analyze Text"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {analysis && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score Card */}
                <Card className={getScoreBackground(analysis.score)}>
                  <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">
                      <span className={getScoreColor(analysis.score)}>{analysis.score}/10</span>
                    </CardTitle>
                    <CardDescription className="font-medium">Inclusivity Score</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={analysis.score * 10} className="mb-4" />
                    <p className="text-sm text-center">{analysis.message}</p>
                  </CardContent>
                </Card>

                {/* Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analysis Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Words:</span>
                      <Badge variant="secondary">{analysis.totalWords}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Biased Words:</span>
                      <Badge variant={analysis.biasedWords.length > 0 ? "destructive" : "secondary"}>
                        {analysis.biasedWords.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Categories:</span>
                      <Badge variant="outline">{new Set(analysis.biasedWords.map((w) => w.category)).size}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={() => setText("")}>
                      Clear Text
                    </Button>
                    <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={analyzeText}>
                      Re-analyze
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Detailed Results */}
            {analysis && analysis.biasedWords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                    Detected Issues & Suggestions
                  </CardTitle>
                  <CardDescription>Click on suggestions to replace words in your text</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.biasedWords.map((bias, index) => (
                      <Alert key={index}>
                        <AlertDescription>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-red-600">"{bias.word}"</span>
                                <Badge variant="destructive" className="ml-2">
                                  {bias.discriminationType}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{bias.reason}</p>

                            {bias.rewrite && (
                              <div className="bg-green-50 p-3 rounded border border-green-200">
                                <p className="text-sm font-medium text-green-800 mb-2">Suggested inclusive rewrite:</p>
                                <p className="text-sm text-green-700 mb-3">{bias.rewrite}</p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigator.clipboard.writeText(bias.rewrite || "")}
                                    className="border-green-200 text-green-600 hover:bg-green-50"
                                  >
                                    Copy Rewrite
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div>
                              <p className="text-sm font-medium mb-2">Word alternatives:</p>
                              <div className="flex flex-wrap gap-2">
                                {bias.suggestions.map((suggestion, idx) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => replaceWord(bias.word, suggestion)}
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                  >
                                    {suggestion}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                  {/* Complete Sentence Rewrite Section */}
                  {analysis.completeRewrite && analysis.completeRewrite !== text && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Complete Inclusive Rewrite
                      </h4>
                      <div className="bg-white p-4 rounded border border-green-100 mb-4">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Original text:</p>
                        <p className="text-gray-800 mb-4 p-2 bg-red-50 rounded border-l-4 border-red-300">{text}</p>
                        <p className="text-sm text-green-800 mb-2 font-medium">Inclusive rewrite:</p>
                        <p className="text-green-700 font-medium p-2 bg-green-50 rounded border-l-4 border-green-400">
                          {analysis.completeRewrite}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(analysis.completeRewrite || "")}
                          className="border-green-200 text-green-600 hover:bg-green-50"
                        >
                          Copy Rewrite
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const comparison = `Original: ${text}\n\nInclusive Rewrite: ${analysis.completeRewrite}`
                            navigator.clipboard.writeText(comparison)
                          }}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          Copy Both Versions
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <History className="h-5 w-5 mr-2" />
                      Analysis History
                    </CardTitle>
                    <CardDescription>Your recent text analyses and scores</CardDescription>
                  </div>
                  {history.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllHistory}
                      className="text-red-600 border-red-200 bg-transparent"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No analysis history yet. Start analyzing some text!</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">
                              {new Date(item.timestamp).toLocaleDateString()} at{" "}
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </p>
                            <p className="text-sm">{item.text}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className={`text-lg font-bold ${getScoreColor(item.score)}`}>{item.score}/10</div>
                              <div className="text-xs text-gray-500">{item.biasedWords} issues</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => clearHistoryItem(item.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">{'"Language shapes reality. Choose words that include, not exclude."'}</p>
            <p className="text-sm text-gray-500">
              BiasBuster - Making communication more inclusive, one word at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
