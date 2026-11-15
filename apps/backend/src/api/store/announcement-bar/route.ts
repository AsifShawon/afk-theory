import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CAMPAIGN_MODULE } from "../../../modules/campaign"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const campaignService = req.scope.resolve(CAMPAIGN_MODULE) as any

  try {
    const records = await campaignService.listAnnouncementBars(
      { is_active: true },
      { take: 1 }
    )

    const announcementBar = records?.[0] || {
      id: null,
      text: "PAUSE THE GAME. KEEP YOUR STYLE. • CASH ON DELIVERY AVAILABLE ACROSS BANGLADESH",
      link_url: null,
      is_active: true,
      desktop_autoplay: false,
      autoplay_interval_ms: 6000,
    }

    res.json({ announcement_bar: announcementBar })
  } catch (error) {
    res.json({
      announcement_bar: {
        id: null,
        text: "PAUSE THE GAME. KEEP YOUR STYLE. • CASH ON DELIVERY AVAILABLE ACROSS BANGLADESH",
        link_url: null,
        is_active: true,
        desktop_autoplay: false,
        autoplay_interval_ms: 6000,
      },
    })
  }
}
