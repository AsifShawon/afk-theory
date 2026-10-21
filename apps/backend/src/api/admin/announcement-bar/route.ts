import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CAMPAIGN_MODULE } from "../../../modules/campaign"
import { updateAnnouncementBarWorkflow } from "../../../workflows/campaign/update-announcement-bar"
import { AnnouncementBarSchema } from "../campaign-slides/validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const campaignService = req.scope.resolve(CAMPAIGN_MODULE) as any
  const records = await campaignService.listAnnouncementBars({}, { take: 1 })
  const announcementBar = records?.[0] || {
    id: null,
    text: "PAUSE THE GAME. KEEP YOUR STYLE. • CASH ON DELIVERY AVAILABLE ACROSS BANGLADESH",
    link_url: null,
    is_active: true,
    desktop_autoplay: false,
    autoplay_interval_ms: 6000,
  }

  res.json({ announcement_bar: announcementBar })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = AnnouncementBarSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid announcement bar configuration",
      errors: parsed.error.format(),
    })
    return
  }

  const { result } = await updateAnnouncementBarWorkflow(req.scope).run({
    input: parsed.data,
  })

  res.json({ announcement_bar: result })
}
