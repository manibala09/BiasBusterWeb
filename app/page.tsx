"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, History, User, LogOut, Shield, Target, Users, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

  useEffect(() => {
    const savedUser = localStorage.getItem("biasbuster-user")
    const savedUsername = localStorage.getItem("biasbuster-username")
    const savedHistory = localStorage.getItem("biasbuster-history")

    if (savedUser && savedUsername) {
      setUser(savedUser)
      setUsername(savedUsername)
    }
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp), // Convert string back to Date object
      }))
      setHistory(parsedHistory)
    }
  }, [])

  const analyzeText = async () => {
    if (!text.trim()) return

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

    // Save to history if user is logged in
    if (user) {
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        score: result.score,
        biasedWords: result.biasedWords.length,
        timestamp: new Date(),
      }
      const newHistory = [historyItem, ...history].slice(0, 10)
      setHistory(newHistory)
      localStorage.setItem("biasbuster-history", JSON.stringify(newHistory))
    }
  }

  const handleLogin = async () => {
    if (!email.trim() || !password.trim() || (isSignUp && !username.trim())) {
      setAuthError("Please fill in all required fields")
      return
    }

    setIsAuthenticating(true)
    setAuthError("")

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const savedUsers = JSON.parse(localStorage.getItem("biasbuster-users") || "{}")

    if (isSignUp) {
      // Sign up logic
      if (savedUsers[email]) {
        setAuthError("Account already exists. Please sign in instead.")
        setIsAuthenticating(false)
        return
      }

      // Create new account
      savedUsers[email] = {
        username: username,
        password: password,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem("biasbuster-users", JSON.stringify(savedUsers))

      setUser(email)
      setUsername(username)
      localStorage.setItem("biasbuster-user", email)
      localStorage.setItem("biasbuster-username", username)
      setShowLogin(false)
      resetLoginForm()
    } else {
      // Sign in logic
      if (!savedUsers[email]) {
        setAuthError("No account found with this email. Please sign up first.")
        setIsAuthenticating(false)
        return
      }

      if (savedUsers[email].password !== password) {
        setAuthError("Incorrect password. Please try again.")
        setIsAuthenticating(false)
        return
      }

      // Successful login
      setUser(email)
      setUsername(savedUsers[email].username)
      localStorage.setItem("biasbuster-user", email)
      localStorage.setItem("biasbuster-username", savedUsers[email].username)
      setShowLogin(false)
      resetLoginForm()
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

  const handleLogout = () => {
    setUser(null)
    setUsername("")
    localStorage.removeItem("biasbuster-user")
    localStorage.removeItem("biasbuster-username")
    setHistory([])
    localStorage.removeItem("biasbuster-history")
    resetLoginForm()
  }

  const clearHistoryItem = (itemId: string) => {
    const newHistory = history.filter((item) => item.id !== itemId)
    setHistory(newHistory)
    localStorage.setItem("biasbuster-history", JSON.stringify(newHistory))
  }

  const clearAllHistory = () => {
    setHistory([])
    localStorage.removeItem("biasbuster-history")
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
                    <DialogHeader>
                      <DialogTitle>{isSignUp ? "Create Account" : "Welcome Back"}</DialogTitle>
                      <DialogDescription>
                        {isSignUp
                          ? "Create your BiasBuster account to save analysis history"
                          : "Sign in to access your analysis history"}
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
                          onChange={(e) => setEmail(e.target.value)}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Write Fair, Write Aware</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {
              "Discover unconscious bias in your writing and learn to communicate more inclusively. Perfect for job posts, content, and professional communication."
            }
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
                <CardDescription>Paste your content below to check for potentially biased language</CardDescription>
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
