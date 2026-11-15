import { useState, useEffect, useCallback } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Sparkles, Trash, PencilSquare, Plus, ArrowUpMini, ArrowDownMini, Photo, Check, XMark } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Text,
  Badge,
  Input,
  Textarea,
  Select,
  Switch,
  Toaster,
  toast,
} from "@medusajs/ui"

interface CampaignSlide {
  id: string
  title: string
  subtitle?: string | null
  eyebrow?: string | null
  description?: string | null
  desktop_image_url: string
  mobile_image_url?: string | null
  primary_cta_label?: string | null
  primary_cta_url?: string | null
  secondary_cta_label?: string | null
  secondary_cta_url?: string | null
  text_alignment: "left" | "center" | "right"
  focal_position: string
  overlay_strength: "none" | "subtle" | "medium" | "strong"
  display_order: number
  is_active: boolean
  status: "draft" | "published"
  starts_at?: string | null
  ends_at?: string | null
}

interface AnnouncementBar {
  id?: string | null
  text: string
  link_url?: string | null
  is_active: boolean
  desktop_autoplay: boolean
  autoplay_interval_ms: number
}

const DEFAULT_SLIDE: Partial<CampaignSlide> = {
  title: "OFFLINE BY CHOICE.",
  subtitle: "PAUSE THE GAME. KEEP YOUR STYLE.",
  eyebrow: "DROP 01 // OVERSIZED DROP SHOULDER TEES",
  description:
    "Away From Keyboard. Engineered for Dhaka street culture with relaxed dropped shoulders, wide boxy cuts, and dense pre-shrunk cotton.",
  desktop_image_url:
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1600&q=85",
  mobile_image_url: "",
  primary_cta_label: "SHOP THE DROP",
  primary_cta_url: "/store",
  secondary_cta_label: "ABOUT THE THEORY",
  secondary_cta_url: "/about",
  text_alignment: "left",
  focal_position: "center",
  overlay_strength: "medium",
  display_order: 0,
  is_active: true,
  status: "published",
}

