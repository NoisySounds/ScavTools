"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, Edit, Trash2, Copy, Heart, HeartOff, Code } from "lucide-react"
import { highlightCode } from "@/lib/syntax-highlight"
import { normalizeTag, hasTag } from "@/lib/normalize-tag"

interface Snippet {
  id: string
  title: string
  description?: string
  code: string
  language: string
  isPublic: boolean
  isFavorite: boolean
  tags: Tag[]
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
  }
}

interface Tag {
  id: string
  name: string
  color?: string
}

const PROGRAMMING_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "csharp",
  "cpp",
  "c",
  "php",
  "ruby",
  "go",
  "rust",
  "swift",
  "kotlin",
  "html",
  "css",
  "sql",
  "bash",
  "powershell",
  "json",
  "xml",
  "yaml",
  "markdown",
]

export default function CodeSnippetSaver() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("library")
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    code: "",
    language: "javascript",
    isPublic: false,
    tags: [] as string[],
  })

  useEffect(() => {
    fetchSnippets()
    fetchTags()
  }, [debouncedSearchTerm, selectedLanguage, selectedTags, showFavorites])

  const fetchSnippets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm)
      if (selectedLanguage) params.append("language", selectedLanguage)
      if (selectedTags.length > 0) params.append("tags", selectedTags.join(","))
      if (showFavorites) params.append("isFavorite", "true")

      const response = await fetch(`/api/snippets?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSnippets(data.snippets)
      }
    } catch (error) {
      console.error("Error fetching snippets:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/snippets/tags")
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingSnippet ? `/api/snippets/${editingSnippet.id}` : "/api/snippets"
      const method = editingSnippet ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        resetForm()
        fetchSnippets()
        setActiveTab("library")
      }
    } catch (error) {
      console.error("Error saving snippet:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (snippet: Snippet) => {
    setFormData({
      title: snippet.title,
      description: snippet.description || "",
      code: snippet.code,
      language: snippet.language,
      isPublic: snippet.isPublic,
      tags: snippet.tags.map((tag) => tag.name),
    })
    setEditingSnippet(snippet)
    setActiveTab("editor")
  }

  const requestDelete = (id: string) => {
    setConfirmingDeleteId(id)
  }

  const cancelDelete = () => {
    setConfirmingDeleteId(null)
  }

  const confirmDelete = async (id: string) => {
    setConfirmingDeleteId(null)

    try {
      const response = await fetch(`/api/snippets/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        fetchSnippets()
      }
    } catch (error) {
      console.error("Error deleting snippet:", error)
    }
  }

  const toggleFavorite = async (id: string) => {
    try {
      const response = await fetch(`/api/snippets/${id}/favorite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        fetchSnippets()
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    // You could add a toast notification here
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      code: "",
      language: "javascript",
      isPublic: false,
      tags: [],
    })
    setEditingSnippet(null)
  }

  const addTag = (tagName: string) => {
    const normalized = normalizeTag(tagName)
    if (normalized && !hasTag(formData.tags, normalized)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, normalized],
      }))
    }
  }

  const removeTag = (tagName: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagName),
    }))
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Code Snippet Saver</h1>
        <p className="text-muted-foreground">
          Save, organize, and manage your code snippets with syntax highlighting and tagging.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="library">Snippet Library</TabsTrigger>
          <TabsTrigger value="editor">{editingSnippet ? "Edit Snippet" : "New Snippet"}</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          {/* Search and Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search snippets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="All languages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All languages</SelectItem>
                      {PROGRAMMING_LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !selectedTags.includes(value)) {
                        setSelectedTags([...selectedTags, value])
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add tag filter" />
                    </SelectTrigger>
                    <SelectContent>
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="favorites" checked={showFavorites} onCheckedChange={setShowFavorites} />
                  <Label htmlFor="favorites">Favorites only</Label>
                </div>
              </div>

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedTags(selectedTags.filter((t) => t !== tag))
                      }}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Snippets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {snippets.map((snippet) => (
              <Card key={snippet.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{snippet.title}</CardTitle>
                      {snippet.description && <CardDescription className="mt-1">{snippet.description}</CardDescription>}
                    </div>
                    {confirmingDeleteId === snippet.id ? (
                      <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1">
                        <span className="text-xs text-destructive">Delete?</span>
                        <Button size="sm" variant="destructive" onClick={() => confirmDelete(snippet.id)}>
                          Delete
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelDelete}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" onClick={() => toggleFavorite(snippet.id)}>
                          {snippet.isFavorite ? (
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          ) : (
                            <HeartOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(snippet)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => requestDelete(snippet.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{snippet.language}</Badge>
                    {snippet.isPublic && <Badge variant="secondary">Public</Badge>}
                  </div>

                  {snippet.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {snippet.tags.map((tag) => (
                        <Badge key={tag.id} variant="outline" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-sm overflow-x-auto">
                      <code>
                        {highlightCode(snippet.code.substring(0, 200), snippet.language)}
                        {snippet.code.length > 200 && "..."}
                      </code>
                    </pre>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(snippet.updatedAt).toLocaleDateString()}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(snippet.code)}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {snippets.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-8">
                <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No snippets found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedLanguage || selectedTags.length > 0
                    ? "Try adjusting your search filters"
                    : "Create your first code snippet to get started"}
                </p>
                <Button onClick={() => setActiveTab("editor")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Snippet
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingSnippet ? "Edit Snippet" : "Create New Snippet"}</CardTitle>
              <CardDescription>Save your code snippets with syntax highlighting and organization.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter snippet title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">Language *</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROGRAMMING_LANGUAGES.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang.charAt(0).toUpperCase() + lang.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the snippet"
                  />
                </div>

                <div>
                  <Label htmlFor="code">Code *</Label>
                  <Textarea
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="Paste your code here..."
                    className="min-h-[300px] font-mono"
                    required
                  />
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addTag(e.currentTarget.value)
                          e.currentTarget.value = ""
                        }
                      }}
                    />
                    <Select value="" onValueChange={addTag}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Existing tags" />
                      </SelectTrigger>
                      <SelectContent>
                        {tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="public"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublic: checked }))}
                  />
                  <Label htmlFor="public">Make this snippet public</Label>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingSnippet ? "Update Snippet" : "Save Snippet"}
                  </Button>
                  {editingSnippet && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
