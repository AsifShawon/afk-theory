import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CAMPAIGN_MODULE } from "../../../modules/campaign"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const campaignService = req.scope.resolve(CAMPAIGN_MODULE) as any

  try {
    const allSlides = await campaignService.listCampaignSlides(
      {
        status: "published",
        is_active: true,
      },
      {
        order: { display_order: "ASC" },
      }
    )

    const now = new Date()

    // Filter scheduling window (starts_at <= now, ends_at >= now)
    const activeSlides = (allSlides || []).filter((slide: any) => {
      if (slide.starts_at && new Date(slide.starts_at) > now) {
        return false
      }
      if (slide.ends_at && new Date(slide.ends_at) < now) {
        return false
      }
      return true
    })

    res.json({ campaign_slides: activeSlides })
  } catch (error) {
    // Graceful fallback to prevent storefront crash if table or module is initializing
    res.json({ campaign_slides: [] })
  }
}