const CampaignSlidesPage = () => {
  const [slides, setSlides] = useState<CampaignSlide[]>([])
  const [announcement, setAnnouncement] = useState<AnnouncementBar>({
    text: "PAUSE THE GAME. KEEP YOUR STYLE. • CASH ON DELIVERY AVAILABLE ACROSS BANGLADESH",
    link_url: "",
    is_active: true,
    desktop_autoplay: false,
    autoplay_interval_ms: 6000,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [currentSlide, setCurrentSlide] = useState<Partial<CampaignSlide>>(DEFAULT_SLIDE)
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop")
  const [isSaving, setIsSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [slidesRes, anncRes] = await Promise.all([
        fetch("/admin/campaign-slides", { credentials: "include" }),
        fetch("/admin/announcement-bar", { credentials: "include" }),
      ])

      if (slidesRes.ok) {
        const data = await slidesRes.json()
        setSlides(data.campaign_slides || [])
      }

      if (anncRes.ok) {
        const data = await anncRes.json()
        if (data.announcement_bar) {
          setAnnouncement(data.announcement_bar)
        }
      }
    } catch (err) {
      console.error("Failed to fetch campaign data:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const isUpdate = Boolean(currentSlide.id)
      const url = isUpdate
        ? `/admin/campaign-slides/${currentSlide.id}`
        : "/admin/campaign-slides"

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(currentSlide),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to save slide")
      }

      toast.success(isUpdate ? "Slide updated successfully" : "Slide created successfully")
      setIsEditing(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSlide = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign slide?")) return

    try {
      const res = await fetch(`/admin/campaign-slides/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) throw new Error("Failed to delete slide")

      toast.success("Slide deleted")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete")
    }
  }

  const handleToggleActive = async (slide: CampaignSlide) => {
    try {
      const res = await fetch(`/admin/campaign-slides/${slide.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !slide.is_active }),
      })

      if (!res.ok) throw new Error("Failed to update status")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to update status")
    }
  }

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= slides.length) return

    const reordered = [...slides]
    const temp = reordered[index]
    reordered[index] = reordered[targetIndex]
    reordered[targetIndex] = temp

    // Update display_order for both
    try {
      await Promise.all([
        fetch(`/admin/campaign-slides/${reordered[index].id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ display_order: index }),
        }),
        fetch(`/admin/campaign-slides/${reordered[targetIndex].id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ display_order: targetIndex }),
        }),
      ])
      fetchData()
    } catch (err) {
      console.error("Reorder failed", err)
    }
  }

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/admin/announcement-bar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(announcement),
      })

      if (!res.ok) throw new Error("Failed to save announcement bar")
      toast.success("Announcement bar settings updated")
    } catch (err: any) {
      toast.error(err.message || "Failed to save")
    }
  }

  return (
    <div className="flex flex-col gap-y-6 max-w-7xl mx-auto p-6 font-sans">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-ui-border-base pb-5">
        <div>
          <Heading className="text-2xl font-bold tracking-tight text-ui-fg-base">
            Storefront Campaign Management
          </Heading>
          <Text className="text-ui-fg-subtle text-sm mt-1">
            Configure dynamic homepage hero slides, scheduling, and announcement banner for AFK THEORY.
          </Text>
        </div>

        <Button
          variant="primary"
          size="base"
          onClick={() => {
            setCurrentSlide({
              ...DEFAULT_SLIDE,
              display_order: slides.length,
            })
            setIsEditing(true)
          }}
          className="bg-brand-primary text-white hover:bg-black"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create New Slide
        </Button>
      </div>

      {/* Announcement Bar & Hero Settings Card */}
      <Container className="p-6 bg-ui-bg-subtle border border-ui-border-base rounded-lg">
        <form onSubmit={handleSaveAnnouncement} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Heading level="h3" className="text-base font-semibold text-ui-fg-base">
                Announcement Bar &amp; Playback Configuration
              </Heading>
              <Text className="text-xs text-ui-fg-subtle mt-0.5">
                Controls the top banner and hero slider playback behavior.
              </Text>
            </div>
            <Button type="submit" variant="secondary" size="small">
              Save Settings
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <Text className="text-xs font-medium text-ui-fg-base mb-1">Banner Announcement Text</Text>
              <Input
                value={announcement.text}
                onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
                placeholder="e.g. PAUSE THE GAME. KEEP YOUR STYLE. • CASH ON DELIVERY"
              />
            </div>

            <div>
              <Text className="text-xs font-medium text-ui-fg-base mb-1">Optional Banner Destination URL</Text>
              <Input
                value={announcement.link_url || ""}
                onChange={(e) => setAnnouncement({ ...announcement, link_url: e.target.value })}
                placeholder="e.g. /store or /about"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-ui-border-base/50">
            <div className="flex items-center gap-2">
              <Switch
                checked={announcement.is_active}
                onCheckedChange={(checked) => setAnnouncement({ ...announcement, is_active: checked })}
              />
              <Text className="text-xs text-ui-fg-base">Display Announcement Bar</Text>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={announcement.desktop_autoplay}
                onCheckedChange={(checked) => setAnnouncement({ ...announcement, desktop_autoplay: checked })}
              />
              <Text className="text-xs text-ui-fg-base">Desktop Hero Autoplay (Disabled on Mobile by Default)</Text>
            </div>

            {announcement.desktop_autoplay && (
              <div className="flex items-center gap-2">
                <Text className="text-xs text-ui-fg-subtle">Interval (ms):</Text>
                <Input
                  type="number"
                  min={3000}
                  max={20000}
                  step={500}
                  className="w-24 text-xs"
                  value={announcement.autoplay_interval_ms}
                  onChange={(e) =>
                    setAnnouncement({ ...announcement, autoplay_interval_ms: Number(e.target.value) })
                  }
                />
              </div>
            )}
          </div>
        </form>
      </Container>

      {/* Slide Editor Modal / Drawer */}
      {isEditing && (
        <Container className="p-6 border-2 border-ui-border-interactive rounded-lg bg-ui-bg-base space-y-6">
          <div className="flex items-center justify-between border-b border-ui-border-base pb-3">
            <Heading level="h2" className="text-lg font-bold text-ui-fg-base">
              {currentSlide.id ? "Edit Campaign Slide" : "Create New Campaign Slide"}
            </Heading>
            <Button variant="transparent" size="small" onClick={() => setIsEditing(false)}>
              <XMark className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSaveSlide} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Form Fields */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Text className="text-xs font-semibold mb-1">Status</Text>
                    <Select
                      value={currentSlide.status}
                      onValueChange={(val: "draft" | "published") =>
                        setCurrentSlide({ ...currentSlide, status: val })
                      }
                    >
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="published">Published</Select.Item>
                        <Select.Item value="draft">Draft</Select.Item>
                      </Select.Content>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      checked={currentSlide.is_active}
                      onCheckedChange={(checked) =>
                        setCurrentSlide({ ...currentSlide, is_active: checked })
                      }
                    />
                    <Text className="text-xs font-medium">Slide Enabled</Text>
                  </div>
                </div>

                <div>
                  <Text className="text-xs font-semibold mb-1">Eyebrow / Badge Text</Text>
                  <Input
                    value={currentSlide.eyebrow || ""}
                    onChange={(e) => setCurrentSlide({ ...currentSlide, eyebrow: e.target.value })}
                    placeholder="e.g. DROP 01 // OVERSIZED DROP SHOULDER TEES"
                  />
                </div>

                <div>
                  <Text className="text-xs font-semibold mb-1">Main Heading (Title)</Text>
                  <Input
                    required
                    value={currentSlide.title || ""}
                    onChange={(e) => setCurrentSlide({ ...currentSlide, title: e.target.value })}
                    placeholder="e.g. OFFLINE BY CHOICE."
                  />
                </div>

                <div>
                  <Text className="text-xs font-semibold mb-1">Subtitle (Secondary Heading)</Text>
                  <Input
                    value={currentSlide.subtitle || ""}
                    onChange={(e) => setCurrentSlide({ ...currentSlide, subtitle: e.target.value })}
                    placeholder="e.g. PAUSE THE GAME. KEEP YOUR STYLE."
                  />
                </div>

                <div>
                  <Text className="text-xs font-semibold mb-1">Narrative Description</Text>
                  <Textarea
                    rows={3}
                    value={currentSlide.description || ""}
                    onChange={(e) => setCurrentSlide({ ...currentSlide, description: e.target.value })}
                    placeholder="e.g. Away From Keyboard. Engineered for Dhaka street culture with relaxed dropped shoulders..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Text className="text-xs font-semibold mb-1">Desktop Image URL</Text>
                    <Input
                      required
                      value={currentSlide.desktop_image_url || ""}
                      onChange={(e) => setCurrentSlide({ ...currentSlide, desktop_image_url: e.target.value })}
                      placeholder="https://... or /brand/..."
                    />
                  </div>

                  <div>
                    <Text className="text-xs font-semibold mb-1">Mobile Image URL (Optional)</Text>
                    <Input
                      value={currentSlide.mobile_image_url || ""}
                      onChange={(e) => setCurrentSlide({ ...currentSlide, mobile_image_url: e.target.value })}
                      placeholder="Leave empty to use desktop image"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Text className="text-xs font-semibold mb-1">Primary CTA Label</Text>
                    <Input
                      value={currentSlide.primary_cta_label || ""}
                      onChange={(e) => setCurrentSlide({ ...currentSlide, primary_cta_label: e.target.value })}
                      placeholder="e.g. SHOP THE DROP"
                    />
                  </div>

                  <div>
                    <Text className="text-xs font-semibold mb-1">Primary CTA URL</Text>
                    <Input
                      value={currentSlide.primary_cta_url || ""}
                      onChange={(e) => setCurrentSlide({ ...currentSlide, primary_cta_url: e.target.value })}
                      placeholder="e.g. /store"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Text className="text-xs font-semibold mb-1">Secondary CTA Label (Optional)</Text>
                    <Input
                      value={currentSlide.secondary_cta_label || ""}
                      onChange={(e) =>
                        setCurrentSlide({ ...currentSlide, secondary_cta_label: e.target.value })
                      }
                      placeholder="e.g. ABOUT THE THEORY"
                    />
                  </div>

                  <div>
                    <Text className="text-xs font-semibold mb-1">Secondary CTA URL</Text>
                    <Input
                      value={currentSlide.secondary_cta_url || ""}
                      onChange={(e) => setCurrentSlide({ ...currentSlide, secondary_cta_url: e.target.value })}
                      placeholder="e.g. /about"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Text className="text-xs font-semibold mb-1">Text Alignment</Text>
                    <Select
                      value={currentSlide.text_alignment || "left"}
                      onValueChange={(val: "left" | "center" | "right") =>
                        setCurrentSlide({ ...currentSlide, text_alignment: val })
                      }
                    >
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="left">Left</Select.Item>
                        <Select.Item value="center">Center</Select.Item>
                        <Select.Item value="right">Right</Select.Item>
                      </Select.Content>
                    </Select>
                  </div>

                  <div>
                    <Text className="text-xs font-semibold mb-1">Overlay Scrim</Text>
                    <Select
                      value={currentSlide.overlay_strength || "medium"}
                      onValueChange={(val: "none" | "subtle" | "medium" | "strong") =>
                        setCurrentSlide({ ...currentSlide, overlay_strength: val })
                      }
                    >
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="none">None (0%)</Select.Item>
                        <Select.Item value="subtle">Subtle (30%)</Select.Item>
                        <Select.Item value="medium">Medium (60%)</Select.Item>
                        <Select.Item value="strong">Strong (90%)</Select.Item>
                      </Select.Content>
                    </Select>
                  </div>

                  <div>
                    <Text className="text-xs font-semibold mb-1">Display Order</Text>
                    <Input
                      type="number"
                      value={currentSlide.display_order ?? 0}
                      onChange={(e) =>
                        setCurrentSlide({ ...currentSlide, display_order: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Text className="text-xs font-semibold mb-1">Schedule Start Date (Optional)</Text>
                    <Input
                      type="datetime-local"
                      value={currentSlide.starts_at ? new Date(currentSlide.starts_at).toISOString().slice(0, 16) : ""}
                      onChange={(e) =>
                        setCurrentSlide({
                          ...currentSlide,
                          starts_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Text className="text-xs font-semibold mb-1">Schedule End Date (Optional)</Text>
                    <Input
                      type="datetime-local"
                      value={currentSlide.ends_at ? new Date(currentSlide.ends_at).toISOString().slice(0, 16) : ""}
                      onChange={(e) =>
                        setCurrentSlide({
                          ...currentSlide,
                          ends_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Live Interactive Preview */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    type="button"
                    size="small"
                    variant={previewViewport === "desktop" ? "primary" : "secondary"}
                    onClick={() => setPreviewViewport("desktop")}
                  >
                    Desktop (16:9)
                  </Button>
                  <Button
                    type="button"
                    size="small"
                    variant={previewViewport === "mobile" ? "primary" : "secondary"}
                    onClick={() => setPreviewViewport("mobile")}
                  >
                    Mobile (4:5)
                  </Button>
                </div>

                {/* Simulation Canvas */}
                <div
                  className={`relative overflow-hidden border border-black bg-[#20241F] shadow-lg transition-all duration-300 flex flex-col justify-end p-6 ${
                    previewViewport === "desktop"
                      ? "w-full aspect-[16/9]"
                      : "w-[280px] aspect-[4/5]"
                  }`}
                >
                  <img
                    src={
                      (previewViewport === "mobile" && currentSlide.mobile_image_url) ||
                      currentSlide.desktop_image_url ||
                      ""
                    }
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = "none"
                    }}
                  />

                  {/* Overlay Scrim */}
                  {currentSlide.overlay_strength !== "none" && (
                    <div
                      className={`absolute inset-0 pointer-events-none ${
                        currentSlide.overlay_strength === "subtle"
                          ? "bg-gradient-to-t from-black/40 to-transparent"
                          : currentSlide.overlay_strength === "medium"
                            ? "bg-gradient-to-t from-[#161815]/80 via-[#20241F]/40 to-transparent"
                            : "bg-gradient-to-t from-[#161815]/95 via-[#20241F]/70 to-black/30"
                      }`}
                    />
                  )}

                  {/* Content Preview */}
                  <div
                    className={`relative z-10 text-white space-y-2 ${
                      currentSlide.text_alignment === "center"
                        ? "text-center mx-auto"
                        : currentSlide.text_alignment === "right"
                          ? "text-right ml-auto"
                          : "text-left"
                    }`}
                  >
                    {currentSlide.eyebrow && (
                      <span className="inline-block px-2 py-0.5 bg-[#D8F452] text-[#20241F] text-[9px] font-black uppercase tracking-wider">
                        {currentSlide.eyebrow}
                      </span>
                    )}

                    <h4 className="font-black text-lg sm:text-xl uppercase leading-tight">
                      {currentSlide.title || "CAMPAIGN TITLE"}
                    </h4>

                    {currentSlide.subtitle && (
                      <p className="text-[#D8F452] font-semibold text-xs tracking-tight">
                        {currentSlide.subtitle}
                      </p>
                    )}

                    {currentSlide.description && (
                      <p className="text-white/80 text-[10px] leading-relaxed line-clamp-2">
                        {currentSlide.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      {currentSlide.primary_cta_label && (
                        <span className="px-3 py-1 bg-[#D8F452] text-[#20241F] text-[10px] font-extrabold uppercase">
                          {currentSlide.primary_cta_label}
                        </span>
                      )}
                      {currentSlide.secondary_cta_label && (
                        <span className="px-3 py-1 border border-white/40 text-white text-[10px] font-bold uppercase">
                          {currentSlide.secondary_cta_label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-ui-border-base">
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? "Saving..." : currentSlide.id ? "Update Slide" : "Create Slide"}
              </Button>
            </div>
          </form>
        </Container>
      )}

      {/* Slide Inventory List */}
      <Container className="p-0 border border-ui-border-base rounded-lg overflow-hidden bg-ui-bg-base">
        <div className="p-4 border-b border-ui-border-base bg-ui-bg-subtle flex items-center justify-between">
          <div>
            <Heading level="h3" className="text-sm font-semibold text-ui-fg-base">
              Active &amp; Draft Slides ({slides.length})
            </Heading>
            <Text className="text-xs text-ui-fg-subtle">
              Sorted by display order. The first active slide displays on page load.
            </Text>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-ui-fg-subtle text-sm">Loading slides...</div>
        ) : slides.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Photo className="w-10 h-10 mx-auto text-ui-fg-muted" />
            <Text className="text-ui-fg-base font-medium">No campaign slides created yet</Text>
            <Text className="text-xs text-ui-fg-subtle max-w-sm mx-auto">
              Click &quot;Create New Slide&quot; to publish your first banner. When no slides are active, an elegant branded fallback is shown.
            </Text>
          </div>
        ) : (
          <div className="divide-y divide-ui-border-base">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-ui-bg-subtle/40 transition-colors"
              >
                {/* Thumbnail & Title */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-24 h-14 bg-black rounded overflow-hidden relative flex-shrink-0 border border-ui-border-base">
                    <img
                      src={slide.desktop_image_url}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-ui-fg-base">{slide.title}</span>
                      <Badge size="2xsmall" color={slide.status === "published" ? "green" : "grey"}>
                        {slide.status.toUpperCase()}
                      </Badge>
                      <Badge size="2xsmall" color={slide.is_active ? "blue" : "red"}>
                        {slide.is_active ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </div>

                    <Text className="text-xs text-ui-fg-subtle line-clamp-1">
                      {slide.subtitle || slide.eyebrow || "No subtitle"} • CTA: {slide.primary_cta_label || "None"} ({slide.primary_cta_url || "-"})
                    </Text>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Reorder Buttons */}
                  <Button
                    variant="transparent"
                    size="small"
                    disabled={index === 0}
                    onClick={() => handleReorder(index, "up")}
                    aria-label="Move slide up"
                  >
                    <ArrowUpMini className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="transparent"
                    size="small"
                    disabled={index === slides.length - 1}
                    onClick={() => handleReorder(index, "down")}
                    aria-label="Move slide down"
                  >
                    <ArrowDownMini className="w-4 h-4" />
                  </Button>

                  {/* Toggle Active */}
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleToggleActive(slide)}
                    title={slide.is_active ? "Disable slide" : "Enable slide"}
                  >
                    {slide.is_active ? <XMark className="w-3.5 h-3.5 mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                    {slide.is_active ? "Disable" : "Enable"}
                  </Button>

                  {/* Edit */}
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => {
                      setCurrentSlide(slide)
                      setIsEditing(true)
                    }}
                  >
                    <PencilSquare className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDeleteSlide(slide.id)}
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Campaign Slides",
  icon: Sparkles,
})

export default CampaignSlidesPage
