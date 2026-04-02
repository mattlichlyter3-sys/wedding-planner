'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SUGGESTION_CATEGORIES } from '@/lib/constants'
import { Heart, CheckCircle } from 'lucide-react'

export default function SuggestPage() {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [category, setCategory] = useState('other')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submitter_name: name, suggestion_text: text, category }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
    } else {
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <Heart className="h-10 w-10 text-pink-500 fill-pink-500" />
          </div>
          <CardTitle className="text-2xl">Share a Suggestion</CardTitle>
          <CardDescription>
            Have an idea for the wedding? We&apos;d love to hear it!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
              <p className="font-semibold text-gray-800">Thank you, {name}!</p>
              <p className="text-sm text-gray-500">Your suggestion has been received.</p>
              <Button
                variant="outline"
                onClick={() => { setSubmitted(false); setName(''); setText(''); setCategory('other') }}
              >
                Submit another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="First name is fine"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUGGESTION_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="text">Your Suggestion</Label>
                <Textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Tell us your idea..."
                  rows={4}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full bg-pink-500 hover:bg-pink-600" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Suggestion'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
